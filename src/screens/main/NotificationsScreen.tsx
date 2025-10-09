import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { InAppNotification } from '../../types/api';

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const {
    notifications,
    unreadCount,
    isLoading,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    loadMoreNotifications,
  } = useNotifications();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Load notifications when screen mounts
    refreshNotifications();
  }, [refreshNotifications]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: InAppNotification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Handle navigation based on notification type
    if (notification.data?.type) {
      handleNotificationNavigation(notification.data.type, notification.data);
    }
  };

  const handleNotificationNavigation = (type: string, data: any) => {
    // You can implement navigation logic based on notification type
    console.log('Navigate to:', type, data);
    
    // Example navigation logic:
    // switch (type) {
    //   case 'delivery_assigned':
    //     navigation.navigate('DeliveryDetails', { deliveryId: data.deliveryId });
    //     break;
    //   case 'earnings_update':
    //     navigation.navigate('Earnings');
    //     break;
    //   default:
    //     break;
    // }
  };

  const handleMarkAllAsRead = () => {
    if (unreadCount === 0) return;

    Alert.alert(
      'Mark All as Read',
      `Mark all ${unreadCount} notifications as read?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Mark All', onPress: markAllAsRead },
      ]
    );
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
    }
  };

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'delivery_assigned':
        return 'car-outline';
      case 'delivery_completed':
        return 'checkmark-circle-outline';
      case 'earnings_update':
        return 'wallet-outline';
      case 'system_update':
        return 'settings-outline';
      case 'promotion':
        return 'gift-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getNotificationColor = (type?: string) => {
    switch (type) {
      case 'delivery_assigned':
        return '#3B82F6';
      case 'delivery_completed':
        return '#10B981';
      case 'earnings_update':
        return '#F59E0B';
      case 'system_update':
        return '#6B7280';
      case 'promotion':
        return '#8B5CF6';
      default:
        return theme.colors.primary;
    }
  };

  const renderNotification = (notification: InAppNotification, index: number) => {
    const iconName = getNotificationIcon(notification.type);
    const iconColor = getNotificationColor(notification.type);

    return (
      <TouchableOpacity
        key={notification.id}
        style={[
          styles.notificationItem,
          {
            backgroundColor: notification.isRead 
              ? theme.colors.card 
              : theme.isDark 
                ? 'rgba(59, 130, 246, 0.1)' 
                : 'rgba(59, 130, 246, 0.05)',
            borderLeftColor: notification.isRead ? 'transparent' : theme.colors.primary,
          },
        ]}
        onPress={() => handleNotificationPress(notification)}
        activeOpacity={0.7}
      >
        <View style={styles.notificationContent}>
          <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
            <Ionicons name={iconName as any} size={20} color={iconColor} />
          </View>

          <View style={styles.textContainer}>
            <Text
              style={[
                styles.notificationTitle,
                {
                  color: theme.colors.text,
                  fontWeight: notification.isRead ? '500' : '600',
                },
              ]}
              numberOfLines={2}
            >
              {notification.title}
            </Text>
            <Text
              style={[
                styles.notificationBody,
                { color: theme.colors.textSecondary },
              ]}
              numberOfLines={3}
            >
              {notification.body}
            </Text>
            <Text
              style={[
                styles.notificationTime,
                { color: theme.colors.textSecondary },
              ]}
            >
              {formatTime(notification.createdAt)}
            </Text>
          </View>

          {!notification.isRead && (
            <View style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="notifications-outline"
        size={64}
        color={theme.colors.textSecondary}
        style={styles.emptyIcon}
      />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        No Notifications
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        You'll see delivery updates and important messages here
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Notifications
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={[styles.markAllButton, { backgroundColor: theme.colors.primary + '15' }]}
            onPress={handleMarkAllAsRead}
          >
            <Text style={[styles.markAllText, { color: theme.colors.primary }]}>
              Mark All Read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Unread Count Badge */}
      {unreadCount > 0 && (
        <View style={[styles.unreadBanner, { backgroundColor: theme.colors.primary + '10' }]}>
          <Ionicons name="notifications" size={16} color={theme.colors.primary} />
          <Text style={[styles.unreadText, { color: theme.colors.primary }]}>
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* Notifications List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
          
          if (isCloseToBottom && !isLoading) {
            loadMoreNotifications();
          }
        }}
        scrollEventThrottle={400}
      >
        {notifications.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.notificationsList}>
            {notifications.map((notification, index) => renderNotification(notification, index))}
            
            {/* Loading indicator for pagination */}
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                  Loading more notifications...
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  unreadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  unreadText: {
    fontSize: 14,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  notificationsList: {
    paddingVertical: 8,
  },
  notificationItem: {
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderLeftWidth: 3,
    overflow: 'hidden',
  },
  notificationContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    marginBottom: 4,
    lineHeight: 22,
  },
  notificationBody: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
  },
});