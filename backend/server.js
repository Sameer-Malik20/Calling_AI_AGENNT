require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const { campaignManager, Campaign, Appointment } = require('./campaign/manager');


// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to Local MongoDB'))
    .catch(err => console.error('MongoDB Connection Error:', err));
// server.js
const { FreeSWITCHHandler, instance: handler } = require('./call/freeswitch_handler');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());



// Simulator Chat for Client Demo
app.post('/api/simulator/chat', async (req, res) => {
    const { message, kbFile, history } = req.body;
    
    try {
        const kbPath = path.join(__dirname, 'knowledge', kbFile || 'techsolutions.json');
        const kb = JSON.parse(fs.readFileSync(kbPath));
        
        const { CallFlow } = require('./flow/state_machine');
        const flow = new CallFlow(kb);
        flow.history = history || [];

        let aiResponse;
        if (message === "GET_GREETING") {
            aiResponse = flow.getInitialGreeting();
        } else {
            aiResponse = await flow.processInput(message);
        }

        res.json({ response: aiResponse });
    } catch (err) {
        console.error("Simulator Error:", err);
        res.status(500).json({ error: "Could not process simulation" });
    }
});

// TTS Endpoint for Web Simulator
app.post('/api/simulator/tts', async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    try {
        const PiperWrapper = require('./ai/piper_wrapper');
        const piper = new PiperWrapper();
        const fileName = `voice_${Date.now()}.wav`;
        const outputPath = path.join(__dirname, '../temp', fileName);
        
        await piper.synthesize(text, outputPath);
        
        res.download(outputPath, (err) => {
            if (err) console.error("Download Error:", err);
            // Optional: delete file after sending
            // fs.unlinkSync(outputPath);
        });
    } catch (err) {
        console.error("TTS Error:", err);
        res.status(500).json({ error: "TTS failed" });
    }
});

// server.js mein
app.post('/api/test-call', async (req, res) => {
    const { number } = req.body;
    if (!number) return res.status(400).json({ error: "Number is required" });
    
    try {
        // Hamara handler jo humne upar banaya
        const result = await handler.initiateCall(number);
        res.json({ message: `Campaign call initiated to ${number}`, fs_response: result });
    } catch (err) {
        console.error("Outbound Error:", err);
        res.status(500).json({ error: "Failed to initiate outbound call" });
    }
});

