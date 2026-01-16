import Groq from 'groq-sdk';
import fs from 'fs';
import path from 'path';

// Manual .env parsing
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, val] = line.split('=');
        if (key && val) {
            process.env[key.trim()] = val.trim().replace(/^["']|["']$/g, ''); // Remove quotes
        }
    });
} else {
    console.error("❌ .env.local not found at", envPath);
}

async function testGroq() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        console.error("❌ No GROQ_API_KEY found in .env.local");
        return;
    }
    console.log("✅ API Key found:", apiKey.slice(0, 5) + "...");

    const groq = new Groq({ apiKey });

    try {
        console.log("📡 Sending test request to llama-3.3-70b-versatile...");
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: 'hello' }],
            model: 'llama-3.3-70b-versatile',
        });
        console.log("✅ Success!");
        console.log("Response:", completion.choices[0]?.message?.content);
    } catch (e: any) {
        console.error("❌ API Call Failed:");
        if (e?.status) console.error("Status:", e.status);
        if (e?.message) console.error("Message:", e.message);
        if (e?.code) console.error("Code:", e.code);
    }
}

testGroq();
