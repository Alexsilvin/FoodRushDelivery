// Centralized API exports
// Production-ready service organization

// Core API client
export { default as apiClient } from './apiClient';

// ====================== SERVICES ======================

// Authentication Service
export { authService } from './authService';

// Rider Service
export { riderService } from './riderService';

// Delivery Service
export { deliveryService } from './deliveryService';

// Analytics Service
export { analyticsService } from './analyticsService';

// Restaurant Service
export { restaurantApi as restaurantService } from './restaurantApi';

// Notification Service
export { notificationService } from './notificationService';

// Location Service (utility)
export { default as locationService } from './locationService';

// ====================== TYPES ======================

// Re-export types
export type { 
  ApiResponse, 
  User, 
  Delivery, 
  RiderStatus, 
  Restaurant,
  RegisterAndApplyResponse,
  RegisterAndApplyRequest
} from '../types/api';

// Legacy API file has been removed - all functionality migrated to new services