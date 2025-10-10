import apiClient from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiResponse, RiderProfile, User } from '../types/api';

/**
 * Authentication Service
 * Handles all authentication-related API calls
 */
export const authService = {
  /**
   * Sign in with Google ID token
   * POST /api/v1/auth/google
   */
  googleSignIn: async (idToken: string): Promise<{ user: User; accessToken: string; refreshToken: string }> => {
    const response = await apiClient.post<ApiResponse<{
      user: User;
      accessToken: string;
      refreshToken: string;
    }>>('/auth/google', { idToken });
    
    const data = response.data.data!;
    
    // Store tokens
    await AsyncStorage.setItem('auth_token', data.accessToken);
    await AsyncStorage.setItem('refresh_token', data.refreshToken);
    
    return data;
  },

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh-token
   */
  refreshToken: async (): Promise<{ accessToken: string; refreshToken: string }> => {
    const refreshToken = await AsyncStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<ApiResponse<{
      accessToken: string;
      refreshToken: string;
    }>>('/auth/refresh-token', { refreshToken });
    
    const data = response.data.data!;
    
    // Update stored tokens
    await AsyncStorage.setItem('auth_token', data.accessToken);
    await AsyncStorage.setItem('refresh_token', data.refreshToken);
    
    return data;
  },

  /**
   * Get current user profile
   * GET /api/v1/auth/profile
   */
  getProfile: async (): Promise<RiderProfile> => {
    const response = await apiClient.get<ApiResponse<RiderProfile>>('/riders/my/account');
    return response.data.data!;
  },

  /**
   * Update current user profile
   * PATCH /api/v1/auth/profile
   */
  updateProfile: async (userData: Partial<User>): Promise<User> => {
    const response = await apiClient.patch<ApiResponse<User>>('/auth/profile', userData);
    return response.data.data!;
  },

  /**
   * Request password reset
   * POST /api/v1/auth/forgot-password
   */
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/forgot-password', { email });
    return response.data.data!;
  },

  /**
   * Reset password with token
   * POST /api/v1/auth/reset-password
   */
  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/reset-password', {
      token,
      newPassword
    });
    return response.data.data!;
  },

  /**
   * Logout (clear local tokens)
   */
  logout: async (): Promise<void> => {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('refresh_token');
  },

  /**
   * Get stored auth token
   */
  getStoredToken: async (): Promise<string | null> => {
    return await AsyncStorage.getItem('auth_token');
  },
};