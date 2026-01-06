import { Dimensions, PixelRatio, Platform, ScaledSize, StatusBar } from 'react-native';

/**
 * Enhanced Responsive Utilities for iOS & Android
 * Supports all screen sizes, orientations, and device types
 */

// Base dimensions (iPhone 14 Pro as reference - 393x852)
const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

// Get current screen dimensions dynamically
const getDimensions = () => Dimensions.get('window');

// Responsive width percentage (dynamic)
export const wp = (widthPercent: number): number => {
  const { width } = getDimensions();
  const elemWidth = typeof widthPercent === 'number' ? widthPercent : parseFloat(widthPercent);
  return PixelRatio.roundToNearestPixel((width * elemWidth) / 100);
};

// Responsive height percentage (dynamic)
export const hp = (heightPercent: number): number => {
  const { height } = getDimensions();
  const elemHeight = typeof heightPercent === 'number' ? heightPercent : parseFloat(heightPercent);
  return PixelRatio.roundToNearestPixel((height * elemHeight) / 100);
};

// Scale based on screen width (dynamic)
export const scale = (size: number): number => {
  const { width } = getDimensions();
  return (width / BASE_WIDTH) * size;
};

// Vertical scale based on screen height (dynamic)
export const verticalScale = (size: number): number => {
  const { height } = getDimensions();
  return (height / BASE_HEIGHT) * size;
};

// Moderate scale with factor (balanced scaling)
export const moderateScale = (size: number, factor = 0.5): number => {
  return size + (scale(size) - size) * factor;
};

// Responsive font size with accessibility support
export const fontScale = (size: number, maxScale: number = 1.3): number => {
  const scaledSize = scale(size);
  const maxSize = size * maxScale;
  const finalSize = Math.min(scaledSize, maxSize);
  return Math.round(PixelRatio.roundToNearestPixel(finalSize));
};

// Get device type (dynamic)
export const getDeviceType = (): 'phone' | 'tablet' => {
  const { width, height } = getDimensions();
  const aspectRatio = height / width;
  const diagonalInches = Math.sqrt(width * width + height * height) / PixelRatio.get();

  // Tablets typically have diagonal > 6.5 inches or aspect ratio closer to 4:3
  if (diagonalInches > 6.5 || width >= 600) return 'tablet';
  return 'phone';
};

// Device size checks (dynamic)
export const isSmallDevice = (): boolean => {
  const { width } = getDimensions();
  return width < 375;
};

export const isMediumDevice = (): boolean => {
  const { width } = getDimensions();
  return width >= 375 && width < 414;
};

export const isLargeDevice = (): boolean => {
  const { width } = getDimensions();
  return width >= 414;
};

export const isTablet = (): boolean => getDeviceType() === 'tablet';

// Platform checks
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

// iOS version check
export const getIOSVersion = (): number => {
  if (!isIOS) return 0;
  const version = Platform.Version;
  return typeof version === 'string' ? parseInt(version, 10) : version;
};

// Android API level
export const getAndroidAPILevel = (): number => {
  if (!isAndroid) return 0;
  return Platform.Version as number;
};

// Get screen dimensions (static - for initial setup)
export const getScreenDimensions = () => {
  const { width, height } = getDimensions();
  return { width, height };
};

// Get current screen dimensions
export const screenWidth = () => getDimensions().width;
export const screenHeight = () => getDimensions().height;

// Comprehensive device breakpoints
export const breakpoints = {
  // Phones
  xsmall: 320,    // iPhone SE (1st gen), very old Android
  small: 360,     // Standard small Android phones
  medium: 375,    // iPhone 12/13/14 mini, iPhone SE (2nd/3rd gen)
  large: 390,     // iPhone 12/13/14, most modern Android
  xlarge: 414,    // iPhone Plus/Pro Max
  xxlarge: 428,   // iPhone 14 Pro Max, large Android

  // Tablets
  tablet: 600,    // Small tablets (7-8 inch)
  tabletLarge: 768,  // iPad, 10 inch tablets
  tabletXL: 1024, // iPad Pro, large tablets
};

