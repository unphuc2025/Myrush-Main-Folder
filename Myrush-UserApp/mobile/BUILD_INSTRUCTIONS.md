# 🏗️ How to Build Your Android APK

## Option 1: Local Gradle Build (Fastest for you)

Since you have the `android` folder, you can build locally:

1. **Open Terminal** in `mobile/android` folder
2. **Run Build Command:**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```
3. **Find Your APK:**
   - Location: `mobile/android/app/build/outputs/apk/release/app-release.apk`
   - You can copy this file to your phone and install it!

## Option 2: EAS Cloud Build (Alternative)

If you want to build in the cloud (good if you don't have Android Studio installed):

1. **Run Build Command:**
   ```bash
   npx eas-cli build --platform android --profile preview
   ```
2. **Download:**
   - Expo will give you a link to download the APK when done.

## 📱 Testing Your APK

1. Transfer the APK file to your Android phone (via USB, Google Drive, WhatsApp, etc.)
2. Tap to install (enable "Install from Unknown Sources" if asked)
3. Open the app - it will work immediately with Supabase!

## ⚠️ Troubleshooting Local Build

If `./gradlew` fails:
1. Ensure you have **Java JDK 17** installed (`java -version`)
2. Ensure **Android Studio** is installed with SDKs
3. Try cleaning first:
   ```bash
   cd android
   ./gradlew clean
   ./gradlew assembleRelease
   ```
