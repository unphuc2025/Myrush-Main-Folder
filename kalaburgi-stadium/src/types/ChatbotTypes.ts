export interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
    type?: 'text' | 'options' | 'venues' | 'slots' | 'summary' | 'date-picker' | 'venue_detail';
    options?: QuickReply[];
    data?: any; // For holding venues, slots, etc.
}

export interface QuickReply {
    label: string;
    value: string;
    action?: string; // 'select_city', 'select_sport', etc.
    data?: any; // Additional data for the action
}

export interface BookingState {
    step: 'idle' | 'selecting_city' | 'selecting_sport' | 'selecting_venue' | 'selecting_date' | 'selecting_slot' | 'confirming' | 'showing_venues';
    city?: string;
    sport?: string;
    venue?: any;
    date?: string; // YYYY-MM-DD
    slot?: any;
    bookingId?: string;
}

export const CITIES = ['Hyderabad', 'Bangalore', 'Mumbai', 'Delhi'];
export const SPORTS = ['Badminton', 'Football', 'Cricket', 'Tennis', 'Pickleball', 'Swimming'];
