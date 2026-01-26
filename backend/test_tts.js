const PiperWrapper = require('./ai/piper_wrapper');
const path = require('path');
require('dotenv').config();

const piper = new PiperWrapper();
const text = "Hello, this is a test of the professional AI voice.";
const outputPath = path.join(__dirname, '../temp/test_voice.wav');

console.log("Starting TTS synthesis...");
console.log("Binary Path:", piper.binaryPath);
console.log("Model Path:", piper.modelPath);
console.log("Output Path:", outputPath);

piper.synthesize(text, outputPath)
    .then(() => {
        console.log("Success! Audio saved to:", outputPath);
        process.exit(0);
    })
    .catch((err) => {
        console.error("Failed!", err);
        process.exit(1);
    });
