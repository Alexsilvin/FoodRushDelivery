import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import notificationService, { InAppNotification, NotificationPermissions } from '../services/notificationService';
import { useAuth } from './AuthContext';
import { useUnreadCount, useRegisterDevice } from '../hooks/useNotifications';

interface NotificationContextType {
  // State
  notifications: InAppNotification[];
  unreadCount: number;
  isLoading: boolean;
  permissions: NotificationPermissions | null;
  pushToken: string | null;
  
  // Actions
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  requestPermissions: () => Promise<boolean>;
  loadMoreNotifications: () => Promise<void>;
  
  // Settings
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  vibrationEnabled: boolean;
  setVibrationEnabled: (enabled: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  
  // React Query hooks
  const { data: unreadCount = 0, refetch: refetchUnreadCount } = useUnreadCount();
  const registerDeviceMutation = useRegisterDevice();
  
  // State
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [permissions, setPermissions] = useState<NotificationPermissions | null>(null);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  /**
   * Initialize notification service when user is authenticated
   */
  useEffect(() => {
    if (user) {
      initializeNotifications();
    } else {
      // Clean up when user logs out
      cleanup();
    }

    return () => {
      cleanup();
    };
  }, [user]);

  /**
   * Initialize notifications
   */
  const initializeNotifications = async () => {
    try {
      console.log('🔔 Initializing notifications for user:', user?.email);
      
      // Initialize notification service
      await notificationService.initialize();
      
      // Get current permissions
      const perms = await notificationService.checkPermissions();
      setPermissions(perms);
      
      // Get push token
      const token = notificationService.getCurrentPushToken();
      setPushToken(token);
      
      // Load initial notifications
      await refreshNotifications();
      
      // Trigger unread count refetch
      refetchUnreadCount();
      
      console.log('✅ Notifications initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize notifications:', error);
    }
  };

  /**
   * Refresh notifications from server
   */
  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setCurrentPage(1);
      
      const result = await notificationService.getInAppNotifications(1, 20);
      
      setNotifications(result.notifications);
      setHasMore(result.hasMore);
      setCurrentPage(1);
      
      console.log(`📨 Loaded ${result.notifications.length} notifications`);
    } catch (error) {
      console.error('❌ Failed to refresh notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  /**
   * Load more notifications (pagination)
   */
  const loadMoreNotifications = useCallback(async () => {
    if (!user || !hasMore || isLoading) return;
    
    try {
      setIsLoading(true);
      const nextPage = currentPage + 1;
      
      const result = await notificationService.getInAppNotifications(nextPage, 20);
      
      setNotifications(prev => [...prev, ...result.notifications]);
      setHasMore(result.hasMore);
      setCurrentPage(nextPage);
      
      console.log(`📨 Loaded ${result.notifications.length} more notifications (page ${nextPage})`);
    } catch (error) {
      console.error('❌ Failed to load more notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, hasMore, isLoading, currentPage]);

  // Remove loadUnreadCount as it's now handled by React Query

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markNotificationAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        )
      );
      
      // Refetch unread count
      refetchUnreadCount();
      
      console.log('✅ Notification marked as read:', notificationId);
    } catch (error) {
      console.error('❌ Failed to mark notification as read:', error);
      Alert.alert('Error', 'Failed to mark notification as read');
    }
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllNotificationsAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
      
      // Refetch unread count
      refetchUnreadCount();
      
      console.log('✅ All notifications marked as read');
    } catch (error) {
      console.error('❌ Failed to mark all notifications as read:', error);
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  }, []);

  /**
   * Request notification permissions
   */
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const perms = await notificationService.requestPermissions();
      setPermissions(perms);
      
      if (perms.granted) {
        // Re-initialize to register token
        await notificationService.registerForPushNotifications();
        const token = notificationService.getCurrentPushToken();
        setPushToken(token);
        
        console.log('✅ Notification permissions granted');
        return true;
      } else {
        console.warn('⚠️ Notification permissions denied');
        Alert.alert(
          'Permissions Required',
          'Please enable notifications in your device settings to receive delivery updates.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => {
              // You could open device settings here
              console.log('Open device settings');
            }}
          ]
        );
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to request permissions:', error);
      Alert.alert('Error', 'Failed to request notification permissions');
      return false;
    }
  }, []);

  /**
   * Handle notification settings changes
   */
  const handleNotificationsEnabledChange = useCallback(async (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    
    if (!enabled) {
      // Unregister device when notifications are disabled
      try {
        await notificationService.unregisterDevice();
        setPushToken(null);
        console.log('📱 Device unregistered from notifications');
      } catch (error) {
        console.error('❌ Failed to unregister device:', error);
      }
    } else {
      // Re-register device when notifications are enabled
      try {
        const token = await notificationService.registerForPushNotifications();
        setPushToken(token);
        console.log('📱 Device re-registered for notifications');
      } catch (error) {
        console.error('❌ Failed to re-register device:', error);
      }
    }
  }, []);

  /**
   * Cleanup function
   */
  const cleanup = () => {
    notificationService.cleanup();
    setNotifications([]);
    setPermissions(null);
    setPushToken(null);
    setCurrentPage(1);
    setHasMore(true);
  };

  // Periodic refresh is now handled by React Query's refetchInterval

  const value: NotificationContextType = {
    // State
    notifications,
    unreadCount,
    isLoading,
    permissions,
    pushToken,
    
    // Actions
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    requestPermissions,
    loadMoreNotifications,
    
    // Settings
    notificationsEnabled,
    setNotificationsEnabled: handleNotificationsEnabledChange,
    soundEnabled,
    setSoundEnabled,
    vibrationEnabled,
    setVibrationEnabled,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;