const esl = require('modesl');
const WhisperWrapper = require('../ai/whisper_wrapper');
const PiperWrapper = require('../ai/piper_wrapper');
const LLMWrapper = require('../ai/llm_wrapper');
const path = require('path');
const fs = require('fs');
const kb = require('../knowledge/techsolutions.json');
const CallMonitor = require('../utils/call_monitor');
const { campaignManager, PhoneNumber, Appointment } = require('../campaign/manager'); // ADDED
const spacePath = path.join(__dirname, '../space').replace(/\\/g, '/');
const { sendDemoConfirmationEmail, sendTeamNotificationEmail } = require('../utils/email_templates');
const moment = require('moment-timezone');

class FreeSWITCHHandler {
    constructor() {
        this.whisper = new WhisperWrapper();
        this.piper = new PiperWrapper();
        this.llm = new LLMWrapper();
        this.activeCalls = new Map();

        // SIP Provider Config (Easily switch to Telnyx later)
        // [TELNYX_UPDATE]: Jab Telnyx use karoge, to .env me DIAL_PROVIDER=telnyx set karna
        this.provider = {
            name: process.env.DIAL_PROVIDER || 'local', 
            sender: process.env.SENDER_ID || '9876543210', // [TELNYX_UPDATE]: Yahan Telnyx se liya hua number dalna hoga
            domain: process.env.SIP_DOMAIN || '100.87.88.37' // [TELNYX_UPDATE]: Telnyx provider ka SIP domain (e.g., sip.telnyx.com)
        };

        this.conn = new esl.Connection(
            process.env.FS_HOST || '127.0.0.1',
            8021,
            process.env.FS_PASSWORD || 'ClueCon',
            () => {
                console.log('[DEBUG] FreeSWITCH Connection Established');
                this.conn.subscribe(['CHANNEL_ANSWER', 'CHANNEL_HANGUP_COMPLETE', 'PLAYBACK_STOP']);
                setInterval(() => this.cleanupOldRecordings(), 60 * 60 * 1000); 
                this.cleanupOldRecordings();
            }
        );

        // Watchdog for stuck calls
        setInterval(() => {
            for (let [id, data] of this.activeCalls) {
                if (data.startTime && (Date.now() - data.startTime > 30 * 60 * 1000)) {
                    console.log(`[WATCHDOG] Force hanging up stuck call: ${id}`);
                    this.conn.execute('hangup', 'ALLOTTED_TIMEOUT', id);
                    this.activeCalls.delete(id);
                }
            }
        }, 5 * 60 * 1000);

        this.conn.on('esl::event::CHANNEL_ANSWER::*', (ev) => this.handleCallStart(ev));
        this.conn.on('esl::event::CHANNEL_PARK::*', (ev) => this.handleCallStart(ev));
        
        this.conn.on('esl::event::CHANNEL_HANGUP_COMPLETE::*', async (ev) => {
            const id = ev.getHeader('Unique-ID');
            const callData = this.activeCalls.get(id);
            let finalOutcome = 'COMPLETED';
            let newAppointmentId = null;

            if (callData && callData.history.length > 0) {
                // Poori conversation ko transcript mein convert karein
                const fullTranscript = callData.history.map(h => `${h.role}: ${h.content}`).join('\n');

                // Check if [BOOK_DEMO] tag exists in the last assistant message
                const lastAIDesign = [...callData.history].reverse().find(h => h.role === 'assistant' && h.content.includes('[BOOK_DEMO'));
            
                if (lastAIDesign) {
                    try {
                        const bookingMatch = lastAIDesign.content.match(/\[BOOK_DEMO: (.*?)\]/);
                        if (bookingMatch) {
                            const bookingData = JSON.parse(bookingMatch[1]);
                            const istTime = new Date(bookingData.ist_time);
                            const istMoment = moment(istTime).tz('Asia/Kolkata');
                            const istHour = istMoment.hour();
                            const dayOfWeek = istMoment.day(); // 0=Sun, 6=Sat
            
                            // ========================================
                            // ✅ VALIDATION 1: Business Hours (9 AM - 9 PM IST)
                            // ========================================
                            if (istHour < 9 || istHour >= 21) {
                                console.log(`[❌ REJECTED] ${istHour}:00 outside 9AM-9PM business hours`);
                                finalOutcome = 'BOOKING_REJECTED';
                                console.log(`[⚠️] Booking skipped due to invalid business hours`);
                            } 
                            // ========================================
                            // ✅ VALIDATION 2: Weekdays Only (Mon-Fri)
                            // ========================================
                            else if (dayOfWeek === 0 || dayOfWeek === 6) {
                                console.log(`[❌ REJECTED] Weekend booking attempted: ${istMoment.format('dddd')}`);
                                finalOutcome = 'BOOKING_REJECTED';
                                console.log(`[⚠️] Booking skipped due to weekend`);
                            }
                            // ========================================
                            // ✅ VALIDATION 3: Conflict Check (15-minute buffer)
                            // ========================================
                            else {
                                const bookedSlots = await campaignManager.getBookedSlots();
                                const hasConflict = bookedSlots.some(slot => {
                                    const diffMs = Math.abs(slot.istTime.getTime() - istTime.getTime());
                                    return diffMs < 15 * 60 * 1000; // 15 minutes in ms
                                });
            
                                if (hasConflict) {
                                    console.log(`[❌ REJECTED] Conflict with existing booking`);
                                    finalOutcome = 'BOOKING_REJECTED';
                                    console.log(`[⚠️] Booking skipped due to conflict`);
                                } 
                                // ========================================
                                // ✅ ALL VALIDATIONS PASSED → PROCEED WITH BOOKING
                                // ========================================
                                else {
                                    const leadInfo = await campaignManager.getLeadEmail(callData.numberId);
                                    
                                    // Create dedicated Appointment record (CallLog ID will be added later)
                                    const newAppt = await campaignManager.createAppointment({
                                        leadId: callData.numberId,
                                        // callLogId: ... (Added after saving log)
                                        userTime: bookingData.user_time,
                                        istTime: istTime,
                                        timezone: bookingData.timezone || 'Asia/Kolkata',
                                        email: leadInfo.email,
                                        status: 'SCHEDULED',
                                        notes: `Auto-booked via AI call on ${new Date().toLocaleString()}`
                                    });
                                    newAppointmentId = newAppt._id;
                                    finalOutcome = 'DEMO_BOOKED';

                                    // Send professional confirmation email with calendar invite
                                    await sendDemoConfirmationEmail(
                                        leadInfo.email, 
                                        leadInfo.name, 
                                        bookingData.user_time,
                                        bookingData.ist_time,
                                        bookingData.timezone || 'Asia/Kolkata'
                                    );
            
                                    // Notify team about new booking
                                    await sendTeamNotificationEmail({
                                        leadName: leadInfo.name,
                                        email: leadInfo.email,
                                        phone: (await PhoneNumber.findById(callData.numberId))?.number || 'N/A',
                                        userTime: bookingData.user_time,
                                        istTime: bookingData.ist_time,
                                        timezone: bookingData.timezone || 'Asia/Kolkata'
                                    });
                                    
                                    console.log(`[✅ DEMO-BOOKED] Appointment created for ${leadInfo.name}`);
                                }
                            }
                        }
                
                    } catch (err) {
                        console.error("[DEMO-BOOKING-ERROR]", err);
                    }
                }
                
                try {
                    // Fetch lead details for better reporting and logging
                    let leadInfo = { name: 'N/A', number: 'N/A' };
                    if (callData.numberId) {
                        try {
                            const lead = await PhoneNumber.findById(callData.numberId);
                            if (lead) {
                                leadInfo.name = lead.name;
                                leadInfo.number = lead.number;
                            }
                        } catch (dbErr) {
                            console.error("[REPORT-DB-FETCH-ERROR]", dbErr);
                        }
                    }

                    const report = await this.llm.generateCallReport(callData.history);
                    
                    // Trigger Self-Learning Loop
                    await this.llm.learnFromCall(callData.history);
                    
                    const reportContent = `
=========================================
      PRODUCTION CALL ANALYTICS
=========================================
REPORT ID   : ${id}
CUSTOMER    : ${leadInfo.name}
NUMBER      : ${leadInfo.number}
TIMESTAMP   : ${new Date().toLocaleString()}
-----------------------------------------
${report}
=========================================`;

                    console.log(reportContent);
                    fs.appendFileSync('call_reports.log', reportContent + '\n');

                    // Log to MongoDB if it's a campaign call
                    if (callData.numberId) {
                        const transcript = callData.history.map(h => `${h.role}: ${h.content}`).join('\n');
                        
                        // Unified Save CallLog with ALL required fields
                        const callLog = await campaignManager.saveCallLog(callData.numberId, {
                            call_id: id,
                            phone_number: leadInfo.number || 'UNKNOWN',
                            timezone: 'Asia/Kolkata', // Default to IST as per system context
                            transcript: transcript,
                            report: report, // Explicitly mapped
                            duration: (Date.now() - callData.startTime) / 1000,
                            outcome: finalOutcome,
                            callType: callData.isFollowUp ? 'FOLLOW_UP' : 'CAMPAIGN',
                            campaignId: callData.campaignId || null
                        });
                        
                        // If we created a new appointment, link the CallLog now
                        if (newAppointmentId) {
                            await Appointment.findByIdAndUpdate(newAppointmentId, { callLogId: callLog._id });
                        }

                            // If this is a follow-up call, update the appointment's callLogId
                        // so subsequent follow-ups can reference this interaction
                        if (callData.isFollowUp) {
                            try {
                                // Find the most recent appointment for this lead
                 
                                const appointment = await Appointment.findOne({
                                    leadId: callData.numberId
                                }).sort({ createdAt: -1 });
                                
                                if (appointment) {
                                    await Appointment.findByIdAndUpdate(appointment._id, {
                                        callLogId: callLog._id,
                                        notes: appointment.notes ? 
                                            `${appointment.notes}\n\nFollow-up call completed on ${new Date().toLocaleString()}` :
                                            `Follow-up call completed on ${new Date().toLocaleString()}`
                                    });
                                    console.log(`[FOLLOW-UP] Updated appointment ${appointment._id} with new call log ${callLog._id}`);
                                }
                            } catch (updateError) {
                                console.error("[FOLLOW-UP-UPDATE-ERROR]", updateError);
                            }
                        }
                    }
                    
                } catch (err) {
                    console.error("[REPORT-ERROR]", err);
                }
            }
            
            this.activeCalls.delete(id);
        });
    }
    
