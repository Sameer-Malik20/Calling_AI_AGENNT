# CallingAgent Complete Setup Guide

## Prerequisites

### Windows Requirements
- Node.js (v14 or higher)
- Git
- PowerShell (Administrator privileges)
- FFmpeg
- PuTTY

### Ubuntu Requirements
- Asterisk (v18 or higher)
- SSH access
- sudo privileges

## Step 1: Install FFmpeg on Windows

1. Download FFmpeg from https://ffmpeg.org/download.html
2. Extract to `C:\ffmpeg`
3. Add to PATH:
   - Right-click "This PC" → Properties → Advanced system settings
   - Click "Environment Variables"
   - Under "System variables", find "Path" and click "Edit"
   - Click "New" and add `C:\ffmpeg\bin`
   - Click OK to save

4. Verify installation:
   ```powershell
   ffmpeg -version
   ```

## Step 2: Install PuTTY on Windows

1. Download PuTTY from https://www.putty.org/
2. Install to default location: `C:\Program Files\PuTTY`
3. Verify installation:
   ```powershell
   Test-Path "C:\Program Files\PuTTY\pscp.exe"
   Test-Path "C:\Program Files\PuTTY\plink.exe"
   ```

## Step 3: Download Whisper Binary

1. Visit https://github.com/ggerganov/whisper.cpp/releases
2. Download the latest Windows binary (whisper.exe or main.exe)
3. Place it in: `backend/whisper/main.exe`
4. Verify:
   ```powershell
   Test-Path "backend/whisper/main.exe"
   ```

## Step 4: Download Piper Binary

1. Visit https://github.com/rhasspy/piper/releases
2. Download the latest Windows binary (piper.exe)
3. Place it in: `backend/piper/piper.exe`
4. Verify:
   ```powershell
   Test-Path "backend/piper/piper.exe"
   ```

## Step 5: Setup Ubuntu Directories

1. SSH into Ubuntu:
   ```bash
   ssh sameer@10.187.56.151
   ```

2. Run the setup script:
   ```bash
   sudo bash setup_ubuntu.sh
   ```

   Or manually:
   ```bash
   sudo mkdir -p /var/lib/asterisk/sounds/custom
   sudo mkdir -p /tmp/asterisk-recordings
   sudo mkdir -p /var/spool/asterisk/monitor
   sudo chown -R asterisk:asterisk /var/lib/asterisk/sounds/custom
   sudo chown -R asterisk:asterisk /tmp/asterisk-recordings
   sudo chown -R asterisk:asterisk /var/spool/asterisk/monitor
   sudo chmod -R 755 /var/lib/asterisk/sounds/custom
   sudo chmod -R 755 /tmp/asterisk-recordings
   sudo chmod -R 755 /var/spool/asterisk/monitor
   ```

3. Verify directories:
   ```bash
   ls -la /var/lib/asterisk/sounds/custom
   ls -la /tmp/asterisk-recordings
   ```

## Step 6: Update Asterisk Configuration

1. Copy fixed configuration files to Ubuntu:
   ```bash
   scp asterisk/ari_fixed.conf sameer@10.187.56.151:/tmp/ari.conf
   scp asterisk/http_fixed.conf sameer@10.187.56.151:/tmp/http.conf
   scp asterisk/extensions_fixed.conf sameer@10.187.56.151:/tmp/extensions.conf
   ```

2. On Ubuntu, move files to Asterisk config directory:
   ```bash
   sudo mv /tmp/ari.conf /etc/asterisk/ari.conf
   sudo mv /tmp/http.conf /etc/asterisk/http.conf
   sudo mv /tmp/extensions.conf /etc/asterisk/extensions.conf
   ```

3. Reload Asterisk:
   ```bash
   sudo asterisk -rx "module reload"
   sudo asterisk -rx "core reload"
   ```

4. Verify ARI is running:
   ```bash
   sudo asterisk -rx "http show status"
   ```

## Step 7: Update Backend Configuration

