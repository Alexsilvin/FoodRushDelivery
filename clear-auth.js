// Simple script to clear authentication data for development
import * as SecureStore from 'expo-secure-store';

export async function clearAuthData() {
  try {
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('user');
    console.log('Authentication data cleared');
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
}

// For development - you can call this function to reset authentication
// clearAuthData();