// API Routes
app.post('/api/campaigns', async (req, res) => {
    const { name, knowledgeFile, leadData } = req.body;
    try {
        const id = await campaignManager.createCampaign(name, knowledgeFile, leadData);
        res.json({ id, message: 'Campaign created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/campaigns', async (req, res) => {
    try {
        const campaigns = await campaignManager.getAllCampaigns();
        // Har campaign ke liye stats bhi le lo
        const campaignsWithStats = await Promise.all(campaigns.map(async (c) => {
            const stats = await campaignManager.getStats(c._id);
            return { ...c.toObject(), stats };
        }));
        res.json(campaignsWithStats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/campaigns/:id', async (req, res) => {
    try {
        await campaignManager.deleteCampaign(req.params.id);
        res.json({ message: "Campaign deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/logs', async (req, res) => {
    try {
        const { campaignId } = req.query;
        const logs = await campaignManager.getLogs(campaignId);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/campaigns/:id/stats', async (req, res) => {
    try {
        let campaignId = req.params.id;
        let name = "No Active Campaign";
        if (campaignId === 'latest') {
            const latest = await Campaign.findOne().sort({ createdAt: -1 });
            if (!latest) return res.json({ total: 0, completed: 0, failed: 0, pending: 0, name: "" });
            campaignId = latest._id;
            name = latest.name;
        } else if (!mongoose.Types.ObjectId.isValid(campaignId)) {
            return res.status(400).json({ error: "Invalid Campaign ID format" });
        } else {
            const camp = await Campaign.findById(campaignId);
            if (camp) name = camp.name;
        }

        const stats = await campaignManager.getStats(campaignId);
        res.json({ ...stats, name });
    } catch (err) {
        console.error("Stats API Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/campaigns/:id/leads', async (req, res) => {
    try {
        const leads = await campaignManager.getCampaignLeads(req.params.id);
        res.json(leads);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/leads/:id', async (req, res) => {
    try {
        const lead = await campaignManager.updateLead(req.params.id, req.body);
        res.json(lead);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/leads/:id', async (req, res) => {
    try {
        await campaignManager.deleteLead(req.params.id);
        res.json({ message: "Lead deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// server.js mein ye naya route add karein
app.post('/api/campaigns/:id/start', async (req, res) => {
    let campaignId = req.params.id;
    console.log(`[CAMPAIGN-START] Request received for ID: ${campaignId}`);

    try {
        if (campaignId === 'latest') {
            const latest = await Campaign.findOne().sort({ createdAt: -1 });
            if (!latest) {
                console.log("[CAMPAIGN-START] No campaign found in database.");
                return res.status(404).json({ success: false, message: "No campaigns found" });
            }
            campaignId = latest._id;
            console.log(`[CAMPAIGN-START] Using latest campaign: ${latest.name} (${campaignId})`);
        }

        const pendingNumbers = await campaignManager.getPendingNumbers(campaignId);
        console.log(`[CAMPAIGN-START] Found ${pendingNumbers.length} pending numbers.`);

        if (pendingNumbers.length === 0) {
            return res.json({ success: false, message: "No pending numbers in this campaign" });
        }

        // Set Campaign Status to RUNNING
        await Campaign.findByIdAndUpdate(campaignId, { status: 'RUNNING' });

        res.json({ success: true, message: `Campaign started for ${pendingNumbers.length} numbers` });

        // Background Processing
        const CONCURRENCY_LIMIT = 10;
        let activeCalls = 0;
        let index = 0;

        const processNext = async () => {
            if (index >= pendingNumbers.length) {
                console.log(`[CAMPAIGN-DONE] Finished all numbers for campaign: ${campaignId}`);
                // Set Campaign Status to STOPPED
                await Campaign.findByIdAndUpdate(campaignId, { status: 'STOPPED' });
                return;
            }

            const record = pendingNumbers[index++];
            activeCalls++;

            console.log(`[CAMPAIGN-DIAL] Lead: ${record.name}, Number: ${record.number} (Index: ${index}/${pendingNumbers.length})`);

            try {
                const result = await handler.initiateCall(record.number, record._id);
                console.log(`[CAMPAIGN-RESULT] ${record.number}: ${result}`);
                
                if (result.includes("+OK")) {
                    await campaignManager.updateNumberStatus(record._id, 'COMPLETED');
                } else {
                    await campaignManager.updateNumberStatus(record._id, 'FAILED');
                }
            } catch (dialError) {
                console.error(`[CAMPAIGN-ERROR] Failed for ${record.number}:`, dialError);
                await campaignManager.updateNumberStatus(record._id, 'FAILED');
            } finally {
                activeCalls--;
                processNext();
            }
        };

        for (let i = 0; i < Math.min(CONCURRENCY_LIMIT, pendingNumbers.length); i++) {
            processNext();
        }

    } catch (err) {
        console.error("[CAMPAIGN-START-ERROR]", err);
        if (!res.headersSent) res.status(500).json({ error: err.message });
    }
});

// ============================================
// APPOINTMENT MANAGEMENT API ENDPOINTS
// ============================================

// Get all booked slots for availability checking
app.get('/api/appointments/availability', async (req, res) => {
    try {
        const bookedSlots = await campaignManager.getBookedSlots();
        res.json(bookedSlots);
    } catch (err) {
        console.error("Availability API Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Get appointments by date range for calendar view
app.get('/api/appointments', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({ error: "startDate and endDate are required" });
        }
        
        const appointments = await campaignManager.getAppointmentsByDateRange(
            new Date(startDate),
            new Date(endDate)
        );
        
        res.json(appointments);
    } catch (err) {
        console.error("Get Appointments Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Get appointment statistics for dashboard
app.get('/api/appointments/stats', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const appointments = await Appointment.find({
            istTime: { $gte: today, $lt: tomorrow },
            isAutoCallback: { $ne: true } // Exclude auto-triggers from stats
        });

        const stats = {
            followup: appointments.filter(a => a.status === 'FOLLOWUP').length,
            appointment: appointments.filter(a => a.status === 'SCHEDULED').length,
            negotiation: appointments.filter(a => a.status === 'NEGOTIATION').length,
            discussion: appointments.filter(a => a.status === 'DISCUSSION').length,
            proposal_submitted: appointments.filter(a => a.status === 'PROPOSAL_SUBMITTED').length,
            total: appointments.length
        };

        res.json(stats);
    } catch (err) {
        console.error("Appointment stats error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Get single appointment details with call logs
app.get('/api/appointments/:id', async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id)
            .populate('leadId', 'name number email')
            .populate('callLogId');
        
        if (!appointment) {
            return res.status(404).json({ error: "Appointment not found" });
        }
        
        res.json(appointment);
    } catch (err) {
        console.error("Get Appointment Error:", err);
        res.status(500).json({ error: err.message });
    }
});
        // Get all call logs for a specific lead (for discussion history)
app.get('/api/leads/:leadId/call-logs', async (req, res) => {
    try {
        const CallLog = require('./models/CallLog');
        const callLogs = await CallLog.find({ numberId: req.params.leadId })
            .sort({ timestamp: 1 })
            .select('transcript timestamp duration outcome callType');
        
        if (!callLogs || callLogs.length === 0) {
            return res.json({ campaignLogs: [], followUpLogs: [], message: "No call logs found for this lead" });
        }
        
        const formatLog = (log) => {
            const lines = log.transcript.split('\n').filter(line => line.trim());
            const messages = lines.map(line => {
                const match = line.match(/^(user|assistant):\s*(.*)$/i);
                if (match) {
                    return {
                        speaker: match[1].toLowerCase() === 'user' ? 'User' : 'AI',
                        content: match[2].trim(),
                        timestamp: log.timestamp
                    };
                }
                return null;
            }).filter(msg => msg !== null);
            
            return {
                callId: log._id,
                callDate: log.timestamp,
                timestamp: log.timestamp,
                duration: log.duration,
                outcome: log.outcome,
                callType: log.callType || 'CAMPAIGN',
                messages: messages,
                transcript: log.transcript
            };
        };

        const formattedLogs = callLogs.map(formatLog);
        const campaignLogs = formattedLogs.filter(log => log.callType === 'CAMPAIGN');
        const followUpLogs = formattedLogs.filter(log => log.callType === 'FOLLOW_UP');
        
        // Fetch pending auto-callbacks
        const pendingCallbacks = await Appointment.find({
            leadId: req.params.leadId,
            isAutoCallback: true,
            istTime: { $gte: new Date() }
        }).sort({ istTime: 1 });
        
        res.json({ 
            callLogs: formattedLogs, 
            campaignLogs, 
            followUpLogs,
            pendingCallbacks: pendingCallbacks.map(cb => ({
                id: cb._id,
                scheduledTime: cb.istTime,
                userTime: cb.userTime,
                notes: cb.notes
            }))
        });
    } catch (err) {
        console.error("Get Call Logs Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Create new appointment (manual booking)
app.post('/api/appointments', async (req, res) => {
    try {
        const { leadId, userTime, istTime, timezone, email, notes } = req.body;
        
        if (!leadId || !userTime || !istTime || !timezone) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        
        const appointment = await campaignManager.createAppointment({
            leadId,
            userTime,
            istTime: new Date(istTime),
            timezone,
            email,
            notes
        });
        
        res.json({ success: true, appointment });
    } catch (err) {
        console.error("Create Appointment Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Update appointment (reschedule, cancel, complete)
app.put('/api/appointments/:id', async (req, res) => {
    try {
        // Validate that the ID is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: "Invalid appointment ID format" });
        }
        
        const appointment = await campaignManager.updateAppointment(req.params.id, req.body);
        res.json({ success: true, appointment });
    } catch (err) {
        console.error("Update Appointment Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Schedule follow-up with email and call
app.post('/api/appointments/:id/follow-up', async (req, res) => {
    try {
        const { scheduledTime, message, includeCall = false, includeEmail = false } = req.body;
        
        const appointment = await Appointment.findById(req.params.id)
            .populate('leadId', 'name email number')
            .populate('callLogId', 'transcript');
        
        if (!appointment) {
            return res.status(404).json({ error: "Appointment not found" });
        }
        
        // Update appointment with follow-up time and status
        await campaignManager.updateAppointment(req.params.id, {
            followUpScheduled: new Date(scheduledTime),
            status: 'FOLLOWUP',
            notes: appointment.notes ? `${appointment.notes}\n\nFollow-up: ${message}` : `Follow-up: ${message}`
        });
        
        let emailSent = false;
        let callScheduled = false;
        
        // Send follow-up email only if includeEmail is true
        if (includeEmail) {
            try {
                const nodemailer = require('nodemailer');
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS
                    }
                });
                
                const mailOptions = {
                    from: '"SusaLabs Team" <support@susalabs.com>',
                    to: appointment.leadId.email || appointment.email,
                    subject: '📬 Follow-up from SusaLabs',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #2563eb;">Follow-up Message</h2>
                            <p>Hi ${appointment.leadId.name},</p>
                            <p>${message}</p>
                            <p>Your scheduled demo: <strong>${appointment.userTime}</strong></p>
                            <br>
                            <p>Best regards,<br><strong>SusaLabs Team</strong></p>
                        </div>
                    `
                };
                
                await transporter.sendMail(mailOptions);
                emailSent = true;
                console.log('Follow-up email sent successfully');
            } catch (emailError) {
                console.error("Error sending follow-up email:", emailError);
            }
        }
        
        // Schedule follow-up call only if includeCall is true
       // Fixed Follow-up Call Logic
        if (includeCall && appointment.leadId.number) {
            try {
                // 1. LLM Summary generation ko rehne de sakte hain notes ke liye
                const LLMWrapper = require('./ai/llm_wrapper');
                const llm = new LLMWrapper();
                const previousDiscussion = appointment.callLogId?.transcript || 'No previous discussion';
                const appointmentDate = new Date(appointment.istTime).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
                
                // Summary sirf database notes ke liye use karenge, FreeSWITCH command ke liye nahi
                const callSummary = await llm.generateFollowUpSummary(previousDiscussion, appointmentDate);
                
                const scheduledDate = new Date(scheduledTime);
                const now = new Date();
                const delayMs = scheduledDate.getTime() - now.getTime();
                
                // Helper function to trigger call with CLEAN data
                const makeCleanCall = async () => {
                    try {
                        console.log(`[FOLLOW-UP-CALL] Initiating call to ${appointment.leadId.number}`);
                        
                        // Trigger call with proper arguments
                        const result = await handler.initiateCall(
                            appointment.leadId.number, 
                            appointment.leadId._id.toString(),
                            {
                                previousDiscussion: appointment.callLogId?.transcript || 'No previous discussion',
                                previousAppointmentDate: new Date(appointment.istTime).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
                            }
                        );
                        console.log(`[FOLLOW-UP-CALL] Result: ${result}`);
                    } catch (error) {
                        console.error(`[FOLLOW-UP-CALL] Trigger Error:`, error);
                    }
                };

                if (delayMs > 0) {
                    setTimeout(makeCleanCall, delayMs);
                    console.log(`[FOLLOW-UP-CALL] Scheduled in ${Math.round(delayMs / 1000 / 60)} mins`);
                } else {
                    await makeCleanCall();
                }
                
                callScheduled = true;

                // Database Update: Notes mein summary rakhein, par command mein nahi bheja humne
                await campaignManager.updateAppointment(req.params.id, {
                    notes: (appointment.notes || "") + `\n\nAI Follow-up Summary: ${callSummary}`
                });

            } catch (callError) {
                console.error("Error scheduling follow-up call:", callError);
            }
        }
        
        // Build appropriate response message
        let responseMessage = "Follow-up scheduled";
        if (emailSent && callScheduled) {
            responseMessage = "Follow-up scheduled with email and call";
        } else if (emailSent) {
            responseMessage = "Follow-up scheduled and email sent";
        } else if (callScheduled) {
            responseMessage = "Follow-up scheduled and call initiated";
        }
        
        res.json({
            success: true,
            message: responseMessage,
            emailSent,
            callScheduled
        });
    } catch (err) {
        console.error("Follow-up Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/knowledge', (req, res) => {
    const files = fs.readdirSync(path.join(__dirname, 'knowledge'));
    res.json(files);
});

// Socket.io for real-time updates
io.on('connection', (socket) => {
    console.log('Client connected dashboard');
});

// AUTO-CALLBACK RECOVERY WORKER (Safety Net)
// Har 1 minute mein check karega ki koi auto-callback miss to nahi hua
setInterval(async () => {
    try {
        const now = new Date();
        const missedCallbacks = await Appointment.find({
            isAutoCallback: true,
            status: 'FOLLOWUP',
            istTime: { $lte: now },
            callTriggered: { $ne: true } // New safety flag
        }).populate('leadId');

        for (const cb of missedCallbacks) {
            if (cb.leadId && cb.leadId.number) {
                console.log(`[WORKER-RECOVERY] Triggering missed callback for ${cb.leadId.number}`);
                
                // Flag update immediately to prevent double calls
                await Appointment.findByIdAndUpdate(cb._id, { callTriggered: true });

                const handler = require('./call/freeswitch_handler').instance;
                if (handler) {
                    await handler.initiateCall(cb.leadId.number, cb.leadId._id.toString(), {
                        previousDiscussion: "Missed scheduled callback (Recovery)",
                        previousAppointmentDate: cb.istTime.toLocaleDateString()
                    });
                }
            }
        }
    } catch (err) {
        console.error("[CRITICAL-WORKER-ERROR]", err);
    }
}, 60000);

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend server running on all interfaces on port ${PORT}`);
});
