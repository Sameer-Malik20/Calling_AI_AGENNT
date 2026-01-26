const LLMWrapper = require('../ai/llm_wrapper');

const STATES = {
    GREETING: 'GREETING',
    IDENTIFY_NEED: 'IDENTIFY_NEED',
    PROVIDE_INFO: 'PROVIDE_INFO',
    OBJECTION_HANDLING: 'OBJECTION_HANDLING',
    CLOSING: 'CLOSING'
};

class CallFlow {
    constructor(knowledgeBase) {
        this.kb = knowledgeBase;
        this.currentState = STATES.GREETING;
        this.llm = new LLMWrapper();
        this.history = [];
    }

    async processInput(userInput) {
        this.history.push({ role: 'user', content: userInput });
        
        // Simple state transition logic
        // In a production system, this would be more complex/LLM-driven
        let contextMessage = `State: ${this.currentState}. `;
        
        const response = await this.llm.generateResponse(userInput, this.kb, this.history);
        this.history.push({ role: 'assistant', content: response });

        // Update state based on LLM response or user input (naive logic for demo)
        this.updateState(userInput, response);

        return response;
    }

    updateState(userInput, response) {
        if (this.currentState === STATES.GREETING) {
            this.currentState = STATES.IDENTIFY_NEED;
        } else if (this.currentState === STATES.IDENTIFY_NEED) {
            this.currentState = STATES.PROVIDE_INFO;
        } else if (this.currentState === STATES.PROVIDE_INFO && userInput.toLowerCase().includes('no')) {
            this.currentState = STATES.OBJECTION_HANDLING;
        } else if (this.currentState === STATES.OBJECTION_HANDLING || this.currentState === STATES.PROVIDE_INFO) {
            this.currentState = STATES.CLOSING;
        }
    }

    getInitialGreeting() {
        return this.kb.script.greeting;
    }
}

module.exports = { CallFlow, STATES };
