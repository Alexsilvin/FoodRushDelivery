import axios, { AxiosInstance, AxiosConfig, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiResponse, Delivery, EarningsSummary, RiderStatus, User, Restaurant } from '../types/api';

// ====================== TYPES & INTERFACES ======================

interface RequestConfig extends AxiosConfig {
  cache?: boolean;
  cacheDuration?: number;
  retries?: number;
  timeout?: number;
}

interface CacheEntry {
  data: any;
  timestamp: number;
}

interface ApiError {
  code: string;
  message: string;
  status: number;
  details?: any;
}

enum ErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN',
}

// ====================== CONSTANTS ======================

export const API_URL = 'https://foodrush-be.onrender.com/api/v1';
const REQUEST_TIMEOUT = 30000; // 30 seconds
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes default
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export const ENDPOINTS = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    me: '/auth/me',
    updateProfile: '/auth/update-profile',
    profile: '/auth/profile',
    verifyEmail: '/auth/verify-email',
    resendVerification: '/auth/resend-verification',
    activateAccount: '/auth/activate-account',
    changePassword: '/auth/change-password',
  },
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
    status: '/riders/status',
    updateStatus: '/riders/status',
    currentDeliveries: '/riders/deliveries/current',
    myDeliveries: '/deliveries/my',
    deliveryHistory: '/riders/deliveries/history',
    deliveries: (id: string) => `/riders/deliveries/${id}`,
    accept: (id: string) => `/riders/deliveries/${id}/accept`,
    start: (id: string) => `/riders/deliveries/${id}/start`,
    complete: (id: string) => `/riders/deliveries/${id}/complete`,
    earnings: '/riders/earnings',
    location: '/riders/location',
    locationMy: '/riders/my/location',
    vehicle: '/riders/vehicle',
  },
  analytics: {
    summary: '/analytics/riders/my/summary',
    balance: '/analytics/riders/my/balance',
  },
  restaurants: {
    nearby: '/restaurants/nearby',
  },
  notifications: {
    devices: '/notifications/devices',
    register: '/notifications/devices',
    unregister: (token: string) => `/notifications/devices/${token}`,
    list: '/notifications',
    unreadCount: '/notifications/unread-count',
    markAsRead: (id: string) => `/notifications/${id}/read`,
    markAllAsRead: '/notifications/mark-all-read',
  },
} as const;

// ====================== LOGGING SERVICE ======================

class Logger {
  static info(message: string, data?: any) {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data || '');
  }

  static warn(message: string, data?: any) {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data || '');
  }

  static error(message: string, error?: any) {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || '');
  }

  static debug(message: string, data?: any) {
    if (__DEV__) console.log(`[DEBUG] ${message}`, data || '');
  }
}

// ====================== CACHE SERVICE ======================

class CacheManager {
  private cache = new Map<string, CacheEntry>();

  set(key: string, data: any, duration = CACHE_DURATION) {
    this.cache.set(key, {
      data,
      timestamp: Date.now() + duration,
    });
  }

  get(key: string) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.timestamp) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  clear(pattern?: string) {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    Array.from(this.cache.keys()).forEach((key) => {
      if (key.includes(pattern)) this.cache.delete(key);
    });
  }

  getCacheKey(url: string, params?: any): string {
    return `${url}:${JSON.stringify(params || {})}`;
  }
}

// ====================== JWT SERVICE ======================

class JWTService {
  static isExpired(jwt?: string | null, skewSeconds = 30): boolean {
    if (!jwt) return true;
    const parts = jwt.split('.');
    if (parts.length !== 3) return false;

    try {
      const decoded = this.decode(jwt);
      if (!decoded?.exp) return false;
      const now = Math.floor(Date.now() / 1000) - skewSeconds;
      return decoded.exp < now;
    } catch (error) {
      Logger.error('JWT parsing error', error);
      return true;
    }
  }

