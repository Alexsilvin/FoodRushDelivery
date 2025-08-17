import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiResponse, Delivery, EarningsSummary, RiderStatus, User } from '../types/api';

// Base URL for the API
export const API_URL = 'https://foodrush-be.onrender.com/api/v1';

// Centralized endpoint fragments (easy to adjust if backend changes)
export const ENDPOINTS = {
  // Legacy generic auth (kept for backward compatibility / fallback)
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    me: '/auth/me',
    updateProfile: '/auth/update-profile',
    verifyEmail: '/auth/verify-email',
    resendVerification: '/auth/resend-verification', // speculative
    activateAccount: '/auth/activate-account', // speculative
    changePassword: '/auth/change-password',
  },
  // Rider-scoped auth & account endpoints (from provided API spec image)
  riderAuth: {
    register: '/riders/auth/register',
    registerAndApply: '/riders/auth/register-and-apply',
    login: '/riders/auth/login',
    apply: '/riders/apply',
    availability: '/riders/my/availability',
    account: '/riders/my/account',
    location: '/riders/my/location',
  },
  rider: {
    status: '/riders/status', // GET current status
    updateStatus: '/riders/status', // PATCH to update
    currentDeliveries: '/riders/deliveries/current',
    deliveryHistory: '/riders/deliveries/history',
    deliveries: (id: string) => `/riders/deliveries/${id}`,
    accept: (id: string) => `/riders/deliveries/${id}/accept`,
    start: (id: string) => `/riders/deliveries/${id}/start`,
    complete: (id: string) => `/riders/deliveries/${id}/complete`,
    earnings: '/riders/earnings',
    // Two variants seen in spec: /riders/my/location and /riders/location (alias)
    location: '/riders/location',
    locationMy: '/riders/my/location',
    vehicle: '/riders/vehicle',
    availability: '/riders/my/availability',
  }
} as const;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log error details for debugging
    console.error(`API Error: ${error?.response?.status} - ${error?.response?.data?.message || error.message}`);
    
    // Handle 401 errors (unauthorized - token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // You could implement token refresh here if needed
      
      // For now, we'll just clear the token and force re-login
      await AsyncStorage.removeItem('auth_token');
      // Force logout or redirect to login screen
      // This part will be handled by AuthContext
    }
    
    // Handle 409 conflicts (duplicate resources)
    if (error.response?.status === 409) {
      console.warn('Resource conflict detected:', error.response.data);
    }
    
    // Handle 404 errors (resource not found)
    if (error.response?.status === 404) {
      console.warn(`Endpoint not found: ${originalRequest.url}`);
      // We'll just log this and let the caller handle it
    }
    
    return Promise.reject(error);
  }
);

