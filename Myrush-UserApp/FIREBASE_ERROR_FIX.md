# React Native Firebase Module Error - Fix Guide

## Error
```
Error: Native module RNFBAppModule not found
```

## Root Cause
The React Native Firebase native modules are not properly linked or installed in the Android project.

## Solution Steps

### Option 1: Quick Fix (Recommended)

1. **Stop Metro Bundler** (Ctrl+C in the terminal running `npm start`)

2. **Clean Android Build**
```bash
cd Myrush-UserApp/mobile
cd android
./gradlew clean
cd ..
```

3. **Reinstall Node Modules**
```bash
rm -rf node_modules
npm install
```

4. **Clear Metro Cache and Rebuild**
```bash
npm start -- --reset-cache
```

5. **In a NEW terminal, rebuild Android**
```bash
cd Myrush-UserApp/mobile
npx react-native run-android
```

### Option 2: If Option 1 Doesn't Work

1. **Check if Firebase is properly installed**
```bash
cd Myrush-UserApp/mobile
npm list @react-native-firebase/app
```

2. **Reinstall Firebase modules**
```bash
npm uninstall @react-native-firebase/app @react-native-firebase/messaging
npm install @react-native-firebase/app @react-native-firebase/messaging
```

3. **Rebuild Android**
```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

### Option 3: Complete Clean Rebuild

1. **Stop all running processes**
   - Stop Metro bundler
   - Close any running emulators/apps

2. **Clean everything**
```bash
cd Myrush-UserApp/mobile

# Clean node modules
rm -rf node_modules
rm package-lock.json

# Clean Android
cd android
./gradlew clean
rm -rf .gradle
cd ..

# Clean Metro cache
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*
```

3. **Reinstall and rebuild**
```bash
npm install
cd android
./gradlew clean
cd ..
npx react-native run-android
```

## PowerShell Commands (For Windows)

Since you're on Windows, use these commands:

### Quick Fix
```powershell
# Stop Metro (Ctrl+C first)
cd C:\Users\ajayp\Desktop\myrush-Main-folder\Myrush-UserApp\mobile

# Clean Android
cd android
.\gradlew clean
cd ..

# Clear cache and restart
npm start -- --reset-cache
```

### In a NEW PowerShell terminal:
```powershell
cd C:\Users\ajayp\Desktop\myrush-Main-folder\Myrush-UserApp\mobile
npx react-native run-android
```

## If Firebase is Not Needed

If your app doesn't actually need Firebase (push notifications), you can remove it:

1. **Uninstall Firebase**
```bash
npm uninstall @react-native-firebase/app @react-native-firebase/messaging
```

2. **Remove Firebase imports from code**
   - Check `App.tsx` or `App.js`
   - Remove any Firebase initialization code

3. **Clean and rebuild**
```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

## Expected Result

After following these steps, the app should:
- ✅ Build successfully
- ✅ Launch without the RNFBAppModule error
- ✅ Show the login/home screen

## Common Issues

### Issue: Gradle build fails
**Solution**: Make sure you have:
- Java JDK 11 or higher installed
- Android SDK properly configured
- `ANDROID_HOME` environment variable set

### Issue: Metro bundler shows errors
**Solution**: 
```bash
npm start -- --reset-cache
```

### Issue: App still crashes
**Solution**: Check if `google-services.json` is in the correct location:
- Should be at: `android/app/google-services.json`
- If missing and Firebase is needed, download from Firebase Console

## Quick Test

After rebuild, test if the app works:
1. App should launch
2. You should see the login screen
3. Try the OTP login flow

---

**Current Status**: Your Metro bundler is running, but the Android app needs to be rebuilt with proper native modules.

**Next Step**: Follow Option 1 (Quick Fix) above.