  static decode(jwt: string): { exp?: number } | null {
    try {
      const parts = jwt.split('.');
      if (parts.length !== 3) return null;

      const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = this.atobPolyfill(b64);
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  private static atobPolyfill(data: string): string {
    if (typeof atob === 'function') return atob(data);
    const Buf: any = (global as any).Buffer;
    if (Buf) return Buf.from(data, 'base64').toString('binary');
    throw new Error('Unable to decode JWT');
  }
}

// ====================== ERROR HANDLER ======================

class ErrorHandler {
  static handle(error: any): ApiError {
    if (error.response) {
      return this.handleResponseError(error);
    } else if (error.code === 'ECONNABORTED') {
      return {
        code: ErrorCode.TIMEOUT,
        message: 'Request timeout',
        status: 0,
      };
    } else if (!error.response) {
      return {
        code: ErrorCode.NETWORK_ERROR,
        message: 'Network error. Please check your connection.',
        status: 0,
      };
    }

    return {
      code: ErrorCode.UNKNOWN,
      message: error.message || 'An unexpected error occurred',
      status: 0,
    };
  }

  private static handleResponseError(error: AxiosError): ApiError {
    const status = error.response?.status || 0;
    const data: any = error.response?.data;

    let code = ErrorCode.SERVER_ERROR;
    let message = data?.message || 'Server error';

    switch (status) {
      case 400:
        code = ErrorCode.VALIDATION_ERROR;
        message = this.extractValidationMessage(data);
        break;
      case 401:
        code = ErrorCode.UNAUTHORIZED;
        message = 'Unauthorized. Please login again.';
        break;
      case 403:
        code = ErrorCode.FORBIDDEN;
        message = 'Access denied.';
        break;
      case 404:
        code = ErrorCode.NOT_FOUND;
        message = 'Resource not found.';
        break;
    }

    return { code, message, status, details: data };
  }

  private static extractValidationMessage(data: any): string {
    if (data?.errors) {
      if (Array.isArray(data.errors)) {
        return data.errors.join(', ');
      }
      if (typeof data.errors === 'object') {
        return Object.entries(data.errors)
          .map(([field, msg]) => `${field}: ${Array.isArray(msg) ? msg.join(', ') : msg}`)
          .join('; ');
      }
    }
    return data?.message || 'Validation failed';
  }
}

// ====================== API SERVICE ======================

class ApiService {
  private api: AxiosInstance;
  private cache: CacheManager;
  private requestQueue: Map<string, Promise<any>> = new Map();

  constructor() {
    this.cache = new CacheManager();
    this.api = axios.create({
      baseURL: API_URL,
      timeout: REQUEST_TIMEOUT,
      headers: { 'Content-Type': 'application/json' },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('auth_token');

        if (token) {
          if (JWTService.isExpired(token)) {
            Logger.warn('Token expired, clearing storage');
            await AsyncStorage.removeItem('auth_token');
          } else {
            config.headers.Authorization = `Bearer ${token}`;
            (config.headers as any)['x-access-token'] = token;
          }
        }

        Logger.debug(`Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        Logger.error('Request interceptor error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => {
        Logger.debug(`Response: ${response.status} ${response.config.url}`);
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Handle 401 - Try token refresh first
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            Logger.warn('Received 401, attempting token refresh...');
            const refreshToken = await AsyncStorage.getItem('refresh_token');
            
            if (refreshToken) {
              // Try to refresh the token
              const refreshResponse = await this.api.post('/auth/refresh', {
                refreshToken: refreshToken
              });
              
              const newAccessToken = refreshResponse.data?.data?.accessToken;
              const newRefreshToken = refreshResponse.data?.data?.refreshToken;
              
              if (newAccessToken) {
                await AsyncStorage.setItem('auth_token', newAccessToken);
                if (newRefreshToken) {
                  await AsyncStorage.setItem('refresh_token', newRefreshToken);
                }
                
                // Update the original request with new token
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                originalRequest.headers['x-access-token'] = newAccessToken;
                
                Logger.info('✅ Token refreshed successfully, retrying original request');
                
                // Retry the original request
                return this.api(originalRequest);
              }
            }
          } catch (refreshError) {
            Logger.warn('⚠️ Token refresh failed:', refreshError);
          }
          
          // If refresh fails, clear tokens and let the error propagate
          Logger.warn('Token refresh failed, clearing auth tokens');
          await AsyncStorage.removeItem('auth_token');
          await AsyncStorage.removeItem('refresh_token');
          this.cache.clear('auth');
        }

        Logger.error(
          `API Error: ${error.response?.status} ${originalRequest.url}`,
          error.response?.data?.message || error.message
        );

        return Promise.reject(error);
      }
    );
  }

  async request<T = any>(
    method: string,
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const cacheKey = this.cache.getCacheKey(url, config?.params);
    const cfg: RequestConfig = {
      ...config,
      cache: config?.cache ?? false,
      cacheDuration: config?.cacheDuration ?? CACHE_DURATION,
      retries: config?.retries ?? MAX_RETRIES,
    };

    // Check cache for GET requests
    if (method.toUpperCase() === 'GET' && cfg.cache) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        Logger.debug(`Cache hit: ${url}`);
        return cached;
      }
    }

    // Prevent duplicate requests
    if (this.requestQueue.has(cacheKey) && method.toUpperCase() === 'GET') {
      return this.requestQueue.get(cacheKey);
    }

    const promise = this.executeRequest<T>(method, url, data, cfg);
    this.requestQueue.set(cacheKey, promise);

    try {
      const response = await promise;
      if (cfg.cache && method.toUpperCase() === 'GET') {
        this.cache.set(cacheKey, response, cfg.cacheDuration);
      }
      return response;
    } finally {
      this.requestQueue.delete(cacheKey);
    }
  }

  private async executeRequest<T = any>(
    method: string,
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    let lastError: any;

    for (let attempt = 0; attempt <= (config?.retries || MAX_RETRIES); attempt++) {
      try {
        const response = await this.api({
          method,
          url,
          data,
          ...config,
        });

        return response.data;
      } catch (error: any) {
        lastError = error;

        // Don't retry on 4xx errors (except 408, 429)
        const status = error.response?.status;
        if (status && status >= 400 && status < 500 && status !== 408 && status !== 429) {
          throw ErrorHandler.handle(error);
        }

        // Retry logic
        if (attempt < (config?.retries || MAX_RETRIES)) {
          const delay = RETRY_DELAY * Math.pow(2, attempt); // Exponential backoff
          Logger.warn(`Retry attempt ${attempt + 1}/${config?.retries} after ${delay}ms`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw ErrorHandler.handle(lastError);
  }

  get<T = any>(url: string, config?: RequestConfig) {
    return this.request<T>('GET', url, undefined, config);
  }

  post<T = any>(url: string, data?: any, config?: RequestConfig) {
    return this.request<T>('POST', url, data, config);
  }

  patch<T = any>(url: string, data?: any, config?: RequestConfig) {
    return this.request<T>('PATCH', url, data, config);
  }

  put<T = any>(url: string, data?: any, config?: RequestConfig) {
    return this.request<T>('PUT', url, data, config);
  }

  delete<T = any>(url: string, config?: RequestConfig) {
    return this.request<T>('DELETE', url, undefined, config);
  }

  clearCache(pattern?: string) {
    this.cache.clear(pattern);
  }
}

// ====================== SINGLETON INSTANCE ======================

const apiService = new ApiService();

// ====================== AUTHENTICATION API ======================

export const authAPI = {
  register: async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phoneNumber: string;
  }) => {
    try {
      const payload = {
        email: userData.email,
        password: userData.password,
        fullName: `${userData.firstName} ${userData.lastName}`,
        phoneNumber: userData.phoneNumber,
        role: 'rider',
      };

      const response = await apiService.post<{ token: string; user: User }>(
        ENDPOINTS.auth.register,
        payload
      );

      if (response.data?.token) {
        await AsyncStorage.setItem('auth_token', response.data.token);
        apiService.clearCache('auth');
      }

      return response;
    } catch (error) {
      Logger.error('Registration failed', error);
      throw error;
    }
  },

  login: async (email: string, password: string) => {
    try {
      const response = await apiService.post<{ token: string; user: User }>(
        ENDPOINTS.auth.login,
        { email, password }
      );

      if (response.data?.token) {
        await AsyncStorage.setItem('auth_token', response.data.token);
        apiService.clearCache('auth');
      }

      return response;
    } catch (error) {
      Logger.error('Login failed', error);
      throw error;
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('refresh_token');
    apiService.clearCache('auth');
    Logger.info('User logged out');
  },

  getProfile: async () => {
    return apiService.get<User>(ENDPOINTS.auth.me, { cache: true, cacheDuration: 10 * 60 * 1000 });
  },

  updateProfile: async (userData: Partial<User>) => {
    const response = await apiService.patch<User>(ENDPOINTS.auth.profile, userData);
    apiService.clearCache('auth');
    return response;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    return apiService.post(ENDPOINTS.auth.changePassword, {
      currentPassword,
      newPassword,
    });
  },
};

// ====================== RIDER AUTH API ======================

export const riderAuthAPI = {
  register: async (payload: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    email: string;
    password: string;
    phoneNumber: string;
  }) => {
    try {
      const body = {
        email: payload.email,
        password: payload.password,
        fullName: payload.fullName || `${payload.firstName || ''} ${payload.lastName || ''}`.trim(),
        phoneNumber: payload.phoneNumber,
      };

      const response = await apiService.post<{ token: string; user: User }>(
        ENDPOINTS.riderAuth.register,
        body
      );

      if (response.data?.token) {
        await AsyncStorage.setItem('auth_token', response.data.token);
      }

      return response;
    } catch (error) {
      Logger.error('Rider registration failed', error);
      throw error;
    }
  },

  login: async (email: string, password: string) => {
    try {
      const response = await apiService.post(ENDPOINTS.riderAuth.login, { email, password });

      console.log('🔑 Login response received:', {
        hasAccessToken: !!response.data?.accessToken,
        hasRefreshToken: !!response.data?.refreshToken,
        userStatus: response.data?.user?.status,
        userRole: response.data?.user?.role
      });

      const accessToken = response.data?.accessToken;
      const refreshToken = response.data?.refreshToken;
      const user = response.data?.user;

      if (accessToken) {
        await AsyncStorage.setItem('auth_token', accessToken);
        console.log('✅ Access token stored');
      }
      
      if (refreshToken) {
        await AsyncStorage.setItem('refresh_token', refreshToken);
        console.log('✅ Refresh token stored');
      }

      return {
        success: true,
        token: accessToken,
        refreshToken: refreshToken,
        user: user,
        state: user?.status || 'pending',
      };
    } catch (error) {
      Logger.error('Rider login failed', error);
      throw error;
    }
  },

  getAccount: async () => {
    try {
      const response = await apiService.get(ENDPOINTS.riderAuth.account, { cache: true });
      
      // Handle the backend response format: { status_code, message, data: RiderProfile }
      if (response.data) {
        const riderProfile = response.data;
        
        // Transform the nested structure to a flat User object
        const user: User = {
          id: riderProfile.user.id,
          email: riderProfile.user.email,
          fullName: riderProfile.user.fullName,
          phoneNumber: riderProfile.user.phoneNumber,
          firstName: riderProfile.user.fullName?.split(' ')[0] || '',
          lastName: riderProfile.user.fullName?.split(' ').slice(1).join(' ') || '',
          role: 'rider',
          state: riderProfile.state,
          vehicleType: riderProfile.vehicleType,
          isAvailable: riderProfile.isAvailable,
          vehiclePhotoUrl: riderProfile.vehiclePhotoUrl,
          idDocumentUrl: riderProfile.idDocumentUrl,
          isVerified: riderProfile.state === 'ACTIVE',
          createdAt: riderProfile.createdAt,
          updatedAt: riderProfile.updatedAt,
          // Add vehicle info if available
          vehicles: riderProfile.vehicleType ? [{
            id: '1',
            name: riderProfile.vehicleType,
            type: riderProfile.vehicleType,
            default: true
          }] : undefined
        };
        
        return {
          ...response,
          data: user
        };
      }
      
      return response;
    } catch (error) {
      Logger.error('Failed to get rider account', error);
      throw error;
    }
  },

  updateAvailability: async (isAvailable: boolean) => {
    const response = await apiService.patch(ENDPOINTS.riderAuth.availability, {
      available: isAvailable,
    });
    apiService.clearCache('rider');
    return response;
  },

  updateLocation: async (latitude: number, longitude: number) => {
    return apiService.patch(ENDPOINTS.riderAuth.location, { latitude, longitude });
  },

  refreshToken: async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiService.post('/auth/refresh', {
        refreshToken: refreshToken
      });

      const newAccessToken = response.data?.accessToken;
      const newRefreshToken = response.data?.refreshToken;

      if (newAccessToken) {
        await AsyncStorage.setItem('auth_token', newAccessToken);
        console.log('✅ Access token refreshed');
      }

      if (newRefreshToken) {
        await AsyncStorage.setItem('refresh_token', newRefreshToken);
        console.log('✅ Refresh token updated');
      }

      return {
        success: true,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      Logger.error('Token refresh failed', error);
      // Clear tokens if refresh fails
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('refresh_token');
      throw error;
    }
  },
};

// ====================== RIDER API ======================

export const riderAPI = {
  getStatus: async () => {
    return apiService.get<RiderStatus>(ENDPOINTS.rider.status, { cache: true, cacheDuration: 30 * 1000 });
  },

  updateStatus: async (status: 'online' | 'offline') => {
    const response = await apiService.patch<RiderStatus>(ENDPOINTS.rider.updateStatus, {
      isOnline: status === 'online',
    });
    apiService.clearCache('rider');
    return response;
  },

  getCurrentDeliveries: async () => {
    return apiService.get<Delivery[]>(ENDPOINTS.rider.currentDeliveries, { cache: true, cacheDuration: 30 * 1000 });
  },

  getDeliveryHistory: async (page = 1, limit = 10) => {
    return apiService.get<Delivery[]>(
      `${ENDPOINTS.rider.deliveryHistory}?page=${page}&limit=${limit}`,
      { cache: true }
    );
  },

  acceptDelivery: async (deliveryId: string) => {
    const response = await apiService.post<Delivery>(ENDPOINTS.rider.accept(deliveryId));
    apiService.clearCache('delivery');
    return response;
  },

  startDelivery: async (deliveryId: string) => {
    const response = await apiService.post<Delivery>(ENDPOINTS.rider.start(deliveryId));
    apiService.clearCache('delivery');
    return response;
  },

  completeDelivery: async (deliveryId: string) => {
    const response = await apiService.post<Delivery>(ENDPOINTS.rider.complete(deliveryId));
    apiService.clearCache('delivery');
    return response;
  },

  getEarnings: async (period: 'today' | 'week' | 'month' = 'today') => {
    return apiService.get<EarningsSummary>(`${ENDPOINTS.rider.earnings}?period=${period}`, {
      cache: true,
    });
  },

  updateLocation: async (latitude: number, longitude: number) => {
    return apiService.patch(ENDPOINTS.rider.location, { latitude, longitude });
  },

  updateVehicle: async (vehicleData: any) => {
    const response = await apiService.patch(ENDPOINTS.rider.vehicle, vehicleData);
    apiService.clearCache('rider');
    return response;
  },

  getMyDeliveries: async (limit: number = 50, offset: number = 0) => {
    return apiService.get<Delivery[]>(
      `${ENDPOINTS.rider.myDeliveries}?limit=${limit}&offset=${offset}`,
      { cache: true, cacheDuration: 30 * 1000 }
    );
  },
};

// ====================== ANALYTICS API ======================

export const analyticsAPI = {
  getSummary: async () => {
    try {
      const response = await apiService.get(ENDPOINTS.analytics.summary, {
        cache: true,
        cacheDuration: 60 * 1000, // 1 minute cache
        retries: 1 // Reduce retries for analytics to avoid long waits
      });
      
      // Handle different response structures
      if (response?.data) {
        return response;
      }
      
      // Return mock data if API fails
      console.warn('⚠️ Analytics API returned empty data, using fallback');
      return {
        success: true,
        data: {
          todayEarnings: 0,
          completedDeliveries: 0,
          rating: 0,
          completionRate: 0
        }
      };
    } catch (error: any) {
      console.warn('⚠️ Analytics summary failed, using fallback data:', error?.message);
      // Return fallback data instead of throwing
      return {
        success: false,
        data: {
          todayEarnings: 0,
          completedDeliveries: 0,
          rating: 0,
          completionRate: 0
        }
      };
    }
  },

  getBalance: async () => {
    try {
      const response = await apiService.get(ENDPOINTS.analytics.balance, {
        cache: true,
        cacheDuration: 30 * 1000, // 30 seconds cache
        retries: 1 // Reduce retries for analytics
      });
      
      // Handle different response structures
      if (response?.data) {
        return response;
      }
      
      // Return mock data if API fails
      console.warn('⚠️ Balance API returned empty data, using fallback');
      return {
        success: true,
        data: {
          balance: 0
        }
      };
    } catch (error: any) {
      console.warn('⚠️ Balance fetch failed, using fallback data:', error?.message);
      // Return fallback data instead of throwing
      return {
        success: false,
        data: {
          balance: 0
        }
      };
    }
  },
};

// ====================== RESTAURANT API ======================

export const restaurantAPI = {
  browseRestaurants: async (params: {
    nearLat: number;
    nearLng: number;
    radiusKm?: number;
    limit?: number;
    offset?: number;
    isOpen?: boolean;
  }) => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('nearLat', params.nearLat.toString());
      queryParams.append('nearLng', params.nearLng.toString());

      if (params.radiusKm !== undefined) queryParams.append('radiusKm', params.radiusKm.toString());
      if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
      if (params.offset !== undefined) queryParams.append('offset', params.offset.toString());
      if (params.isOpen !== undefined) queryParams.append('isOpen', params.isOpen.toString());

      const url = `${ENDPOINTS.restaurants.nearby}?${queryParams.toString()}`;
      const response = await apiService.get<Restaurant[]>(url, { cache: true });

      // Normalize coordinates
      if (response.data) {
        response.data = response.data.map((r) => ({
          ...r,
          latitude: typeof r.latitude === 'string' ? parseFloat(r.latitude) : r.latitude,
          longitude: typeof r.longitude === 'string' ? parseFloat(r.longitude) : r.longitude,
        }));
      }

      return response;
    } catch (error) {
      Logger.error('Failed to fetch restaurants', error);
      throw error;
    }
  },
};

// ====================== NOTIFICATION API ======================

export const notificationAPI = {
  registerDevice: async (expoToken: string, platform: string, role: string) => {
    try {
      const response = await apiService.post(ENDPOINTS.notifications.register, {
        expoToken,
        platform,
        role,
      });
      return response;
    } catch (error) {
      Logger.error('Failed to register device', error);
      throw error;
    }
  },

  unregisterDevice: async (expoToken: string) => {
    try {
      const response = await apiService.delete(ENDPOINTS.notifications.unregister(expoToken));
      return response;
    } catch (error) {
      Logger.error('Failed to unregister device', error);
      throw error;
    }
  },

  getDevices: async () => {
    try {
      const response = await apiService.get(ENDPOINTS.notifications.devices, { cache: true });
      return response;
    } catch (error) {
      Logger.error('Failed to get devices', error);
      throw error;
    }
  },

  getNotifications: async (page: number = 1, limit: number = 20) => {
    try {
      const response = await apiService.get(
        `${ENDPOINTS.notifications.list}?page=${page}&limit=${limit}`,
        { cache: true, cacheDuration: 60 * 1000 } // 1 minute cache
      );
      return response;
    } catch (error) {
      Logger.error('Failed to get notifications', error);
      throw error;
    }
  },

  getUnreadCount: async () => {
    try {
      const response = await apiService.get(ENDPOINTS.notifications.unreadCount, {
        cache: true,
        cacheDuration: 30 * 1000, // 30 seconds cache
      });
      return response;
    } catch (error) {
      Logger.error('Failed to get unread count', error);
      throw error;
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      const response = await apiService.post(ENDPOINTS.notifications.markAsRead(notificationId));
      apiService.clearCache('notifications');
      return response;
    } catch (error) {
      Logger.error('Failed to mark notification as read', error);
      throw error;
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await apiService.post(ENDPOINTS.notifications.markAllAsRead);
      apiService.clearCache('notifications');
      return response;
    } catch (error) {
      Logger.error('Failed to mark all notifications as read', error);
      throw error;
    }
  },
};

export { ApiService, Logger, ErrorHandler, ErrorCode };
export default apiService;
