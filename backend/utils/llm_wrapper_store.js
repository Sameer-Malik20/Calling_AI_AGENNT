const axios = require('axios');
const fs = require('fs');
const moment = require('moment-timezone');
const path = require('path');
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();
const CampaignManager = require('../campaign/manager');

class LLMWrapper {
    constructor(endpoint = 'http://localhost:11434/v1/chat/completions') {
        this.endpoint = endpoint;
        this.memoryPath = path.join(__dirname, '../memory/learnings.json');
        this.loadLearnings();
    }

    loadLearnings() {
        try {
            if (!fs.existsSync(this.memoryPath)) {
                const initial = { effective_phrases: [], prohibited_terms: [], dynamic_rules: [] };
                fs.writeFileSync(this.memoryPath, JSON.stringify(initial, null, 2));
            }
            this.learnings = JSON.parse(fs.readFileSync(this.memoryPath, 'utf8'));
        } catch (err) {
            console.error("[LLM-MEMORY-LOAD-ERROR]", err);
            this.learnings = { effective_phrases: [], prohibited_terms: [], dynamic_rules: [] };
        }
    }

getGlobalTimezone(phoneNumber) {
        try {
            // Agar number valid nahi hai ya + se shuru nahi hota, default IST
            if (!phoneNumber || !phoneNumber.startsWith('+')) return 'Asia/Kolkata';
            
            const number = phoneUtil.parseAndKeepRawInput(phoneNumber);
            const countryCode = phoneUtil.getRegionCodeForNumber(number); // Example: 'US', 'IN', 'GB'
            const zones = moment.tz.zonesForCountry(countryCode);
            
            return zones && zones.length > 0 ? zones[0] : 'Asia/Kolkata';
        } catch (e) {
            console.error("[TIMEZONE-ERROR]", e.message);
            return 'Asia/Kolkata'; // Fallback
        }
    }

    saveLearnings() {
        try {
            fs.writeFileSync(this.memoryPath, JSON.stringify(this.learnings, null, 2));
        } catch (err) {
            console.error("[LLM-MEMORY-SAVE-ERROR]", err);
        }
    }

