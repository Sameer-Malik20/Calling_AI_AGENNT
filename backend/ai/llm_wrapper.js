const axios = require('axios');

class LLMWrapper {
    constructor(endpoint = 'http://localhost:1234/v1/chat/completions') {
        this.endpoint = endpoint;
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

    // Aapka existing LLM call logic
    return await this.generateResponse(prompt, null, []); 
}
    async generateResponse(prompt, knowledgeBase, history = []) {
// Optimized System Prompt for Qwen 3B
const systemPrompt = `
You are Sam, a professional American outbound agent from SusaLabs.
Tone: Helpful, consultative, and relaxed. Avoid sounding like a scripted robot.
Rules:
1. Speak ONLY in English.
2. Keep responses extremely concise (5-12 words).
3. Use natural fillers like "Well," "Actually," or "I see" occasionally.
4. Use ONLY this knowledge: ${JSON.stringify(knowledgeBase)}
5. Never repeat yourself. If a user asks a question already answered, acknowledge and pivot.

Current Context:
${history.map(h => `${h.role}: ${h.content}`).join('\n')}
`;
        try {
            const modelName = process.env.LLM_MODEL || "qwen2.5-3b-instruct";
            console.log(`[LLM Request] Model: ${modelName}, Prompt: "${prompt}"`);
            const response = await axios.post(this.endpoint, {
                model: modelName,
                messages: [
                    { role: "system", content: systemPrompt },
                    ...history.filter(h => h.content !== prompt),
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 50
            });

            const content = response.data.choices[0].message.content;
            console.log(`[LLM Response] "${content}"`);
            return content;
        } catch (error) {
            console.error("LLM Error details:", error.response?.data || error.message);
            return "I'm sorry, I didn't catch that. Could you repeat it?";
        }
    }
}

module.exports = LLMWrapper;