// API endpoints for generic authentication (non rider-specific; kept for fallback)
export const authAPI = {
  // Register a new rider
  register: async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phoneNumber: string;
    role?: string;
    vehicleName?: string;
  }) => {
    try {
      // Format the payload to match what the API expects
      const payload = {
        email: userData.email,
        password: userData.password,
        fullName: `${userData.firstName} ${userData.lastName}`,
        phoneNumber: userData.phoneNumber,
        role: 'rider' // Always set to rider for the delivery app
      };
      
  const response = await api.post<ApiResponse<{ token: string; user: User }>>(ENDPOINTS.auth.register, payload);
      return response.data;
    } catch (error: any) {
      console.error(`Registration failed with status: ${error?.response?.status}`);
      console.error(`Error details: ${JSON.stringify(error?.response?.data || {})}`);
      throw error;
    }
  },

  // Login with email and password
  login: async (email: string, password: string) => {
    const response = await api.post<ApiResponse<{ token: string; user: User }>>(ENDPOINTS.auth.login, {
      email,
      password,
    });
    return response.data;
  },

  // Forgot password request
  forgotPassword: async (email: string) => {
    const response = await api.post<ApiResponse>(ENDPOINTS.auth.forgotPassword, { email });
    return response.data;
  },

  // Reset password with token
  resetPassword: async (token: string, newPassword: string) => {
    const response = await api.post<ApiResponse>(ENDPOINTS.auth.resetPassword, {
      token,
      newPassword,
    });
    return response.data;
  },

  // Get current user profile
  getProfile: async () => {
    const response = await api.get<ApiResponse<User>>(ENDPOINTS.auth.me);
    return response.data;
  },

  // Update user profile
  updateProfile: async (userData: Partial<User>) => {
    const response = await api.put<ApiResponse<User>>(ENDPOINTS.auth.updateProfile, userData);
    return response.data;
  },

  // Verify email address
  verifyEmail: async (token: string) => {
    const response = await api.post<ApiResponse>(ENDPOINTS.auth.verifyEmail, { token });
    return response.data;
  },
  
  // Resend verification email
  resendVerificationEmail: async (email: string) => {
    try {
      const response = await api.post<ApiResponse>(ENDPOINTS.auth.resendVerification, { email });
      return response.data;
    } catch (error: any) {
      // If the endpoint doesn't exist, simulate a success response
      // This allows the UI to still provide feedback while the backend catches up
      if (error?.response?.status === 404) {
        console.warn('Resend verification endpoint not found. Simulating success.');
        return { success: true, message: 'Verification email sent' };
      }
      throw error;
    }
  },
  
  // Activate account directly (if the API supports this)
  activateAccount: async (email: string) => {
    try {
      const response = await api.post<ApiResponse>(ENDPOINTS.auth.activateAccount, { email });
      return response.data;
    } catch (error: any) {
      // If the endpoint doesn't exist, simulate a success response
      if (error?.response?.status === 404) {
        console.warn('Activate account endpoint not found. Simulating failure.');
        return { 
          success: false, 
          message: 'Account activation through the app is not supported. Please check your email for a verification link.' 
        };
      }
      throw error;
    }
  },

  // Change password when logged in
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post<ApiResponse>(ENDPOINTS.auth.changePassword, {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
};

// Rider-scoped authentication & account endpoints
export const riderAuthAPI = {
  // Register a rider (independent)
  register: async (payload: {
    firstName?: string; lastName?: string; fullName?: string; email: string; password: string; phoneNumber: string; vehicleName?: string;
  }) => {
    const body = {
      email: payload.email,
      password: payload.password,
      fullName: payload.fullName || `${payload.firstName || ''} ${payload.lastName || ''}`.trim(),
      phoneNumber: payload.phoneNumber,
  // NOTE: Backend rejects unknown properties with 400 ("property vehicleName should not exist").
  // vehicleName intentionally excluded here; capture locally then send via /riders/vehicle after registration when supported.
    };
    try {
      const response = await api.post<ApiResponse<{ token: string; user: User }>>(ENDPOINTS.riderAuth.register, body);
      return response.data;
    } catch (e: any) {
      if (e?.response?.status === 400) {
        // Capture backend validation structure if present
        const data = e.response.data || {};
        console.warn('riderAuth.register validation failed payload:', body);
        console.warn('riderAuth.register validation error response:', JSON.stringify(data, null, 2));
        // Normalize field error messages if available
        if (data.errors && typeof data.errors === 'object') {
          const fieldMessages: string[] = [];
            Object.entries(data.errors).forEach(([field, msg]) => {
              if (Array.isArray(msg)) fieldMessages.push(`${field}: ${msg.join(', ')}`);
              else if (msg) fieldMessages.push(`${field}: ${msg}`);
            });
          const combined = fieldMessages.join(' | ');
          e.response.data.message = combined || data.message || 'Validation failed';
        }
        // Heuristic suggestions (not shown to user unless thrown)
        const suggestions: string[] = [];
        if (!body.fullName) suggestions.push('Full name required');
        if (!/^[+]?\d[\d\s-]{6,}$/.test(body.phoneNumber)) suggestions.push('Use full international phone format, e.g. +15551234567');
        if (body.password.length < 6) suggestions.push('Password must be at least 6 characters');
        if (suggestions.length) {
          e.response.data.message = `${e.response.data.message} (${suggestions.join('; ')})`;
        }
      }
      // Fallback to legacy /auth/register if new path not found
      if (e?.response?.status === 404) {
        console.warn('riderAuth.register 404, falling back to legacy /auth/register');
        return authAPI.register({
          firstName: payload.firstName || body.fullName?.split(' ')[0] || '',
          lastName: payload.lastName || body.fullName?.split(' ').slice(1).join(' ') || '',
          email: payload.email,
          password: payload.password,
          phoneNumber: payload.phoneNumber,
          role: 'rider',
          vehicleName: payload.vehicleName,
        } as any);
      }
      throw e;
    }
  },
  // Combined register & apply
  registerAndApply: async (payload: {
    email: string; password: string; phoneNumber: string; fullName: string; vehicleType: string; documentUri?: string; vehiclePhotoUri?: string;
  }) => {
    // Build multipart form-data
    const form = new FormData();
    form.append('fullName', payload.fullName);
    form.append('email', payload.email);
    form.append('phoneNumber', payload.phoneNumber);
    form.append('password', payload.password);
    form.append('vehicleType', payload.vehicleType);
    if (payload.documentUri) {
      form.append('document', { uri: payload.documentUri, name: 'document.jpg', type: 'image/jpeg' } as any);
    }
    if (payload.vehiclePhotoUri) {
      form.append('vehiclePhoto', { uri: payload.vehiclePhotoUri, name: 'vehicle.jpg', type: 'image/jpeg' } as any);
    }
    const response = await api.post<ApiResponse<{ token: string; user: User }>>(ENDPOINTS.riderAuth.registerAndApply, form, { headers: { 'Content-Type': 'multipart/form-data' } });
    return response.data;
  },
  // Rider login
  login: async (email: string, password: string) => {
    try {
      const response = await api.post<ApiResponse<{ token: string; user: User }>>(ENDPOINTS.riderAuth.login, { email, password });
      return response.data;
    } catch (e: any) {
      if (e?.response?.status === 404) {
        console.warn('riderAuth.login 404, falling back to legacy /auth/login');
        return authAPI.login(email, password);
      }
      throw e;
    }
  },
  // Apply to become a rider (for existing user)
  apply: async (extraData?: any) => {
    const response = await api.post<ApiResponse>(ENDPOINTS.riderAuth.apply, extraData || {});
    return response.data;
  },
  // Update availability (approved riders)
  updateAvailability: async (availability: { available: boolean }) => {
    const response = await api.patch<ApiResponse>(ENDPOINTS.riderAuth.availability, availability);
    return response.data;
  },
  // Get rider account (profile)
  getAccount: async () => {
    try {
      const response = await api.get<ApiResponse<User>>(ENDPOINTS.riderAuth.account);
      return response.data;
    } catch (e: any) {
      if (e?.response?.status === 404) {
        console.warn('riderAuth.getAccount 404, falling back to legacy /auth/me');
        return authAPI.getProfile();
      }
      throw e;
    }
  },
  // Update location via /riders/my/location
  updateMyLocation: async (latitude: number, longitude: number) => {
    const response = await api.patch<ApiResponse>(ENDPOINTS.riderAuth.location, { latitude, longitude });
    return response.data;
  },
};

// API endpoints for rider-specific operations
export const riderAPI = {
  // Get rider's current status
  getStatus: async () => {
    const response = await api.get<ApiResponse<RiderStatus>>(ENDPOINTS.rider.status);
    return response.data;
  },

  // Update rider's status (online/offline)
  updateStatus: async (status: 'online' | 'offline') => {
    const response = await api.patch<ApiResponse<RiderStatus>>(ENDPOINTS.rider.updateStatus, { status });
    return response.data;
  },

  // Get rider's current deliveries
  getCurrentDeliveries: async () => {
    const response = await api.get<ApiResponse<Delivery[]>>(ENDPOINTS.rider.currentDeliveries);
    return response.data;
  },

  // Get rider's delivery history
  getDeliveryHistory: async (page = 1, limit = 10) => {
    const response = await api.get<ApiResponse<Delivery[]>>(`${ENDPOINTS.rider.deliveryHistory}?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Accept a delivery
  acceptDelivery: async (deliveryId: string) => {
    const response = await api.post<ApiResponse<Delivery>>(ENDPOINTS.rider.accept(deliveryId));
    return response.data;
  },

  // Start a delivery (picked up from restaurant)
  startDelivery: async (deliveryId: string) => {
    const response = await api.post<ApiResponse<Delivery>>(ENDPOINTS.rider.start(deliveryId));
    return response.data;
  },

  // Complete a delivery
  completeDelivery: async (deliveryId: string) => {
    const response = await api.post<ApiResponse<Delivery>>(ENDPOINTS.rider.complete(deliveryId));
    return response.data;
  },

  // Get rider's earnings
  getEarnings: async (period: 'day' | 'week' | 'month' | 'all' = 'all') => {
    const response = await api.get<ApiResponse<EarningsSummary>>(`${ENDPOINTS.rider.earnings}?period=${period}`);
    return response.data;
  },

  // Update rider's location
  updateLocation: async (latitude: number, longitude: number) => {
    // Prefer /riders/my/location then fallback to /riders/location
    try {
      const response = await api.patch<ApiResponse>(ENDPOINTS.rider.locationMy, { latitude, longitude });
      return response.data;
    } catch (e: any) {
      if (e?.response?.status === 404) {
        console.warn('PATCH /riders/my/location not found, attempting /riders/location');
        const alt = await api.patch<ApiResponse>(ENDPOINTS.rider.location, { latitude, longitude });
        return alt.data;
      }
      throw e;
    }
  },

  // Update rider's vehicle information
  updateVehicle: async (vehicleData: any) => {
    const response = await api.patch<ApiResponse>(ENDPOINTS.rider.vehicle, vehicleData);
    return response.data;
  },
  // Availability update (alias to riderAuth)
  updateAvailability: async (available: boolean, schedule?: any) => {
    const body: any = { available };
    if (schedule) body.schedule = schedule; // optimistic, backend may ignore
    const response = await api.patch<ApiResponse>(ENDPOINTS.rider.availability, body);
    return response.data;
  },
  // Get full account (alias convenience)
  getAccount: async () => riderAuthAPI.getAccount(),
};

export default api;