1. Verify .env file contains correct settings:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/calling_agent
   ARI_URL=http://10.187.56.151:8088/ari
   ARI_USERNAME=admin
   ARI_PASSWORD=admin
   LLM_ENDPOINT=http://localhost:1234/v1/chat/completions
   LLM_MODEL=qwen2.5-3b-instruct
   WHISPER_PATH=C:/Users/hp/Desktop/CallingAgent/backend/whisper/main.exe
   WHISPER_MODEL=C:/Users/hp/Desktop/CallingAgent/backend/whisper/ggml-base.en.bin
   PIPER_PATH=piper/piper.exe
   PIPER_MODEL=piper/en_US-amy-medium.onnx
   UBUNTU_IP=10.187.56.151
   UBUNTU_USER=sameer
   SSH_KEY_PATH=
   ```

## Step 8: Replace Backend Files

1. Backup original files:
   ```powershell
   Copy-Item backend/utils/file_transfer.js backend/utils/file_transfer.js.backup
   Copy-Item backend/call/ari_handler.js backend/call/ari_handler.js.backup
   ```

2. Replace with fixed versions:
   ```powershell
   Copy-Item backend/utils/file_transfer_fixed.js backend/utils/file_transfer.js
   Copy-Item backend/call/ari_handler_fixed.js backend/call/ari_handler.js
   ```

## Step 9: Install Dependencies

1. Navigate to backend directory:
   ```powershell
   cd backend
   ```

2. Install npm packages:
   ```powershell
   npm install
   ```

## Step 10: Test Components

### Test TTS
```powershell
node test_tts.js
```

Expected output:
- TTS file generated in temp directory
- File size > 1000 bytes
- No errors

### Test Whisper
```powershell
# Create a test audio file first
ffmpeg -f lavfi -i sine=frequency=1000:duration=1 test.wav

# Test transcription
node -e "const w = require('./ai/whisper_wrapper'); const wrapper = new w(); wrapper.transcribe('test.wav').then(console.log);"
```

Expected output:
- Transcription result (may be empty for test audio)
- Exit code 0

### Test File Transfer
```powershell
# Test upload to Ubuntu
echo "test" > test.txt
node -e "const ft = require('./utils/file_transfer'); const transfer = new ft(); transfer.uploadToUbuntu('test.txt', '/tmp/test.txt').then(console.log).catch(console.error);"

# Test download from Ubuntu
node -e "const ft = require('./utils/file_transfer'); const transfer = new ft(); transfer.downloadFromUbuntu('/tmp/test.txt', 'downloaded.txt').then(console.log).catch(console.error);"
```

Expected output:
- Upload successful
- Download successful
- Files match

## Step 11: Start the Backend

1. Start MongoDB (if not running):
   ```powershell
   # If using MongoDB as a service, it should start automatically
   # Otherwise, start it manually:
   mongod
   ```

2. Start the backend server:
   ```powershell
   node server.js
   ```

Expected output:
- Connected to Local MongoDB
- Successfully connected to Asterisk ARI
- Backend server running on port 5000

## Step 12: Test Call Flow

1. Make a test call to your SIP endpoint
2. Monitor logs:
   - ARI connection established
   - Call detected
   - Channel answered
   - Greeting played
   - Recording started
   - Recording finished
   - Transcription completed
   - AI response generated
   - Response played

## Troubleshooting

### ARI Connection Fails
- Check Ubuntu IP is correct
- Verify Asterisk is running: `sudo asterisk -r`
- Check http.conf: `sudo asterisk -rx "http show status"`
- Verify firewall allows port 8088

### Recording Fails
- Check /tmp/asterisk-recordings directory exists
- Verify permissions: `ls -la /tmp/asterisk-recordings`
- Check Asterisk logs: `sudo asterisk -r` → `core set verbose 10`

### Whisper Fails
- Verify whisper.exe exists at correct path
- Check model file exists
- Test manually: `whisper/main.exe -m whisper/ggml-base.en.bin -f test.wav`

### TTS Fails
- Verify piper.exe exists at correct path
- Check model files exist
- Test manually: `piper/piper.exe --model piper/en_US-amy-medium.onnx --output_file test.wav`

### File Transfer Fails
- Verify PuTTY is installed
- Test SSH connection manually: `ssh sameer@10.187.56.151`
- Check firewall allows SSH
- Verify credentials in .env

### Playback Fails
- Check file was uploaded to Ubuntu
- Verify file exists: `ls -la /var/lib/asterisk/sounds/custom/`
- Check file permissions
- Test playback manually in Asterisk CLI: `channel originate PJSIP/1001@incoming-sip application Playback custom/test`

## Verification Checklist

After completing setup, verify:

- [ ] FFmpeg installed and working
- [ ] PuTTY installed and working
- [ ] Whisper binary downloaded
- [ ] Piper binary downloaded
- [ ] Ubuntu directories created
- [ ] Ubuntu permissions set
- [ ] Asterisk configuration updated
- [ ] ARI connection working
- [ ] TTS working
- [ ] Whisper working
- [ ] File transfer working
- [ ] Recording working
- [ ] Playback working
- [ ] End-to-end call flow working

## Support

If you encounter issues:
1. Check all logs in terminal
2. Verify file paths in .env
3. Test SSH connection to Ubuntu
4. Check Asterisk CLI: `asterisk -r`
5. Verify file permissions on Ubuntu
6. Review FIXES_APPLIED.md for known issues
