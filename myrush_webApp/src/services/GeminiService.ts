import { GoogleGenerativeAI } from "@google/generative-ai";
import { fetchKnowledgeBase, buildChatbotContext, searchVenues, getVenueDetails } from './ChatbotContext';

// Enhanced Gemini response with context enrichment
export const getGeminiResponse = async (userMessage: string, conversationHistory: any[] = []): Promise<any> => {
  try {
    if (conversationHistory.length) { console.debug("Chat history included"); }
    console.error("Gemini API is currently disabled due to API key issues");
    return {
      intent: "error",
      action: { type: "respond" },
      response: "Our chat support is currently unavailable. Please try again later or contact us directly at harsha@myrush.in.",
      suggestions: []
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      intent: "error",
      action: { type: "respond" },
      response: "Our chat support is currently unavailable. Please try again later or contact us directly at harsha@myrush.in.",
      suggestions: []
    };
  }
};
