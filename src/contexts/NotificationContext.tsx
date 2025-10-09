import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { InAppNotification } from '../types/api';
import { useAuth } from './AuthContext';
import { useUnreadCount, useRegisterDevice, useNotifications as useNotificationsQuery } from '../hooks/useNotifications';

interface NotificationContextType {
  notifications: InAppNotification[];
  unreadCount: number;
  isLoading: boolean;
  pushToken: string | null;
  refreshNotifications: () => Promise<void>;
  requestPermissions: () => Promise<boolean>;
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
  
  // Local state
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
      const { status } = await Notifications.requestPermissionsAsync();
      
      if (status === 'granted') {
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

  return (
    <NotificationContext.Provider
      value={{
        notifications: notificationsData,
        unreadCount: isActive ? unreadCount : 0,
        isLoading,
        pushToken,
        refreshNotifications,
        requestPermissions,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};