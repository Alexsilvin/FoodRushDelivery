# EAS build & Google Maps API key (secure setup)

## Prerequisites

Install and login to EAS CLI:

```powershell
npm install -g eas-cli
eas login
```

## 1) Add the secret to EAS

Create the secret (replace with your real key):

```powershell
# Creates a secret named GOOGLE_MAPS_API_KEY that will be available during builds
eas secret:create --name GOOGLE_MAPS_API_KEY --value "YOUR_REAL_GOOGLE_MAPS_API_KEY"
```

## 2) Build an internal preview APK (cloud build)

```powershell
# This uses the `preview` profile in eas.json which produces an APK and
# injects the secret into EXPO_PUBLIC_GOOGLE_MAPS_API_KEY during the build.
eas build --platform android --profile preview
```

## 3) Why this is secure and how keys are used

- The secret is injected only at build time by EAS and is not stored in the repository.
- `app.config.js` reads `process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` at build time and, when present, injects it into `expo.extra` and native config. `src/config/env.ts` then reads from `process.env` or `Constants.expoConfig.extra` at runtime.
- The built APK will have the key baked into its native manifest; this is required for the Google Maps SDK to work. Do not commit the key to source control.

## 4) If you use API key restrictions

- If you restrict the key by Android apps (package name + SHA-1), then the SHA-1 depends on the signing key used to sign the APK. For EAS-managed builds, EAS generates a keystore by default; you can either:
  - Upload your own keystore (so the SHA-1 matches your existing Google restrictions), or
  - After the first EAS build, retrieve the SHA-1 and add it to the allowed credentials in Google Cloud Console.

## 5) Local development

- You can keep a local `.env` with a placeholder or development key, but do NOT commit it. The repo `.gitignore` already ignores `.env` files.
- For local native builds (`expo run:android`) you still need a local Android SDK and `adb` in PATH. Using EAS cloud builds avoids that requirement.

## 6) Troubleshooting

- If maps crash after installing the APK, check the following:
  - Google Cloud: Maps SDK for Android / iOS are enabled.
  - Directions API is enabled for the HTTP requests used by the app.
  - If you used key restrictions (package name + SHA-1), verify the SHA-1 matches the signing key used for the APK.

If you want, I can add a small check in `src/config/env.ts` to warn at runtime when no valid API key is found (helpful for debugging).

## How the API key is injected securely

- For Android: The API key is injected at build time using Gradle's `manifestPlaceholders`. The `AndroidManifest.xml` uses `${GOOGLE_MAPS_API_KEY}`, and `build.gradle` sets `manifestPlaceholders` from the `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` environment variable.
- For iOS: If needed, similar approach with Info.plist placeholders.
- This ensures the key is not hardcoded in source code, and EAS secrets provide the value at build time.
