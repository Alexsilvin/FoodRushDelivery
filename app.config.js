const { ExpoConfig } = require('@expo/config');
const fs = require('fs');
const path = require('path');

// Load .env for local development (if present)
try {
  require('dotenv').config();
} catch (e) {
  // dotenv may not be installed in all environments — that's fine
}

// Read app.json to preserve current config
const appJsonPath = path.resolve(__dirname, 'app.json');
let appJson = {};
try {
  appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
} catch (e) {
  console.warn('Could not read app.json, falling back to minimal config');
  appJson = { expo: {} };
}

const expo = appJson.expo || {};

// Ensure EAS projectId is present when running builds locally so the CLI
// can link the local repo to the EAS project. This value was detected
// during an attempted build and is safe to set here (it's not a secret).
expo.extra = Object.assign({}, expo.extra || {}, { eas: { projectId: '426d0b7d-9f04-4fb3-ace5-9ec5b7503c1b' } });

// Prefer environment variable (EXPO_PUBLIC_GOOGLE_MAPS_API_KEY) then fallback to existing extra.googleMapsApiKey
const googleKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || (expo.extra && expo.extra.googleMapsApiKey) || null;

// Inject native google maps keys and expose on extra for runtime (only when present)
if (googleKey) {
  expo.extra = Object.assign({}, expo.extra || {}, { googleMapsApiKey: googleKey });

  // Android native config
  expo.android = Object.assign({}, expo.android || {});
  expo.android.config = Object.assign({}, expo.android.config || {}, {
    googleMaps: {
      apiKey: googleKey,
    },
  });

  // iOS native config
  expo.ios = Object.assign({}, expo.ios || {});
  expo.ios.config = Object.assign({}, expo.ios.config || {}, {
    googleMapsApiKey: googleKey,
  });
} else {
  // Keep existing extras if any, but do not inject empty native keys.
  expo.extra = Object.assign({}, expo.extra || {});
}

module.exports = {
  expo,
};
