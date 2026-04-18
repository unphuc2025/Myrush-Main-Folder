/**
 * Gemini Service for MyRush AI Concierge
 * Powered by Gemini 2.0 Flash
 */
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { searchVenues, getVenueDetails, calculateBookingPrice, getBookingDetails } from "./ChatbotContext";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/user').replace('/api/user', '');

const buildSystemInstruction = async () => {
  const cities = ["Hyderabad", "Bangalore", "Chennai", "Mumbai", "Delhi"];
  const sports = ["Football", "Cricket", "Badminton", "Tennis", "Swimming", "Padel", "Pickleball"];
  
  return `
You are the "MyRush Premium Concierge" – a high-energy, friendly, and expert sports booking assistant. 
Your goal is to get the user onto the field!

PERSONALITY:
- Enthusiastic, professional, and emoji-friendly.
- Use phrases like "Booya!", "Let's get you playing!", "Game on!"
- Always be proactive. If someone asks for a sport, find it!

STRICT NAVIGATION RULES:
- Correct user typos for cities and sports using these lists: [${cities}], [${sports}]. (e.g., if they say "shutle", you know it's "Badminton").
- **STRICT EXTRACTION**: When calling tools like "search_venues", you MUST only use the exact names from the lists. NEVER include words like "the", "in", or "city" in the "city" parameter. (e.g., Extract "Hyderabad", NOT "the hyderabad").

BOOKING FLOW & SEARCH RULES:
1. **Search (IMMEDIATE)**: If the user mentions a sport (e.g., "football") or a city, you MUST call "search_venues" immediately with whatever info you have. Do NOT wait for both city and sport. Search first, then ask for missing info if the results are too broad.
2. **Details**: Once a venue is picked, ALWAYS use "get_venue_details" to fetch the specific courts, pricing, and logic types.
3. **Logic Handling**:
    - Divisible (Nets/Turf): Look at "slices" in venue details. Ask the user for their preferred zone/mode (e.g., "Full Court" vs "Net 1") and get the 'mask'.
    - Capacity (Swimming): Ask for the "Number of Players".
4. **Slots & Proactive Suggestions**:
    - Use "get_available_slots".
    - **CRITICAL**: If the user's preferred time is NOT available, look at the returned slot list. AUTOMATICALLY suggest the nearest available time (e.g., "Darn, 6 PM is full, but I grabbed a spot for you at 7 PM! Shall we?")
5. **Quote**: Provide an authoritative total price by using "calculate_price_quote".

KNOWLEDGE & SUPPORT:
- Answer questions about rain policies, equipment, and cancellations using your knowledge and policies provided.
- If a user asks a general question while booking, answer it and immediately follow up with the next step in the booking flow.
- BE CONCISE and helpful. Let's get them playing!

STRICT JSON OUTPUT:
- Your response MUST contain a single, valid JSON block.
- **CRITICAL**: Use your tools first. Once you have the data, your final answer MUST be in this JSON format:
  {
    "intent": "chat" | "search" | "slots" | "quote" | "book" | "view_bookings",
    "action": "OPTIONAL_SPECIFIC_ACTION",
    "response": "Your friendly conversational answer here",
    "suggestions": ["Option 1", "Option 2"],
    "data": { ...any context you want to pass to the UI... }
  }
`;
};

// Handlers for tool calls
const toolHandlers: any = {
  search_venues: async (args: any) => {
    try {
      console.log("[GEMINI DEBUG] search_venues args:", args);
      const res = await searchVenues(args);
      console.log("[GEMINI DEBUG] search_venues result count:", res.data?.length || 0);
      return { results: res.success ? res.data : [] };
    } catch (e) {
      return { results: [] };
    }
  },
  get_venue_details: async (args: any) => {
    try {
      console.log("[GEMINI DEBUG] get_venue_details args:", args);
      const res = await getVenueDetails(args.venueId);
      console.log("[GEMINI DEBUG] venue details fetched:", res.data?.name);
      return { venue: res.success ? res.data : null };
    } catch (e) {
      return { venue: null };
    }
  },
  get_available_slots: async (args: any) => {
    try {
      console.log("[GEMINI DEBUG] get_available_slots args:", args);
      const sportParam = args.sport ? `&game_type=${encodeURIComponent(args.sport)}` : '';
      const response = await fetch(`${API_BASE_URL}/api/user/venues/${args.venueId}/slots?date=${args.date}${sportParam}`);
      const result = await response.json();
      return { slots: result.success ? result.data.slots : [] };
    } catch (e) {
      return { slots: [] };
    }
  },
  calculate_price_quote: async (args: any) => {
    try {
      console.log("[GEMINI DEBUG] calculate_price_quote args:", args);
      const res = await calculateBookingPrice({
        court_id: args.courtId,
        date: args.date,
        slot_times: args.slotTimes,
        number_of_players: args.numPlayers || 1,
        slice_mask: args.sliceMask
      });
      return { quote: res.success ? res.data : {} };
    } catch (e) {
      return { quote: {} };
    }
  },
  lookup_booking: async (args: any) => {
    try {
      const data = await getBookingDetails(args.displayId);
      return { booking: data };
    } catch (e) {
      return { error: "Booking lookup failed" };
    }
  }
};

