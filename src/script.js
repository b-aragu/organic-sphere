import './style.css'
import Experience from './Experience/Experience.js'

const experience = new Experience({
    targetElement: document.querySelector('.experience')
})

function updateSpeechOutput(text) {
            const outputElement = document.getElementById('speech-output');
            if (outputElement) {
                outputElement.innerHTML = `User Input: ${text}`;
            }
        }
        
        function displayGroqResponse(response) {
            const outputElement = document.getElementById('speech-output');
            if (outputElement) {
                outputElement.innerHTML = `Groq Response: ${response}`;
            }
        }