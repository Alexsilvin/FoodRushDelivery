import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationApi } from './notificationApi';

// Check if we're running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Configure notification behavior only if not in Expo Go
if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export interface NotificationDevice {
  id: string;
  expoToken: string;
  platform: string;
  role: string;
}

export interface InAppNotification {
  id: string;
  title: string;
  body: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
  type?: string;
}

export interface NotificationPermissions {
  granted: boolean;
  canAskAgain: boolean;
  status: string;
}

class NotificationService {
  private expoPushToken: string | null = null;
  private notificationListener: any = null;
  private responseListener: any = null;

  /**
   * Initialize notification service
   */
  async initialize(): Promise<void> {
    try {
      if (isExpoGo) {
        // Still initialize for in-app notifications
        return;
      }
      
      // Register for push notifications
      await this.registerForPushNotifications();
      
      // Set up notification listeners
      this.setupNotificationListeners();
      
      console.log('✅ Notification service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize notification service:', error);
    }
  }

  /**
   * Register device for push notifications
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      if (isExpoGo) {
        return null;
      }
      
      if (!Device.isDevice) {
        return null;
      }

      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return null;
      }

      // Get Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync();
      this.expoPushToken = tokenData.data;

      console.log('📱 Expo push token:', this.expoPushToken);

      // Register token with backend
      await this.registerDeviceWithBackend(this.expoPushToken);

      // Store token locally
      await AsyncStorage.setItem('expo_push_token', this.expoPushToken);

      return this.expoPushToken;
    } catch (error) {
      console.error('❌ Failed to register for push notifications:', error);
      return null;
    }
  }

  /**
   * Register device token with backend
   */
  async registerDeviceWithBackend(expoToken: string): Promise<void> {
    try {
      const platform = Platform.OS;
      const role = 'RIDER'; // Since this is the driver app

      const response = await notificationApi.registerDevice(expoToken, platform, role);
      console.log('✅ Device registered with backend:', response);
    } catch (error: any) {
      // Don't throw error for device registration failures - app should continue working
      console.warn('⚠️ Device registration failed (non-critical):', {
        status: error?.response?.status,
        message: error?.response?.data?.message || error.message,
        url: error?.config?.url
      });
      // Continue without throwing - notification registration is not critical for app functionality
    }
  }

  /**
   * Unregister device from backend
   */
  async unregisterDevice(): Promise<void> {
    try {
      const token = this.expoPushToken || await AsyncStorage.getItem('expo_push_token');
      
      if (!token) {
        console.warn('⚠️ No token found to unregister');
        return;
      }

      const response = await notificationApi.unregisterDevice(token);

      if (response?.success) {
        console.log('✅ Device unregistered successfully');
        await AsyncStorage.removeItem('expo_push_token');
        this.expoPushToken = null;
      }
    } catch (error: any) {
      console.error('❌ Failed to unregister device:', error?.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get list of registered devices
   */
  async getRegisteredDevices(): Promise<NotificationDevice[]> {
    try {
      const response = await notificationApi.getDevices();
      return response?.data || [];
    } catch (error: any) {
      console.error('❌ Failed to get registered devices:', error?.response?.data || error.message);
      return [];
    }
  }

  /**
   * Get in-app notifications
   */
  async getInAppNotifications(page: number = 1, limit: number = 20): Promise<{
    notifications: InAppNotification[];
    hasMore: boolean;
    total: number;
  }> {
    try {
      const response = await notificationApi.getNotifications(page, limit);
      
      const notifications = response?.data || [];
      const meta = response?.meta || {};
      
      return {
        notifications,
        hasMore: (meta.page || 1) * (meta.limit || limit) < (meta.total || 0),
        total: meta.total || 0,
      };
    } catch (error: any) {
      console.error('❌ Failed to get in-app notifications:', error?.response?.data || error.message);
      return {
        notifications: [],
        hasMore: false,
        total: 0,
      };
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const response = await notificationApi.markAsRead(notificationId);
      
      if (response?.success) {
        console.log('✅ Notification marked as read:', notificationId);
      }
    } catch (error: any) {
      console.error('❌ Failed to mark notification as read:', error?.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsAsRead(): Promise<void> {
    try {
      const response = await notificationApi.markAllAsRead();
      
      if (response?.success) {
        console.log('✅ All notifications marked as read');
      }
    } catch (error: any) {
      console.error('❌ Failed to mark all notifications as read:', error?.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const count = await notificationApi.getUnreadCount();
      return count;
    } catch (error: any) {
      console.error('❌ Failed to get unread count:', error?.response?.data || error.message);
      return 0;
    }
  }

  /**
   * Setup notification listeners
   */
  private setupNotificationListeners(): void {
    // Listener for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('📨 Notification received:', notification);
      
      // You can handle the notification here (e.g., update UI, play sound)
      this.handleNotificationReceived(notification);
    });

    // Listener for when user taps on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response);
      
      // Handle notification tap (e.g., navigate to specific screen)
      this.handleNotificationTapped(response);
    });
  }

  /**
   * Handle notification received while app is active
   */
  private handleNotificationReceived(notification: Notifications.Notification): void {
    const { title, body, data } = notification.request.content;
    
    // You can customize this based on notification type
    console.log('📨 Handling received notification:', { title, body, data });
    
    // Example: Show custom in-app notification
    // You could dispatch this to your notification context
  }

  /**
   * Handle notification tap
   */
  private handleNotificationTapped(response: Notifications.NotificationResponse): void {
    const { data } = response.notification.request.content;
    
    console.log('👆 Handling notification tap with data:', data);
    
    // Example: Navigate based on notification type
    if (data?.type === 'delivery_assigned') {
      // Navigate to delivery details
    } else if (data?.type === 'earnings_update') {
      // Navigate to earnings screen
    }
    
    // You could use navigation service or context to handle navigation
  }

  /**
   * Check notification permissions
   */
  async checkPermissions(): Promise<NotificationPermissions> {
    try {
      const { status, canAskAgain } = await Notifications.getPermissionsAsync();
      
      return {
        granted: status === 'granted',
        canAskAgain,
        status,
      };
    } catch (error) {
      console.error('❌ Failed to check notification permissions:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'unknown',
      };
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<NotificationPermissions> {
    try {
      const { status, canAskAgain } = await Notifications.requestPermissionsAsync();
      
      return {
        granted: status === 'granted',
        canAskAgain,
        status,
      };
    } catch (error) {
      console.error('❌ Failed to request notification permissions:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'unknown',
      };
    }
  }

  /**
   * Schedule local notification
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: any,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: trigger || null, // null means immediate
      });

      console.log('📅 Local notification scheduled:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('❌ Failed to schedule local notification:', error);
      throw error;
    }
  }

  /**
   * Cancel local notification
   */
  async cancelLocalNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('❌ Local notification cancelled:', notificationId);
    } catch (error) {
      console.error('❌ Failed to cancel local notification:', error);
    }
  }

  /**
   * Cancel all local notifications
   */
  async cancelAllLocalNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('❌ All local notifications cancelled');
    } catch (error) {
      console.error('❌ Failed to cancel all local notifications:', error);
    }
  }

  /**
   * Get current push token
   */
  getCurrentPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Cleanup notification service
   */
  cleanup(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
      this.notificationListener = null;
    }

    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
      this.responseListener = null;
    }

    console.log('🧹 Notification service cleaned up');
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;