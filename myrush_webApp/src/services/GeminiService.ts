import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { 
  fetchKnowledgeBase, 
  searchVenues, 
  getVenueDetails, 
  getBookingDetails, 
  calculateBookingPrice 
} from './ChatbotContext';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/user').replace('/api/user', '');

const genAI = new GoogleGenerativeAI(API_KEY);

// Define Tools for Gemini
const tools: any = [
  {
    functionDeclarations: [
      {
        name: "search_venues",
        description: "Search for sports venues based on city, sport, area, or price.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            city: { type: SchemaType.STRING, description: "City name" },
            sport: { type: SchemaType.STRING, description: "Sport name (e.g. Football, Badminton, Swimming)" },
            area: { type: SchemaType.STRING, description: "Specific area in the city" },
            price_max: { type: SchemaType.NUMBER, description: "Maximum price per slot" }
          }
        }
      },
      {
        name: "get_venue_details",
        description: "Get detailed information about a specific venue, including its courts, prices, rules, and amenities.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            venueId: { type: SchemaType.STRING, description: "The unique ID of the venue" }
          },
          required: ["venueId"]
        }
      },
      {
        name: "get_available_slots",
        description: "Get available time slots for a specific venue, date, and sport.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            venueId: { type: SchemaType.STRING, description: "The unique ID of the venue" },
            date: { type: SchemaType.STRING, description: "The date (YYYY-MM-DD)" },
            sport: { type: SchemaType.STRING, description: "The sport name" }
          },
          required: ["venueId", "date"]
        }
      },
      {
        name: "calculate_price_quote",
        description: "Calculate the exact price for a booking, including GST and player multipliers.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            courtId: { type: SchemaType.STRING, description: "The unique ID of the specific court" },
            date: { type: SchemaType.STRING, description: "The booking date (YYYY-MM-DD)" },
            slotTimes: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "List of 30-min slot start times (e.g. ['10:00', '10:30'])" },
            numPlayers: { type: SchemaType.NUMBER, description: "Number of players (Required for Capacity courts like Swimming)" },
            sliceMask: { type: SchemaType.NUMBER, description: "Bitmask for the selected playing mode/zone (Required for Divisible courts like Cricket Nets)" }
          },
          required: ["courtId", "date", "slotTimes"]
        }
      },
      {
        name: "lookup_booking",
        description: "Look up details of an existing booking by its Display ID.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            displayId: { type: SchemaType.STRING, description: "The Booking ID (e.g. BK-12345)" }
          },
          required: ["displayId"]
        }
      }
    ]
  }
];

const buildSystemInstruction = async () => {
  const knowledge = await fetchKnowledgeBase();
  const cities = knowledge.cities.map(c => c.name).join(', ');
  const sports = knowledge.game_types.map(s => s.name).join(', ');

  return `
You are the "MyRush Concierge", a premium, action-oriented booking assistant.
Your goal is to guide the user from interest to a confirmed booking by handling all complex court logic and pricing transparently.

BOOKING FUNNEL & COURT LOGIC:
1. IDENTIFY: Get City and Sport. (Use search_venues)
2. EXPLORE: Present venues. (Use get_venue_details to see courts and their logic types)
3. CONFIG (CRITICAL):
    - If logic_type is "divisible": The court has "slices" (zones). Fetch the venue details, look at the "slices" for that court, and ask the user to choose a mode (e.g., "Full Court" vs "Net 1"). You MUST get the 'mask' from the selected slice.
    - If logic_type is "capacity": (e.g., Swimming) Ask for the "Number of Players".
4. AVAILABILITY: Ask for a date and show slots. (Use get_available_slots). For divisible courts, availability is granular; advise the user on which modes are free.
5. QUOTE: Provide an authoritative price quote. (Use calculate_price_quote with the selected sliceMask and numPlayers).
6. CHECKOUT: When the user is ready, use intent: "checkout" and provide the "prepare_booking" parameters.

STRICT OPERATIONAL RULES:
- SPELLING CORRECTION: Use the provided lists: Cities: [${cities}], Sports: [${sports}]. Correct user typos.
- ZONES & MASKS: Never guess a mask. Always use the masks provided in the court's "slices" array from get_venue_details.
- DATA MANDATE: When tool results are available, you MUST include them in the "data" object.
- JSON ONLY: Your response MUST be a single, valid JSON object.

JSON SCHEMA:
{
  "intent": "search" | "slots" | "quote" | "checkout" | "chat",
  "action": { 
    "type": "respond" | "prepare_booking", 
    "parameters": { 
       "venueId": "ID", "courtId": "ID", "date": "YYYY-MM-DD", "slots": ["10:00"], "numPlayers": 1, "sliceMask": 3, "playingModeName": "Full Court" 
    } 
  },
  "response": "Your helpful conversational response.",
  "suggestions": ["Choose Net 1", "6:00 PM"],
  "data": { ... }
}
`;
};