    cleanupOldRecordings() {
        const tempDir = process.env.TEMP_DIR;
        const now = Date.now();
        const oneHourAgo = now - (60 * 60 * 1000);

        if (!tempDir || !fs.existsSync(tempDir)) return;

        fs.readdir(tempDir, (err, files) => {
            if (err) return;
            
            files.forEach(file => {
                if (file.endsWith('.wav') && (file.startsWith('rec_') || file.startsWith('tts_'))) {
                    const filePath = path.join(tempDir, file);
                    fs.stat(filePath, (err, stats) => {
                        if (!err && stats.mtimeMs < oneHourAgo) {
                            fs.unlink(filePath, () => {});
                        }
                    });
                }
            });
        });
    }

    handleCallStart(event) {
        const id = event.getHeader('Unique-ID');
        if (this.activeCalls.has(id)) return;

        // Custom Header se lead information nikaalein
        const numberId = event.getHeader('variable_lead_number_id');
        const campaignId = event.getHeader('variable_campaign_id');
        const kbFile = event.getHeader('variable_kb_file');
        const leadName = event.getHeader('variable_lead_name')?.replace(/_/g, ' ');
        const isFollowUp = event.getHeader('variable_is_follow_up') === 'true' || event.getHeader('is_follow_up') === 'true';
        console.log(`[FS-DEBUG] Detected isFollowUp: ${isFollowUp} (Header: ${event.getHeader('variable_is_follow_up')})`);
        
        let previousDiscussion = event.getHeader('variable_previous_discussion') || event.getHeader('previous_discussion') || '';
try {
    // Decode karna zaroori hai taaki LLM ko sahi text mile
    previousDiscussion = decodeURIComponent(previousDiscussion);
} catch (e) {
    console.log("[FS] Discussion decoding skipped or already clean");
}
        const previousAppointmentDate = event.getHeader('variable_previous_appointment_date') || event.getHeader('previous_appointment_date') || '';
        
        let callKb = kb; // Fallback to default
        if (kbFile) {
            try {
                const kbPath = path.join(__dirname, '../knowledge', kbFile);
                if (fs.existsSync(kbPath)) {
                    callKb = JSON.parse(fs.readFileSync(kbPath, 'utf8'));
                    console.log(`[SYSTEM] Loaded Dynamic KB: ${kbFile}`);
                }
            } catch (err) {
                console.error(`[KB-LOAD-ERROR] Failed to load ${kbFile}:`, err);
            }
        }

        this.activeCalls.set(id, { 
            history: [], 
            startTime: Date.now(),
            numberId: numberId,
            campaignId: campaignId,
            customerName: leadName,
            kb: callKb,
            isFollowUp: isFollowUp,
            previousDiscussion: previousDiscussion,
            previousAppointmentDate: previousAppointmentDate
        });

        console.log(`\n[SYSTEM] New Call Detected: ${id} (LeadID: ${numberId || 'N/A'}, Campaign: ${campaignId || 'N/A'}, FollowUp: ${isFollowUp})`);
        this.conn.execute('park', '', id);
        this.onAnswer(id);
    }

