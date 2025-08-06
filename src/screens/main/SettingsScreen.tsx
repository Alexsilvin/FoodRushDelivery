import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface SettingItemProps {
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  rightComponent?: React.ReactNode;
}

const SettingItem: React.FC<SettingItemProps> = ({
  title,
  subtitle,
  icon,
  onPress,
  rightComponent,
}) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.settingItem, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}
      onPress={onPress}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name={icon} size={20} color={theme.colors.card} />
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightComponent || (
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
      )}
    </TouchableOpacity>
  );
};

export default function SettingsScreen() {
  const { theme, themeMode, setThemeMode } = useTheme();

  const getThemeTitle = () => {
    switch (themeMode) {
      case 'light':
        return 'Light Mode';
      case 'dark':
        return 'Dark Mode';
      case 'system':
        return 'System Default';
      default:
        return 'System Default';
    }
  };

  const getThemeSubtitle = () => {
    switch (themeMode) {
      case 'light':
        return 'Always use light theme';
      case 'dark':
        return 'Always use dark theme';
      case 'system':
        return 'Follow system appearance';
      default:
        return 'Follow system appearance';
    }
  };

  const handleThemePress = () => {
    // Cycle through theme options
    const nextMode = themeMode === 'light' ? 'dark' : themeMode === 'dark' ? 'system' : 'light';
    setThemeMode(nextMode);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          APPEARANCE
        </Text>
        
        <SettingItem
          title={getThemeTitle()}
          subtitle={getThemeSubtitle()}
          icon="color-palette-outline"
          onPress={handleThemePress}
          rightComponent={
            <View style={styles.themeIndicator}>
              <Ionicons 
                name={themeMode === 'light' ? 'sunny' : themeMode === 'dark' ? 'moon' : 'phone-portrait'} 
                size={16} 
                color={theme.colors.primary} 
              />
            </View>
          }
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          ACCOUNT
        </Text>
        
        <SettingItem
          title="Profile"
          subtitle="Manage your account information"
          icon="person-outline"
          onPress={() => {}}
        />
        
        <SettingItem
          title="Notifications"
          subtitle="Configure notification preferences"
          icon="notifications-outline"
          onPress={() => {}}
        />
        
        <SettingItem
          title="Privacy"
          subtitle="Manage privacy settings"
          icon="shield-outline"
          onPress={() => {}}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          DELIVERY
        </Text>
        
        <SettingItem
          title="Vehicle Information"
          subtitle="Update your delivery vehicle details"
          icon="car-outline"
          onPress={() => {}}
        />
        
        <SettingItem
          title="Working Hours"
          subtitle="Set your availability schedule"
          icon="time-outline"
          onPress={() => {}}
        />
        
        <SettingItem
          title="Earnings"
          subtitle="View payment and earnings history"
          icon="wallet-outline"
          onPress={() => {}}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          SUPPORT
        </Text>
        
        <SettingItem
          title="Help & Support"
          subtitle="Get help or contact support"
          icon="help-circle-outline"
          onPress={() => {}}
        />
        
        <SettingItem
          title="Terms of Service"
          subtitle="View terms and conditions"
          icon="document-text-outline"
          onPress={() => {}}
        />
        
        <SettingItem
          title="About"
          subtitle="App version and information"
          icon="information-circle-outline"
          onPress={() => {}}
        />
      </View>

      <View style={[styles.section, styles.lastSection]}>
        <SettingItem
          title="Sign Out"
          subtitle="Sign out of your account"
          icon="log-out-outline"
          onPress={() => {}}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginTop: 24,
  },
  lastSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginHorizontal: 20,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 20,
  },
  settingSubtitle: {
    fontSize: 13,
    lineHeight: 16,
    marginTop: 2,
  },
  themeIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
