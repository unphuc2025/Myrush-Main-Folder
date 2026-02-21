import { GoogleGenerativeAI } from "@google/generative-ai";
import { fetchKnowledgeBase, buildChatbotContext, searchVenues, getVenueDetails } from './ChatbotContext';

// API Key provided by the user
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);

// Build dynamic system instruction with real platform data
const buildSystemInstruction = async () => {
  const knowledge = await fetchKnowledgeBase();

  const cities = knowledge.cities.map(c => c.name).join(', ');
  const sports = knowledge.game_types.map(s => s.name).join(', ');
  const amenities = knowledge.amenities.map(a => a.name).join(', ');

  // Format FAQs for context
  const faqContext = knowledge.faqs.map((f: any) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');

  return `
You are a customer support executive for MyRush, India's premium sports booking platform.
You are a REAL human team member. You are NOT an AI, bot, or virtual assistant.
NEVER mention "AI", "language model", "training data", or "automation".

PLATFORM KNOWLEDGE:
- Active Cities: ${cities}
- Supported Sports: ${sports}
- Available Amenities: ${amenities}
- Total Venues: ${knowledge.venue_count} venues across ${knowledge.city_count} cities

COMMON POLICIES & FAQs:
${faqContext}

YOUR STYLE:
- Natural, friendly, and confident.
- Use short, clear sentences.
- Chat like a human on WhatsApp.
- Do not be robotic or overly formal.
- Avoid bullet points unless listing venues.
- If asked who you are: "I'm from the MyRush support team."
- If asked if you are a bot: "I'm a real person here to help you get the best turf."

YOUR JOB:
1. Help users find and book courts ("Let me check available badminton courts in Indiranagar...").
2. Answer questions about pricing, rules, and amenities.
3. Solve issues with bookings or payments.
4. If info is missing: "Let me quickly check that for you." (Don't guess).

IMPORTANT POLICIES:
- Cancellation: Free cancellation 24+ hours before. 50% refund 12-24 hours. No refund <12 hours.
- Payment: Card, UPI, Netbanking.
- Booking Fee: ₹50.

OUTPUT SCHEMA (strict JSON):
{
  "intent": "book_court" | "search_venues" | "ask_question" | "venue_details" | "view_bookings" | "support" | "general_chat",
  "action": {
    "type": "search" | "book" | "get_venue_details" | "navigate" | "respond" | "ask_clarification",
    "parameters": {
      "city"?: string,
      "sport"?: string,
      "area"?: string,
      "amenities"?: string[],
      "priceMax"?: number,
      "venueId"?: string,
      "venueName"?: string
    }
  },
  "response": string, // Natural human response
  "suggestions": [] // ALWAYS EMPTY.
}

EXAMPLE INTERACTIONS:

User: "I want to play refined badminton"
Output: {
  "intent": "search_venues",
  "action": { "type": "search", "parameters": { "sport": "Badminton" } },
  "response": "Nice choice! Badminton is super popular. Which city are you looking for?",
  "suggestions": []
}

User: "Show me football turfs in Hyderabad"
Output: {
  "intent": "search_venues",
  "action": { "type": "search", "parameters": { "city": "Hyderabad", "sport": "Football" } },
  "response": "Got it. Here are some of the best football turfs in Hyderabad.",
  "suggestions": []
}

User: "What happens if it rains?"
Output: {
  "intent": "ask_question",
  "action": { "type": "respond" },
  "response": "If it rains during your outdoor game, don't worry. We usually offer a credit refund or let you reschedule. Just have a word with the venue manager.",
  "suggestions": []
}

User: "Hi"
Output: {
  "intent": "general_chat",
  "action": { "type": "respond" },
  "response": "Hey! I'm from the MyRush support team. How can I help you regarding your booking or game today?",
  "suggestions": []
}
`;
};

// Enhanced Gemini response with context enrichment
export const getGeminiResponse = async (userMessage: string, conversationHistory: any[] = []) => {
  try {
    // Build context based on user message
    const context = await buildChatbotContext(userMessage);

    // Build dynamic system instruction
    const systemInstruction = await buildSystemInstruction();

    // Create model with enhanced configuration
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
        topP: 0.9,
        topK: 40
      }
    });

    // Build conversation context (last 6 messages for memory)
    let conversationContext = '';
    if (conversationHistory.length > 0) {
      const recentMessages = conversationHistory.slice(-6);
      conversationContext = '\\n\\nRECENT CONVERSATION:\\n' +
        recentMessages.map(msg =>
          `${msg.sender === 'user' ? 'User' : 'Bot'}: ${msg.text}`
        ).join('\\n');
    }

    // Enrich prompt with context data if available
    let enrichedPrompt = userMessage;

    if (context.venues && context.venues.length > 0) {
      enrichedPrompt += `\\n\\nAVAILABLE VENUES (for reference):\\n` +
        context.venues.slice(0, 5).map((v: any) =>
          `- ${v.name} (${v.city}): ${v.game_types.join(', ')}, ₹${v.price_range?.min || 'N/A'}-${v.price_range?.max || 'N/A'}/hour`
        ).join('\\n');
    }

    enrichedPrompt += conversationContext;

    const result = await model.generateContent(enrichedPrompt);
    const responseText = result.response.text();

    try {
      const parsed = JSON.parse(responseText);

      // Handle search action - fetch real venues
      if (parsed.action?.type === 'search' && parsed.action.parameters) {
        const searchResult = await searchVenues(parsed.action.parameters);
        if (searchResult.success) {
          parsed.searchResults = searchResult.data;
        }
      }

      // Handle venue details action
      if (parsed.action?.type === 'get_venue_details' && parsed.action.parameters?.venueName) {
        // Try to find venue by name from context
        const venue = context.venues?.find((v: any) =>
          v.name.toLowerCase().includes(parsed.action.parameters.venueName.toLowerCase())
        );
        if (venue) {
          const detailsResult = await getVenueDetails(venue.id);
          if (detailsResult.success) {
            parsed.venueDetails = detailsResult.data;
          }
        }
      }

      return parsed;
    } catch (e) {
      console.error("Failed to parse Gemini response:", e, responseText);
      // Fallback object
      return {
        intent: "general_chat",
        action: { type: "respond" },
        response: responseText || "I didn't quite catch that. Could you tell me again?",
        suggestions: []
      };
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      intent: "error",
      action: { type: "respond" },
      response: "Our system is running a bit slow. Give me a moment to check that.",
      suggestions: []
    };
  }
};