    async onAnswer(channelId) {
        const callData = this.activeCalls.get(channelId);
        
        // Check if this is a follow-up call
        if (callData?.isFollowUp) {
            console.log(`[FOLLOW-UP] Using follow-up greeting for ${callData.customerName}`);
            
            try {
                // Generate follow-up greeting using LLM
                const followUpGreeting = await this.llm.generateFollowUpGreeting(
                    callData.previousDiscussion,
                    callData.previousAppointmentDate,
                    callData.customerName
                );
                
                // Add greeting to history
                callData.history.push({ role: 'assistant', content: followUpGreeting });
                
                // Speak the follow-up greeting
                await this.speak(channelId, followUpGreeting);
            } catch (error) {
                console.error("[FOLLOW-UP-ERROR] Failed to generate follow-up greeting:", error);
                // Fallback to standard greeting
                const nameGreeting = callData?.customerName ? `Hi ${callData.customerName}, ` : "";
                const configGreeting = callData?.kb?.conversational_intelligence?.boring_free_greeting || kb.conversational_intelligence.boring_free_greeting;
                await this.speak(channelId, nameGreeting + configGreeting);
            }
        } else {
            // Standard greeting for regular calls
            const nameGreeting = callData?.customerName ? `Hi ${callData.customerName}, ` : "";
            const configGreeting = callData?.kb?.conversational_intelligence?.boring_free_greeting || kb.conversational_intelligence.boring_free_greeting;
            await this.speak(channelId, nameGreeting + configGreeting);
        }
    }

