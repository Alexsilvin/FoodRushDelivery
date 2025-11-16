import Constants from 'expo-constants';

interface ExtraConfig {
  googleMapsApiKey?: string;
}

const extra = (Constants.expoConfig?.extra || {}) as ExtraConfig;

// Priority: 1) Environment variable (build-time), 2) app.json / app.config.js extra, 3) Fallback
export const GOOGLE_MAPS_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  extra.googleMapsApiKey ||
  'DEMO_KEY';

// Helpful runtime warning if the app is running without a real API key.
if (
  typeof GOOGLE_MAPS_API_KEY === 'string' &&
  (GOOGLE_MAPS_API_KEY === 'DEMO_KEY' || GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY_HERE')
) {
  // Keep the message short and actionable for developers.
  // In production EAS builds the key should be injected via secrets.
  // eslint-disable-next-line no-console
  console.warn(
    '[Config] Google Maps API key is missing or using placeholder.\n' +
      'Add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY to a local .env for development (ignored by git),\n' +
      'and create an EAS secret named GOOGLE_MAPS_API_KEY for cloud builds.'
  );
}
