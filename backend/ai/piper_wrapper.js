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

    async synthesize(text, outputPath) {
        return new Promise((resolve, reject) => {
            try {
                if (!fs.existsSync(this.binaryPath)) {
                    throw new Error(`Piper binary not found at ${this.binaryPath}`);
                }

                console.log(`[TTS] ✔ Binary found: ${this.binaryPath}`);

                const piper = spawn(this.binaryPath, [
                    '--model', this.modelPath,
                    '--output_file', outputPath
                ]);

                piper.stdin.write(text);
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