const extractJson = (text: string) => {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return jsonMatch[0];
    }
  } catch (e) {}
  return text;
};

const tools = [
  {
    function_declarations: [
      {
        name: "search_venues",
        description: "Search for sports venues based on city, sport, area, or price.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            city: { type: SchemaType.STRING, description: "City name" },
            sport: { type: SchemaType.STRING, description: "Sport name" },
            area: { type: SchemaType.STRING, description: "Specific area in the city" },
            price_max: { type: SchemaType.NUMBER, description: "Maximum price per hour" }
          }
        }
      },
      {
        name: "get_venue_details",
        description: "Get detailed information about a specific venue branch including its courts and logic.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            venueId: { type: SchemaType.STRING, description: "UUID of the venue branch" }
          },
          required: ["venueId"]
        }
      },
      {
        name: "get_available_slots",
        description: "Fetch available time slots for a specific venue and date.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            venueId: { type: SchemaType.STRING, description: "UUID of the venue branch" },
            date: { type: SchemaType.STRING, description: "Date in YYYY-MM-DD format" },
            sport: { type: SchemaType.STRING, description: "Sport name for selective slots" }
          },
          required: ["venueId", "date"]
        }
      },
      {
        name: "calculate_price_quote",
        description: "Get a final price quote for a specific court and slot selection.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            courtId: { type: SchemaType.STRING, description: "UUID of the specific court" },
            date: { type: SchemaType.STRING, description: "Date in YYYY-MM-DD format" },
            slotTimes: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "List of selected start times" },
            numPlayers: { type: SchemaType.NUMBER, description: "Number of players (for capacity-based venues)" },
            sliceMask: { type: SchemaType.NUMBER, description: "Bitmask for divisible court selection (from venue details)" }
          },
          required: ["courtId", "date", "slotTimes"]
        }
      }
    ]
  }
];

export const getGeminiResponse = async (userMessage: string, conversationHistory: any[] = []) => {
  try {
    const systemInstruction = await buildSystemInstruction();
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash", 
      systemInstruction, 
      tools 
    });

    const history = conversationHistory
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));
    
    // Ensure history starts with user role and alternates correctly
    const firstUserIndex = history.findIndex(h => h.role === 'user');
    let validHistory = firstUserIndex !== -1 ? history.slice(firstUserIndex) : [];
    
    // SDK requirement: History must alternate user/model/user...
    // Since chat.sendMessage sends a USER message, the history passed to startChat MUST end with a 'model' turn.
    if (validHistory.length > 0 && validHistory[validHistory.length - 1].role === 'user') {
      validHistory = validHistory.slice(0, -1);
    }

    const chat = model.startChat({
      history: validHistory.slice(-10), 
      generationConfig: { 
        temperature: 0.1
      }
    });

    let accumulatedData: any = {};
    let result = await chat.sendMessage(userMessage);
    let response = result.response;
    let functionCalls = response.functionCalls();

    // Robust tool execution loop
    let turns = 0;
    while (functionCalls && functionCalls.length > 0 && turns < 5) {
      turns++;
      console.log("[GEMINI] Function calls requested:", JSON.stringify(functionCalls, null, 2));
      const toolResponses = await Promise.all(
        functionCalls.map(async (call) => {
          const handler = toolHandlers[call.name];
          const data = handler ? await handler(call.args) : { error: "Tool not found" };
          
          // Accumulate tool data
          accumulatedData[call.name] = data; 
          
          return { functionResponse: { name: call.name, response: data } };
        })
      );

      result = await chat.sendMessage(toolResponses);
      response = result.response;
      functionCalls = response.functionCalls();
    }

    const responseText = response.text();
    console.log("[GEMINI DEBUG] Final response text:", responseText);
    
    try {
      const cleanJson = extractJson(responseText);
      const parsed = JSON.parse(cleanJson);
      
      return {
        ...parsed,
        intent: parsed.intent || "chat",
        response: parsed.response || responseText,
        data: { ...accumulatedData, ...parsed.data }
      };
    } catch (e) {
      console.error("Gemini JSON Parse Fallback:", responseText);
      return { 
        intent: "chat", 
        response: responseText, 
        suggestions: ["Check available venues"],
        data: accumulatedData
      };
    }
  } catch (error) {
    console.error("Gemini Critical Error:", error);
    return { 
      intent: "chat", 
      response: "I'm having a bit of trouble processing that. Could you try rephrasing?", 
      suggestions: ["Retry"] 
    };
  }
};
