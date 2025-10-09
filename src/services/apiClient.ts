import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL for the API
export const API_URL = 'https://foodrush-be.onrender.com/api/v1';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds timeout
});

// JWT token validation helper
const isTokenExpired = (token: string): boolean => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    const now = Math.floor(Date.now() / 1000);
    
    return payload.exp < now;
  } catch {
    return true;
  }
};

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      
      if (token && !isTokenExpired(token)) {
        config.headers.Authorization = `Bearer ${token}`;
      } else if (token && isTokenExpired(token)) {
        // Token expired, remove it
        await AsyncStorage.removeItem('auth_token');
        console.warn('🔑 Auth token expired and removed');
      }
    } catch (error) {
      console.warn('⚠️ Failed to get auth token:', error);
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling common errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Clear invalid token
      await AsyncStorage.removeItem('auth_token');
      console.warn('🔑 401 received, auth token cleared');
      
      // You could trigger a logout action here if needed
      // For now, just let the error propagate
    }
    
    // Log API errors for debugging
    if (error.response) {
      console.error(`🚨 API Error: ${error} - ${error.response.data?.message || error.message}`);
    } else if (error.request) {
      console.error('🌐 Network Error: No response received');
    } else {
      console.error('⚠️ Request Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
