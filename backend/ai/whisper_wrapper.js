const WebSocket = require('ws');
const fs = require('fs');

class WhisperWrapper {
    constructor() {
        // Python server se connection
        this.ws = new WebSocket('ws://127.0.0.1:8083');
        
        this.ws.on('open', () => console.log('[NODE] Connected to Python STT Engine'));
        this.ws.on('error', (err) => console.error('[NODE] STT Engine Connection Error:', err.message));
    }

    async transcribe(wavPath) {
        return new Promise((resolve) => {
            if (!fs.existsSync(wavPath)) return resolve("");

            const audioBuffer = fs.readFileSync(wavPath);
            
            // Python ko audio bhejoji
            this.ws.send(audioBuffer);

            // Response ka wait karo
            this.ws.once('message', (data) => {
                resolve(data.toString());
            });
        });
    }
}

module.exports = WhisperWrapper;