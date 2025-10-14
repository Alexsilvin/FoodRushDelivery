import Constants from 'expo-constants';

interface ExtraConfig { 
  googleMapsApiKey?: string; 
}

const extra = (Constants.expoConfig?.extra || {}) as ExtraConfig;

// Priority: 1) Environment variable, 2) app.json extra (legacy), 3) Fallback
export const GOOGLE_MAPS_API_KEY = 
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 
  extra.googleMapsApiKey || 
  'DEMO_KEY';
