const apiKey = "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";

export default class LLMCommunication {
    constructor() {
        this.apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
    }

    async sendToGroq(speech) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: 'mixtral-8x7b-32768',
                    messages: [
                        { role: 'system', content: 'You are a helpful assistant.' },
                        { role: 'user', content: speech },
                    ],
                }),
            });

            const data = await response.json();
            const aiResponse = data.choices[0]?.message?.content || 'No response from Groq';
            console.log('Groq Response:', aiResponse);
            this.displayResponse(aiResponse);
        } catch (error) {
            console.error('Error sending to Groq:', error);
        }
    }

    displayResponse(response) {
        // Use the function to display the response in the HTML
        if (typeof window.updateSpeechOutput === 'function') {
            window.displayGroqResponse(response);  // Call the function from HTML
        }
    }
}
