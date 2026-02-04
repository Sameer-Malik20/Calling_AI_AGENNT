const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class PiperWrapper {
    constructor(binaryPath = process.env.PIPER_PATH || 'piper/piper.exe', modelPath = process.env.PIPER_MODEL || 'piper/en_US-amy-medium.onnx') {
        // Fix for Windows: Append .exe if not present
        if (process.platform === 'win32' && !binaryPath.endsWith('.exe')) {
            this.binaryPath = binaryPath + '.exe';
        } else {
            this.binaryPath = binaryPath;
        }
        this.modelPath = modelPath;
    }

    sanitizeForTTS(text) {
        if (!text) return "";
    
        let cleanText = text;
    
        // 1. Sabse pehle [BOOK_DEMO: ...] tags ko puri tarah remove karein
        // Taaki technical data Piper tak pahunche hi nahi
        cleanText = cleanText.replace(/\[BOOK_DEMO:.*?\]/gs, '');
    
        // 2. Agar LLM ne bina brackets ke JSON bhej diya ho (e.g. {"user_time": ...})
        // Toh curly braces aur uske andar ka content saaf karein
        cleanText = cleanText.replace(/\{.*?\}/gs, '');
    
        // 3. Technical Keys aur Garbage words ko remove karein
        // Kabhi-kabhi LLM quotes mein keys likh deta hai (jaisa aapne face kiya)
        const technicalGarbage = [
            /"user_time":/gi, /"ist_time":/gi, /"timezone":/gi, 
            /"usertime":/gi, /"isttime":/gi, /"leadName":/gi,
            /BOOK_DEMO/gi, /BOOKDEMO/gi, /assistant:/gi, /user:/gi
        ];
        technicalGarbage.forEach(term => {
            cleanText = cleanText.replace(term, '');
        });
    
        // 4. ISO Timestamps ko remove karein (e.g. 2026-02-03T11:00:00)
        // Kyunki humne prompt mein bola hai ki wo natural English bole (11 AM), 
        // isliye raw timestamp ko bolne ki zaroorat nahi hai.
        cleanText = cleanText.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*?(?=\s|$|")/g, '');
    
        // 5. Common abbreviations ko full form mein badlein (Piper ke liye behtar hai)
        cleanText = cleanText.replace(/\bIST\b/g, 'India Standard Time');
        cleanText = cleanText.replace(/\b24\/7\b/g, 'twenty four seven');
    
        // 6. Symbols aur Quotes ko saaf karein
        // Piper double quotes ko "quote" bol sakta hai, isliye unhe space se badal dein
        cleanText = cleanText.replace(/\*/g, '');
        cleanText = cleanText.replace(/["']/g, ' '); 
        cleanText = cleanText.replace(/\//g, ' ');
        
        // Sirf wahi Colons (:) hatayein jo time ka hissa nahi hain
        cleanText = cleanText.replace(/(?<!\d):(?!\d)/g, ' ');
    
        // Bache hue ajeeb characters hatayein
        cleanText = cleanText.replace(/[#@$%^&+=<>{}[\]\\|_]/g, ' ');
    
        // 7. Final Formatting
        // Multiple spaces ko single space mein badlein aur trim karein
        cleanText = cleanText.replace(/\s+/g, ' ').trim();
    
        console.log(`[TTS-FINAL-OUTPUT] Piper will say: "${cleanText}"`);
        return cleanText;
    }

    async synthesize(text, outputPath) {
        return new Promise((resolve, reject) => {
            try {
                if (!fs.existsSync(this.binaryPath)) {
                    throw new Error(`Piper binary not found at ${this.binaryPath}`);
                }

                console.log(`[TTS] ✔ Binary found: ${this.binaryPath}`);

                // Sanitize text before TTS
                const cleanText = this.sanitizeForTTS(text);

                const piper = spawn(this.binaryPath, [
                    '--model', this.modelPath,
                    '--output_file', outputPath
                ]);

                piper.stdin.write(cleanText);
                piper.stdin.end();

                let errorMsg = '';
                piper.stderr.on('data', (data) => {
                    errorMsg += data.toString();
                });

                piper.on('close', (code) => {
                    if (code === 0) {
                        console.log(`[TTS] ✔ TTS generated: ${outputPath}`);
                        resolve(outputPath);
                    } else {
                        const msg = `Piper exited with code ${code}. ${errorMsg}`;
                        console.error(`[TTS] ✗ ${msg}`);
                        reject(new Error(msg));
                    }
                });

                piper.on('error', (err) => {
                    console.error(`[TTS] ✗ Failed to start Piper: ${err.message}`);
                    reject(new Error(`Failed to start Piper process: ${err.message}`));
                });
            } catch (error) {
                console.error(`[TTS] ✗ Error: ${error.message}`);
                reject(error);
            }
        });
    }
}

module.exports = PiperWrapper;
