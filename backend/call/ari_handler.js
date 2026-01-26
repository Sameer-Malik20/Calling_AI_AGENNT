const ari = require('ari-client');
const { CallFlow } = require('../flow/state_machine');
const WhisperWrapper = require('../ai/whisper_wrapper');
const PiperWrapper = require('../ai/piper_wrapper');
const FileTransfer = require('../utils/file_transfer');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

class ARIHandler {
    constructor(config) {
        this.config = config;
        this.whisper = new WhisperWrapper();
        this.piper = new PiperWrapper();
        this.fileTransfer = new FileTransfer({
            host: process.env.UBUNTU_IP || config.ubuntu_ip || '10.187.56.151',
            user: process.env.UBUNTU_USER || config.ubuntu_user || 'sameer',
            keyPath: process.env.SSH_KEY_PATH || null
        });
        this.client = null;
        this.activeCalls = new Map();

        // Ensure temp directory exists
        const tempDir = path.join(__dirname, '../../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Remote directories on Ubuntu
        this.remoteAsteriskSounds = '/var/lib/asterisk/sounds/custom';
        this.remoteRecordings = '/tmp';
    }

    async connect() {
        try {
            console.log(`[ARI] Connecting to ${this.config.url} with user ${this.config.username}...`);
            this.client = await ari.connect(this.config.url, this.config.username, this.config.password);
            console.log('[ARI] Successfully connected to Asterisk ARI');

            this.client.on('StasisStart', (event, channel) => {
                this.handleCall(channel);
            });

            this.client.on('StasisEnd', (event, channel) => {
                console.log(`[CALL] Call ended on channel ${channel.id}`);
                this.activeCalls.delete(channel.id);
            });

            this.client.start('callingagent');
        } catch (error) {
            console.error('[ARI] Connection Error:', error.message);
            setTimeout(() => this.connect(), 5000);
        }
    }

    async handleCall(channel) {
        console.log(`[CALL] New call detected on channel ${channel.id}`);
        this.activeCalls.set(channel.id, true);

        try {
            await channel.answer();
            console.log(`[CALL] Channel answered: ${channel.id}`);

            // Initialize Call Flow
            const kbPath = path.join(__dirname, '../knowledge/techsolutions.json');
            let kb;
            try {
                const bytes = fs.readFileSync(kbPath);
                kb = JSON.parse(bytes);
            } catch (e) {
                console.error("[KB] Knowledge base not found, using default.");
                kb = { script: { greeting: "Hello, this is an AI agent. How can I help you?" } };
            }
            const flow = new CallFlow(kb);

            // 1. Initial Greeting
            const greeting = flow.getInitialGreeting();
            console.log(`[GREETING] Playing: "${greeting}"`);
            await this.saySomething(channel, greeting);

            // 2. Main Loop: Listen -> Think -> Speak
            let loopCount = 0;
            while (this.activeCalls.has(channel.id) && loopCount < 5) {
                loopCount++;
                console.log(`\n[LOOP] Starting loop ${loopCount} for channel ${channel.id}`);

                try {
                    // Record user input
                    const recordingPath = await this.recordAudio(channel);
                    if (!recordingPath) {
                        console.log("[LOOP] No recording captured, ending call.");
                        break;
                    }

                    // Verify recording has actual audio content
                    const stats = fs.statSync(recordingPath);
                    if (stats.size < 1000) {
                        console.log(`[LOOP] Recording too small (${stats.size} bytes), ending call.`);
                        break;
                    }

                    // Transcribe to text
                    console.log(`[LOOP] Transcribing audio...`);
                    const userInput = await this.whisper.transcribe(recordingPath);

                    if (!userInput || userInput.length < 2) {
                        console.log("[LOOP] No meaningful transcription, ending call.");
                        break;
                    }

                    console.log(`[LOOP] User said: "${userInput}"`);

                    // Process with LLM
                    const aiResponse = await flow.processInput(userInput);
                    console.log(`[LOOP] AI response: "${aiResponse}"`);

                    // Speak back
                    await this.saySomething(channel, aiResponse);

                } catch (err) {
                    if (err.message && err.message.includes('not found')) {
                        console.log("[LOOP] Channel hung up.");
                        break;
                    }
                    console.error("[LOOP] Error in call loop:", err.message);
                    break;
                }
            }

            console.log(`[CALL] Call completed for ${channel.id}`);
        } catch (error) {
            console.error(`[CALL] Error handling call ${channel.id}:`, error.message);
        }
    }

    /**
     * Record audio from channel and transfer to Windows
     */
    async recordAudio(channel) {
        return new Promise(async (resolve) => {
            try {
                const recordingName = `rec_${channel.id}_${Date.now()}`;

                console.log(`[RECORD] Recording started: ${recordingName}`);

                try {
                    // Use MixMonitor via dialplan instead of ARI record
                    // This is more reliable and doesn't have Internal Server Error issue
                    const recordingPath = `/tmp/${recordingName}.wav`;

                    // Start recording using MixMonitor
                    await channel.exec({ 
                        app: 'MixMonitor', 
                        appArgs: `${recordingName}.wav,b,,${recordingName}.wav` 
                    });

                    console.log(`[RECORD] MixMonitor started`);

                    // Wait for user to speak (10 seconds)
                    await new Promise(r => setTimeout(r, 10000));

                    // Stop recording
                    await channel.exec({ 
                        app: 'StopMixMonitor', 
                        appArgs: '' 
                    });

                    console.log(`[RECORD] MixMonitor stopped`);

                } catch (recordError) {
                    console.error(`[RECORD] MixMonitor failed: ${recordError.message}`);
                    resolve(null);
                    return;
                }

                const remoteRecordingFile = `/tmp/${recordingName}.wav`;
                const windowsRecordingPath = path.join(__dirname, `../../temp/${recordingName}.wav`);

                try {
                    // Transfer recording back to Windows
                    await this.fileTransfer.downloadFromUbuntu(remoteRecordingFile, windowsRecordingPath);
                    console.log(`[RECORD] Recording transferred to Windows: ${windowsRecordingPath}`);

                    // Verify file exists and has content
                    if (!fs.existsSync(windowsRecordingPath)) {
                        console.error(`[RECORD] File not transferred: ${windowsRecordingPath}`);
                        resolve(null);
                        return;
                    }

                    const stats = fs.statSync(windowsRecordingPath);
                    if (stats.size < 1000) {
                        console.error(`[RECORD] Recording too small (${stats.size} bytes)`);
                        resolve(null);
                        return;
                    }

                    // Resample to 16kHz for Whisper
                    const upsampled = await this.resampleAudio(windowsRecordingPath, 16000);
                    resolve(upsampled);
                } catch (transferError) {
                    console.warn(`[RECORD] Transfer warning: ${transferError.message}`);
                    resolve(null);
                }
            } catch (error) {
                console.error(`[RECORD] Recording error: ${error.message}`);
                resolve(null);
            }
        });
    }

    /**
     * Wait for recording to finish
     */
    async waitForRecording(recordingName) {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                this.client.removeListener('RecordingFinished', onFinished);
                console.warn(`[RECORD] Recording timeout for ${recordingName}`);
                resolve();
            }, 15000);