    // Helper function to normalize text for comparison
    normalizeText(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, '') // Remove punctuation
            .replace(/\s+/g, ' ')     // Normalize whitespace
            .trim();
    }

    // Helper function to check if text is similar to existing entries
    isSimilarToExisting(newText, existingArray) {
        const normalizedNew = this.normalizeText(newText);
        
        for (const existing of existingArray) {
            const normalizedExisting = this.normalizeText(existing);
            
            // Exact match after normalization
            if (normalizedNew === normalizedExisting) {
                return true;
            }
            
            // Similarity check: if 90% of words match
            const newWords = normalizedNew.split(' ');
            const existingWords = normalizedExisting.split(' ');
            const commonWords = newWords.filter(word => existingWords.includes(word));
            const similarity = commonWords.length / Math.max(newWords.length, existingWords.length);
            
            if (similarity > 0.9) {
                return true;
            }
        }
        
        return false;
    }

    async learnFromCall(history) {
        if (!history || history.length < 2) return;

        const insightPrompt = `
        You are an AI Architect. Analyze this call history and extract NEW 1-2 learning points.
        Filter out garbage, abuse, or redundancy.
        Output ONLY a JSON object with:
        {
          "new_effective_phrases": [str],
          "new_dynamic_rules": [str]
        }
        
        Transcript: ${JSON.stringify(history)}
        `;

        try {
            const response = await axios.post(this.endpoint, {
                model: "qwen3-coder:480b-cloud",
                messages: [{ role: "user", content: insightPrompt }],
                temperature: 0.3,
                max_tokens: 200
            });

            const content = response.data.choices[0].message.content;
            const match = content.match(/\{[\s\S]*\}/);
            if (match) {
                const newInsights = JSON.parse(match[0]);
                
                let addedCount = 0;
                
                // Merge unique effective phrases with duplicate prevention
                if (newInsights.new_effective_phrases) {
                    newInsights.new_effective_phrases.forEach(phrase => {
                        if (!this.isSimilarToExisting(phrase, this.learnings.effective_phrases)) {
                            this.learnings.effective_phrases.push(phrase);
                            addedCount++;
                            console.log(`[LLM-LEARNING] Added new phrase: "${phrase}"`);
                        } else {
                            console.log(`[LLM-LEARNING] Skipped duplicate phrase: "${phrase}"`);
                        }
                    });
                }
                
                // Merge unique dynamic rules with duplicate prevention
                if (newInsights.new_dynamic_rules) {
                    newInsights.new_dynamic_rules.forEach(rule => {
                        if (!this.isSimilarToExisting(rule, this.learnings.dynamic_rules)) {
                            this.learnings.dynamic_rules.push(rule);
                            addedCount++;
                            console.log(`[LLM-LEARNING] Added new rule: "${rule}"`);
                        } else {
                            console.log(`[LLM-LEARNING] Skipped duplicate rule: "${rule}"`);
                        }
                    });
                }
                
                if (addedCount > 0) {
                    this.saveLearnings();
                    console.log(`[LLM-LEARNING] ${addedCount} new insights integrated.`);
                } else {
                    console.log("[LLM-LEARNING] No new unique insights to add.");
                }
            }
        } catch (err) {
            console.error("[LLM-LEARN-ERROR]", err.message);
        }
    }

    async generateCallReport(history) {
        if (history.length === 0) return null;
        
        const prompt = `Analyze the following call transcript and generate a professional production-level report.
        Format:
        - TITLE: [Professional Case Title]
        - SUMMARY: [Short 2-line overview]
        - CUSTOMER INTENT: [Why did they call?]
        - OUTCOME: [Resolved/Follow-up needed]
        - SENTIMENT: [Positive/Neutral/Negative]

        Transcript: ${JSON.stringify(history)}`;

        return await this.generateResponse(prompt, null, []); 
    }

    async generateResponse(prompt, knowledgeBase, history = [], userNumber = '+91') {
        
        // 1. Timezone Intelligence Logic (Added)
        const tz = this.getGlobalTimezone(userNumber);
        const userLocalTime = moment().tz(tz).format('hh:mm A');
        const userDay = moment().tz(tz).format('dddd');
        const indiaTime = moment().tz('Asia/Kolkata').format('hh:mm A');
        
        // 2. Database se busy slots mangwayein with detailed info
        const bookedSlots = await CampaignManager.campaignManager.getBookedSlots();
        const formattedBusyList = bookedSlots.map(slot => 
            `${moment(slot.istTime).tz('Asia/Kolkata').format('MMM DD, hh:mm A')} IST (${slot.leadName})`
        ).join(', ');


        // 2. Existing System Prompt (Kuch bhi remove nahi kiya gaya, sirf add kiya hai)
        const systemPrompt = `
        You are Sam, a professional American outbound agent from SusaLabs.
        Tone: Helpful, consultative, and relaxed. Avoid sounding like a scripted robot.

        GLOBAL TIMEZONE CONTEXT (CRITICAL):
        - Current User Local Time: ${userLocalTime} (Zone: ${tz})
        - Current User Day: ${userDay}
        - Reference India Time: ${indiaTime} (IST)

        LIVE AVAILABILITY (IST):
        - Already Booked Slots: ${formattedBusyList || 'None'}
    
        TRAIN TICKET LOGIC (CONFLICT CHECKING):
        1. If user asks for a time, check if it falls within a 15-minute window of any "Already Booked Slot".
        2. If there is a conflict, politely say: "I'm sorry, that slot just got reserved. I have [Slot A] or [Slot B] available. Which works?"
        3. If NO conflict, confirm the demo and output: [BOOK_DEMO: {"user_time": "...", "ist_time": "...", "timezone": "${tz}"}]
        
        SCHEDULING RULES:
        - Only offer demo slots Monday to Friday, between 9 AM - 9 PM IST.
        - You ALREADY know the user's local time (${userLocalTime}); do NOT ask for it.
        - If a demo is fixed, you must output this tag at the end: [BOOK_DEMO: {"user_time": "...", "ist_time": "...", "timezone": "${tz}"}]
        - CONVERSION RULE: If user suggests a time, internally convert it to IST. 
        - Example: User says "10 PM" (their time), you check the offset and see if that IST time is between 9 AM - 9 PM IST.
        - If the converted IST time is outside 9 AM - 9 PM IST, say: "I'd love to, but our engineers are only available between 9 AM and 9 PM India time. Could we do something earlier/later?"
        - FORMAT: When you output [BOOK_DEMO], always ensure "ist_time" is the calculated India time in ISO format.
        
        Learned Behaviors (Adaptive Rules):
        ${this.learnings.dynamic_rules.join('\n') || "None yet."}
        
        Effective Phrases (Use naturally):
        ${this.learnings.effective_phrases.join(', ') || "None yet."}
        
        Safety Guardrails:
        1. NEVER repeat or use abusive/toxic language even if the user does.
        2. If a customer is toxic, stay calm, professional, and try to end the call politely.
        3. Prohibited terms to NEVER use: ${this.learnings.prohibited_terms.join(', ') || "None."}

        Core Rules:
        1. Speak ONLY in English.
        2. Keep responses extremely concise (5-12 words).
        3. Use ONLY this knowledge: ${JSON.stringify(knowledgeBase)}
        4. Never repeat yourself.
        
        Current Context:
        ${history.slice(-5).map(h => `${h.role}: ${h.content}`).join('\n')}
        `;
        try {
            const modelName = "qwen3-coder:480b-cloud"; 
            
            const response = await axios.post(this.endpoint, {
                model: modelName,
                messages: [
                    { role: "system", content: systemPrompt },
                    ...history.filter(h => h.content !== prompt).slice(-3),
                    { role: "user", content: prompt }
                ],
                temperature: 0.5,
                max_tokens: 50
            });

            return response.data.choices[0].message.content;
        } catch (error) {
            console.error("LLM Error:", error.message);
            return "I'm sorry, can you repeat that?";
        }
    }
}

module.exports = LLMWrapper;