    async initiateCall(number, numberId = null, followUpContext = null) {
        console.log(`[CAMPAIGN] Preparing call to: ${number}`);
        
        let campaignId = '';
        let kbFile = '';
        let leadName = '';
        
        try {
            if (numberId) {
                // Safety check: if numberId is an object by mistake, don't pass it to findById
                if (typeof numberId === 'object' && !mongoose.Types.ObjectId.isValid(numberId)) {
                    console.warn("[SYSTEM] Warning: numberId is an object, skipping DB fetch");
                } else {
                    const lead = await PhoneNumber.findById(numberId).populate('campaignId');
                    if (lead) {
                        leadName = lead.name || '';
                        if (lead.campaignId) {
                            campaignId = lead.campaignId._id.toString();
                            kbFile = lead.campaignId.knowledgeFile || '';
                        }
                    }
                }
            }
        } catch (e) {
            console.error("[CAMPAIGN-DB-ERROR]", e);
        }

        let dialString;
        
        /**
         * 🚨 TELNYX / REAL SIP INTEGRATION GUIDE 🚨
         * ------------------------------------------
         * If you have a Telnyx account or a professional SIP provider:
         * 
         * 1. Go to your .env file and set DIAL_PROVIDER=telnyx (or any key)
         * 2. Configure your Sofia Gateway in FreeSWITCH (conf/sip_profiles/external/telnyx.xml)
         * 3. Use the 'telnyx' block below to route calls through that gateway.
         * 
         * For generic providers (e.g. Twilio BYOC, Vonage), use:
         * dialString = `sofia/gateway/my_provider_name/${number}`;
         */
        if (this.provider.name === 'telnyx') {
            // [TELNYX_UPDATE]: Telnyx calls route karne ke liye ye block use hoga
            // Isse pehle FreeSWITCH me 'telnyx' gateway configure karna padega
            dialString = `sofia/gateway/telnyx/${number}`;
        } else {
            // DEFAULT: Local testing with MicroSIP/Linphone
            // [TELNYX_UPDATE]: Abhi ye use ho raha hai local calls ke liye
            dialString = `user/${number}@${this.provider.domain}`; 
        }

        // Headers array - empty values wale variables skip karein taaki FS crash na ho
        const varsArr = [
            `origination_caller_id_number=${this.provider.sender}`,
            `hangup_after_bridge=true`
        ];
        
        if (numberId) varsArr.push(`lead_number_id=${numberId}`);
        if (leadName) varsArr.push(`lead_name=${leadName.replace(/\s+/g, '_')}`);
        if (campaignId) varsArr.push(`campaign_id=${campaignId.toString()}`);
        if (kbFile) varsArr.push(`kb_file=${kbFile}`);
        
        // Add follow-up context if provided
       // Add follow-up context if provided
if (followUpContext) {
    varsArr.push(`is_follow_up=true`);
    if (followUpContext.previousDiscussion) {
        // Discussion ko saaf karein aur limit karein
        const sanitizedDiscussion = followUpContext.previousDiscussion
            .substring(0, 300) // 300 characters se zyada lamba na ho
            .replace(/[^a-zA-Z0-9 ]/g, ' ') // Sirf letters aur numbers rakhein
            .trim();
        varsArr.push(`previous_discussion=${encodeURIComponent(sanitizedDiscussion)}`);
    }
    if (followUpContext.previousAppointmentDate) {
        varsArr.push(`previous_appointment_date=${encodeURIComponent(followUpContext.previousAppointmentDate)}`);
    }
    console.log(`[FOLLOW-UP] Call initiated with sanitized context for lead ${numberId}`);
}

        const vars = varsArr.join(',');

        // ZAROORI: {} block aur dialstring ke beech bilkul space nahi hona chahiye
        // Fix FreeSWITCH command syntax - use proper originate format
        // The correct format is: originate {vars}destination application args
        // For dialing to a user, we should use: originate {vars}user/1001@domain &bridge
        const command = `originate {${vars}}${dialString} &park`;
        console.log(`[FS-EXECUTE] ${command}`);
        
        return new Promise((resolve, reject) => {
            if (!this.conn || !this.conn.connected()) {
                console.error("[FS-ERROR] Connection not ready");
                return reject("Connection lost");
            }
            
            // Use the api method with the full command
            // The correct format is: originate {vars}destination application args
            this.conn.api(command, (res) => {
                const body = res.getBody();
                console.log(`[FS-RESPONSE] ${body}`);
                
                // Check if the response indicates success
                if (body && body.includes('+OK')) {
                    resolve(body);
                } else {
                    console.error(`[FS-ERROR] Command failed: ${body}`);
                    reject(body);
                }
            });
        });
    }

