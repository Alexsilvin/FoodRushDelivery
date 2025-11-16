EAS build & Google Maps API key (secure setup)

This project uses Google Maps for native maps and the Directions API. To keep API keys out of source control and produce distribution-ready builds, use EAS (Expo Application Services) secrets.

1) Add the secret to EAS (cloud) before building

Install and login to EAS CLI:

```powershell
npm install -g eas-cli
eas login
```

Create the secret (replace with your real key):

```powershell
# Creates a secret named GOOGLE_MAPS_API_KEY that will be available during builds
eas secret:create --name GOOGLE_MAPS_API_KEY --value "YOUR_REAL_GOOGLE_MAPS_API_KEY"
```

2) Build an internal preview APK (cloud build)

```powershell
# This uses the `preview` profile in eas.json which produces an APK and
# injects the secret into EXPO_PUBLIC_GOOGLE_MAPS_API_KEY during the build.
eas build --platform android --profile preview
```

3) Why this is secure and how keys are used

- The secret is injected only at build time by EAS and is not stored in the repository.
- `app.config.js` reads `process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` at build time and
  injects it into native configs so the resulting APK contains the required key for
  Google Maps SDKs.
- The built APK will have the key baked into its native manifest; this is required
  for the Google Maps SDK to work. Do not commit the key to source control.

4) If you use API key restrictions

- If you restrict the key by Android application (package name + SHA-1), then the
  SHA-1 depends on the signing key used to sign the APK. For EAS-managed builds,
  EAS generates a keystore by default; you can either:
  - Upload your own keystore to EAS (so the SHA-1 matches your Google restrictions),
    or
  - After the first EAS build, retrieve the SHA-1 and add it to the key restrictions
    in Google Cloud Console.

5) Local development

- You can keep a local `.env` with a placeholder or development key, but do NOT
  commit it. The repo `.gitignore` already ignores `.env` files.
- For local native builds (`expo run:android`) you still need a local Android SDK
  and `adb` in PATH. Using EAS cloud builds avoids that requirement.

6) Troubleshooting

- If maps crash after installing the APK, check the following:
  - Google Cloud: Maps SDK for Android / iOS are enabled.
  - Directions API is enabled for the HTTP requests used by the app.
  - If you used key restrictions (package name + SHA-1), verify the SHA-1 matches the
    signing key used for the APK.

If you want, I can add a small check in `src/config/env.ts` to warn at runtime when no
valid API key is found (helpful for debugging).