import asyncio
import websockets
from faster_whisper import WhisperModel
import io

# Model ko RAM mein load karke rakhein
# 'base.en' fast hai, accuracy ke liye 'small.en' bhi use kar sakte hain
print("[PYTHON] Loading Faster-Whisper Model...")
model = WhisperModel("base.en", device="cpu", compute_type="int8")
print("[PYTHON] Model Loaded! Ready for requests.")

async def handle_audio(websocket):
    print("[PYTHON] Node.js Connected")
    async for message in websocket:
        try:
            # Node.js se audio data mil raha hai
            audio_file = io.BytesIO(message)
            
            # Transcription (Beam size 1 for maximum speed)
            segments, _ = model.transcribe(audio_file, beam_size=1, language="en")
            
            text = "".join([segment.text for segment in segments]).strip()
            
            print(f"[STT] Result: {text}")
            await websocket.send(text)
        except Exception as e:
            print(f"[ERROR] {e}")
            await websocket.send("")

async def main():
    async with websockets.serve(handle_audio, "127.0.0.1", 8083):
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    asyncio.run(main())