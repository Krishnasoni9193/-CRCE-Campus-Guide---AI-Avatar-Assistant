const config = require('./api.json');

const apiKey = config.apiKey;
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`;

async function main() {
    const fetch = await import('node-fetch').then(module => module.default);

    async function fetchGeminiResponse(prompt) {
        const response = await fetch(GEMINI_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: prompt }
                        ]
                    }
                ]
            }),
        });

        const data = await response.json();

        if (data.candidates && data.candidates.length > 0) {
            return data.candidates[0].content.parts[0].text.trim();
        } else {
            throw new Error("No response from Gemini API");
        }
    }

    const userInput = "Who is the CEO of Tesla?";
    const geminiResponse = await fetchGeminiResponse(userInput);

    console.log("User Input:", userInput);
    console.log("Gemini Response:", geminiResponse);
}

main().catch(error => console.error(error));
