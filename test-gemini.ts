import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config({ path: '.env' });

async function testGoogleApi() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.log("No API key");
        return;
    }
    
    // Test fetch directly
    const model = 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    console.log(`Testing URL: ${url}`);
    
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: "Hello" }] }]
            })
        });
        
        console.log(`Status: ${res.status} ${res.statusText}`);
        const text = await res.text();
        console.log(`Body: ${text}`);
    } catch(e: any) {
        console.error(e.message);
    }
}

testGoogleApi();
