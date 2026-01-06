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
  MainTabs: undefined;
  Play: undefined;
  Book: undefined;
  Train: undefined;
  Community: undefined;
  VenueDetails: { venue?: any };
  SlotSelection: { venue?: any };
  BookingDetails: { venue?: string; venueObject?: any; pitch?: string; date?: number; month?: string; year?: number; monthIndex?: number; timeSlot?: string; slotPrice?: number };
  ReviewBooking: { venue?: string; venueObject?: any; pitch?: string; date?: number; month?: string; year?: number; monthIndex?: number; timeSlot?: string; slotPrice?: number; numPlayers?: number; teamName?: string; specialRequests?: string };
  CreateTournament: undefined;
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
