const apiKey = process.env.GROQ_API_KEY;

export default class LLMCommunication {
    constructor() {
        this.apiUrl = 'https://search-window-1.onrender.com/api/groq';
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
