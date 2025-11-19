# Google Maps API Key Setup with EAS Secrets

## 📋 Overview

This document explains how to properly configure Google Maps API keys for the Food Rush Delivery Driver app using **EAS Secrets** (recommended for production) instead of environment files.

---

## ✅ Current Project Status

Your project is **WELL CONFIGURED** to use EAS Secrets! Here's what's already set up:

### ✓ Properly Configured Files

1. **`eas.json`** - All build profiles reference EAS Secret
   ```json
   "env": {
     "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY": "@GOOGLE_MAPS_API_KEY"
   }
   ```
   The `@` prefix tells EAS to inject the secret at build time.

2. **`app.config.js`** - Dynamic configuration that reads from environment
   - Reads `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` at build time
   - Injects into both Android and iOS native configs
   - Falls back gracefully if key is missing

3. **`src/config/env.ts`** - Runtime configuration with validation
   - Reads from environment variable or expo config
   - Provides helpful warnings if key is missing
   - Uses fallback for development

4. **`.gitignore`** - Properly excludes sensitive files
   - `.env` files are ignored ✓
   - No API keys will be committed ✓

---

## 🚀 Setup Instructions

### Step 1: Install EAS CLI (if not already installed)

```bash
npm install -g eas-cli
```

Verify installation:
```bash
eas --version
```

### Step 2: Login to EAS

```bash
eas login
```

Use your Expo account credentials. If you don't have an account, create one at https://expo.dev

### Step 3: Create the EAS Secret

**IMPORTANT:** Replace `YOUR_ACTUAL_GOOGLE_MAPS_API_KEY` with your real API key from Google Cloud Console.

```bash
eas secret:create --scope project --name GOOGLE_MAPS_API_KEY --value "YOUR_ACTUAL_GOOGLE_MAPS_API_KEY" --type string
```

**Explanation:**
- `--scope project` - Secret is available only for this project
- `--name GOOGLE_MAPS_API_KEY` - Must match the name in `eas.json` (without `@`)
- `--value` - Your actual Google Maps API key
- `--type string` - Specifies the secret type

### Step 4: Verify the Secret

```bash
eas secret:list
```

You should see `GOOGLE_MAPS_API_KEY` in the list.

### Step 5: Build Your App

**For Android (Preview/Testing):**
```bash
eas build --platform android --profile preview
```

**For iOS (Preview/Testing):**
```bash
eas build --platform ios --profile preview
```

**For Production:**
```bash
eas build --platform android --profile production
eas build --platform ios --profile production
```

---

## 🔧 Local Development Setup

For local development (running with `expo start` or `npx expo run:android`), you need a local `.env` file:

### Create `.env` file (NOT committed to git)

```bash
# .env (local development only - DO NOT COMMIT)
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_DEVELOPMENT_API_KEY
```

**Important Notes:**
- This file is already in `.gitignore` and won't be committed
- Use a **development/restricted** API key for local testing
- For production builds, EAS Secrets will override this value

### Alternative: Use `.env.example` as template

```bash
cp .env.example .env
# Then edit .env and add your development key
```

---

## 🔐 Security Best Practices

### ✅ DO:
- ✓ Store production API keys in EAS Secrets
- ✓ Use API key restrictions in Google Cloud Console
- ✓ Keep `.env` in `.gitignore`
- ✓ Use different keys for development and production
- ✓ Restrict keys by package name and SHA-1 fingerprint

### ❌ DON'T:
- ✗ Commit API keys to git
- ✗ Share API keys in chat/email
- ✗ Use production keys for local development
- ✗ Leave API keys unrestricted in Google Cloud Console

---

## 🗑️ Cleanup: Remove Unnecessary Setup

### Files to Clean Up

1. **Remove hardcoded keys from `.env`**

Your current `.env` file contains actual API keys that should be removed:

```bash
# BEFORE (INSECURE - has real keys)
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCf4_DeX2v798-3tYxYK5QtecoHTreMWgU

# AFTER (SECURE - placeholder only)
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_development_key_here
```

**Action Required:** Edit `.env` and replace the real key with a placeholder or your development key.

2. **Optional: Remove dotenv dependency**

The project tries to load `dotenv` in `app.config.js`, but it's not installed as a dependency. This is fine because:
- Expo automatically loads `.env` files
- The try/catch handles the missing package gracefully

**No action needed** - the current setup works correctly.

---

## 🔍 How It Works

### Build Time (EAS Cloud Builds)

1. EAS reads `eas.json` and sees `@GOOGLE_MAPS_API_KEY`
2. EAS injects the secret value into `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` environment variable
3. `app.config.js` reads the environment variable and configures:
   - Android: `expo.android.config.googleMaps.apiKey`
   - iOS: `expo.ios.config.googleMapsApiKey`
   - Runtime: `expo.extra.googleMapsApiKey`
