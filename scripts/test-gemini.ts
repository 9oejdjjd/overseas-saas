
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const key = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(key || "");

async function listModels() {
    if (!key) return;
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}&pageSize=200`);
        const data = await response.json();

        console.log("--- ALL Available Models ---");
        if (data.models) {
            data.models.forEach((m: any) => {
                console.log(m.name.replace("models/", ""));
            });
        }
        console.log("-------------------------------");

    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

async function testFlashLatest() {
    console.log("Testing gemini-flash-latest...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const result = await model.generateContent("Test");
        console.log("Success with gemini-flash-latest:", result.response.text());
    } catch (e: any) {
        console.log("Failed gemini-flash-latest:", e.message);
    }
}

async function main() {
    await listModels();
    await testFlashLatest();
}

main();
