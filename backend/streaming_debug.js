const dgram = require('dgram');
const WebSocket = require('ws');
const esl = require('modesl');

// --- CONFIGURATION ---
const UDP_PORT = 9999;
const STT_WS_URL = 'ws://127.0.0.1:8083';
const FS_CONFIG = { host: '127.0.0.1', port: 8021, pass: 'ClueCon' };

console.log('\n--- 🔍 ULTIMATE STREAMING DEBUGGER (Mod_Shout Edition) ---');

// 1. Python WebSocket Connection
const ws = new WebSocket(STT_WS_URL);
let isWsConnected = false;
ws.on('open', () => { 
    console.log('✅ [STEP 1] Python STT Engine: CONNECTED'); 
    isWsConnected = true; 
});
ws.on('error', () => console.log('❌ [STEP 1] Python STT Engine: NOT CONNECTED'));

// 2. UDP Audio Listener
const udpServer = dgram.createSocket('udp4');
let totalBytes = 0;
udpServer.on('message', (msg) => {
    totalBytes += msg.length;
    // Har audio packet par ek dot dikhega
    process.stdout.write("."); 
    if (totalBytes % 16000 === 0) console.log(`\n📦 [AUDIO] Total Bytes Received: ${totalBytes}`);
    if (isWsConnected) ws.send(msg);
});

udpServer.bind(UDP_PORT, '0.0.0.0', () => {
    console.log(`✅ [STEP 2] UDP Listener: ACTIVE on port ${UDP_PORT}`);
});

// 3. FreeSWITCH Connection
const eslConn = new esl.Connection(FS_CONFIG.host, FS_CONFIG.port, FS_CONFIG.pass, () => {
    console.log('✅ [STEP 3] FreeSWITCH ESL: CONNECTED');
    eslConn.subscribe(['CHANNEL_ANSWER', 'CHANNEL_HANGUP']);
    console.log('📡 Waiting for call to test SHOUT streaming...\n');
});

eslConn.on('esl::event::CHANNEL_ANSWER::*', (ev) => {
    const uuid = ev.getHeader('Unique-ID');
    console.log(`\n📞 [CALL] Answered! UUID: ${uuid}`);
    
    // Windows requirements
    eslConn.execute('set', 'bypass_media=false', uuid);
    eslConn.execute('set', 'media_bug_answer_req=true', uuid);

    // Hum Shout protocol use karenge kyunki mod_shout ab loaded hai
    const streamUrl = `shout://127.0.0.1:${UDP_PORT}`;
    
    console.log(`🚀 Sending: uuid_record start ${streamUrl}`);
    
    eslConn.api('uuid_record', `${uuid} start ${streamUrl}`, (res) => {
        const reply = res.getBody();
        console.log(`💬 [FS-REPLY]: ${reply.trim()}`);
        
        if (reply.includes('-ERR')) {
            console.log("⚠️ Shout failed, trying Raw extension backup...");
            eslConn.api('uuid_record', `${uuid} start udp://127.0.0.1:${UDP_PORT}/.raw`);
        } else {
            console.log("⭐ [SUCCESS] Command accepted. If dots appear, streaming is working!");
        }
    });
});

eslConn.on('error', (err) => console.error('❌ [ESL-ERROR]:', err));