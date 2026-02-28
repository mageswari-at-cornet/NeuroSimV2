import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const apiKey = process.env.GROK_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

console.log("Testing API Key:", apiKey ? "Found (starts with " + apiKey.substring(0, 5) + ")" : "Missing");

async function testKey() {
    if (!apiKey) {
        console.error("No API key found!");
        return;
    }

    try {
        const response = await fetch(GROQ_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: "Hello, just testing connection." }]
            })
        });

        if (!response.ok) {
            console.error("API Error Status:", response.status);
            console.error("API Error Text:", await response.text());
        } else {
            const data = await response.json();
            console.log("Success! Response:", data.choices[0].message.content);
        }
    } catch (e) {
        console.error("Network or other error:", e);
    }
}

testKey();
