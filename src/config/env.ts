import Constants from 'expo-constants';

interface ExtraConfig { googleMapsApiKey?: string; }

const extra = (Constants.expoConfig?.extra || {}) as ExtraConfig;

export const GOOGLE_MAPS_API_KEY = extra.googleMapsApiKey || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'DEMO_KEY';
