import { GoogleGenerativeAI } from "@google/generative-ai";
import { fetchKnowledgeBase, buildChatbotContext, searchVenues, getVenueDetails } from './ChatbotContext';

// API Key provided by the user
const API_KEY = "AIzaSyA21AWLr2IJRxsUnITnTIxSvP-jqYzME3o";

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
You are MyRush AI, an expert concierge for India's premium sports booking platform.

PLATFORM KNOWLEDGE:
- Active Cities: ${cities}
- Supported Sports: ${sports}
- Available Amenities: ${amenities}
- Total Venues: ${knowledge.venue_count} venues across ${knowledge.city_count} cities

COMMON POLICIES & FAQs:
${faqContext}

YOUR CAPABILITIES:
1. Answer ANY question about MyRush (venues, pricing, amenities, rules,  locations, policies)
2. Recommend venues based on user preferences
3. Guide booking process conversationally
4. Explain cancellation policies, payment methods, membership benefits
5. Help with account and technical issues
6. Provide specific venue details including pricing, rules, and amenities

CONVERSATIONAL STYLE:
- Be friendly, helpful, and concise
- Use emojis sparingly for emphasis (🏸, ⚽, 🏏, 🅿️, etc.)
- Ask clarifying questions when needed
- Provide specific information (venue names, addresses, prices)
- Use bullet points for lists
- Be proactive in offering relevant suggestions

IMPORTANT POLICIES:
- Cancellation: Free cancellation 24+ hours before booking, 50% refund 12-24 hours, no refund <12 hours
- Payment: All major cards, UPI, netbanking accepted
- Booking Fee: ₹50 per booking
- Rush Hours: Peak pricing typically 6 PM - 10 PM on weekdays, all day weekends

OUTPUT SCHEMA (strict JSON, no markdown):
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
  "response": string,
  "suggestions": string[] (max 4 quick action buttons)
}

EXAMPLE INTERACTIONS:

User: "What sports can I play at MyRush?"
Output: {
  "intent": "ask_question",
  "action": { "type": "respond" },
  "response": "We offer ${sports}! Each sport has dedicated venues with professional facilities. Which sport interests you?",
  "suggestions": ["Book Badminton", "Book Football", "View All Venues"]
}

User: "Find cheapest football courts in Hyderabad with parking under ₹1000"
Output: {
  "intent": "search_venues",
  "action": {
    "type": "search",
    "parameters": { "city": "Hyderabad", "sport": "Football", "amenities": ["parking"], "priceMax": 1000 }
  },
  "response": "Searching for budget-friendly football venues in Hyderabad with parking...",
  "suggestions": []
}

User: "Tell me about [venue name]"
Output: {
  "intent": "venue_details",
  "action": {
    "type": "get_venue_details",
    "parameters": { "venueName": "[venue name]" }
  },
  "response": "Let me get the details for you...",
  "suggestions": []
}

User: "What's your refund policy?"
Output: {
  "intent": "ask_question",
  "action": { "type": "respond" },
  "response": "MyRush Refund Policy:\\n\\n✅ Full Refund: Cancel 24+ hours before\\n⚠️ 50% Refund: Cancel 12-24 hours before\\n❌ No Refund: Cancel <12 hours or no-show\\n\\nYou can also reschedule for free up to 48 hours before your slot!",
  "suggestions": ["View My Bookings", "Book a Court", "Contact Support"]
}

User: "Hi" or "Hello"
Output: {
  "intent": "general_chat",
  "action": { "type": "respond" },
  "response": "Hello! 👋 Welcome to MyRush. I can help you:\\n• Book sports courts\\n• Find venues\\n• Answer questions\\n• Manage bookings\\n\\nWhat would you like to do?",
  "suggestions": ["Book a Court", "Search Venues", "View Bookings"]
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
            model: "gemini-1.5-pro",
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
                response: responseText || "I'm sorry, I didn't quite understand that. Could you rephrase?",
                suggestions: ["Book a Court", "Search Venues", "Ask a Question"]
            };
        }
    } catch (error) {
        console.error("Gemini API Error:", error);
        return {
            intent: "error",
            action: { type: "respond" },
            response: "I'm having trouble connecting right now. Please try again in a moment.",
            suggestions: ["Try Again", "Contact Support"]
        };
    }
};
