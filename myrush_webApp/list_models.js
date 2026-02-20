import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyD6NJhLiFQHefWYq4vE2Pg2evgGr7ATovg";
const genAI = new GoogleGenerativeAI(API_KEY);

async function listModels() {
    try {
        // For some versions, listModels might be under a different property or require direct fetching if library has issues
        // But let's try standard way first.
        // Actually, the node library doesn't expose listModels directly on the main class usually, but let's check.
        // The standard way is usually via the API directly if the SDK doesn't expose it easily in this version.
        // Let's try to use the model and catch the specific error, or try a direct fetch.

        console.log("Fetching available models...");
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const data = await response.json();

        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(model => {
                if (model.supportedGenerationMethods && model.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${model.name}`);
                }
            });
        } else {
            console.log("No models found or error:", data);
        }

    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
