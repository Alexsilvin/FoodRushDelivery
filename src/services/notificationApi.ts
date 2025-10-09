import apiClient from './apiClient';
import { ApiResponse, InAppNotification, NotificationDevice } from '../types/api';

/**
 * Notification API Service
 * Handles all notification-related API calls with proper typing
 */
export const notificationApi = {
  /**
   * Register device for push notifications
   * POST /api/v1/notifications/devices
   */
  registerDevice: async (expoToken: string, platform: string, role: string): Promise<NotificationDevice> => {
    const response = await apiClient.post<ApiResponse<NotificationDevice>>('/notifications/devices', {
      expoToken,
      platform,
      role,
    });
    return response.data.data!;
  },

  /**
   * Unregister device
   * DELETE /api/v1/notifications/devices/{token}
   */
  unregisterDevice: async (expoToken: string): Promise<void> => {
    await apiClient.delete(`/notifications/devices/${expoToken}`);
  },

  /**
   * Get registered devices
   * GET /api/v1/notifications/devices
   */
  getDevices: async (): Promise<NotificationDevice[]> => {
    const response = await apiClient.get<ApiResponse<NotificationDevice[]>>('/notifications/devices');
    return response.data.data || [];
  },

  /**
   * Get notifications list
   * GET /api/v1/notifications
   */
  getNotifications: async (page: number = 1, limit: number = 20): Promise<{
    notifications: InAppNotification[];
    hasMore: boolean;
    total: number;
  }> => {
    const response = await apiClient.get<ApiResponse<InAppNotification[]>>(
      `/notifications/my`
    );
    
    const notifications = response.data.data || [];
    const meta = response.data.meta || {};
    
    return {
      notifications,
      hasMore: (meta.page || 1) * (meta.limit || limit) < (meta.total || 0),
      total: meta.total || 0,
    };
  },

  /**
   * Get unread notifications count
   * GET /api/v1/notifications/unread-count
   */
  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get<{
      status_code: number;
      message: string;
      data: { count: number };
    }>('/notifications/unread-count');
    
    return response.data.data?.count || 0;
  },

  /**
   * Mark notification as read
   * POST /api/v1/notifications/{id}/read
   */
  markAsRead: async (notificationId: string): Promise<void> => {
    await apiClient.patch(`/notifications/${notificationId}/read`);
  },

  /**
   * Mark all notifications as read
   * POST /api/v1/notifications/mark-all-read
   */
  markAllAsRead: async (): Promise<void> => {
    await apiClient.patch('/notifications/read-all');
  },
};
