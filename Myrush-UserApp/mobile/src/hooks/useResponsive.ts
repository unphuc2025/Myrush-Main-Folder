import { useState, useEffect, useCallback } from 'react';
import { Dimensions, ScaledSize } from 'react-native';
import {
  wp,
  hp,
  scale,
  verticalScale,
  moderateScale,
  fontScale,
  getCurrentBreakpoint,
  getDeviceType,
  isSmallDevice,
  isMediumDevice,
  isLargeDevice,
  isTablet,
  isPortrait,
  isLandscape,
  breakpoints,
  getStatusBarHeight,
  hasNotch,
  spacing,
  borderRadius,
  iconSize,
  platformValue,
  getIOSVersion,
  getAndroidAPILevel,
} from '../utils/responsive';

interface ResponsiveValues {
  screenWidth: number;
  screenHeight: number;
  breakpoint: 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge' | 'tablet' | 'tabletLarge' | 'tabletXL';
  deviceType: 'phone' | 'tablet';
  isSmall: boolean;
  isMedium: boolean;
  isLarge: boolean;
  isTablet: boolean;
  isPortrait: boolean;
  isLandscape: boolean;
  statusBarHeight: number;
  hasNotch: boolean;
  iosVersion: number;
  androidAPILevel: number;
}

export const useResponsive = () => {
  const [dimensions, setDimensions] = useState<ScaledSize>(Dimensions.get('window'));

  const updateDimensions = useCallback(({ window }: { window: ScaledSize }) => {
    setDimensions(window);
  }, []);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', updateDimensions);
    return () => subscription.remove();
  }, [updateDimensions]);

  const responsive: ResponsiveValues = {
    screenWidth: dimensions.width,
    screenHeight: dimensions.height,
    breakpoint: getCurrentBreakpoint(),
    deviceType: getDeviceType(),
    isSmall: isSmallDevice(),
    isMedium: isMediumDevice(),
    isLarge: isLargeDevice(),
    isTablet: isTablet(),
    isPortrait: isPortrait(),
    isLandscape: isLandscape(),
    statusBarHeight: getStatusBarHeight(),
    hasNotch: hasNotch(),
    iosVersion: getIOSVersion(),
    androidAPILevel: getAndroidAPILevel(),
  };

  // Responsive style helpers - supports all breakpoints
  const rs = useCallback((
    xsmall: number,
    small?: number,
    medium?: number,
    large?: number,
    xlarge?: number,
    tablet?: number
  ) => {
    const { breakpoint, deviceType } = responsive;

    // Tablet takes priority
    if (deviceType === 'tablet' && tablet !== undefined) {
      return tablet;
    }

    switch (breakpoint) {
      case 'tabletXL':
      case 'tabletLarge':
      case 'tablet':
        return tablet ?? xlarge ?? large ?? medium ?? small ?? xsmall;
      case 'xxlarge':
      case 'xlarge':
        return xlarge ?? large ?? medium ?? small ?? xsmall;
      case 'large':
        return large ?? medium ?? small ?? xsmall;
      case 'medium':
        return medium ?? small ?? xsmall;
      case 'small':
        return small ?? xsmall;
      default:
        return xsmall;
    }
  }, [responsive]);

  // Get responsive value from object
  const rv = useCallback(<T,>(values: {
    xsmall?: T;
    small?: T;
    medium?: T;
    large?: T;
    xlarge?: T;
    tablet?: T;
    default: T;
  }): T => {
    const { breakpoint, deviceType } = responsive;

    if (deviceType === 'tablet' && values.tablet !== undefined) {
      return values.tablet;
    }

    if ((breakpoint === 'xlarge' || breakpoint === 'xxlarge') && values.xlarge !== undefined) {
      return values.xlarge;
    }

    if (breakpoint === 'large' && values.large !== undefined) {
      return values.large;
    }

    if (breakpoint === 'medium' && values.medium !== undefined) {
      return values.medium;
    }

    if (breakpoint === 'small' && values.small !== undefined) {
      return values.small;
    }

    if (breakpoint === 'xsmall' && values.xsmall !== undefined) {
      return values.xsmall;
    }

    return values.default;
  }, [responsive]);

  return {
    ...responsive,
    wp,
    hp,
    scale,
    verticalScale,
    moderateScale,
    fontScale,
    breakpoints,
    spacing,
    borderRadius,
    iconSize,
    platformValue,
    rs,  // Responsive size shorthand
    rv,  // Responsive value from object
  };
};

export default useResponsive;