// Handlers for tool calls
const toolHandlers: any = {
  search_venues: async (args: any) => {
    try {
      const res = await searchVenues(args);
      return { searchResults: res.success ? res.data : [], count: res.success ? res.data.length : 0 };
    } catch (e) {
      return { error: "Search failed", searchResults: [] };
    }
  },
  get_venue_details: async (args: any) => {
    try {
      const data = await getVenueDetails(args.venueId);
      return { venue: data || {} };
    } catch (e) {
      return { error: "Failed to fetch venue details", venue: {} };
    }
  },
  get_available_slots: async (args: any) => {
    try {
      const sportParam = args.sport ? `&game_type=${encodeURIComponent(args.sport)}` : '';
      const response = await fetch(`${API_BASE_URL}/api/user/venues/${args.venueId}/slots?date=${args.date}${sportParam}`);
      const result = await response.json();
      return { slots: result.success ? result.data.slots : [] };
    } catch (e) {
      return { error: "Failed to fetch slots", slots: [] };
    }
  },
  calculate_price_quote: async (args: any) => {
    try {
      const res = await calculateBookingPrice({
        court_id: args.courtId,
        date: args.date,
        slot_times: args.slotTimes,
        number_of_players: args.numPlayers || 1,
        slice_mask: args.sliceMask // Pass the bitmask to the price engine
      });
      return { quote: res.success ? res.data : {} };
    } catch (e) {
      return { error: "Price calculation failed", quote: {} };
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

export const getGeminiResponse = async (userMessage: string, conversationHistory: any[] = []) => {
  try {
    const systemInstruction = await buildSystemInstruction();
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash", 
      systemInstruction, // Back to string format
      tools 
    });

    const history = conversationHistory
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));
    
    // Ensure history starts with user role
    const firstUserIndex = history.findIndex(h => h.role === 'user');
    const validHistory = firstUserIndex !== -1 ? history.slice(firstUserIndex) : [];

    const chat = model.startChat({
      history: validHistory.slice(-10),
      generationConfig: { 
        temperature: 0.1,
        responseMimeType: "application/json" // Hint for JSON
      }
    });

    let result = await chat.sendMessage(userMessage);
    let response = result.response;
    let functionCalls = response.functionCalls();

    // Robust tool execution loop
    let turns = 0;
    while (functionCalls && functionCalls.length > 0 && turns < 5) {
      turns++;
      console.log("[GEMINI] Function calls requested:", functionCalls.map(c => c.name));
      const toolResponses = await Promise.all(
        functionCalls.map(async (call) => {
          const handler = toolHandlers[call.name];
          const data = handler ? await handler(call.args) : { error: "Tool not found" };
          return { functionResponse: { name: call.name, response: data } };
        })
      );

      result = await chat.sendMessage(toolResponses);
      response = result.response;
      functionCalls = response.functionCalls();
    }

    const responseText = response.text();
    try {
      const cleanJson = extractJson(responseText);
      const parsed = JSON.parse(cleanJson);
      return parsed;
    } catch (e) {
      console.error("Gemini JSON Parse Fallback:", responseText);
      // Fallback for plain text responses
      return { 
        intent: "chat", 
        response: responseText, 
        suggestions: ["Check available venues", "How do I book?"] 
      };
    }
  } catch (error) {
    console.error("Gemini Critical Error:", error);
    return { 
      intent: "chat", 
      response: "I'm having a bit of trouble processing that. Could you try rephrasing or checking back in a moment?", 
      suggestions: ["Retry"] 
    };
  }
};
