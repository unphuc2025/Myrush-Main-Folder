import colors, { darkColors, Colors } from './colors';
import typography, { Typography, fontFamilies, fontSizes, fontWeights, lineHeights } from './typography';
import { spacing, borderRadius, shadows, Spacing, BorderRadius, Shadows } from './spacing';

export interface Theme {
  colors: Colors;
  typography: Typography;
  fontFamilies: typeof fontFamilies;
  fontSizes: typeof fontSizes;
  fontWeights: typeof fontWeights;
  lineHeights: typeof lineHeights;
  spacing: Spacing;
  borderRadius: BorderRadius;
  shadows: Shadows;
}

export const lightTheme: Theme = {
  colors,
  typography,
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  spacing,
  borderRadius,
  shadows,
};

export const darkTheme: Theme = {
  ...lightTheme,
  colors: darkColors,
};

export {
  colors,
  darkColors,
  typography,
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  spacing,
  borderRadius,
  shadows,
};

export default lightTheme;