            const onFinished = (event, recording) => {
                if (recording.name && recording.name.includes(recordingName)) {
                    clearTimeout(timeout);
                    this.client.removeListener('RecordingFinished', onFinished);
                    console.log(`[RECORD] Recording event received: ${recording.name}`);
                    resolve();
                }
            };
            this.client.on('RecordingFinished', onFinished);
        });
    }

    /**
     * Play TTS audio on channel
     */
    async saySomething(channel, text) {
        if (!this.activeCalls.has(channel.id)) return;

        try {
            const ttsFileName = `tts_${channel.id}_${Date.now()}`;
            const ttsWindowsPath = path.resolve(__dirname, `../../temp/${ttsFileName}.wav`);

            // Generate TTS on Windows
            console.log(`[TTS] Generating: "${text.substring(0, 50)}..."`);
            await this.piper.synthesize(text, ttsWindowsPath);

            // Wait for file to be created
            let retries = 0;
            while (!fs.existsSync(ttsWindowsPath) && retries < 10) {
                await new Promise(r => setTimeout(r, 100));
                retries++;
            }

            if (!fs.existsSync(ttsWindowsPath)) {
                throw new Error(`TTS file not created: ${ttsWindowsPath}`);
            }

            // Verify TTS file has content
            const stats = fs.statSync(ttsWindowsPath);
            if (stats.size < 1000) {
                throw new Error(`TTS file too small (${stats.size} bytes)`);
            }

            // Resample to 8kHz for Asterisk
            const resampled = await this.resampleAudio(ttsWindowsPath, 8000);
            console.log(`[TTS] Resampled to 8kHz`);

            // Verify resampled file
            const resampledStats = fs.statSync(resampled);
            if (resampledStats.size < 1000) {
                throw new Error(`Resampled file too small (${resampledStats.size} bytes)`);
            }

            // Transfer to Ubuntu
            const remoteFileName = `tts_${Date.now()}.wav`;
            const remotePath = `${this.remoteAsteriskSounds}/${remoteFileName}`;

            try {
                await this.fileTransfer.uploadToUbuntu(resampled, remotePath);
                console.log(`[TTS] Transferred to Ubuntu: ${remotePath}`);
            } catch (transferError) {
                console.warn(`[TTS] File transfer skipped: ${transferError.message}`);
                // Continue anyway - might work even without transfer
            }

            // Remove extension for ARI playback
            const soundName = remoteFileName.replace('.wav', '');

            // Play via ARI
            console.log(`[ARI] Playing: sound:custom/${soundName}`);
            const playback = await channel.play({ media: `sound:custom/${soundName}` });

            // Wait for playback to finish
            await new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    this.client.removeListener('PlaybackFinished', onPlaybackFinished);
                    console.warn(`[ARI] Playback timeout for ${soundName}`);
                    resolve();
                }, 30000);

                const onPlaybackFinished = (event, completedPlayback) => {
                    if (completedPlayback.id === playback.id) {
                        clearTimeout(timeout);
                        this.client.removeListener('PlaybackFinished', onPlaybackFinished);
                        console.log(`[ARI] Playback finished: ${soundName}`);
                        resolve();
                    }
                };
                this.client.on('PlaybackFinished', onPlaybackFinished);
            });

            // Cleanup
            if (fs.existsSync(ttsWindowsPath)) fs.unlinkSync(ttsWindowsPath);
            if (fs.existsSync(resampled)) fs.unlinkSync(resampled);

        } catch (error) {
            console.error(`[TTS] Error: ${error.message}`);
        }
    }

    /**
     * Resample audio using FFmpeg
     */
    async resampleAudio(inputPath, targetSampleRate) {
        return new Promise((resolve, reject) => {
            try {
                const outputPath = inputPath.replace('.wav', `_${targetSampleRate}.wav`);

                if (fs.existsSync(outputPath)) {
                    fs.unlinkSync(outputPath);
                }

                console.log(`[FFMPEG] Resampling to ${targetSampleRate}kHz...`);

                try {
                    const ffmpegPath = 'C:\\ffmpeg\\bin\\ffmpeg.exe';
                    const cmd = `"${ffmpegPath}" -y -i "${inputPath}" -ar ${targetSampleRate} -ac 1 -c:a pcm_s16le "${outputPath}"`;
                    execSync(cmd, { stdio: 'pipe' });

                    if (!fs.existsSync(outputPath)) {
                        throw new Error('FFmpeg output file not created');
                    }

                    console.log(`[FFMPEG] Resampled: ${outputPath}`);
                    resolve(outputPath);
                } catch (ffmpegError) {
                    // FFmpeg not available, use original file
                    console.warn(`[FFMPEG] FFmpeg not available or failed, using original file`);
                    resolve(inputPath);
                }
            } catch (error) {
                console.error(`[FFMPEG] Error: ${error.message}`);
                reject(error);
            }
        });
    }

    /**
     * Initiate outbound call
     */
    async initiateCall(number) {
        if (!this.client) {
            throw new Error('ARI Client not connected');
        }

        console.log(`[CALL] Initiating outbound call to ${number}...`);
        try {
            await this.client.channels.originate({
                endpoint: `PJSIP/${number}@sip2sip-endpoint`,
                app: 'callingagent',
                appArgs: 'dialed',
                callerId: '"AI Agent" <sameermalik123>',
                timeout: 30
            });
            console.log(`[CALL] Call origination request sent for ${number}`);
        } catch (error) {
            console.error(`[CALL] Failed to originate call to ${number}: ${error.message}`);
            throw error;
        }
    }
}

module.exports = ARIHandler;
