import apiClient from './apiClient';
import { ApiResponse } from '../types/api';

/**
 * Notification Service
 * Handles all notification-related API calls
 */
export const notificationService = {
  /**
   * Register device for push notifications
   * POST /api/v1/notifications/devices
   */
  registerDevice: async (deviceData: {
    expoToken: string;
    platform: string;
    role: string;
  }): Promise<{ message: string }> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>('/notifications/device', deviceData);
    return response.data.data!;
  },

  /**
   * Unregister device from push notifications
   * DELETE /api/v1/notifications/devices/{token}
   */
  unregisterDevice: async (expoToken: string): Promise<{ message: string }> => {
      const response = await apiClient.delete<ApiResponse<{ message: string }>>(`/notifications/devices/`, { data: { expoToken } });
      return response.data.data!;
  },

  /**
   * Get registered devices
   * GET /api/v1/notifications/devices
   */
  getDevices: async (): Promise<Array<{
    id: string;
    expoToken: string;
    platform: string;
    role: string;
    createdAt: string;
    updatedAt: string;
  }>> => {
    const response = await apiClient.get<ApiResponse<Array<{
      id: string;
      expoToken: string;
      platform: string;
      role: string;
      createdAt: string;
      updatedAt: string;
    }>>>('/notifications/devices');
    return response.data.data!;
  },

  /**
   * Get notifications list
   * GET /api/v1/notifications
   */
  getNotifications: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<Array<{
    id: string;
    title: string;
    body: string;
    data?: any;
    isRead: boolean;
    type?: string;
    createdAt: string;
    updatedAt?: string;
  }>> => {
    
    const response = await apiClient.get<ApiResponse<Array<{
      id: string;
      title: string;
      body: string;
      data?: any;
      isRead: boolean;
      type?: string;
      createdAt: string;
      updatedAt?: string;
    }>>>('/notifications/my');
    return response.data.data!;
  },

  /**
   * Get unread notifications count
   * GET /api/v1/notifications/unread-count
   */
  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await apiClient.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
    return response.data.data!;
  },

  /**
   * Mark notification as read
   * POST /api/v1/notifications/{id}/read
   */
  markAsRead: async (notificationId: string): Promise<{ message: string }> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(`/notifications/${notificationId}/read`);
    return response.data.data!;
  },

  /**
   * Mark all notifications as read
   * POST /api/v1/notifications/mark-all-read
   */
  markAllAsRead: async (): Promise<{ message: string }> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>('/notifications/mark-all-read');
    return response.data.data!;
  },
};