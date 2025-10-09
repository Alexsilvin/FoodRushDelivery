import apiClient from './apiClient';
import { User, ApiResponse } from '../types/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Authentication API Service
 * Handles all auth-related API calls
 */
export const authApi = {
  /**
   * Login rider
   * POST /api/v1/riders/auth/login
   */
  login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
    const response = await apiClient.post<ApiResponse<{ user: User; token: string; accessToken?: string }>>(
      '/riders/auth/login',
      { email, password }
    );
    
    const data = response.data.data!;
    const token = data.token || data.accessToken!;
    
    // Store token in AsyncStorage (this is persistent data that should be stored)
    await AsyncStorage.setItem('auth_token', token);
    
    return {
      user: data.user,
      token,
    };
  },

  /**
   * Register rider
   * POST /api/v1/riders/auth/register
   */
  register: async (userData: {
    fullName: string;
    email: string;
    password: string;
    phoneNumber: string;
  }): Promise<{ user: User; token: string }> => {
    const response = await apiClient.post<ApiResponse<{ user: User; token: string }>>(
      '/riders/auth/register',
      userData
    );
    
    const data = response.data.data!;
    
    // Store token in AsyncStorage
    await AsyncStorage.setItem('auth_token', data.token);
    
    return data;
  },

  /**
   * Register and apply as rider
   * POST /api/v1/riders/auth/register-and-apply
   */
  registerAndApply: async (formData: FormData): Promise<{ user: User; token: string }> => {
    const response = await apiClient.post<ApiResponse<{ user: User; token: string }>>(
      '/riders/auth/register-and-apply',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    const data = response.data.data!;
    
    // Store token in AsyncStorage
    await AsyncStorage.setItem('auth_token', data.token);
    
    return data;
  },

  /**
   * Get current user profile
   * GET /api/v1/riders/my/account
   */
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>('/riders/my/account');
    return response.data.data!;
  },

  /**
   * Update user profile
   * PATCH /api/v1/riders/my/account
   */
  updateProfile: async (userData: Partial<User>): Promise<User> => {
    const response = await apiClient.patch<ApiResponse<User>>('/riders/my/account', userData);
    return response.data.data!;
  },

  /**
   * Logout (clear local token)
   */
  logout: async (): Promise<void> => {
    await AsyncStorage.removeItem('auth_token');
  },

  /**
   * Get stored auth token
   */
  getStoredToken: async (): Promise<string | null> => {
    return await AsyncStorage.getItem('auth_token');
  },
};