// Get current breakpoint (dynamic)
export const getCurrentBreakpoint = (): 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge' | 'tablet' | 'tabletLarge' | 'tabletXL' => {
  const { width } = getDimensions();

  if (width >= breakpoints.tabletXL) return 'tabletXL';
  if (width >= breakpoints.tabletLarge) return 'tabletLarge';
  if (width >= breakpoints.tablet) return 'tablet';
  if (width >= breakpoints.xxlarge) return 'xxlarge';
  if (width >= breakpoints.xlarge) return 'xlarge';
  if (width >= breakpoints.large) return 'large';
  if (width >= breakpoints.medium) return 'medium';
  if (width >= breakpoints.small) return 'small';
  return 'xsmall';
};

// Orientation detection (dynamic)
export const isPortrait = (): boolean => {
  const { width, height } = getDimensions();
  return height >= width;
};

export const isLandscape = (): boolean => !isPortrait();

// Get status bar height
export const getStatusBarHeight = (): number => {
  if (isIOS) {
    // iOS - varies by device model
    const { height, width } = getDimensions();

    // iPhone X and newer (with notch/Dynamic Island)
    if (height >= 812 || width >= 812) {
      return isPortrait() ? 47 : 0;
    }

    // Older iPhones
    return 20;
  }

  // Android
  return StatusBar.currentHeight || 0;
};

// Safe area helpers
export const hasNotch = (): boolean => {
  if (!isIOS) return false;
  const { height, width } = getDimensions();
  const dimension = Math.max(height, width);

  // iPhone models with notch/Dynamic Island
  return dimension >= 812;
};

// Responsive spacing (dynamic)
export const spacing = {
  xxs: () => moderateScale(2),
  xs: () => moderateScale(4),
  sm: () => moderateScale(8),
  md: () => moderateScale(12),
  lg: () => moderateScale(16),
  xl: () => moderateScale(20),
  xxl: () => moderateScale(24),
  xxxl: () => moderateScale(32),
};

// Responsive border radius (dynamic)
export const borderRadius = {
  xs: () => moderateScale(2),
  sm: () => moderateScale(4),
  md: () => moderateScale(8),
  lg: () => moderateScale(12),
  xl: () => moderateScale(16),
  xxl: () => moderateScale(20),
  round: () => moderateScale(999),
};

// Responsive icon sizes (dynamic)
export const iconSize = {
  xs: () => moderateScale(12),
  sm: () => moderateScale(16),
  md: () => moderateScale(20),
  lg: () => moderateScale(24),
  xl: () => moderateScale(32),
  xxl: () => moderateScale(40),
};

// Screen orientation listener helper
export const addOrientationListener = (
  callback: (dimensions: ScaledSize) => void
): (() => void) => {
  const subscription = Dimensions.addEventListener('change', ({ window }) => {
    callback(window);
  });
  return () => subscription.remove();
};

// Utility to get responsive value based on device size
export const responsiveSize = <T,>(sizes: {
  small?: T;
  medium?: T;
  large?: T;
  tablet?: T;
  default: T;
}): T => {
  const deviceType = getDeviceType();
  const breakpoint = getCurrentBreakpoint();

  if (deviceType === 'tablet' && sizes.tablet !== undefined) {
    return sizes.tablet;
  }

  if (breakpoint in ['xlarge', 'xxlarge'] && sizes.large !== undefined) {
    return sizes.large;
  }

  if (breakpoint in ['medium', 'large'] && sizes.medium !== undefined) {
    return sizes.medium;
  }

  if (sizes.small !== undefined && isSmallDevice()) {
    return sizes.small;
  }

  return sizes.default;
};

// Platform-specific values
export const platformValue = <T,>(ios: T, android: T): T => {
  return isIOS ? ios : android;
};

// Export all utilities as default object for backward compatibility
export default {
  // Core functions
  wp,
  hp,
  scale,
  verticalScale,
  moderateScale,
  fontScale,

  // Device detection
  getDeviceType,
  isSmallDevice,
  isMediumDevice,
  isLargeDevice,
  isTablet,

  // Platform
  isIOS,
  isAndroid,
  getIOSVersion,
  getAndroidAPILevel,
  platformValue,

  // Dimensions
  getScreenDimensions,
  screenWidth,
  screenHeight,

  // Breakpoints
  breakpoints,
  getCurrentBreakpoint,

  // Orientation
  isPortrait,
  isLandscape,
  addOrientationListener,

  // Safe area
  getStatusBarHeight,
  hasNotch,

  // Responsive helpers
  spacing,
  borderRadius,
  iconSize,
  responsiveSize,
};

