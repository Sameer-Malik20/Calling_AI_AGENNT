const esl = require('modesl');
const WhisperWrapper = require('../ai/whisper_wrapper');
const PiperWrapper = require('../ai/piper_wrapper');
const LLMWrapper = require('../ai/llm_wrapper');
const path = require('path');
const fs = require('fs');
const kb = require('../knowledge/techsolutions.json');
const CallMonitor = require('../utils/call_monitor');

class FreeSWITCHHandler {
    constructor() {
        this.whisper = new WhisperWrapper();
        this.piper = new PiperWrapper();
        this.llm = new LLMWrapper();
        this.activeCalls = new Map();

        this.conn = new esl.Connection(
            process.env.FS_HOST || '127.0.0.1',
            8021,
            process.env.FS_PASSWORD || 'ClueCon',
            () => {
                console.log('[DEBUG] FreeSWITCH Connection Established');
                this.conn.subscribe(['CHANNEL_ANSWER', 'CHANNEL_HANGUP_COMPLETE', 'PLAYBACK_STOP']);
                setInterval(() => this.cleanupOldRecordings(), 60 * 60 * 1000); 
                // Pehli baar start hote hi cleanup chalane ke liye
                this.cleanupOldRecordings();
            }
        );

        this.conn.on('esl::event::CHANNEL_ANSWER::*', (ev) => this.handleCallStart(ev));
        this.conn.on('esl::event::CHANNEL_PARK::*', (ev) => this.handleCallStart(ev));
        
        // constructor ke andar ye update karein
this.conn.on('esl::event::CHANNEL_HANGUP_COMPLETE::*', async (ev) => {
    const id = ev.getHeader('Unique-ID');
    const callData = this.activeCalls.get(id);

    if (callData && callData.history.length > 0) {
        console.log(`\n[PRODUCTION-REPORT] Generating Analytics for Call: ${id}...`);
        
        try {
            const report = await this.llm.generateCallReport(callData.history);
            
            // Report ka Title aur Format
            const reportTitle = `CALL_ANALYTICS_REPORT_${Date.now()}`;
            const reportContent = `
=========================================
      PRODUCTION CALL ANALYTICS
=========================================
REPORT ID   : ${id}
TIMESTAMP   : ${new Date().toISOString()}
-----------------------------------------
${report}
=========================================`;

            console.log(reportContent);
            
            // Optional: Ise file mein save karein
            fs.appendFileSync('call_reports.log', reportContent);
            
        } catch (err) {
            console.error("[REPORT-ERROR]", err);
        }
    }
    
    this.activeCalls.delete(id);
});
    }

cleanupOldRecordings() {
        const tempDir = process.env.TEMP_DIR; // Ensure karein ki ye sahi path hai
        const now = Date.now();
        const oneHourAgo = now - (60 * 60 * 1000);

        console.log("[CLEANUP] Checking for files older than 1 hour...");
        
        fs.readdir(tempDir, (err, files) => {
            if (err) return console.error("[CLEANUP-ERROR]", err);
            
            files.forEach(file => {
                // Sirf wo files jo 'rec_' ya 'tts_' se shuru hoti hain aur .wav hain
                if (file.endsWith('.wav') && (file.startsWith('rec_') || file.startsWith('tts_'))) {
                    const filePath = path.join(tempDir, file);
                    
                    fs.stat(filePath, (err, stats) => {
                        if (err) return;
                        
                        // Agar file 1 ghante se purani hai toh delete karein
                        if (stats.mtimeMs < oneHourAgo) {
                            fs.unlink(filePath, (err) => {
                                if (!err) console.log(`[CLEANUP] Deleted old file: ${file}`);
                            });
                        }
                    });
                }
            });
        });
    }

    handleCallStart(event) {
        const id = event.getHeader('Unique-ID');
        if (this.activeCalls.has(id)) return;
        this.activeCalls.set(id, { history: [] });
        console.log(`\n[SYSTEM] New Call Detected: ${id}`);
        
        // ZAROORI: Call ko park karein taaki FS use hangup na kare
        this.conn.execute('park', '', id);
        this.onAnswer(id);
    }

    async onAnswer(channelId) {
        console.log(`[FLOW] Sending Greeting...`);
        await this.speak(channelId, kb.script.greeting);
    }

    async speak(channelId, text) {
        if (!this.activeCalls.has(channelId)) return;

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
    this.conn.execute('wait_for_silence', '200 15 10 5000', channelId, async () => {
        
        // Step 3: Recording rokein taaki file save ho jaye
        this.conn.execute('stop_record_session', recPath, channelId);
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
                        monitor.log("Calling LLM...");
                        // 1. User ki baat history mein daalein
                        this.activeCalls.get(channelId).history.push({ role: 'user', content: transcript });
                        const response = await this.llm.generateResponse(transcript, kb, this.activeCalls.get(channelId).history);
                        // 2. AI ka jawab history mein daalein
                        this.activeCalls.get(channelId).history.push({ role: 'assistant', content: response });
                        await this.speak(channelId, response);
                    } else {
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
        }, 100); 
    });
}
}

module.exports = FreeSWITCHHandler;