export const MAP_CONFIG = {
  apiKey: 'AIzaSyAYc29K0OTxkOfBxHgJNVPrPMvkakqcr18',
  defaultRegion: {
    latitude: 40.7128,
    longitude: -74.0060,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  },
  style: 'standard',
  zoom: {
    min: 4,
    max: 20,
    default: 15
  },
  updateInterval: 30000, // 30 seconds
};

export const MAP_STYLES = {
  standard: [],  // Default style
  dark: [
    {
      elementType: 'geometry',
      stylers: [{ color: '#242f3e' }]
    },
    {
      elementType: 'labels.text.fill',
      stylers: [{ color: '#746855' }]
    }
    // Add more dark mode styles as needed
  ]
};
