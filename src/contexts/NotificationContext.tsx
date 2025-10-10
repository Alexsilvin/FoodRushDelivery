import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { InAppNotification } from '../types/api';
import { useAuth } from './AuthContext';
import { useUnreadCount, useRegisterDevice, useNotifications as useNotificationsQuery, useMarkAsRead, useMarkAllAsRead } from '../hooks/useNotifications';

interface NotificationContextType {
  notifications: InAppNotification[];
  unreadCount: number;
  isLoading: boolean;
  pushToken: string | null;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  vibrationEnabled: boolean;
  setVibrationEnabled: (enabled: boolean) => void;
  permissions: Notifications.NotificationPermissionsStatus | null;
  refreshNotifications: () => Promise<void>;
  requestPermissions: () => Promise<boolean>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  loadMoreNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Configure notification handler once, outside component
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldShowList: true,
    shouldShowBanner: true,
    shouldSetBadge: true,
  }),
});

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const isActive = user?.state === 'ACTIVE';
  
  // React Query hooks
  const { data: unreadCount = 0 } = useUnreadCount({ enabled: isActive });
  const { data: notificationsData = [], refetch: refetchNotifications } = useNotificationsQuery(
    { page: 1, limit: 20 },
    { enabled: isActive }
  );
  const registerDeviceMutation = useRegisterDevice();
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();
  
  // Local state
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [permissions, setPermissions] = useState<Notifications.NotificationPermissionsStatus | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Check permissions and update state on mount
  useEffect(() => {
    let mounted = true;

    const checkPermissions = async () => {
      try {
        const permissionStatus = await Notifications.getPermissionsAsync();
        if (mounted) {
          setPermissions(permissionStatus);
          setNotificationsEnabled(permissionStatus.status === 'granted');
        }
      } catch (error) {
        console.error('❌ Permission check failed:', error);
      }
    };

    checkPermissions();

    return () => {
      mounted = false;
    };
  }, []);

  // Register for push notifications on mount (once)
  useEffect(() => {
    let mounted = true;

    const registerPush = async () => {
      if (!isActive || !Device.isDevice) return;

      try {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') return;

        const token = (await Notifications.getExpoPushTokenAsync()).data;
        
        if (mounted) {
          setPushToken(token);
        }

        await registerDeviceMutation.mutateAsync({
          expoToken: token,
          platform: Platform.OS,
          role: 'rider'
        });

        console.log('✅ Push notifications registered');
      } catch (error) {
        console.error('❌ Push registration failed:', error);
      }
    };

    registerPush();

    return () => {
      mounted = false;
    };
  }, [isActive]); // Only depend on isActive

  // Request permissions
  const requestPermissions = async (): Promise<boolean> => {
    try {
      const permissionStatus = await Notifications.requestPermissionsAsync();
      setPermissions(permissionStatus);
      
      if (permissionStatus.status === 'granted') {
        setNotificationsEnabled(true);
        
        if (!Device.isDevice) {
          console.warn('⚠️ Push notifications only work on physical devices');
          return true;
        }

        const token = (await Notifications.getExpoPushTokenAsync()).data;
        setPushToken(token);

        await registerDeviceMutation.mutateAsync({
          expoToken: token,
          platform: Platform.OS,
          role: 'rider'
        });

        return true;
      }

      setNotificationsEnabled(false);
      Alert.alert(
        'Permissions Required',
        'Please enable notifications in settings to receive delivery updates.'
      );
      return false;
    } catch (error) {
      console.error('❌ Permission request failed:', error);
      Alert.alert('Error', 'Failed to request notification permissions');
      return false;
    }
  };

  // Refresh notifications
  const refreshNotifications = async () => {
    if (!isActive) return;
    
    try {
      setIsLoading(true);
      await refetchNotifications();
    } catch (error) {
      console.error('❌ Refresh failed:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await markAsReadMutation.mutateAsync(notificationId);
    } catch (error) {
      console.error('❌ Mark as read failed:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
    } catch (error) {
      console.error('❌ Mark all as read failed:', error);
    }
  };

  // Load more notifications
  const loadMoreNotifications = async () => {
    try {
      setCurrentPage(prev => prev + 1);
      // This would typically trigger a new query with the updated page
      // For now, just refresh the current notifications
      await refreshNotifications();
    } catch (error) {
      console.error('❌ Load more failed:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications: notificationsData,
        unreadCount: isActive ? unreadCount : 0,
        isLoading,
        pushToken,
        notificationsEnabled,
        setNotificationsEnabled,
        soundEnabled,
        setSoundEnabled,
        vibrationEnabled,
        setVibrationEnabled,
        permissions,
        refreshNotifications,
        requestPermissions,
        markAsRead,
        markAllAsRead,
        loadMoreNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};