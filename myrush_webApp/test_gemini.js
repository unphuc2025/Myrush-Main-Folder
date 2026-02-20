import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyD6NJhLiFQHefWYq4vE2Pg2evgGr7ATovg";
const genAI = new GoogleGenerativeAI(API_KEY);

async function testGemini() {
    try {
        console.log("Testing Gemini API connection...");
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = "Hello! Are you working?";
        console.log(`Sending prompt: "${prompt}" to model: gemini-2.0-flash`);

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log("--------------------------------------------------");
        console.log("SUCCESS! Gemini API responded:");
        console.log(text);
        console.log("--------------------------------------------------");
    } catch (error) {
        console.error("FAILED to connect to Gemini API:");
        console.error(error);
    }
}

testGemini();
