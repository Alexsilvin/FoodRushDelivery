import React from 'react';
import { View, Text, Switch, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotifications } from '../contexts/NotificationContext';

export default function NotificationSettings() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const {
    notificationsEnabled,
    setNotificationsEnabled,
    soundEnabled,
    setSoundEnabled,
    vibrationEnabled,
    setVibrationEnabled,
    permissions,
    requestPermissions,
  } = useNotifications();

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled && permissions && !permissions.granted) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive delivery updates.',
          [{ text: 'OK' }]
        );
        return;
      }
    }
    setNotificationsEnabled(enabled);
  };

  const handleSoundToggle = (enabled: boolean) => {
    if (!notificationsEnabled) {
      Alert.alert(
        'Enable Notifications First',
        'Please enable notifications before configuring sound settings.',
        [{ text: 'OK' }]
      );
      return;
    }
    setSoundEnabled(enabled);
  };

  const handleVibrationToggle = (enabled: boolean) => {
    if (!notificationsEnabled) {
      Alert.alert(
        'Enable Notifications First',
        'Please enable notifications before configuring vibration settings.',
        [{ text: 'OK' }]
      );
      return;
    }
    setVibrationEnabled(enabled);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
      {/* Push Notifications */}
      <View style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <View style={[styles.iconContainer, { backgroundColor: '#F59E0B15' }]}>
            <Ionicons name="notifications-outline" size={20} color="#F59E0B" />
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
              {t('pushNotifications') || 'Push Notifications'}
            </Text>
            <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
              Receive delivery updates and alerts
            </Text>
          </View>
        </View>
        <Switch
          value={notificationsEnabled}
          onValueChange={handleNotificationToggle}
          trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
          thumbColor={notificationsEnabled ? theme.colors.primary : theme.colors.textSecondary}
        />
      </View>

      {/* Sound Notifications */}
      <View style={[styles.settingItem, styles.borderTop]}>
        <View style={styles.settingLeft}>
          <View style={[styles.iconContainer, { backgroundColor: '#10B98115' }]}>
            <Ionicons name="volume-high-outline" size={20} color="#10B981" />
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
              {t('soundNotifications') || 'Sound'}
            </Text>
            <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
              Play sound for notifications
            </Text>
          </View>
        </View>
        <Switch
          value={soundEnabled}
          onValueChange={handleSoundToggle}
          trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
          thumbColor={soundEnabled ? theme.colors.primary : theme.colors.textSecondary}
          disabled={!notificationsEnabled}
        />
      </View>

      {/* Vibration Notifications */}
      <View style={[styles.settingItem, styles.borderTop]}>
        <View style={styles.settingLeft}>
          <View style={[styles.iconContainer, { backgroundColor: '#8B5CF615' }]}>
            <Ionicons name="phone-portrait-outline" size={20} color="#8B5CF6" />
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
              {t('vibrationNotifications') || 'Vibration'}
            </Text>
            <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
              Vibrate for notifications
            </Text>
          </View>
        </View>
        <Switch
          value={vibrationEnabled}
          onValueChange={handleVibrationToggle}
          trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
          thumbColor={vibrationEnabled ? theme.colors.primary : theme.colors.textSecondary}
          disabled={!notificationsEnabled}
        />
      </View>

      {/* Permission Status */}
      {permissions && (
        <View style={[styles.permissionStatus, { backgroundColor: theme.colors.background }]}>
          <Ionicons 
            name={permissions.granted ? 'checkmark-circle' : 'alert-circle'} 
            size={16} 
            color={permissions.granted ? '#10B981' : '#F59E0B'} 
          />
          <Text style={[styles.permissionText, { color: theme.colors.textSecondary }]}>
            {permissions.granted 
              ? 'Notification permissions granted' 
              : 'Notification permissions required'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  permissionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  permissionText: {
    fontSize: 12,
    fontWeight: '500',
  },
});