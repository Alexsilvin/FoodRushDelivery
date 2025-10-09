import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Modal,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { riderAPI, riderAuthAPI } from '../../services/api';
import LanguageSelector from '../../components/LanguageSelector';
import CommonView from '../../components/CommonView';
import { StackScreenProps } from '../../types/navigation.types';
import { useFloatingTabBarHeight } from '../../hooks/useFloatingTabBarHeight';

type Props = StackScreenProps<'Settings'>;

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

export default function SettingsScreen({ navigation, route }: Props) {
  const { theme, themeMode, setThemeMode } = useTheme();
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const tabBarHeight = useFloatingTabBarHeight();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationTrackingEnabled, setLocationTrackingEnabled] = useState(true);
  const [dataUsageEnabled, setDataUsageEnabled] = useState(true);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [online, setOnline] = useState<boolean>(false);
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [applying, setApplying] = useState<boolean>(false);

  React.useEffect(() => {
    let mounted = true;
    riderAPI.getStatus()
      .then(res => {
        if (!mounted) return;
        const status = (res as any)?.data?.status;
        if (status === 'online' || status === 'offline') setOnline(status === 'online');
      })
      .catch(() => {/* silent */});
    return () => { mounted = false; };
  }, []);

  const toggleOnline = async () => {
    if (updatingStatus) return;
    const next = !online;
    setOnline(next); // optimistic
    setUpdatingStatus(true);
    try {
      const res = await riderAPI.updateStatus(next ? 'online' : 'offline');
      const confirmed = (res as any)?.data?.status;
      if (confirmed && confirmed !== (next ? 'online' : 'offline')) {
        setOnline(confirmed === 'online');
      }
    } catch (e: any) {
      setOnline(!next); // revert
      Alert.alert(t('error'), e?.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const showApplyDialog = () => {
    Alert.alert(
      t('applyToRider') || 'Apply to Become a Rider',
      t('applyToRiderDescription') || 'Submit your application to become an approved rider.',
      [
        { text: t('cancel'), style: 'cancel' },
        { text: applying ? (t('pleaseWait') || 'Please wait') : (t('apply') || 'Apply'), onPress: () => { if (!applying) handleApply(); } }
      ]
    );
  };

  const handleApply = async () => {
    if (applying) return;
    setApplying(true);
    try {
      const res = await riderAuthAPI.apply();
      Alert.alert(t('success'), res?.message || t('applicationSubmitted') || 'Application submitted.');
    } catch (e: any) {
      Alert.alert(t('error'), e?.response?.data?.message || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };
  
  // App information
  const appVersion = "1.0.0";
  const buildNumber = "105";

  const getThemeTitle = () => {
    switch (themeMode) {
      case 'light':
        return t('lightMode');
      case 'dark':
        return t('darkMode');
      case 'system':
        return t('systemDefault');
      default:
        return t('systemDefault');
    }
  };

  const getThemeSubtitle = () => {
    switch (themeMode) {
      case 'light':
        return t('alwaysUseLight');
      case 'dark':
        return t('alwaysUseDark');
      case 'system':
        return t('followSystem');
      default:
        return t('followSystem');
    }
  };

  const handleThemePress = () => {
    setShowThemeModal(true);
  };
  
  const handleNotificationsPress = () => {
    setShowNotificationsModal(true);
  };
  
  const handlePrivacyPress = () => {
    Alert.alert(
      t('privacySettings'),
      t('privacySettingsInfo'),
      [
        {
          text: t('locationTracking'),
          onPress: () => {
            Alert.alert(
              t('locationTracking'),
              t('locationTrackingDescription'),
              [
                {
                  text: t('disable'),
                  onPress: () => setLocationTrackingEnabled(false),
                  style: 'destructive',
                },
                {
                  text: t('enable'),
                  onPress: () => setLocationTrackingEnabled(true),
                },
                {
                  text: t('cancel'),
                  style: 'cancel',
                }
              ]
            );
          },
        },
        {
          text: t('dataSaving'),
          onPress: () => {
            Alert.alert(
              t('dataSaving'),
              t('dataSavingDescription'),
              [
                {
                  text: t('disable'),
                  onPress: () => setDataUsageEnabled(false),
                  style: 'destructive',
                },
                {
                  text: t('enable'),
                  onPress: () => setDataUsageEnabled(true),
                },
                {
                  text: t('cancel'),
                  style: 'cancel',
                }
              ]
            );
          },
        },
        {
          text: t('deleteAccount'),
          onPress: () => {
            Alert.alert(
              t('deleteAccount'),
              t('deleteAccountConfirmation'),
              [
                {
                  text: t('cancel'),
                  style: 'cancel',
                },
                {
                  text: t('delete'),
                  onPress: () => {
                    Alert.alert(t('accountDeletionRequested'), t('accountDeletionMessage'));
                    // In a real app, this would call an API endpoint to request account deletion
                  },
                  style: 'destructive',
                }
              ]
            );
          },
          style: 'destructive',
        },
        {
          text: t('cancel'),
          style: 'cancel',
        }
      ]
    );
  };
  
  const handleHelpPress = () => {
    Alert.alert(
      t('helpSupport'),
      t('helpOptions'),
      [
        {
          text: t('callSupport'),
          onPress: () => {
            Linking.openURL('tel:+18003456789');
          },
        },
        {
          text: t('emailSupport'),
          onPress: () => {
            Linking.openURL('mailto:support@foodrush.com?subject=Driver Support Request');
          },
        },
        {
          text: t('faq'),
          onPress: () => {
            Alert.alert(t('faq'), t('faqComingSoon'));
          },
        },
        {
          text: t('cancel'),
          style: 'cancel',
        }
      ]
    );
  };
  
  const handleTermsPress = () => {
    Alert.alert(
      t('termsService'),
      t('termsServiceDetails'),
      [
        {
          text: t('viewFullTerms'),
          onPress: () => {
            Linking.openURL('https://foodrush.com/terms');
          },
        },
        {
          text: t('ok'),
          style: 'cancel',
        }
      ]
    );
  };
  
  const handleAboutPress = () => {
    Alert.alert(
      t('about'),
      `${t('appName')}: Food Rush Driver\n${t('version')}: ${appVersion} (${buildNumber})\n${t('copyright')}: © 2025 Food Rush Inc.\n\n${t('aboutDescription')}`,
      [
        {
          text: t('checkUpdates'),
          onPress: () => {
            Alert.alert(t('upToDate'), t('latestVersion'));
          },
        },
        {
          text: t('viewLicenses'),
          onPress: () => {
            Alert.alert(t('licenses'), t('licensesDescription'));
          },
        },
        {
          text: t('ok'),
          style: 'cancel',
        }
      ]
    );
  };
  
  const handleSignOutPress = () => {
    Alert.alert(
      t('logout'),
      t('logoutConfirmation'),
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('logout'),
          onPress: logout,
          style: 'destructive',
        }
      ]
    );
  };
  
  const ThemeModal = () => (
    <Modal
      visible={showThemeModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowThemeModal(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={() => setShowThemeModal(false)}
      >
        <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{t('selectTheme')}</Text>
          
          <TouchableOpacity 
            style={[
              styles.modalOption, 
              themeMode === 'system' && [styles.selectedOption, { borderColor: theme.colors.primary }]
            ]} 
            onPress={() => {
              setThemeMode('system');
              setShowThemeModal(false);
            }}
          >
            <View style={styles.optionIcon}>
              <Ionicons 
                name="phone-portrait-outline" 
                size={22} 
                color={themeMode === 'system' ? theme.colors.primary : theme.colors.textSecondary} 
              />
            </View>
            <View style={styles.optionText}>
              <Text style={[styles.optionTitle, { color: theme.colors.text }]}>{t('systemDefault')}</Text>
          <Text style={[styles.optionSubtitle, { color: theme.colors.textSecondary }]}>{t('followSystem')}</Text>
            </View>
            {themeMode === 'system' && (
              <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.modalOption, 
              themeMode === 'light' && [styles.selectedOption, { borderColor: theme.colors.primary }]
            ]} 
            onPress={() => {
              setThemeMode('light');
              setShowThemeModal(false);
            }}
          >
            <View style={styles.optionIcon}>
              <Ionicons 
                name="sunny-outline" 
                size={22} 
                color={themeMode === 'light' ? theme.colors.primary : theme.colors.textSecondary} 
              />
            </View>
            <View style={styles.optionText}>
              <Text style={[styles.optionTitle, { color: theme.colors.text }]}>{t('lightMode')}</Text>
          <Text style={[styles.optionSubtitle, { color: theme.colors.textSecondary }]}>{t('alwaysUseLight')}</Text>
            </View>
            {themeMode === 'light' && (
              <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.modalOption, 
              themeMode === 'dark' && [styles.selectedOption, { borderColor: theme.colors.primary }]
            ]} 
            onPress={() => {
              setThemeMode('dark');
              setShowThemeModal(false);
            }}
          >
            <View style={styles.optionIcon}>
              <Ionicons 
                name="moon-outline" 
                size={22} 
                color={themeMode === 'dark' ? theme.colors.primary : theme.colors.textSecondary} 
              />
            </View>
            <View style={styles.optionText}>
              <Text style={[styles.optionTitle, { color: theme.colors.text }]}>{t('darkMode')}</Text>
          <Text style={[styles.optionSubtitle, { color: theme.colors.textSecondary }]}>{t('alwaysUseDark')}</Text>
            </View>
            {themeMode === 'dark' && (
              <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.cancelButton, { borderColor: theme.colors.border }]} 
            onPress={() => setShowThemeModal(false)}
          >
            <Text style={[styles.cancelText, { color: theme.colors.text }]}>{t('cancel')}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
  
  const NotificationsModal = () => (
    <Modal
      visible={showNotificationsModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowNotificationsModal(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={() => setShowNotificationsModal(false)}
      >
        <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
                    <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{t('notifications')}</Text>
          
          <View style={styles.switchOption}>
            <View style={styles.switchText}>
              <Text style={[styles.switchTitle, { color: theme.colors.text }]}>{t('pushNotifications')}</Text>
              <Text style={[styles.switchSubtitle, { color: theme.colors.textSecondary }]}>{t('newDeliveryAlerts')}</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
              thumbColor={notificationsEnabled ? theme.colors.primary : theme.colors.textSecondary}
            />
          </View>
          
          <View style={styles.switchOption}>
            <View style={styles.switchText}>
              <Text style={[styles.switchTitle, { color: theme.colors.text }]}>{t('soundNotifications')}</Text>
              <Text style={[styles.switchSubtitle, { color: theme.colors.textSecondary }]}>{t('playSound')}</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
              thumbColor={notificationsEnabled ? theme.colors.primary : theme.colors.textSecondary}
              disabled={!notificationsEnabled}
            />
          </View>
          
          <View style={styles.switchOption}>
            <View style={styles.switchText}>
              <Text style={[styles.switchTitle, { color: theme.colors.text }]}>{t('vibrationNotifications')}</Text>
              <Text style={[styles.switchSubtitle, { color: theme.colors.textSecondary }]}>{t('vibrateOnNotification')}</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
              thumbColor={notificationsEnabled ? theme.colors.primary : theme.colors.textSecondary}
              disabled={!notificationsEnabled}
            />
          </View>
          
          <TouchableOpacity 
            style={[styles.cancelButton, { borderColor: theme.colors.border }]} 
            onPress={() => setShowNotificationsModal(false)}
          >
          <Text style={[styles.cancelText, { color: theme.colors.text }]}>{t('done')}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <CommonView>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={{ paddingBottom: tabBarHeight }}
      >
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          {t('appearance').toUpperCase()}
        </Text>
        
        <SettingItem
          title={getThemeTitle()}
          subtitle={getThemeSubtitle()}
          icon="color-palette-outline"
          onPress={handleThemePress}
          rightComponent={
            <View style={[styles.themeIndicator, { backgroundColor: theme.colors.primary + '20', borderRadius: 8, padding: 6 }]}>
              <Ionicons 
                name={themeMode === 'light' ? 'sunny' : themeMode === 'dark' ? 'moon' : 'phone-portrait'} 
                size={16} 
                color={theme.colors.primary} 
              />
            </View>
          }
        />
        
        <SettingItem
          title={t('language')}
          subtitle={t('changeAppLanguage')}
          icon="language-outline"
          onPress={() => {}}
          rightComponent={<LanguageSelector compact={true} />}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          {t('account').toUpperCase()}
        </Text>
        
        <SettingItem
          title={t('profile')}
          subtitle={t('manageAccountInfo')}
          icon="person-outline"
          onPress={() => navigation.navigate('EditProfile')}
        />
        
        <SettingItem
          title={t('notifications')}
          subtitle={t('configureNotifications')}
          icon="notifications-outline"
          onPress={handleNotificationsPress}
        />
        
        <SettingItem
          title={t('privacy')}
          subtitle={t('managePrivacy')}
          icon="shield-outline"
          onPress={handlePrivacyPress}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          {t('delivery').toUpperCase()}
        </Text>

        {/* Online status toggle */}
        <SettingItem
          title={(t('onlineStatus') || 'Online Status') + (updatingStatus ? '…' : '')}
          subtitle={online ? (t('youAreOnline') || 'You are currently online') : (t('youAreOffline') || 'You are currently offline')}
          icon={online ? 'radio-button-on-outline' : 'radio-button-off-outline'}
          onPress={toggleOnline}
          rightComponent={
            <Switch
              value={online}
              onValueChange={toggleOnline}
              disabled={updatingStatus}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
              thumbColor={online ? theme.colors.primary : theme.colors.textSecondary}
            />
          }
        />
        
        <SettingItem
          title={t('vehicleInformation')}
          subtitle={t('updateVehicleDetails')}
          icon="car-outline"
          onPress={() => navigation.navigate('VehicleInfo')}
        />
        
        <SettingItem
          title={t('workingHours')}
          subtitle={t('setAvailability')}
          icon="time-outline"
          onPress={() => navigation.navigate('AvailabilitySchedule')}
        />
        
        <SettingItem
          title={t('earnings')}
          subtitle={t('viewPaymentHistory')}
          icon="wallet-outline"
          onPress={() => {
            Alert.alert(
              t('earnings'),
              `${t('currentBalance')}: $1,247.53\n${t('pendingTransfers')}: $0.00\n\n${t('lastWeekEarnings')}: $342.15\n${t('thisMonthEarnings')}: $1,247.53`,
              [
                {
                  text: t('viewAllTransactions'),
                  onPress: () => {
                    Alert.alert(t('comingSoon'), t('featureAvailableSoon'));
                  },
                },
                {
                  text: t('ok'),
                  style: 'cancel',
                }
              ]
            );
          }}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          {t('support').toUpperCase()}
        </Text>

        {/* Rider application (shown if not verified / approved) */}
        {!user?.isVerified && (
          <SettingItem
            title={t('applyToRider') || 'Apply to Become a Rider'}
            subtitle={t('applyToRiderDescription') || 'Submit application for approval'}
            icon="clipboard-outline"
            onPress={showApplyDialog}
            rightComponent={
              applying ? <Ionicons name="hourglass" size={18} color={theme.colors.primary} /> : <Ionicons name="arrow-forward" size={18} color={theme.colors.textSecondary} />
            }
          />
        )}
        
        <SettingItem
          title={t('helpSupport')}
          subtitle={t('getHelp')}
          icon="help-circle-outline"
          onPress={handleHelpPress}
        />
        
        <SettingItem
          title={t('termsService')}
          subtitle={t('viewTerms')}
          icon="document-text-outline"
          onPress={handleTermsPress}
        />
        
        <SettingItem
          title={t('about')}
          subtitle={`v${appVersion} (${buildNumber})`}
          icon="information-circle-outline"
          onPress={handleAboutPress}
        />
      </View>

      <View style={[styles.section, styles.lastSection]}>
        <SettingItem
          title={t('logout')}
          subtitle={t('signOutDescription')}
          icon="log-out-outline"
          onPress={handleSignOutPress}
        />
      </View>
      
      {showThemeModal && <ThemeModal />}
      {showNotificationsModal && <NotificationsModal />}
      </ScrollView>
    </CommonView>
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  themeOptionText: {
    fontSize: 16,
    marginLeft: 15,
  },
  themeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  notificationDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  cancelButton: {
    marginTop: 20,
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
  // Additional modal styles
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 12,
  },
  selectedOption: {
    borderWidth: 1,
  },
  optionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  optionSubtitle: {
    fontSize: 13,
    marginTop: 3,
  },
  switchOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  switchText: {
    flex: 1,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  switchSubtitle: {
    fontSize: 13,
    marginTop: 2,
    color: '#666',
  },
});
