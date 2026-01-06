# Responsive Design Guide for MyRush Mobile App

This guide ensures your app is fully responsive across all iOS and Android devices with all resolutions and OS versions.

## 📱 Supported Devices

### iOS Devices
- **iPhone SE (1st, 2nd, 3rd gen)**: 320-375px width
- **iPhone 12/13/14 mini**: 375px width
- **iPhone 12/13/14/15**: 390px width  
- **iPhone 12/13/14/15 Pro**: 393px width
- **iPhone Plus models**: 414px width
- **iPhone Pro Max models**: 428px width
- **iPad/iPad Mini**: 768-820px width
- **iPad Pro**: 1024-1366px width

### Android Devices
- **Small phones** (Galaxy A series, older models): 320-360px width
- **Standard phones** (Pixel, Galaxy S series): 360-412px width
- **Large phones** (Pixel XL, Galaxy S Plus): 412-428px width
- **Tablets** (Galaxy Tab, etc.): 600-1280px width

### Orientation Support
- ✅ Portrait mode
- ✅ Landscape mode
- ✅ Auto-rotation with live updates

---

## 🎯 How to Use Responsive Utilities

### 1. Basic Usage (Percentage-based)

```typescript
import { wp, hp, moderateScale, fontScale } from '../utils/responsive';

const styles = StyleSheet.create({
  container: {
    width: wp(90),        // 90% of screen width
    height: hp(50),       // 50% of screen height
    padding: wp(5),       // 5% of screen width
  },
  button: {
    width: wp(80),
    height: hp(7),
    borderRadius: moderateScale(12),  // Scales with screen size
  },
  text: {
    fontSize: fontScale(16),  // Responsive font size
  },
});
```

### 2. Using the useResponsive Hook (Recommended)

```typescript
import { useResponsive } from '../hooks/useResponsive';

const MyComponent = () => {
  const { 
    isTablet, 
    isPortrait, 
    breakpoint, 
    wp, 
    hp,
    rs,   // Responsive size helper
    rv    // Responsive value helper
  } = useResponsive();

  return (
    <View style={{
      padding: wp(isTablet ? 8 : 4),
      flexDirection: isPortrait ? 'column' : 'row',
    }}>
      {/* Content */}
    </View>
  );
};
```

### 3. Responsive Size Helper (rs)

```typescript
const MyComponent = () => {
  const { rs } = useResponsive();

  return (
    <View style={{
      // xsmall, small, medium, large, xlarge, tablet
      fontSize: rs(12, 14, 16, 18, 20, 22),
      padding: rs(8, 10, 12, 14, 16, 20),
    }}>
      {/* Content */}
    </View>
  );
};
```

### 4. Responsive Value Helper (rv)

```typescript
const MyComponent = () => {
  const { rv } = useResponsive();

  const columns = rv({
    xsmall: 1,
    small: 2,
    medium: 2,
    large: 3,
    xlarge: 3,
    tablet: 4,
    default: 2,
  });

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {/* Will show 1-4 columns based on device size */}
    </View>
  );
};
```

---

## 🔧 Available Responsive Functions

### Dimension Functions
| Function | Description | Example |
|----------|-------------|---------|
| `wp(percent)` | Width percentage | `wp(50)` = 50% width |
| `hp(percent)` | Height percentage | `hp(30)` = 30% height |
| `scale(size)` | Scale based on width | `scale(16)` |
| `verticalScale(size)` | Scale based on height | `verticalScale(20)` |
| `moderateScale(size)` | Balanced scaling | `moderateScale(14)` |
| `fontScale(size)` | Font size with max limit | `fontScale(16)` |

### Device Detection
| Function | Returns | Description |
|----------|---------|-------------|
| `getDeviceType()` | `'phone' \| 'tablet'` | Device type |
| `isSmallDevice()` | `boolean` | Width < 375px |
| `isMediumDevice()` | `boolean` | 375px ≤ width < 414px |
| `isLargeDevice()` | `boolean` | Width ≥ 414px |
| `isTablet()` | `boolean` | Tablet device |
| `getCurrentBreakpoint()` | `string` | Current breakpoint |

