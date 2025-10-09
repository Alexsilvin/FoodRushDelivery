// Centralized API exports
// This file organizes all API services in one place

// Core API client
export { default as apiClient } from './apiClient';

// Authentication APIs
export { authApi } from './authApi';

// Rider APIs
export { riderApi } from './riderApi';

// Delivery APIs
export { deliveryApi } from './deliveryApi';

// Restaurant APIs
export { restaurantApi } from './restaurantApi';

// Notification APIs
export { notificationApi } from './notificationApi';

// Analytics (can be added later)
// export { analyticsApi } from './analyticsApi';

// Legacy API (to be phased out)
export { 
  authAPI, 
  riderAuthAPI, 
  riderAPI, 
  analyticsAPI, 
  restaurantAPI, 
  notificationAPI 
} from './api';

// Re-export types
export type { ApiResponse, User, Delivery, RiderStatus } from '../types/api';