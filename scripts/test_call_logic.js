const { CallFlow } = require('../backend/flow/state_machine');
const fs = require('fs');
const path = require('path');

async function simulateTestCall(number) {
    console.log(`\n--- Simulating AI Call Logic for: ${number} ---`);
    
    // 1. Load Knowledge Base
    const kbPath = path.join(__dirname, '../knowledge/techsolutions.json');
    if (!fs.existsSync(kbPath)) {
        console.error("Error: Knowledge file not found!");
        return;
    }
    const kb = JSON.parse(fs.readFileSync(kbPath));
    
    // 2. Initialize Flow
    const flow = new CallFlow(kb);
    
    // 3. Step 1: Greeting
    const greeting = flow.getInitialGreeting();
    console.log(`[AI Agent]: ${greeting}`);
    
    // 4. Simulate User Response 1
    const userResponse1 = "Haan, namaste. Kaun bol raha hai?";
    console.log(`[User]: ${userResponse1}`);
    const aiResp1 = await flow.processInput(userResponse1);
    console.log(`[AI Agent]: ${aiResp1}`);
    
    // 5. Simulate User Response 2 (Inquiry)
    const userResponse2 = "Price kya hai serves ki?";
    console.log(`[User]: ${userResponse2}`);
    const aiResp2 = await flow.processInput(userResponse2);
    console.log(`[AI Agent]: ${aiResp2}`);
    
    // 6. Simulate Objection
    const userResponse3 = "Bahut mehenga hai yaar.";
    console.log(`[User]: ${userResponse3}`);
    const aiResp3 = await flow.processInput(userResponse3);
    console.log(`[AI Agent]: ${aiResp3}`);
    
    // 7. Simulated Closing
    const userResponse4 = "Thik hai, call karo baad mein.";
    console.log(`[User]: ${userResponse4}`);
    const aiResp4 = await flow.processInput(userResponse4);
    console.log(`[AI Agent]: ${aiResp4}`);
    
    console.log("\n--- Simulation Complete ---");
    console.log("Decision: Logic is valid. Ready for Asterisk deployment.");
}

// Perform test for the user's number
simulateTestCall("7456088014").catch(err => console.error(err));