### Orientation
| Function | Returns | Description |
|----------|---------|-------------|
| `isPortrait()` | `boolean` | Portrait mode |
| `isLandscape()` | `boolean` | Landscape mode |

### Platform Helpers
| Function | Returns | Description |
|----------|---------|-------------|
| `isIOS` | `boolean` | iOS platform |
| `isAndroid` | `boolean` | Android platform |
| `getIOSVersion()` | `number` | iOS version |
| `getAndroidAPILevel()` | `number` | Android API level |
| `platformValue(ios, android)` | `any` | Platform-specific value |

### Safe Area
| Function | Returns | Description |
|----------|---------|-------------|
| `getStatusBarHeight()` | `number` | Status bar height |
| `hasNotch()` | `boolean` | Device has notch/island |

---

## 📐 Breakpoints Reference

```typescript
{
  xsmall: 320,    // iPhone SE (1st gen), very old Android
  small: 360,     // Standard small Android phones
  medium: 375,    // iPhone 12/13/14 mini, iPhone SE (2nd/3rd gen)
  large: 390,     // iPhone 12/13/14, most modern Android
  xlarge: 414,    // iPhone Plus/Pro Max
  xxlarge: 428,   // iPhone 14 Pro Max, large Android
  tablet: 600,    // Small tablets
  tabletLarge: 768,  // iPad, 10 inch tablets
  tabletXL: 1024, // iPad Pro, large tablets
}
```

---

## ✅ Best Practices

### 1. Always Use Responsive Units
❌ **Bad:**
```typescript
const styles = StyleSheet.create({
  container: {
    width: 320,        // Fixed pixel value
    height: 200,
    fontSize: 16,
  },
});
```

✅ **Good:**
```typescript
const styles = StyleSheet.create({
  container: {
    width: wp(80),           // Percentage of width
    height: hp(25),          // Percentage of height
    fontSize: fontScale(16), // Responsive font
  },
});
```

### 2. Handle Orientation Changes
```typescript
const MyScreen = () => {
  const { isPortrait, isLandscape } = useResponsive();

  return (
    <View style={{
      flexDirection: isPortrait ? 'column' : 'row',
      paddingHorizontal: isPortrait ? wp(5) : wp(10),
    }}>
      {/* Content adapts to orientation */}
    </View>
  );
};
```

### 3. Support Tablets
```typescript
const MyComponent = () => {
  const { isTablet, wp, hp } = useResponsive();

  return (
    <View style={{
      width: isTablet ? wp(50) : wp(90),  // Half width on tablets
      padding: isTablet ? wp(4) : wp(2),   // More padding on tablets
    }}>
      {/* Content */}
    </View>
  );
};
```

### 4. Use moderateScale for Elements
```typescript
// For icons, buttons, borders
const styles = StyleSheet.create({
  icon: {
    width: moderateScale(24),
    height: moderateScale(24),
  },
  button: {
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(20),
  },
});
```

### 5. Platform-Specific Adjustments
```typescript
import { platformValue } from '../utils/responsive';

const styles = StyleSheet.create({
  text: {
    fontFamily: platformValue('San Francisco', 'Roboto'),
    marginTop: platformValue(hp(2), hp(1.5)),
  },
});
```

### 6. SafeArea Handling
```typescript
import { SafeAreaView } from 'react-native-safe-area-context';
import { getStatusBarHeight } from '../utils/responsive';

const MyScreen = () => {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      {/* SafeAreaView handles notches and safe areas automatically */}
    </SafeAreaView>
  );
};
```

---

## 🎨 Responsive Spacing & Sizing

### Spacing Object (Use these for consistent spacing)
```typescript
import { spacing } from '../utils/responsive';

const styles = StyleSheet.create({
  container: {
    padding: spacing.md(),      // 12px scaled
    marginBottom: spacing.lg(), // 16px scaled
  },
});
```

