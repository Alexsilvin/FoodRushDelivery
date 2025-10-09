import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../services/notificationApi';
import { InAppNotification, NotificationDevice } from '../types/api';
import { cacheConfig } from '../lib/queryClient';

// Query Keys
export const notificationKeys = {
  all: ['notifications'] as const,
  list: (page?: number, limit?: number) => [...notificationKeys.all, 'list', { page, limit }] as const,
  unreadCount: () => [...notificationKeys.all, 'unreadCount'] as const,
  devices: () => [...notificationKeys.all, 'devices'] as const,
};

/**
 * Hook to get notifications list
 */
export const useNotificationsList = (page: number = 1, limit: number = 20) => {
  return useQuery({
    queryKey: notificationKeys.list(page, limit),
    queryFn: () => notificationApi.getNotifications(page, limit),
    ...cacheConfig.realTime, // 30 second stale time
  });
};

/**
 * Hook to get unread notifications count
 */
export const useUnreadCount = () => {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationApi.getUnreadCount(),
    ...cacheConfig.realTime, // 30 second stale time
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};

/**
 * Hook to get registered devices
 */
export const useNotificationDevices = () => {
  return useQuery({
    queryKey: notificationKeys.devices(),
    queryFn: () => notificationApi.getDevices(),
    ...cacheConfig.userData, // 10 minute stale time
  });
};

/**
 * Hook to register device for push notifications
 */
export const useRegisterDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ expoToken, platform, role }: { 
      expoToken: string; 
      platform: string; 
      role: string; 
    }) => notificationApi.registerDevice(expoToken, platform, role),
    
    onSuccess: () => {
      // Invalidate devices list
      queryClient.invalidateQueries({ queryKey: notificationKeys.devices() });
    },
  });
};

/**
 * Hook to unregister device
 */
export const useUnregisterDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (expoToken: string) => notificationApi.unregisterDevice(expoToken),
    
    onSuccess: () => {
      // Invalidate devices list
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
    mutationFn: (notificationId: string) => notificationApi.markAsRead(notificationId),
    
    onMutate: async (notificationId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });

      // Optimistically update notifications list
      queryClient.setQueriesData(
        { queryKey: notificationKeys.list() },
        (old: any) => {
          if (!old?.notifications) return old;
          
          return {
            ...old,
            notifications: old.notifications.map((notification: InAppNotification) =>
              notification.id === notificationId
                ? { ...notification, isRead: true }
                : notification
            ),
          };
        }
      );

      // Optimistically update unread count
      queryClient.setQueryData(notificationKeys.unreadCount(), (old: number = 0) => 
        Math.max(0, old - 1)
      );
    },
    
    onError: () => {
      // Invalidate on error to refetch correct data
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
    
    onSettled: () => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

/**
 * Hook to mark all notifications as read
 */
export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });

      // Optimistically update notifications list
      queryClient.setQueriesData(
        { queryKey: notificationKeys.list() },
        (old: any) => {
          if (!old?.notifications) return old;
          
          return {
            ...old,
            notifications: old.notifications.map((notification: InAppNotification) => ({
              ...notification,
              isRead: true,
            })),
          };
        }
      );

      // Optimistically update unread count to 0
      queryClient.setQueryData(notificationKeys.unreadCount(), 0);
    },
    
    onError: () => {
      // Invalidate on error to refetch correct data
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
    
    onSettled: () => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

/**
 * Utility hook to invalidate all notification queries
 */
export const useInvalidateNotifications = () => {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: notificationKeys.all });
  };
};