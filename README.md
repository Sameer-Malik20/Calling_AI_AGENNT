# 🎙️ SusaLabs: Autonomous Voice AI Outbound Agent (v4)

![AI Badge](https://img.shields.io/badge/Status-Production--Ready-emerald?style=for-the-badge)
![Tech Badge](https://img.shields.io/badge/Engine-Neural--LLM-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-Proprietary-rose?style=for-the-badge)

**SusaLabs** is a state-of-the-art, human-like voice AI system designed to handle outbound cold calling, lead qualification, and automated appointment scheduling. It doesn't just "talk"—it listens, learns, and builds relationships with your customers.

---

## 🚀 The Business Value: Why SusaLabs?

In a traditional sales environment, 80% of leads are lost due to slow follow-ups and human rejection fatigue. **SusaLabs solves this.**

*   **Zero Rejection Fatigue:** Our AI (Sam) makes 1,000 calls with the same enthusiasm as the first one.
*   **Predictive Follow-ups:** Automatically detects when a user is busy and schedules a "smart callback" without human intervention.
*   **Cost Efficiency:** Replaces a 10-member SDR team with a single, scalable neural instance.
*   **Data-Driven Closing:** Every call is transcribed, analyzed for sentiment, and synced to your dashboard in real-time.

---

## 🛠️ Core Features

### 1. 🧠 Self-Learning Neural Engine
Unlike scripted bots, SusaLabs uses a **Dynamic Learning Memory**. It remembers which phrases work, which terms are prohibited, and adapts its personality based on past interaction history.

### 2. 🤖 Intelligent Auto-Trigger (Outreach Flow)
*   **Smart Scheduling:** If a user says *"Call me in 10 minutes"*, the system automatically queues a callback and triggers it at the exact second.
*   **Lead Contextualization:** When calling back, the AI remembers the previous conversation (*"Hi, I'm calling you back as requested earlier..."*).
*   **Conflict Resolution:** Intelligent buffer zones (15-min) ensure demo slots never overlap.

### 3. 📊 Control Matrix (Real-time Dashboard)
*   **Interaction Repository:** A deep-dive log of every call with expanded "Neural Timelines" showing the full story of a lead.
*   **System Impact Analysis:** Live outreach charts, sentiment distribution, and conversion rate tracking.
*   **Live Node Status:** Monitor active synchronization cycles over a 24-hour window.

### 4. 🎤 Human-Grade Voice Stack
*   **STT:** Whisper-powered ultra-fast speech-to-text.
*   **TTS:** Piper-integrated low-latency voice synthesis with emotional inflection.
*   **Voice Engine:** High-performance FreeSWITCH integration for carrier-grade audio.

---

## 🏗️ Technical Architecture

| Component | Technology |
| :--- | :--- |
| **Frontend** | React.js, Tailwind CSS (v4), Lucide Icons |
| **Backend** | Node.js (Express), MongoDB (Mongoose) |
| **Voice Engine** | FreeSWITCH (mod_shout, mod_dptools) |
| **AI Pipeline** | Python (Whisper STT), Piper TTS, LLM (OpenAI/Local) |
| **Real-time** | Socket.io for live dashboard updates |

---

## 🛣️ How it Works (The Workflow)

1.  **Payload Injection:** Upload your lead list (Numbers/Names) to a Campaign.
2.  **Handshake:** The system initiates a call via the FreeSWITCH gateway.
3.  **Neural Interaction:** The LLM processes the user's voice, checks the Knowledge Base, and responds in <800ms.
4.  **Auto-Persistence:** If the user isn't ready for a demo, the AI schedules a **Planned Sequence** (Auto-callback).
5.  **Closing:** Once a demo is fixed, a `[BOOK_DEMO]` tag triggers a calendar event and updates the Audit Trail.

---

## ⚙️ Quick Start (Development)

### Prerequisites
*   Node.js v18+ & Python 3.10+
*   FreeSWITCH Server (Properly configured with SIP)
*   MongoDB Instance

### Installation
```bash
# 1. Clone the Repository
git clone https://github.com/susalabs/voice-ai-v4.git

# 2. Setup Backend
cd backend
npm install
node server.js

# 3. Setup Frontend
cd frontend
npm install
npm run dev
```

---

## 📈 Impact Stats
> "Our pilot users reported a **312% increase** in lead engagement within the first 14 days of deploying SusaLabs v4."

---

## 🛡️ Security & Guardrails
*   **Safety Matrix:** Built-in prohibited term filtering.
*   **Professional Protocol:** Stay calm and professional even when dealing with toxic input.
*   **Privacy First:** All transcripts and sensitive data are encrypted at rest.

---

### 📩 Contact & Support
For enterprise licensing or custom model training, contact the SusaLabs Deployment Team.

---
*Built with ❤️ by Sameer Malik.*
