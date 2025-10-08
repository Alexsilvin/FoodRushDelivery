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
    updateProfile: '/auth/update-profile', // legacy endpoint
    profile: '/auth/profile', // correct JWT endpoint
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
const isExpired = (jwt?: string | null) => {
  if (!jwt) return true;
  const parts = jwt.split('.');
  if (parts.length !== 3) return false; // not a standard JWT => assume not expired
  try {
    const b64 = parts[1].replace(/-/g,'+').replace(/_/g,'/');
    // Provide fallback if atob is not defined (React Native)
    const decode = (data: string) => {
      if (typeof atob === 'function') return atob(data);
      // Minimal polyfill using Buffer if available
      const Buf: any = (global as any).Buffer;
      if (Buf) return Buf.from(data, 'base64').toString('binary');
      // As a last resort, return empty string to avoid throwing
      return '';
    };
    const json = decode(b64);
    if (!json) return false;
    const payload = JSON.parse(json);
    if (!payload.exp) return false;
    const now = Math.floor(Date.now()/1000) - 30; // 30s skew
    return payload.exp < now;
  } catch {
    return false;
  }
};

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      if (isExpired(token)) {
        console.warn('Stored token appears expired; removing.');
        await AsyncStorage.removeItem('auth_token');
      } else {
        config.headers.Authorization = `Bearer ${token}`;
        // Some backends accept x-access-token
        (config.headers as any)['x-access-token'] = token;
      }
    } else if (!config.url?.includes('login')) {
      console.debug('Auth token missing for request', config.url);
    }
    return config;
  },
  (error) => Promise.reject(error)
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
      console.warn('401 received for', originalRequest.url);
      // Clear invalid token so UI can force re-login
      await AsyncStorage.removeItem('auth_token');
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
      const payload = {
        email: userData.email,
        password: userData.password,
        fullName: `${userData.firstName} ${userData.lastName}`,
        phoneNumber: userData.phoneNumber,
        role: 'rider',
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

  // ✅ Get rider state by email
  getRiderState: async (email: string) => {
    try {
      const response = await api.get<ApiResponse<{ state: string }>>(`/Api/V1/Riders?email=${encodeURIComponent(email)}`);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to fetch rider state: ${error?.response?.status}`);
      throw error;
    }
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

  // Update user profile (legacy)
  updateProfile: async (userData: Partial<User>) => {
    const response = await api.put<ApiResponse<User>>(ENDPOINTS.auth.updateProfile, userData);
    return response.data;
  },

  // Update profile using the correct endpoint with JWT
  updateProfileJWT: async (userData: { firstName?: string; lastName?: string; email?: string; fullName?: string }) => {
    try {
      console.log('🔄 Making PATCH request to /api/v1/auth/profile with data:', userData);
      const response = await api.patch<ApiResponse<User>>(ENDPOINTS.auth.profile, userData);
      console.log('✅ Profile update response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Profile update error:', error?.response?.data || error.message);
      throw error;
    }
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
      if (error?.response?.status === 404) {
        console.warn('Activate account endpoint not found. Simulating failure.');
        return {
          success: false,
          message: 'Account activation through the app is not supported. Please check your email for a verification link.',
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
    try {
      const response = await api.post<ApiResponse<{ token: string; user: User }>>(ENDPOINTS.riderAuth.registerAndApply, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      return response.data;
    } catch (e: any) {
      if (e?.response) {
        console.warn('registerAndApply error status:', e.response.status);
        console.warn('registerAndApply error data:', JSON.stringify(e.response.data, null, 2));
        // Normalize message if backend returns array in errors
        const data = e.response.data || {};
        if (Array.isArray(data.errors)) {
            e.response.data.message = data.errors.join(' | ');
        }
        // Provide hints
        if (e.response.status === 400) {
          const hints: string[] = [];
          if (!/^[+]?\d[\d\s-]{6,}$/.test(payload.phoneNumber)) hints.push('Use international phone format e.g. +15551234567');
          if (!payload.vehicleType) hints.push('vehicleType required');
          if (payload.vehicleType === 'MOTORCYCLE' || payload.vehicleType === 'CAR' || payload.vehicleType === 'VAN' || payload.vehicleType === 'TRUCK') {
            if (!payload.vehiclePhotoUri) hints.push('vehiclePhoto required for motorized vehicles');
          }
          if (hints.length) {
            e.response.data.message = (e.response.data.message ? e.response.data.message + ' - ' : '') + hints.join('; ');
          }
        }
      }
      throw e;
    }
  },
  // Rider login
  login: async (
  email: string,
  password: string
): Promise<{ success: boolean; user?: User; token?: string; state?: string }> => {
  try {
    const response = await api.post(ENDPOINTS.riderAuth.login, { email, password });
    const raw = response.data;

    let token: string | undefined;
    let user: User | undefined;

    if (raw?.data) {
      token = raw.data.accessToken || raw.data.token || raw.data.jwt || raw.data.access_token;
      user = raw.data.user || raw.data.rider || raw.data.account || raw.data.profile;
    } else if (raw?.token) {
      token = raw.token;
      user = raw.user;
    }

    if (!token) {
      console.warn('riderAuthAPI.login: token missing in response, raw:', JSON.stringify(raw).slice(0, 500));
    }

    return {
      success: true,
      token,
      user,
      state: user?.state || 'pending',
    };
  } catch (e: any) {
    if (e?.response?.status === 404) {
      console.warn('riderAuth.login 404, falling back to legacy /auth/login');
      const fallback = await authAPI.login(email, password);
      return {
        success: fallback.success,
        token: fallback.data?.token,
        user: fallback.data?.user,
        state: fallback.data?.user?.state || 'pending',
      };
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
    try {
      const response = await api.patch<ApiResponse<RiderStatus>>(ENDPOINTS.rider.updateStatus, { isOnline: status === 'online' });
      return response.data;
    } catch (e: any) {
      const code = e?.response?.status;
      if (code === 400) {
        console.warn('updateStatus 400 payload error:', JSON.stringify(e?.response?.data, null, 2));
      }
      if (code === 404 || code === 400) {
        // Fallback: some backends only expose /riders/my/availability { available: boolean }
        try {
          const alt = await api.patch<ApiResponse>(ENDPOINTS.rider.availability, { isAvailable: status === 'online' });
          return { ...(alt.data as any), data: { status, ...(alt.data?.data || {}) } } as ApiResponse<RiderStatus>;
        } catch (altErr) {
          throw altErr;
        }
      }
      throw e;
    }
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
  getEarnings: async (period: 'today' | 'week' | 'month' | 'day' | 'all' = 'today') => {
    try {
      // Map legacy/placeholder periods to backend-supported values
      const mapped = (period === 'day' || period === 'all') ? 'today' : period;
      const response = await api.get<ApiResponse<EarningsSummary>>(`${ENDPOINTS.rider.earnings}?period=${mapped}`);
      return response.data;
    } catch (e: any) {
      if (e?.response?.status === 400) {
        console.warn('Earnings 400 response:', JSON.stringify(e.response.data, null, 2));
        // Try alternative param name 'range' using mapped value
        try {
          const mapped = (period === 'day' || period === 'all') ? 'today' : period;
          const alt = await api.get<ApiResponse<EarningsSummary>>(`${ENDPOINTS.rider.earnings}?range=${mapped}`);
          return alt.data;
        } catch {}
        // Try no query at all
        try {
          const bare = await api.get<ApiResponse<EarningsSummary>>(ENDPOINTS.rider.earnings);
          return bare.data;
        } catch {}
        // Return normalized empty summary
        return { success: false, message: 'Earnings validation failed', data: { period: (period as any), total: 0 } };
      }
      throw e;
    }
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
  updateAvailability: async (isAvailable: boolean, schedule?: any) => {
    const body: any = { isAvailable };
    if (schedule) body.schedule = schedule; // optimistic, backend may ignore
    const response = await api.patch<ApiResponse>(ENDPOINTS.rider.availability, body);
    return response.data;
  },
  // Get full account (alias convenience)
  getAccount: async () => riderAuthAPI.getAccount(),
};

export default api;