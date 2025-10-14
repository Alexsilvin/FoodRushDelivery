import apiClient from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiResponse, User, RiderStatus, Delivery } from '../types/api';

/**
 * Rider Service
 * Handles all rider-related API calls
 */
export const riderService = {
  // ====================== AUTHENTICATION ======================
  
  /**
   * Register a rider and submit application in one step
   * POST /api/v1/riders/auth/register-and-apply
   */
  registerAndApply: async (formData: FormData): Promise<{
    user: User;
    accessToken: string;
    refreshToken: string;
    riderId: string;
    riderAccount: any;
    nextAction: string;
  }> => {
    const response = await apiClient.post<ApiResponse<{
      accessToken: string;
      refreshToken: string;
      user: User;
      riderId: string;
      riderAccount: any;
      nextAction: string;
    }>>('/riders/auth/register-and-apply', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    const data = response.data.data!;
    
    // Store tokens
    await AsyncStorage.setItem('auth_token', data.accessToken);
    await AsyncStorage.setItem('refresh_token', data.refreshToken);
    
    return data;
  },

  /**
   * Rider login with email/phone and password
   * POST /api/v1/riders/auth/login
   */
  login: async (email: string, password: string): Promise<{
    user: User;
    accessToken: string;
    refreshToken: string;
  }> => {
    const response = await apiClient.post<ApiResponse<{
      user: User;
      accessToken: string;
      refreshToken: string;
    }>>('/riders/auth/login', { email, password });
    
    const data = response.data.data!;
    
    // Store tokens
    await AsyncStorage.setItem('auth_token', data.accessToken);
    await AsyncStorage.setItem('refresh_token', data.refreshToken);
    
    return data;
  },

  /**
   * Rider registration (independent of customer)
   * POST /api/v1/riders/auth/register
   */
  register: async (userData: {
    fullName: string;
    email: string;
    password: string;
    phoneNumber: string;
  }): Promise<{ user: User; accessToken: string; refreshToken: string }> => {
    const response = await apiClient.post<ApiResponse<{
      user: User;
      accessToken: string;
      refreshToken: string;
    }>>('/riders/auth/register', userData);
    
    const data = response.data.data!;
    
    // Store tokens
    await AsyncStorage.setItem('auth_token', data.accessToken);
    await AsyncStorage.setItem('refresh_token', data.refreshToken);
    
    return data;
  },

  /**
   * Apply to become a rider
   * POST /api/v1/riders/apply
   */
  apply: async (applicationData?: any): Promise<{ message: string }> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>('/riders/apply', applicationData);
    return response.data.data!;
  },

  // ====================== ACCOUNT MANAGEMENT ======================

  /**
   * Update my availability (approved riders)
   * PATCH /api/v1/riders/my/availability
   */
  updateAvailability: async (availability: {
    available: boolean;
    schedule?: any;
  }): Promise<{ message: string }> => {
    const response = await apiClient.patch<ApiResponse<{ message: string }>>('/riders/my/availability', availability);
    return response.data.data!;
  },

  /**
   * Get my rider account
   * GET /api/v1/riders/my/account
   */
  getMyAccount: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>('/riders/my/account');
    return response.data.data!;
  },

  /**
   * Update my current location
   * PATCH /api/v1/riders/my/location
   */
  updateMyLocation: async (latitude: number, longitude: number): Promise<{ message: string }> => {
    const response = await apiClient.patch<ApiResponse<{ message: string }>>('/riders/my/location', {
      lat: latitude,  // Backend expects 'lat', not 'latitude'
      lng: longitude  // Backend expects 'lng', not 'longitude'
    });
    return response.data.data!;
  },

  // ====================== RIDER MANAGEMENT ======================

  /**
   * List riders with optional availability and proximity filters
   * GET /api/v1/riders
   */
  listRiders: async (params?: {
    available?: boolean;
    latitude?: number;
    longitude?: number;
    radius?: number;
  }): Promise<User[]> => {
    const queryParams = new URLSearchParams();
    if (params?.available !== undefined) queryParams.append('available', params.available.toString());
    if (params?.latitude !== undefined) queryParams.append('latitude', params.latitude.toString());
    if (params?.longitude !== undefined) queryParams.append('longitude', params.longitude.toString());
    if (params?.radius !== undefined) queryParams.append('radius', params.radius.toString());

    const url = `/riders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<ApiResponse<User[]>>(url);
    return response.data.data!;
  },

  /**
   * Get my online/offline status
   * GET /api/v1/riders/status
   */
  getStatus: async (): Promise<RiderStatus> => {
    const response = await apiClient.get<ApiResponse<RiderStatus>>('/riders/status');
    // Response shape: { status_code, message, data: { isOnline: boolean } }
    return response.data.data!;
  },

  /**
   * Update my online/offline status
   * PATCH /api/v1/riders/status
   */
  updateStatus: async (isOnline: boolean): Promise<RiderStatus> => {
    const response = await apiClient.patch<ApiResponse<RiderStatus>>('/riders/status', { isOnline });
    // Response shape: { status_code, message, data: { isOnline: boolean } }
    return response.data.data!;
  },

  // ====================== DELIVERIES ======================

  /**
   * Get my current active deliveries
   * GET /api/v1/riders/deliveries/current
   */
  getCurrentDeliveries: async (): Promise<Delivery[]> => {
    const response = await apiClient.get<ApiResponse<Delivery[]>>('/riders/deliveries/current');
    return response.data.data!;
  },

  /**
   * Get my delivery history
   * GET /api/v1/riders/deliveries/history
   */
  getDeliveryHistory: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<Delivery[]> => {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.append('page', params.page.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());

    const url = `/riders/deliveries/history${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<ApiResponse<Delivery[]>>(url);
    return response.data.data!;
  },

  /**
   * Accept a delivery
   * POST /api/v1/riders/deliveries/{id}/accept
   */
  acceptDelivery: async (deliveryId: string): Promise<Delivery> => {
    const response = await apiClient.post<ApiResponse<Delivery>>(`/riders/deliveries/${deliveryId}/accept`);
    return response.data.data!;
  },

  /**
   * Start a delivery (after pickup) -> out for delivery
   * POST /api/v1/riders/deliveries/{id}/start
   */
  startDelivery: async (deliveryId: string): Promise<Delivery> => {
    const response = await apiClient.post<ApiResponse<Delivery>>(`/riders/deliveries/${deliveryId}/start`);
    return response.data.data!;
  },

  /**
   * Complete a delivery (mark delivered)
   * POST /api/v1/riders/deliveries/{id}/complete
   */
  completeDelivery: async (deliveryId: string): Promise<Delivery> => {
    const response = await apiClient.post<ApiResponse<Delivery>>(`/riders/deliveries/${deliveryId}/complete`);
    return response.data.data!;
  },

  // ====================== EARNINGS ======================

  /**
   * Get my earnings
   * GET /api/v1/riders/earnings
   */
  getEarnings: async (params?: {
    period?: 'today' | 'week' | 'month';
    startDate?: string;
    endDate?: string;
  }): Promise<any> => {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const url = `/riders/earnings${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<ApiResponse<any>>(url);
    return response.data.data!;
  },

  // ====================== LOCATION & VEHICLE ======================

  /**
   * Update my current location (alias)
   * PATCH /api/v1/riders/location
   */
  updateLocation: async (latitude: number, longitude: number): Promise<{ message: string }> => {
    const response = await apiClient.patch<ApiResponse<{ message: string }>>('/riders/location', {
      lat: latitude,  // Backend expects 'lat', not 'latitude'
      lng: longitude  // Backend expects 'lng', not 'longitude'
    });
    return response.data.data!;
  },

  /**
   * Update my vehicle information
   * PATCH /api/v1/riders/vehicle
   */
  updateVehicle: async (vehicleData: any): Promise<{ message: string }> => {
    const response = await apiClient.patch<ApiResponse<{ message: string }>>('/riders/vehicle', vehicleData);
    return response.data.data!;
  },
};