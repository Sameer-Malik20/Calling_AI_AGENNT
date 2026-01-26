# AI Outbound Cold Calling Agent System - Installation Guide

This system runs fully offline on a local machine using open-source components.

## Prerequisites
1. **Node.js** (v18+)
2. **Docker Desktop** (for LiveKit/Redis)
3. **Asterisk** (Installed on Linux or WSL2)
4. **Python** (Optional, for scripts)

## 1. Setup Backend
```bash
cd backend
npm install
cp .env.example .env # Update with your paths
mkdir ../temp # For audio files
```

## 2. Setup Frontend
```bash
cd frontend
npm install
```

## 3. Local AI Components (Manual Downloads Required)
### STT: Whisper.cpp
1. Clone [whisper.cpp](https://github.com/ggerganov/whisper.cpp).
2. Build it (`make`).
3. Download the base model: `./models/download-ggml-model.sh base`.
4. Update `WHISPER_PATH` in `backend/.env`.

### LLM: LM Studio / llama.cpp
1. Download **Qwen 3B Instruct GGUF**.
2. Run it as an API server on `http://localhost:1234`.
3. Ensure it supports `/v1/chat/completions`.

### TTS: Piper
1. Download [Piper binary](https://github.com/rhasspy/piper).
2. Download a US English model (`en_US-amy-medium.onnx`).
3. Update `PIPER_PATH` in `backend/.env`.

## 4. Telephony Setup (Asterisk)
1. Copy contents of `/asterisk/*.conf` to `/etc/asterisk/`.
2. Restart Asterisk: `sudo systemctl restart asterisk`.
3. Ensure ARI is enabled and port `8088` is open.

## 5. LiveKit Setup
```bash
cd livekit
docker-compose up -d
```

## 6. Running the System
Use the provided PowerShell script:
```powershell
.\scripts\start.ps1
```
Or start components manually:
- Backend: `npm run dev` in `/backend`
- Frontend: `npm run dev` in `/frontend`

## 7. Configuration
- Place knowledge JSON files in `backend/knowledge/`.
- Manage campaigns via the React Dashboard at `http://localhost:5173`.
