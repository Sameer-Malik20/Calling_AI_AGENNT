require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const campaignManager = require('./campaign/manager');

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to Local MongoDB'))
    .catch(err => console.error('MongoDB Connection Error:', err));
// server.js
const FreeSWITCHHandler = require('./call/freeswitch_handler');
const handler = new FreeSWITCHHandler(); // Ye sahi hai 
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

// const ari = new ARIHandler({
//     url: process.env.ARI_URL || 'http://localhost:8088',
//     username: process.env.ARI_USERNAME || 'admin',
//     password: process.env.ARI_PASSWORD || 'admin_password'
// });

// ari.connect();

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

// // Test Call Route
// app.post('/api/test-call', async (req, res) => {
//     const { number } = req.body;
//     if (!number) return res.status(400).json({ error: "Number is required" });
    
//     // Normalize number
//     let formattedNumber = number.trim();
//     if (!formattedNumber.startsWith('+')) {
//         // Default to +1 for US if 10 digits, otherwise keep as is or user should provide full format
//         formattedNumber = formattedNumber.length === 10 ? `+1${formattedNumber}` : formattedNumber;
//     }

//     try {
//         // await ari.initiateCall(formattedNumber);
//         res.json({ message: `Test call initiated to ${formattedNumber}` });
//     } catch (err) {
//         res.status(500).json({ error: "ARI not connected or invalid number" });
//     }
// });

// API Routes
app.post('/api/campaigns', async (req, res) => {
    const { name, knowledgeFile, numbers } = req.body;
    try {
        const id = await campaignManager.createCampaign(name, knowledgeFile, numbers);
        res.json({ id, message: 'Campaign created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/campaigns/:id/stats', async (req, res) => {
    try {
        const stats = await campaignManager.getStats(req.params.id);
        res.json(stats);
    } catch (err) {
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

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend server running on all interfaces on port ${PORT}`);
});
