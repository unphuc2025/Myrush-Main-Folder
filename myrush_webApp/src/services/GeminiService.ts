import { GoogleGenerativeAI } from "@google/generative-ai";
import { fetchKnowledgeBase, searchVenues, calculateBookingPrice, buildChatbotContext } from './ChatbotContext';

// API Key provided by the user
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/user').replace('/api/user', '');

const genAI = new GoogleGenerativeAI(API_KEY);

// Build dynamic system instruction with real platform data
const buildSystemInstruction = async () => {
  await fetchKnowledgeBase();

  return `
You are the "MyRush Concierge", a high-end customer support executive.
You are PROACTIVE and ACTION-ORIENTED. Your goal is to get the user to a booking as fast as possible.

STRICT OPERATIONAL RULES:
1. AUTOMATIC SEARCH: As soon as you know the CITY and SPORT, you MUST return the "search_venues" action. Do NOT ask for permission. Do NOT say "Let me check". Just return the action.
2. DURATION: Minimum booking is 1 hour (2 slots of 30 mins).
3. PRICING: All quotes MUST include 18% GST.
4. CAPACITY: Swimming/Skating = price * players.
5. NO STALLING: If you have everything needed for a step, EXECUTE THE ACTION. Do not ask redundant questions like "What next?" or "Ready to book?".

ACTION TYPES (JSON SCHEMA):
- "search_venues": Must trigger as soon as City + Sport are known.
- "check_availability": Trigger once Venue + Date are selected. 
- "get_price_quote": Trigger once specific SlotTimes are selected.
- "prepare_booking": Trigger only after user confirms the price quote.
- "respond": Only for general chat or when parameters are missing.

OUTPUT STRUCTURE:
{
  "intent": "search" | "get_slots" | "quote" | "checkout" | "chat",
  "action": {
    "type": "search_venues" | "check_availability" | "get_price_quote" | "prepare_booking" | "respond",
    "parameters": { "city", "sport", "venueId", "date", "slotTimes", "numPlayers", "courtId" }
  },
  "response": "Your crisp, helpful human response.",
  "suggestions": ["Show venues", "Check slots", "Confirm price"]
}

EXAMPLE:
User: "I want to swim in Bangalore tomorrow"
Response: {
  "intent": "get_slots",
  "action": { "type": "search_venues", "parameters": { "city": "Bangalore", "sport": "Swimming" } },
  "response": "Awesome! Bangalore has some great pools. Let me find them for you for tomorrow.",
  "suggestions": ["Show me pools", "What's the price?"]
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
        temperature: 0.1,
        topP: 0.9,
        topK: 40
      }
    });

    // Build conversation context (last 6 messages for memory)
    let conversationContext = '';
    if (conversationHistory.length > 0) {
      const recentMessages = conversationHistory.slice(-6);
      conversationContext = '\n\nRECENT CONVERSATION:\n' +
        recentMessages.map(msg =>
          `${msg.sender === 'user' ? 'User' : 'Bot'}: ${msg.text}`
        ).join('\n');
    }

    // Enrich prompt with context data and current state
    const currentBookingState = conversationHistory.length > 0 ? (conversationHistory[conversationHistory.length - 1] as any).bookingState : null;
    
    let enrichedPrompt = `
USER'S LATEST REQUEST: "${userMessage}"

IMPORTANT: If the latest request mentions a DIFFERENT sport or city than the current draft below, DISREGARD the draft and start a new search for the new sport/city.

CURRENT BOOKING DRAFT (For Reference):
- City: ${currentBookingState?.city || 'Not specified'}
- Sport: ${currentBookingState?.sport || 'Not specified'}
- Venue: ${currentBookingState?.venueId ? 'Selected' : 'Not selected'}
- Date: ${currentBookingState?.date || 'Not specified'}

CONVERSATION HISTORY:
${conversationContext}

YOUR TASK:
1. If the user shifts focus (e.g. from Football to Swimming), immediately use "search_venues" for Swimming.
2. If the user asks "How much", identify the Sport, Players, and Duration. Return "get_price_quote".
3. Return ONLY valid JSON. Be a helpful human concierge.
`;

    if (context.venues && context.venues.length > 0) {
      enrichedPrompt += `\n\nAVAILABLE VENUES IN DB (for ID reference):\n` +
        context.venues.slice(0, 5).map((v: any) =>
          `- ${v.name} (ID: ${v.id}, Area: ${v.area})`
        ).join('\n');
    }

    const result = await model.generateContent(enrichedPrompt);
    const responseText = result.response.text();

    try {
      const parsed = JSON.parse(responseText);

      // 1. Search Venues
      if (parsed.action?.type === 'search_venues' && parsed.action.parameters) {
        const searchResult = await searchVenues(parsed.action.parameters);
        if (searchResult.success) {
          parsed.searchResults = searchResult.data;
          
          if (searchResult.data.length === 0) {
            parsed.response = `I searched for ${parsed.action.parameters.sport} venues in ${parsed.action.parameters.city}, but unfortunately, I couldn't find any that match right now. Would you like to try a different sport or city?`;
            parsed.intent = "chat";
            parsed.suggestions = ["Try Badminton", "Change City", "See all sports"];
          }
        }
      }

      // 2. Check Availability (Slots)
      if (parsed.action?.type === 'check_availability' && parsed.action.parameters?.venueId) {
        const p = parsed.action.parameters;
        const response = await fetch(`${API_BASE_URL}/api/user/venues/${p.venueId}/slots?date=${p.date || new Date().toISOString().split('T')[0]}&game_type=${p.sport || ''}`);
        const result = await response.json();
        if (result.success) {
          parsed.slots = result.data.slots;
        }
      }

      // 3. Get Price Quote
      if (parsed.action?.type === 'get_price_quote' && parsed.action.parameters?.courtId) {
        const p = parsed.action.parameters;
        const quoteResult = await calculateBookingPrice({
          court_id: p.courtId,
          date: p.date!,
          slot_times: p.slotTimes!,
          number_of_players: p.numPlayers || 1
        });
        if (quoteResult.success) {
          parsed.quote = quoteResult.data;
          // Enrich response with price info
          const q = quoteResult.data;
          parsed.response = `${parsed.response}\n\n💰 **Base Price:** ₹${q.base_price}\n✨ **GST (18%):** ₹${q.tax}\n✅ **Total Amount:** ₹${q.total}\n\nShall I proceed to booking?`;
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
