export const colors = {
  // Primary colors (Brand)
  primary: '#00D700',
  primaryDark: '#00A300',
  primaryLight: '#33DF33',

  // Brand specific
  brand: {
    primary: '#00D700',
    secondary: '#00A300',
    light: '#E5FBE5', // Very light green for backgrounds
    muted: '#80EB80',
  },

  // Secondary colors
  secondary: '#5856D6',
  secondaryDark: '#3E3CB3',
  secondaryLight: '#7A79E0',

  // Accent colors
  accent: '#FF9F43', // Orange accent from design
  accentDark: '#E68A2E',
  accentLight: '#FFB870',

  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Status colors
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#007AFF',

  // Background colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F2F2F7',
    tertiary: '#E5E5EA',
  },

  // Text colors
  text: {
    primary: '#000000',
    secondary: '#3C3C43',
    tertiary: '#8E8E93',
    inverted: '#FFFFFF',
  },

  // Border colors
  border: {
    light: '#E5E5EA',
    medium: '#C7C7CC',
    dark: '#8E8E93',
  },

  // Transparent
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

// Dark theme colors
export const darkColors = {
  ...colors,
  background: {
    primary: '#000000',
    secondary: '#1C1C1E',
    tertiary: '#2C2C2E',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#EBEBF5',
    tertiary: '#8E8E93',
    inverted: '#000000',
  },
  border: {
    light: '#38383A',
    medium: '#48484A',
    dark: '#636366',
  },
};

export type Colors = typeof colors;
export default colors;

