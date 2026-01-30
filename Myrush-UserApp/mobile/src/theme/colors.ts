export const colors = {
  // Primary colors (Brand)
  primary: '#39E079', // Neon Green (v2.0)
  primaryDark: '#00AB55', // Kept as secondary variant
  primaryLight: '#66FF99',

  // Brand specific
  brand: {
    primary: '#39E079',
    secondary: '#00AB55',
    light: '#1A1A1A', // Surface Dark
    muted: '#005C2E',
  },

  // Secondary colors
  secondary: '#5856D6',
  secondaryDark: '#3E3CB3',
  secondaryLight: '#7A79E0',

  // Accent colors
  accent: '#FF9F43',
  accentDark: '#E68A2E',
  accentLight: '#FFB870',

  // Neutral colors
  white: '#FFFFFF',
  black: '#000000', // True Black
  gray: {
    50: '#1A1A1A',  // Surface Dark (Inputs)
    100: '#1C1C1E', // Card Surface
    200: '#2C2C2E',
    300: '#3A3A3C',
    400: '#9CA3AF', // Text Muted
    500: '#6B7280',
    600: '#9CA3AF',
    700: '#D1D5DB',
    800: '#E5E7EB',
    900: '#FFFFFF',
  },

  // Status colors
  success: '#39E079',
  warning: '#FF9500',
  error: '#FF453A',
  info: '#0A84FF',

  // Background colors
  background: {
    primary: '#000000',     // True Black
    secondary: '#1C1C1E',   // Card Surface
    tertiary: '#1A1A1A',    // Inputs/Secondary Surface
  },

  // Text colors
  text: {
    primary: '#FFFFFF',
    secondary: '#9CA3AF', // Text Muted
    tertiary: '#636366',
    inverted: '#000000', // For text on primary buttons
  },

  // Border colors
  border: {
    light: 'rgba(255, 255, 255, 0.1)', // White/10
    medium: '#3A3A3C',
    dark: '#48484A',
  },

  // Transparent
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.7)',
};

// Dark theme colors (Identical to default for forced Dark Mode)
export const darkColors = {
  ...colors,
};

export type Colors = typeof colors;
export default colors;

