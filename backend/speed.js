const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

// Yahan apni koi bhi purani recording ka path daalein
const TEST_AUDIO_FILE = path.join(__dirname, '..', 'temp', 'rec_1769323701473.wav'); 



async function runTest() {
    console.log("--- STARTING SPEED TEST ---");
    const ws = new WebSocket('ws://127.0.0.1:8083');

    ws.on('open', async () => {
        console.log("[1] Connected to Python Engine");

        if (!fs.existsSync(TEST_AUDIO_FILE)) {
            console.error("❌ Test file nahi mili! Pehle ek 'test_audio.wav' temp folder mein rakhein.");
            process.exit();
        }

        const startRead = Date.now();
        const audioBuffer = fs.readFileSync(TEST_AUDIO_FILE);
        console.log(`[2] File Read Time: ${Date.now() - startRead}ms`);

        const startSTT = Date.now();
        console.log("[3] Sending audio to Python...");
        ws.send(audioBuffer);

        ws.on('message', (data) => {
            const endSTT = Date.now();
            console.log(`[4] Transcription Received: "${data.toString()}"`);
            console.log(`[5] TOTAL STT LATENCY: ${endSTT - startSTT}ms`);
            
            if ((endSTT - startSTT) < 1000) {
                console.log("✅ Result: Speed is EXCELLENT (Sub-second)");
            } else {
                console.log("⚠️ Result: Speed is SLOW (Above 1 second)");
            }
            process.exit();
        });
    });

    ws.on('error', (err) => {
        console.error("❌ Connection Failed! Kya stt_engine.py chalu hai?");
    });
}

runTest();