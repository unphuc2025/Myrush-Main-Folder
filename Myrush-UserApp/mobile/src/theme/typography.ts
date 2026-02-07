import { Platform } from 'react-native';
import { fontScale } from '../utils/responsive';

// Font families
export const fontFamilies = {
  regular: 'Lexend_400Regular',
  medium: 'Lexend_500Medium',
  bold: 'Lexend_700Bold',
  light: 'Lexend_300Light',
};

// Font sizes (scaled)
export const fontSizes = {
  xs: fontScale(10),
  sm: fontScale(12),
  md: fontScale(14),
  lg: fontScale(16),
  xl: fontScale(18),
  '2xl': fontScale(20),
  '3xl': fontScale(24),
  '4xl': fontScale(30),
  '5xl': fontScale(36),
  '6xl': fontScale(48),
};

// Line heights
export const lineHeights = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
};

// Font weights
export const fontWeights = {
  light: '300' as const,
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

// Typography presets
export const typography = {
  h1: {
    fontFamily: 'Lexend_900Black', // Design System: Display XL (Black 900)
    fontSize: fontSizes['5xl'],
    fontWeight: undefined, // Let font family handle weight
    lineHeight: fontSizes['5xl'] * lineHeights.tight,
  },
  h2: {
    fontFamily: 'Lexend_700Bold',
    fontSize: fontSizes['4xl'],
    fontWeight: undefined,
    lineHeight: fontSizes['4xl'] * lineHeights.tight,
  },
  h3: {
    fontFamily: 'Lexend_700Bold', // Design System: Heading L
    fontSize: fontSizes['3xl'],
    fontWeight: undefined,
    lineHeight: fontSizes['3xl'] * lineHeights.tight,
  },
  h4: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: fontSizes['2xl'],
    fontWeight: undefined,
    lineHeight: fontSizes['2xl'] * lineHeights.normal,
  },
  h5: {
    fontFamily: 'Lexend_500Medium',
    fontSize: fontSizes.xl,
    fontWeight: undefined,
    lineHeight: fontSizes.xl * lineHeights.normal,
  },
  body: {
    fontFamily: 'Lexend_400Regular', // Design System: Body
    fontSize: fontSizes.lg,
    fontWeight: undefined,
    lineHeight: fontSizes.lg * lineHeights.normal,
  },
  bodySmall: {
    fontFamily: 'Lexend_400Regular',
    fontSize: fontSizes.md,
    fontWeight: undefined,
    lineHeight: fontSizes.md * lineHeights.normal,
  },
  caption: {
    fontFamily: 'Lexend_300Light',
    fontSize: fontSizes.sm,
    fontWeight: undefined,
    lineHeight: fontSizes.sm * lineHeights.normal,
  },
  button: {
    fontFamily: 'Lexend_700Bold', // Design System: Label (Bold)
    fontSize: fontSizes.lg,
    fontWeight: undefined,
    lineHeight: fontSizes.lg * lineHeights.tight,
  },
  label: {
    fontFamily: 'Lexend_700Bold', // Design System: Label (Bold)
    fontSize: fontSizes.md,
    fontWeight: undefined,
    lineHeight: fontSizes.md * lineHeights.tight,
  },
};

export type Typography = typeof typography;
export default typography;

