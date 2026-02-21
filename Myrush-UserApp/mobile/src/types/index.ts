// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  OTPLogin: undefined;
  Main: undefined;
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Profile: undefined;
  PlayerProfile: undefined;
  ProfileOverview: undefined;
  Reviews: undefined;
  Venues: undefined;
  Settings: undefined;
  MainTabs: { screen?: string; params?: any };
  Play: undefined;
  Book: undefined;
  Train: undefined;
  CoachDetails: { coachId: string };
  Community: undefined;
  Leaderboard: undefined;
  SquadList: undefined;
  SquadDetails: { squadId: string };
  CreateSquad: undefined;
  ChatList: undefined;
  ChatDetail: { chatId: string; userName: string };
  Store: undefined;
  Payments: undefined;
  Support: undefined;
  Events: undefined;
  RedemptionStore: undefined;
  Membership: undefined;
  PrivacyPolicy: undefined;
  VenueDetails: { venue?: any };
  SlotSelection: { venue?: any; venueId?: string; venueName?: string; sport?: string }; // Updated for coach booking
  BookingDetails: { venue?: string; venueObject?: any; pitch?: string; date?: number; month?: string; year?: number; monthIndex?: number; timeSlot?: string; slotPrice?: number; selectedSlots?: Array<{ time: string; display_time: string; price: number; }>; totalPrice?: number; };
  BookingSuccess: { venue?: string; date?: any; timeSlot?: string; totalAmount?: number; bookingId?: string; selectedSlots?: Array<any>; paymentId?: string };
  CreateTournament: undefined;
  JoinGame: { gameData?: any };
  HostGame: { bookingData: any };
  // Tab Keys
  HomeTab: undefined;
  PlayTab: undefined;
  BookTab: undefined;
  TrainTab: undefined;
  CommunityTab: undefined;
};

// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

// Common component props
export interface BaseComponentProps {
  testID?: string;
  style?: object;
}
