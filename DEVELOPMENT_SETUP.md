# Development Setup Guide

## Location Permissions Issue

If you're seeing this error:
```
❌ [INIT_ERROR] One of the `NSLocation*UsageDescription` keys must be present in Info.plist to be able to use geolocation.
```

This means you need to create a **development build** instead of using Expo Go.

## Quick Fix

### Option 1: Create Development Build (Recommended)

1. **Install dependencies:**
   ```bash
   npx expo install --fix
   ```

2. **Prebuild the project:**
   ```bash
   npx expo prebuild
   ```

3. **Run on device:**
   ```bash
   # For iOS
   npx expo run:ios
   
   # For Android
   npx expo run:android
   ```

### Option 2: Use EAS Build (Cloud Build)

1. **Install EAS CLI:**
   ```bash
   npm install -g @expo/eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

3. **Configure EAS:**
   ```bash
   eas build:configure
   ```

4. **Build for development:**
   ```bash
   # For iOS
   eas build --platform ios --profile development
   
   # For Android
   eas build --platform android --profile development
   ```

## Why This Happens

- **Expo Go** has limitations with native permissions
- **Location services** require native iOS/Android permissions
- **Development builds** include all native configurations
- **app.json** permissions only work in development/production builds

## What's Already Configured

✅ **iOS Location Permissions** in `app.json`:
- `NSLocationWhenInUseUsageDescription`
- `NSLocationAlwaysAndWhenInUseUsageDescription` 
- `NSLocationAlwaysUsageDescription`

✅ **Android Location Permissions**:
- `ACCESS_FINE_LOCATION`
- `ACCESS_COARSE_LOCATION`
- `ACCESS_BACKGROUND_LOCATION`

✅ **Background Location** enabled for both platforms

✅ **expo-location plugin** properly configured

## Testing Location Features

Once you have a development build:

1. **Grant location permissions** when prompted
2. **Enable background location** for delivery tracking
3. **Test in different scenarios:**
   - App in foreground
   - App in background
   - Device location services on/off

## Troubleshooting

### Permission Denied
- Check device location services are enabled
- Grant permissions in device settings
- Restart the app after granting permissions

### Still Not Working
- Clean build: `npx expo prebuild --clean`
- Clear cache: `npx expo start --clear`
- Reinstall dependencies: `rm -rf node_modules && npm install`

## Production Builds

For production builds, use:
```bash
# iOS App Store
eas build --platform ios --profile production

# Android Play Store  
eas build --platform android --profile production
```

The location permissions will work automatically in production builds.