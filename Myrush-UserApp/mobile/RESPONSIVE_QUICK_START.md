# 🚀 Quick Start: Responsive Design in MyRush

## ⚡ 5-Minute Guide to Making Components Responsive

### Step 1: Import the Utilities

```typescript
import { wp, hp, moderateScale, fontScale } from '../utils/responsive';
// OR use the hook for advanced features
import { useResponsive } from '../hooks/useResponsive';
```

### Step 2: Replace Fixed Values

#### ❌ Before (Not Responsive):
```typescript
const styles = StyleSheet.create({
  container: {
    width: 320,           // Fixed pixel value
    height: 200,
    padding: 16,
    borderRadius: 12,
  },
  text: {
    fontSize: 16,
  },
});
```

#### ✅ After (Responsive):
```typescript
const styles = StyleSheet.create({
  container: {
    width: wp(85),              // 85% of screen width
    height: hp(25),             // 25% of screen height
    padding: moderateScale(16), // Scales with screen
    borderRadius: moderateScale(12),
  },
  text: {
    fontSize: fontScale(16),    // Responsive font
  },
});
```

### Step 3 (Optional): Add Orientation Support

```typescript
const MyComponent = () => {
  const { isPortrait, isTablet } = useResponsive();

  return (
    <View style={{
      flexDirection: isPortrait ? 'column' : 'row',
      width: isTablet ? wp(50) : wp(90),
    }}>
      {/* Your content */}
    </View>
  );
};
```

---

## 📏 Responsive Unit Cheat Sheet

| Function | Use For | Example |
|----------|---------|---------|
| `wp(%)` | Widths, horizontal padding/margin | `width: wp(90)` |
| `hp(%)` | Heights, vertical padding/margin | `height: hp(30)` |
| `moderateScale(px)` | Buttons, icons, border radius | `borderRadius: moderateScale(12)` |
| `fontScale(px)` | Text sizes | `fontSize: fontScale(16)` |

---

## 🎯 Common Patterns

### Full Width Container
```typescript
container: {
  width: wp(100),      // Full width
  paddingHorizontal: wp(5),  // 5% padding on sides
}
```

### Centered Card
```typescript
card: {
  width: wp(90),       // 90% of screen
  alignSelf: 'center', // Center it
  borderRadius: moderateScale(16),
  padding: moderateScale(20),
}
```

### Responsive Button
```typescript
button: {
  width: wp(80),
  height: hp(7),
  borderRadius: moderateScale(25),
  paddingHorizontal: moderateScale(24),
}
```

### Responsive Text
```typescript
title: {
  fontSize: fontScale(24),     // Large title
},
body: {
  fontSize: fontScale(16),     // Body text
  lineHeight: fontScale(24),   // Responsive line height
}
```

### Responsive Spacing
```typescript
import { spacing } from '../utils/responsive';

container: {
  padding: spacing.lg(),       // 16px scaled
  marginBottom: spacing.xl(),  // 20px scaled
}
```

---

## 🔥 Pro Tips

### 1. Use Percentages for Containers
```typescript
// Good for layouts that should fill space
width: wp(90)    // 90% of screen
height: hp(50)   // 50% of screen
```

### 2. Use moderateScale for Fixed Elements
```typescript
// Good for buttons, icons, borders
borderRadius: moderateScale(12)
paddingHorizontal: moderateScale(20)
iconSize: moderateScale(24)
```

### 3. Use fontScale for Text
```typescript
// Automatically limits max size for accessibility
fontSize: fontScale(16)
```

### 4. Check Device Type When Needed
```typescript
const { isTablet } = useResponsive();

<View style={{
  width: isTablet ? wp(50) : wp(90),  // Smaller width on tablets
}}>
```

---

## 🎨 Real Example: Responsive Card

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react';
import { wp, hp, moderateScale, fontScale } from '../utils/responsive';
import { useResponsive } from '../hooks/useResponsive';

const ResponsiveCard = ({ title, description, onPress }) => {
  const { isTablet, spacing } = useResponsive();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          width: isTablet ? wp(45) : wp(90),  // 2 columns on tablet
          padding: spacing.lg(),
          borderRadius: moderateScale(16),
        },
      ]}
      onPress={onPress}
    >
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginBottom: hp(2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: fontScale(18),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(8),
  },
  description: {
    fontSize: fontScale(14),
    color: '#666',
    lineHeight: fontScale(20),
  },
});
```

---

## ✅ Checklist for New Components

When creating a new component, make sure to:

- [ ] Import responsive utilities
- [ ] Replace all fixed widths with `wp()`
- [ ] Replace all fixed heights with `hp()`
- [ ] Replace padding/margin with `moderateScale()` or `spacing`
- [ ] Replace font sizes with `fontScale()`
- [ ] Replace border radius with `moderateScale()` or `borderRadius`
- [ ] Consider tablet layout with `isTablet`
- [ ] Consider orientation with `isPortrait`/`isLandscape`
- [ ] Use `SafeAreaView` for full-screen components
- [ ] Test on small (320px) and large (428px+) devices

---

## 🐛 Common Mistakes to Avoid

### ❌ Don't mix fixed and responsive values
```typescript
// Bad
container: {
  width: wp(90),    // Responsive
  padding: 16,      // Fixed - won't scale!
}
```

```typescript
// Good
container: {
  width: wp(90),            // Responsive
  padding: moderateScale(16), // Responsive
}
```

### ❌ Don't use pixel values for devices of different sizes
```typescript
// Bad - looks different on each device
fontSize: 16,
width: 300,
```

```typescript
// Good - scales properly
fontSize: fontScale(16),
width: wp(80),
```

---

## 📱 Test Your Component

### Quick Test Checklist:
1. Does it look good on iPhone SE (320px)?
2. Does it look good on iPhone 14 (390px)?
3. Does it look good on iPhone Pro Max (428px)?
4. Does it look good on iPad (768px+)?
5. Does it adapt to portrait/landscape?

### How to Test Different Sizes:
- iOS Simulator: Hardware → Device → Choose different devices
- Android Emulator: Tools → Device Manager → Create various sizes
- Physical Device: Test with actual phones/tablets

---

## 🎓 Learn More

**Full Documentation:** `RESPONSIVE_DESIGN_GUIDE.md`
- Complete function reference
- Advanced patterns
- Best practices
- Platform-specific tips

**Example Screen:** `src/screens/ResponsiveExampleScreen.tsx`
- See all features in action
- Copy patterns from working code
- Visual examples of responsive design

**Implementation Summary:** `RESPONSIVE_IMPLEMENTATION_SUMMARY.md`
- What was implemented
- What changed
- Testing checklist

---

## 💡 Remember

> **The goal of responsive design is for your app to look great on EVERY device, in EVERY orientation, without you having to think about it.**

Using the responsive utilities makes this automatic! 🎉
