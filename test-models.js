import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

async function listModels() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.log("No API key");
        return;
    }
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    console.log(`Testing URL: ${url}`);
    
    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
    } catch(e) {
        console.error(e.message);
    }
}

listModels();