4. The key is baked into the native app bundle

### Runtime (App Execution)

1. `src/config/env.ts` reads the key from:
   - `process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` (build-time injection)
   - `Constants.expoConfig.extra.googleMapsApiKey` (from app.config.js)
   - Falls back to `'DEMO_KEY'` with a warning
2. `src/config/maps.ts` uses the key for map configuration
3. `MapScreen.tsx` uses the key for Google Maps Directions API

---

## 🎯 Google Cloud Console Setup

### 1. Create/Get Your API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable these APIs:
   - **Maps SDK for Android**
   - **Maps SDK for iOS**
   - **Directions API**
   - **Geocoding API** (if used)
4. Go to **Credentials** → **Create Credentials** → **API Key**

### 2. Restrict Your API Key (IMPORTANT!)

**Application Restrictions:**

For Android:
- Restriction type: **Android apps**
- Package name: `food.rush.delivery.driver.app`
- SHA-1 fingerprint: Get from EAS build or your keystore

For iOS:
- Restriction type: **iOS apps**
- Bundle ID: `food.rush.delivery.driver.app`

**API Restrictions:**
- Restrict key to only these APIs:
  - Maps SDK for Android
  - Maps SDK for iOS
  - Directions API
  - Geocoding API

### 3. Get SHA-1 Fingerprint for Android

**For EAS builds:**
```bash
# After your first EAS build
eas credentials
# Select Android → Production → Keystore → View
# Copy the SHA-1 fingerprint
```

**For local builds:**
```bash
# If you have a local keystore
keytool -list -v -keystore your-keystore.jks -alias your-key-alias
```

---

## 🧪 Testing Your Setup

### 1. Verify Local Development

```bash
expo start
# or
npx expo run:android
```

Check the console for warnings about missing API keys.

### 2. Verify EAS Build

```bash
eas build --platform android --profile preview
```

After the build completes:
1. Download and install the APK
2. Open the app and navigate to the Map screen
3. Verify that maps load correctly
4. Test navigation/directions functionality

### 3. Check for Warnings

Look for this warning in the console (means key is missing):
```
[Config] Google Maps API key is missing or using placeholder.
Add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY to a local .env for development (ignored by git),
and create an EAS secret named GOOGLE_MAPS_API_KEY for cloud builds.
```

---

## 🐛 Troubleshooting

### Maps don't load in the app

**Possible causes:**
1. API key not set in EAS Secrets
2. Google Maps SDK not enabled in Cloud Console
3. API key restrictions don't match app package/bundle ID
4. SHA-1 fingerprint doesn't match signing key

**Solutions:**
```bash
# Check if secret exists
eas secret:list

# Recreate secret if needed
eas secret:delete --name GOOGLE_MAPS_API_KEY
eas secret:create --scope project --name GOOGLE_MAPS_API_KEY --value "YOUR_KEY"

# Rebuild the app
eas build --platform android --profile preview --clear-cache
```

### "API key not valid" error

1. Verify the key in Google Cloud Console
2. Check API restrictions match enabled APIs
3. Verify package name/bundle ID restrictions
4. Wait 5-10 minutes after creating/updating key (propagation delay)

### Local development works but EAS build doesn't

1. Verify EAS secret is created: `eas secret:list`
2. Check `eas.json` has correct reference: `@GOOGLE_MAPS_API_KEY`
3. Rebuild with cache cleared: `eas build --clear-cache`

---

## 📝 Summary Checklist

- [ ] Install EAS CLI: `npm install -g eas-cli`
- [ ] Login to EAS: `eas login`
- [ ] Create Google Maps API key in Cloud Console
- [ ] Enable required APIs (Maps SDK, Directions API)
- [ ] Restrict API key by package name and SHA-1
- [ ] Create EAS Secret: `eas secret:create --scope project --name GOOGLE_MAPS_API_KEY --value "YOUR_KEY"`
- [ ] Verify secret: `eas secret:list`
- [ ] Clean up `.env` file (remove hardcoded production keys)
- [ ] Create local `.env` with development key (optional)
- [ ] Build with EAS: `eas build --platform android --profile preview`
- [ ] Test the app and verify maps work

---

## 🔗 Additional Resources

- [EAS Secrets Documentation](https://docs.expo.dev/build-reference/variables/#using-secrets-in-environment-variables)
- [Google Maps Platform](https://console.cloud.google.com/google/maps-apis)
- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
- [React Native Maps Documentation](https://github.com/react-native-maps/react-native-maps)

---

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review EAS build logs: `eas build:list`
3. Check Google Cloud Console for API usage/errors
4. Verify all APIs are enabled and billing is set up (if required)

---

**Last Updated:** 2024-12-19
**Project:** Food Rush Delivery Driver Mobile App
**EAS Project ID:** bacdb34b-93c0-41c5-b664-b6705bc0b105
