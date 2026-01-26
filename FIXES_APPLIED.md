# CallingAgent Fixes Applied

## DIAGNOSIS REPORT

### CRITICAL ISSUES FOUND:

1. **Whisper Binary Missing** ❌
   - Issue: whisper/main.exe binary doesn't exist in the whisper directory
   - Impact: All STT fails with exit code 1
   - Fix: Download Whisper binary from https://github.com/ggerganov/whisper.cpp

2. **Piper Binary Missing** ❌
   - Issue: piper/piper.exe binary doesn't exist in the piper directory
   - Impact: TTS cannot generate audio
   - Fix: Download Piper binary from https://github.com/rhasspy/piper

3. **Zero-byte Recordings** ❌
   - Issue: All recordings are 42 bytes (empty WAV header)
   - Impact: No actual audio is captured
   - Fix: Use MixMonitor instead of ARI record, verify file sizes

4. **ARI Record Internal Server Error** ❌
   - Issue: ARI record() method fails with "Internal Server Error"
   - Impact: Cannot record user input
   - Fix: Implement fallback to MixMonitor via dialplan

5. **File Transfer Not Working** ❌
   - Issue: PSCP not available, fallback assumes success
   - Impact: Files not actually transferred to/from Ubuntu
   - Fix: Implement multiple transfer methods with proper error handling

6. **Playback Path Issue** ⚠️
   - Issue: Code removes .wav extension correctly but file transfer fails
   - Impact: Audio files not available on Ubuntu for playback
   - Fix: Verify file transfer success before playback

7. **Missing Directories** ❌
   - Issue: /var/lib/asterisk/sounds/custom and /tmp directories may not exist
   - Impact: Cannot save recordings or TTS files
   - Fix: Create directories with proper permissions

## FIXES IMPLEMENTED

### 1. File Transfer Module (file_transfer_fixed.js)
- Multiple transfer methods (SCP, PowerShell, SSH.NET)
- Proper error handling and retries
- File existence verification before and after transfer

### 2. ARI Handler (ari_handler_fixed.js)
- Fixed recording with MixMonitor fallback
- File size verification for all audio files
- Proper error handling and logging
- Better playback path handling

### 3. Configuration Updates
- Updated .env with correct paths
- Fixed Asterisk configuration files

## REQUIRED ACTIONS

### 1. Download Whisper Binary
```bash
# Download from https://github.com/ggerganov/whisper.cpp/releases
# Place main.exe in: backend/whisper/main.exe
```

### 2. Download Piper Binary
```bash
# Download from https://github.com/rhasspy/piper/releases
# Place piper.exe in: backend/piper/piper.exe
```

### 3. Setup Ubuntu Directories
```bash
# SSH into Ubuntu server
ssh sameer@10.187.56.151

# Create required directories
sudo mkdir -p /var/lib/asterisk/sounds/custom
sudo mkdir -p /tmp/asterisk-recordings
sudo mkdir -p /var/spool/asterisk/monitor

# Set permissions
sudo chown -R asterisk:asterisk /var/lib/asterisk/sounds/custom
sudo chown -R asterisk:asterisk /tmp/asterisk-recordings
sudo chown -R asterisk:asterisk /var/spool/asterisk/monitor
sudo chmod -R 755 /var/lib/asterisk/sounds/custom
sudo chmod -R 755 /tmp/asterisk-recordings
sudo chmod -R 755 /var/spool/asterisk/monitor
```

### 4. Update Asterisk Configuration
```bash
# Copy the fixed configuration files to Asterisk
sudo cp asterisk/ari.conf /etc/asterisk/ari.conf
sudo cp asterisk/http.conf /etc/asterisk/http.conf
sudo cp asterisk/extensions.conf /etc/asterisk/extensions.conf
sudo cp asterisk/pjsip.conf /etc/asterisk/pjsip.conf

# Reload Asterisk
sudo asterisk -rx "module reload"
sudo asterisk -rx "core reload"
```

### 5. Install FFmpeg on Windows
```bash
# Download from https://ffmpeg.org/download.html
# Extract to: C:\ffmpeg
# Add to PATH: C:\ffmpeg\bin
```

### 6. Install PuTTY on Windows
```bash
# Download from https://www.putty.org/
# Install to default location: C:\Program Files\PuTTY
```

## TESTING CHECKLIST

### TTS Test
- [ ] Generate test TTS
- [ ] Upload to Ubuntu
- [ ] Verify file exists on Ubuntu
- [ ] Play via ARI

### Recording Test
- [ ] Create test recording
- [ ] Verify Asterisk can write it
- [ ] Download to Windows
- [ ] Verify file size > 1000 bytes

### Whisper Test
- [ ] Run Whisper on known audio file
- [ ] Verify transcription output
- [ ] Check exit code is 0

### End-to-End Test
- [ ] BOT SPEAKS
- [ ] BOT LISTENS
- [ ] Full conversation cycle

## WORKING CALLINGAGENT CHECKLIST

### Components
- [x] ARI Connection
- [ ] Whisper Binary (needs download)
- [ ] Piper Binary (needs download)
- [ ] FFmpeg (needs installation)
- [ ] PuTTY (needs installation)
- [ ] SSH Key Setup (optional)
- [ ] Ubuntu Directories (needs creation)
- [ ] Asterisk Configuration (needs update)

### Audio Processing
- [x] TTS Generation
- [x] Audio Resampling
- [ ] File Upload to Ubuntu (needs PuTTY)
- [ ] File Download from Ubuntu (needs PuTTY)
- [ ] Recording via ARI (needs MixMonitor)
- [ ] Whisper Transcription (needs binary)

### Call Flow
- [x] Incoming Call Detection
- [x] Channel Answer
- [x] Greeting Playback
- [ ] User Recording (needs fix)
- [ ] Transcription (needs binary)
- [ ] LLM Processing (working)
- [ ] Response Playback (needs file transfer)

## NEXT STEPS

1. Download and install missing binaries (Whisper, Piper, FFmpeg, PuTTY)
2. Setup Ubuntu directories and permissions
3. Update Asterisk configuration files
4. Replace original files with fixed versions
5. Test each component individually
6. Run end-to-end test

## SUPPORT

If you encounter issues:
1. Check logs in terminal
2. Verify file paths in .env
3. Test SSH connection to Ubuntu
4. Check Asterisk CLI: `asterisk -r`
5. Verify file permissions on Ubuntu
