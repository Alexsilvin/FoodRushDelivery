# EAS Build & Google Maps API Key - Quick Reference

> 📖 **For complete setup instructions, see [GOOGLE_MAPS_API_SETUP.md](./GOOGLE_MAPS_API_SETUP.md)**

## Quick Start

### 1. Install & Login to EAS

```bash
npm install -g eas-cli
eas login
```

### 2. Create EAS Secret

```bash
eas secret:create --scope project --name GOOGLE_MAPS_API_KEY --value "YOUR_ACTUAL_API_KEY"
```

### 3. Verify Secret

```bash
eas secret:list
```

### 4. Build Your App

```bash
# Android Preview (APK)
eas build --platform android --profile preview

# iOS Preview
eas build --platform ios --profile preview

# Production
eas build --platform android --profile production
eas build --platform ios --profile production
```

---

## How It Works

1. **EAS Secrets** store your API key securely (not in git)
2. **`eas.json`** references the secret with `@GOOGLE_MAPS_API_KEY`
3. **Build time**: EAS injects the secret into `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`
4. **`app.config.js`** reads the environment variable and configures native apps
5. **Runtime**: App reads from `Constants.expoConfig.extra.googleMapsApiKey`

---

## Project Configuration Status

✅ **Your project is properly configured!**

- ✓ `eas.json` - All profiles reference `@GOOGLE_MAPS_API_KEY`
- ✓ `app.config.js` - Dynamically injects key into native configs
- ✓ `src/config/env.ts` - Runtime configuration with fallbacks
- ✓ `.gitignore` - Excludes `.env` files from git
- ✓ `.env.example` - Template for local development

---

## Local Development

For local development, create a `.env` file (already in `.gitignore`):

```bash
# .env (local only - NOT committed)
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_development_key_here
```

---

## Troubleshooting

### Maps don't load

```bash
# Check secret exists
eas secret:list

# Recreate if needed
eas secret:delete --name GOOGLE_MAPS_API_KEY
eas secret:create --scope project --name GOOGLE_MAPS_API_KEY --value "YOUR_KEY"

# Rebuild with clean cache
eas build --platform android --profile preview --clear-cache
```

### Get SHA-1 for API Key Restrictions

```bash
eas credentials
# Select: Android → Production → Keystore → View
# Copy the SHA-1 fingerprint and add to Google Cloud Console
```

---

## Important Notes

### Security
- **Never commit API keys to git**
- Use EAS Secrets for production builds
- Restrict keys in Google Cloud Console by package name + SHA-1

### Google Cloud Console
Enable these APIs:
- Maps SDK for Android
- Maps SDK for iOS
- Directions API
- Geocoding API

### Package/Bundle IDs
- Android: `food.rush.delivery.driver.app`
- iOS: `food.rush.delivery.driver.app`

---

## Complete Documentation

For detailed instructions, troubleshooting, and best practices:

👉 **[GOOGLE_MAPS_API_SETUP.md](./GOOGLE_MAPS_API_SETUP.md)**

---

**EAS Project ID:** `bacdb34b-93c0-41c5-b664-b6705bc0b105`