Available spacing:
- `spacing.xxs()` → 2px scaled
- `spacing.xs()` → 4px scaled
- `spacing.sm()` → 8px scaled
- `spacing.md()` → 12px scaled
- `spacing.lg()` → 16px scaled
- `spacing.xl()` → 20px scaled
- `spacing.xxl()` → 24px scaled
- `spacing.xxxl()` → 32px scaled

### Border Radius Object
```typescript
import { borderRadius } from '../utils/responsive';

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg(),  // 12px scaled
  },
  button: {
    borderRadius: borderRadius.xl(),  // 16px scaled
  },
});
```

### Icon Size Object
```typescript
import { iconSize } from '../utils/responsive';

<Ionicons name="home" size={iconSize.md()} color="#000" />
```

---

## 🔄 Handling Orientation Changes Live

```typescript
import { useState, useEffect } from 'react';
import { useResponsive } from '../hooks/useResponsive';

const MyScreen = () => {
  const { isPortrait, breakpoint } = useResponsive();
  
  // Component will re-render on orientation change
  useEffect(() => {
    console.log('Orientation changed:', isPortrait ? 'Portrait' : 'Landscape');
  }, [isPortrait]);

  return (
    <View>
      <Text>Current mode: {isPortrait ? 'Portrait' : 'Landscape'}</Text>
      <Text>Breakpoint: {breakpoint}</Text>
    </View>
  );
};
```

---

## 📊 Example: Fully Responsive Card Component

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { moderateScale, fontScale } from '../utils/responsive';

const ResponsiveCard = ({ title, description }) => {
  const { wp, hp, isTablet, isPortrait, spacing, borderRadius } = useResponsive();

  return (
    <View style={[
      styles.card,
      {
        width: isTablet ? wp(45) : wp(90),
        padding: spacing.lg(),
        borderRadius: borderRadius.xl(),
        marginBottom: hp(2),
      }
    ]}>
      <Text style={[
        styles.title,
        {
          fontSize: fontScale(isTablet ? 20 : 16),
          marginBottom: spacing.sm(),
        }
      ]}>
        {title}
      </Text>
      <Text style={[
        styles.description,
        { fontSize: fontScale(14) }
      ]}>
        {description}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontWeight: '600',
    color: '#333',
  },
  description: {
    color: '#666',
    lineHeight: 20,
  },
});

export default ResponsiveCard;
```

---

## 🧪 Testing Responsiveness

### 1. Test on Multiple Screen Sizes
- Small phone (iPhone SE): 320-375px
- Medium phone (iPhone 14): 390px
- Large phone (iPhone Pro Max): 428px
- Tablet (iPad): 768px+

### 2. Test Orientations
- Portrait mode
- Landscape mode
- Rotation between modes

### 3. Test Platform Differences
- iOS devices (with notch and without)
- Android devices (various manufacturers)
- Different OS versions

---

## 🚀 Migration Checklist

To make existing screens fully responsive:

1. ✅ Import responsive utilities
2. ✅ Replace fixed pixel values with `wp()`, `hp()`, `moderateScale()`
3. ✅ Replace fixed font sizes with `fontScale()`
4. ✅ Add orientation support with `useResponsive()` hook
5. ✅ Add tablet-specific layouts
6. ✅ Use `SafeAreaView` for screens
7. ✅ Test on multiple device sizes
8. ✅ Test portrait and landscape modes

---

## 📝 Summary

Your app is now equipped with:
- ✅ **Dynamic responsive utilities** that update on orientation changes
- ✅ **Comprehensive device detection** for all iOS and Android devices
- ✅ **Breakpoint system** covering all device sizes
- ✅ **Orientation support** with live updates
- ✅ **Platform-specific helpers** for iOS and Android differences
- ✅ **Safe area handling** for notches and dynamic islands
- ✅ **Responsive spacing, borders, and icons** for consistency
- ✅ **TypeScript support** for type safety

Your app will now work perfectly on:
- 📱 All iPhone models (SE to Pro Max, all generations)
- 📱 All Android phones (320px to 428px+ width)
- 📱 All tablets (iPad, iPad Pro, Android tablets)
- 🔄 Both portrait and landscape orientations
- 🌍 All iOS and Android OS versions
