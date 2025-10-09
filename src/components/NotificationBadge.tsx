import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

interface NotificationBadgeProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  style?: any;
  navigation?: any; // Optional navigation prop
}

export default function NotificationBadge({ 
  size = 'medium', 
  showText = false, 
  style,
  navigation: passedNavigation 
}: NotificationBadgeProps) {
  const { theme } = useTheme();
  const { unreadCount } = useNotifications();
  const hookNavigation = useNavigation<NavigationProp<any>>();
  
  // Use passed navigation or fallback to hook navigation
  const navigation = passedNavigation || hookNavigation;

  const handlePress = () => {
    try {
      console.log('🔔 Notification badge pressed, navigating to Notifications screen');
      console.log('Platform:', Platform.OS);
      console.log('Navigation object:', navigation);
      
      if (navigation && typeof navigation.navigate === 'function') {
        // Add a small delay for Android to ensure touch is properly registered
        if (Platform.OS === 'android') {
          setTimeout(() => {
            navigation.navigate('Notifications');
            console.log('✅ Navigation successful (Android delayed)');
          }, 50);
        } else {
          navigation.navigate('Notifications');
          console.log('✅ Navigation successful (iOS immediate)');
        }
      } else {
        console.error('❌ Navigation object is invalid:', navigation);
        console.error('Navigation type:', typeof navigation);
        console.error('Navigation keys:', navigation ? Object.keys(navigation) : 'null');
      }
    } catch (error) {
      console.error('❌ Navigation failed:', error);
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small': return 20;
      case 'medium': return 24;
      case 'large': return 28;
      default: return 24;
    }
  };

  const getBadgeSize = () => {
    switch (size) {
      case 'small': return 16;
      case 'medium': return 18;
      case 'large': return 20;
      default: return 18;
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'small': return 10;
      case 'medium': return 11;
      case 'large': return 12;
      default: return 11;
    }
  };

  // Use Pressable for better Android support
  const TouchableComponent = Platform.OS === 'android' ? Pressable : TouchableOpacity;
  const touchProps = Platform.OS === 'android' 
    ? {
        onPress: handlePress,
        android_ripple: { color: 'rgba(0, 0, 0, 0.1)', borderless: true },
        style: ({ pressed }: { pressed: boolean }) => [
          styles.container,
          style,
          { opacity: pressed ? 0.7 : 1 }
        ]
      }
    : {
        onPress: handlePress,
        activeOpacity: 0.7,
        style: [styles.container, style]
      };

  return (
    <TouchableComponent {...touchProps}>
      <View style={styles.iconContainer}>
        <Ionicons
          name={unreadCount > 0 ? 'notifications' : 'notifications-outline'}
          size={getIconSize()}
          color={unreadCount > 0 ? theme.colors.primary : theme.colors.textSecondary}
        />
        
        {unreadCount > 0 && (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: '#DC2626',
                width: getBadgeSize(),
                height: getBadgeSize(),
                borderRadius: getBadgeSize() / 2,
                minWidth: getBadgeSize(),
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                {
                  fontSize: getTextSize(),
                  color: '#FFFFFF',
                },
              ]}
              numberOfLines={1}
            >
              {unreadCount > 99 ? '99+' : unreadCount.toString()}
            </Text>
          </View>
        )}
      </View>
      
      {showText && (
        <Text
          style={[
            styles.label,
            {
              color: theme.colors.textSecondary,
              fontSize: getTextSize() + 1,
            },
          ]}
        >
          Notifications
        </Text>
      )}
    </TouchableComponent>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
    minHeight: 48,
    borderRadius: 24,
    ...Platform.select({
      android: {
        overflow: 'hidden',
        elevation: 2,
      },
      ios: {
        // iOS specific styles if needed
      },
    }),
  },
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  label: {
    marginTop: 4,
    fontWeight: '500',
  },
});