    async speak(channelId, text) {
        if (!this.activeCalls.has(channelId)) return;
// --- GAP 3: Piper file likh raha hai (TTS Generation) ---
    // Jab tak .wav file banti hai, tab tak typing sound bajne do
    this.conn.execute('playback', `${spacePath}/keyboard_typing.wav`, channelId);
    console.log("[TTS] Synthesizing... Playing: keyboard_typing.wav");
        const fileName = `tts_${Date.now()}.wav`;
        // Windows path fix for FreeSWITCH (Replace \ with /)
        let outputPath = path.join(process.env.TEMP_DIR, fileName).replace(/\\/g, '/');

        try {
            console.log(`[TTS] Synthesizing...`);
            await this.piper.synthesize(text, outputPath);
            
            console.log(`[FS] Executing Playback...`);
            this.conn.execute('playback', outputPath, channelId);

            const onStop = (event) => {
                if (event.getHeader('Unique-ID') === channelId && event.getHeader('Event-Name') === 'PLAYBACK_STOP') {
                    this.conn.removeListener('esl::event::PLAYBACK_STOP::*', onStop);
                    console.log("[FS] Playback Stopped. Switching to Record.");
                    
                    // Cleanup TTS file after playing
                    setTimeout(() => {
                        try {
                            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                            console.log(`[TTS-CLEANUP] Deleted ${fileName}`);
                        } catch (e) {
                            console.error("[TTS-CLEANUP-ERROR]", e.message);
                        }
                    }, 1000);

                    // Record se pehle chota delay taaki FS ready rahe
                    setTimeout(() => this.listenLoop(channelId), 500);
                }
            };
            this.conn.on('esl::event::PLAYBACK_STOP::*', onStop);
        } catch (err) {
            console.error(`[TTS-ERROR] ${err.message}`);
        }
    }



// freeswitch_handler.js (Sirf listenLoop wala part update karein)
 // Path check karlein

async listenLoop(channelId) {
    if (!this.activeCalls.has(channelId)) {
        console.log(`[STOP] Call ${channelId} has ended. Killing AI process.`);
        return; // Loop yahi ruk jayega aur minutes nahi badhenge
    }

    if (!this.activeCalls.has(channelId)) return;

    // 1. Monitor ko define karein taaki logs crash na ho
    const monitor = new CallMonitor(channelId);
    const recFileName = `rec_${Date.now()}.wav`;
    const recPath = path.join(process.env.TEMP_DIR, recFileName).replace(/\\/g, '/');

    monitor.log("Starting Background Recording...");
    
    // Step 1: Recording shuru karein
    this.conn.execute('record_session', recPath, channelId);

    // Step 2: wait_for_silence (Threshold: 200, Silence-time: 15 samples, Gap: 10, Timeout: 5000ms)
    // Mobile aur Laptop dono ke liye ye settings stable hain
    this.conn.execute('wait_for_silence', '200 80 10 20000', channelId, async () => {
        
        // Step 3: Recording rokein taaki file save ho jaye
        this.conn.execute('stop_record_session', recPath, channelId);
        // --- GAP 1: User chup hua, Whisper shuru hone wala hai ---
        // Turant acknowledgment de do
        this.conn.execute('playback', `${spacePath}/uh_huh.wav`, channelId);
        monitor.log("Silence Detected. Playing: uh_huh.wav");
        monitor.log("Silence Detected by wait_for_silence.");

        if (!this.activeCalls.has(channelId)) return;

        // File check logic (Wait for 100ms for disk write)
        setTimeout(async () => {
            if (fs.existsSync(recPath)) {
                try {
                    monitor.log("Sending audio to Whisper...");
                    const sttStart = Date.now();
                    
                    // SIRF EK BAAR transcribe call karein
                    const transcript = await this.whisper.transcribe(recPath);
                    monitor.log(`Whisper Done. Text: "${transcript}"`);

                    if (transcript && transcript.trim().length > 1) {
                        // --- GAP 2: Whisper khatam, LLM (Qwen) sochna shuru karega ---
                        // "Hmm, let me see" bajao taaki thinking gap cover ho jaye
                        this.conn.execute('playback', `${spacePath}/let_me_see.wav`, channelId);
                        monitor.log("Calling LLM... Playing: let_me_see.wav");
                        monitor.log("Calling LLM...");
                        
                        const callData = this.activeCalls.get(channelId);
                        const currentKb = callData.kb || kb;

                        // 1. User ki baat history mein daalein
                        callData.history.push({ role: 'user', content: transcript });
                        const rawResponse = await this.llm.generateResponse(transcript, currentKb, callData.history);
                        
                        // ✅ Check [BOOK_DEMO] BEFORE speaking to user
                        const bookingMatch = rawResponse.match(/\[BOOK_DEMO: (.*?)\]/);
                        const callbackMatch = rawResponse.match(/\[SCHEDULE_CALLBACK: (.*?)\]/);
                        let finalResponse = rawResponse;
                        
                        if (bookingMatch) {
                            const bookingData = JSON.parse(bookingMatch[1]);
                            const istTime = new Date(bookingData.ist_time);
                            const istMoment = moment(istTime).tz('Asia/Kolkata');
                            const istHour = istMoment.hour();
                            const dayOfWeek = istMoment.day();
                        
                            // ✅ Business Hours Check (9 AM - 9 PM IST)
                            if (istHour < 9 || istHour >= 21) {
                                finalResponse = "I'd love to, but our engineers are only available between 9 AM and 9 PM India time. Could we do something earlier/later?";
                            } 
                            // ✅ Weekday Check
                            else if (dayOfWeek === 0 || dayOfWeek === 6) {
                                finalResponse = "We offer demos Monday through Friday only. How about Tuesday at 11 AM?";
                            }
                            // ✅ Conflict Check
                            else {
                                const bookedSlots = await campaignManager.getBookedSlots();
                                const hasConflict = bookedSlots.some(slot => {
                                    const diffMs = Math.abs(slot.istTime.getTime() - istTime.getTime());
                                    return diffMs < 15 * 60 * 1000;
                                });
                        
                                if (hasConflict) {
                                    finalResponse = "I'm sorry, that slot just got reserved. can choose diffrent time Which works better?";
                                }
                            }
                        } else if (callbackMatch) {
                            try {
                                const callbackData = JSON.parse(callbackMatch[1]);
                                
                                // LLM now calculates delay_minutes for us
                                const delayMinutes = parseInt(callbackData.delay_minutes) || 10;
                                const scheduledTime = moment().add(delayMinutes, 'minutes').toDate();

                                console.log(`[AUTO-CALLBACK] Scheduling for: ${scheduledTime.toLocaleString()} (${delayMinutes} mins from now)`);
                                
                                if (callData.numberId) {
                                    const lead = await PhoneNumber.findById(callData.numberId);
                                    if (lead) {
                                        const delayMs = scheduledTime.getTime() - Date.now();
                                        
                                        // Save to DB as an appointment with FOLLOWUP status
                                        const newApt = await campaignManager.createAppointment({
                                            leadId: callData.numberId,
                                            userTime: callbackData.time_str || `${callbackData.delay_minutes} mins later`,
                                            istTime: scheduledTime,
                                            timezone: 'Asia/Kolkata',
                                            email: (await campaignManager.getLeadEmail(callData.numberId)).email,
                                            status: 'FOLLOWUP', // Distinguished from a booked demo
                                            isAutoCallback: true,
                                            callTriggered: false,
                                            notes: `Auto-scheduled callback via AI call. User said: ${callbackData.time_str}`
                                        });

                                        // Set trigger
                                        if (delayMs > 0) {
                                            setTimeout(async () => {
                                                try {
                                                    // Check if already triggered by worker to avoid racing
                                                    const checkApt = await Appointment.findById(newApt._id);
                                                    if (checkApt && checkApt.callTriggered) return;

                                                    console.log(`[AUTO-CALLBACK-TRIGGER] Calling ${lead.number}`);
                                                    await Appointment.findByIdAndUpdate(newApt._id, { callTriggered: true });
                                                    
                                                    await this.initiateCall(lead.number, lead._id.toString(), {
                                                        previousDiscussion: callData.history.map(h => `${h.role}: ${h.content}`).join('\n'),
                                                        previousAppointmentDate: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
                                                    });
                                                } catch (err) {
                                                    console.error("[AUTO-CALLBACK-TRIGGER-ERROR]", err);
                                                }
                                            }, delayMs);
                                            console.log(`[AUTO-CALLBACK] Trigger set for ${Math.round(delayMs/60000)} minutes`);
                                        }
                                    }
                                }
                            } catch (err) {
                                console.error("[AUTO-CALLBACK-ERROR]", err);
                            }
                        }
                        
                        callData.history.push({ role: 'assistant', content: finalResponse });
                        await this.speak(channelId, finalResponse);

                        // Cleanup recording file after processing
                        try {
                            if (fs.existsSync(recPath)) fs.unlinkSync(recPath);
                            console.log(`[REC-CLEANUP] Deleted user recording`);
                        } catch (e) {
                            console.error("[REC-CLEANUP-ERROR]", e.message);
                        }
                    } else {
                        // Cleanup even if empty transcript
                        try {
                            if (fs.existsSync(recPath)) fs.unlinkSync(recPath);
                        } catch (e) {}

                        // Yahan check karein ki call zinda hai ya nahi
                        if (!this.activeCalls.has(channelId)) {
                            console.log("[STOP] Call ended, breaking empty transcript loop.");
                            return; // Loop ko yahin khatam kar dein
                        }   
                        
                        monitor.log("Empty transcript. Restarting loop.");
                        this.listenLoop(channelId);
                    }
                } catch (err) {
                    console.error(`[ERROR]: ${err}`);
                    this.listenLoop(channelId);
                }
            } else {
                monitor.log("ERROR: File not found on disk!");
                this.listenLoop(channelId);
            }
            monitor.getSummary();
        }, 300); 
    });
}
}

module.exports = {
    FreeSWITCHHandler,
    instance: new FreeSWITCHHandler()
};