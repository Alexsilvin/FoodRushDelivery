import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../services/notificationService';

// Query Keys
export const notificationKeys = {
  all: ['notifications'] as const,
  list: (params?: any) => [...notificationKeys.all, 'list', params] as const,
  unreadCount: () => [...notificationKeys.all, 'unreadCount'] as const,
  devices: () => [...notificationKeys.all, 'devices'] as const,
};

/**
 * Hook to get notifications list
 */
export const useNotifications = (params?: {
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => notificationService.getNotifications(params),
    staleTime: 30 * 1000, // 30 seconds
  });
};

/**
 * Hook to get unread notifications count
 */
export const useUnreadCount = () => {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: notificationService.getUnreadCount,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};

/**
 * Hook to get registered devices
 */
export const useNotificationDevices = () => {
  return useQuery({
    queryKey: notificationKeys.devices(),
    queryFn: notificationService.getDevices,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to register device for notifications
 */
export const useRegisterDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deviceData: {
      expoToken: string;
      platform: string;
      role: string;
    }) => notificationService.registerDevice(deviceData),
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.devices() });
    },
  });
};

/**
 * Hook to unregister device from notifications
 */
export const useUnregisterDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (expoToken: string) => notificationService.unregisterDevice(expoToken),
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.devices() });
    },
  });
};

/**
 * Hook to mark notification as read
 */
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => notificationService.markAsRead(notificationId),
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.list() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
};

/**
 * Hook to mark all notifications as read
 */
export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationService.markAllAsRead,
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.list() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
};