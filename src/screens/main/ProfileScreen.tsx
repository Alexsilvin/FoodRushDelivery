import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { riderAPI, riderAuthAPI } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNavigation } from '@react-navigation/native';
import LanguageSelector from '../../components/LanguageSelector';
import { useStaggeredFadeIn } from '../../hooks/useStaggeredFadeIn';
import { useCountUp } from '../../hooks/useCountUp';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import axios from 'axios'; // Ensure axios is imported if not already

// Define the notification type
interface Notification {
  title: string;
  body: string;
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const navigation = useNavigation();
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [notifications, setNotifications] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [todayEarnings, setTodayEarnings] = useState<number | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [completedDeliveries, setCompletedDeliveries] = useState<number | null>(null);
  const [completionRate, setCompletionRate] = useState<string | null>(null);
  const [notificationList, setNotificationList] = useState<Notification[]>([]); // Explicitly define the type

  // Derive vehicle type (backend may store on vehicle or root)
  const vehicleType = user?.vehicleType || user?.vehicles?.find(v => v.default)?.type || user?.vehicles?.[0]?.type;

  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 0, useNativeDriver: true })
      ])
    ).start();
  }, [fadeAnim, pulseAnim]);

  const handleLogout = () => {
    Alert.alert(
      t('logout'),
      t('logoutConfirmation'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('logout'),
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile' as never);
  };

  const handleSupport = () => {
    Alert.alert(t('support'), t('supportMessage'));
  };

  const handlePrivacy = () => {
    Alert.alert(t('privacyPolicy'), t('privacyPolicyDetails'));
  };

  const handleTerms = () => {
    Alert.alert(t('termsService'), t('termsServiceDetails'));
  };

  const handleSettings = () => {
    navigation.navigate('Settings' as never);
  };

  const profileStats = [
    { label: t('totalDeliveries'), value: completedDeliveries, icon: 'car-outline', type: 'int' as const },
    { label: t('rating'), value: rating, icon: 'star', type: 'rating' as const },
    { label: t('todayEarnings') || 'Today', value: todayEarnings, icon: 'wallet-outline', type: 'currency' as const },
    { label: t('completionRate'), value: completionRate ? parseFloat(String(completionRate).replace(/%/, '')) : null, icon: 'checkmark-circle-outline', type: 'percent' as const },
  ];
  const statAnimations = useStaggeredFadeIn(profileStats.length, { delay: 90, duration: 450 });
  // Prepare count up raw values with hooks (order stable)
  const rawCounts = [
    useCountUp(Number(profileStats[0].value) || 0, 900),
    useCountUp(Number(profileStats[1].value) || 0, 900),
    useCountUp(Number(profileStats[2].value) || 0, 900),
    useCountUp(Number(profileStats[3].value) || 0, 900),
  ];
  const countUps = rawCounts.map((val, idx) => {
    const stat = profileStats[idx];
    if (stat.value == null) return '—';
    switch (stat.type) {
      case 'currency': return `$${val}`;
      case 'percent': return `${val}%`;
      default: return val;
    }
  });

  // Fetch dynamic profile info
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setProfileLoading(true);
        // Status
        const statusRes = await riderAPI.getStatus().catch(() => null);
        if (mounted && statusRes?.data) setIsOnline(statusRes.data.status === 'online');
        // Account for additional stats if provided
        if (user) {
          setRating(user.rating ?? user['averageRating'] ?? null);
          setCompletedDeliveries(user.completedDeliveries ?? user['totalDeliveries'] ?? null);
          const comp = user['completionRate'] ?? user['deliveryCompletionRate'];
          if (comp != null) setCompletionRate(typeof comp === 'number' ? `${comp}%` : String(comp));
        }
        // Earnings today
        const earnRes = await riderAPI.getEarnings('today').catch(() => null);
        if (mounted && earnRes?.data) setTodayEarnings(earnRes.data.total ?? null);
      } finally {
        mounted && setProfileLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [user]);

  useEffect(() => {
    const registerForPushNotifications = async () => {
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          Alert.alert('Failed to get push token for notifications!');
          return;
        }
        const token = (await Notifications.getExpoPushTokenAsync()).data;
        console.log('Push token:', token);

        // Register the token with the backend
        try {
          await axios.post('/api/v1/notifications/device', { token }); // Use axios for the POST request
        } catch (error) {
          console.error('Failed to register push token:', error);
        }
      } else {
        Alert.alert('Must use physical device for Push Notifications');
      }
    };

    const fetchNotifications = async () => {
      try {
        const response = await axios.get('/api/v1/notifications/my'); // Use axios for the GET request
        setNotificationList(response.data || []);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    registerForPushNotifications();
    fetchNotifications();
  }, []);

  const toggleOnline = async (value: boolean) => {
    const previous = isOnline;
    setIsOnline(value);
    setLoadingStatus(true);
    try {
      // Prefer availability endpoint (available boolean) for clearer semantics
  const res = await riderAPI.updateAvailability(value);
  if (!res?.success) throw new Error(res?.message || 'Availability not accepted');
    } catch (e: any) {
      // fallback to status endpoint
      try {
        await riderAPI.updateStatus(value ? 'online' : 'offline');
      } catch (finalErr: any) {
        console.warn('Availability toggle failed:', finalErr?.response?.data || finalErr?.message);
        setIsOnline(previous); // revert
        const message = finalErr?.response?.data?.message || 'Could not change availability';
        Alert.alert('Status Update Failed', message);
      }
    } finally {
      setLoadingStatus(false);
    }
  };

  const refreshProfile = async () => {
    setProfileLoading(true);
    try {
      const account = await riderAuthAPI.getAccount();
      if (account?.data) {
        // minimal fields already stored in context; stats extracted earlier via user dependency
      }
      const statusRes = await riderAPI.getStatus().catch(()=>null);
      if (statusRes?.data) setIsOnline(statusRes.data.status === 'online');
      const earnRes = await riderAPI.getEarnings('today').catch(()=>null);
      if (earnRes?.data) setTodayEarnings(earnRes.data.total ?? null);
    } finally {
      setProfileLoading(false);
    }
  };

  const renderNotifications = () => {
    return notificationList.map((notification, index) => (
      <View key={index} style={[styles.notificationItem, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.notificationTitle, { color: theme.colors.text }]}>{notification.title}</Text>
        <Text style={[styles.notificationBody, { color: theme.colors.textSecondary }]}>{notification.body}</Text>
      </View>
    ));
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView 
        style={[styles.scrollView, { backgroundColor: theme.colors.background }]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <LinearGradient 
          colors={theme.isDark ? [theme.colors.surface, theme.colors.primary] : ['#1E40AF', '#3B82F6']} 
          style={[styles.header, { paddingTop: 60 }]}
        >
          <BlurView intensity={20} tint={theme.isDark ? "dark" : "light"} style={styles.profileOverlay}>
            <View style={styles.profileInfo}>
              <Animated.View 
                style={[
                  styles.avatar,
                  {
                    transform: [{
                      scale: scrollY.interpolate({
                        inputRange: [0, 100],
                        outputRange: [1, 0.8],
                        extrapolate: 'clamp',
                      })
                    }]
                  }
                ]}
              >
                <Text style={styles.avatarText}>
                  {/* Get initials from first and last name */}
                  {(user?.firstName?.[0] || '') + (user?.lastName?.[0] || '') || 'U'}
                </Text>
              </Animated.View>
              
              <Animated.View
                style={{
                  opacity: scrollY.interpolate({
                    inputRange: [0, 50],
                    outputRange: [1, 0.7],
                    extrapolate: 'clamp',
                  })
                }}
              >
                <Text style={styles.name}>{user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User'}</Text>
                <Text style={styles.email}>{user?.email || 'No email'}</Text>
                <View style={styles.badgeRow}>
                  {user?.isVerified && (
                    <View style={styles.badgeVerified}>
                      <Ionicons name="checkmark-circle" size={14} color="#fff" />
                      <Text style={styles.badgeText}>Verified</Text>
                    </View>
                  )}
                  {vehicleType && (
                    <View style={styles.badgeNeutral}>
                      <Ionicons name="car-outline" size={14} color="#1E40AF" />
                      <Text style={styles.badgeNeutralText}>{vehicleType}</Text>
                    </View>
                  )}
                </View>
              </Animated.View>
              
              <View>
                <Animated.View style={[styles.pulseWrapper, { opacity: pulseAnim.interpolate({ inputRange: [0,1], outputRange: [0.4, 0] }), transform: [{ scale: pulseAnim.interpolate({ inputRange: [0,1], outputRange: [1,1.6] }) }] }]} />
                <View style={styles.onlineStatus}>
                  <Text style={styles.statusLabel}>{t('availableForDeliveries')}</Text>
                  <Switch
                    value={isOnline}
                    onValueChange={toggleOnline}
                    trackColor={{ false: 'rgba(255,255,255,0.3)', true: 'rgba(255,255,255,0.5)' }}
                    thumbColor={loadingStatus ? '#FBBF24' : (isOnline ? '#FFFFFF' : '#D1D5DB')}
                  />
                </View>
              </View>
            </View>
          </BlurView>
        </LinearGradient>

        <View style={[styles.content, { backgroundColor: 'transparent' }]}>
          <Animated.View 
            style={[
              styles.statsContainer,
              {
                transform: [{
                  translateY: scrollY.interpolate({
                    inputRange: [0, 100],
                    outputRange: [0, -20],
                    extrapolate: 'clamp',
                  })
                }]
              }
            ]}
          >
            {profileStats.map((stat, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.statCard,
                  {
                    backgroundColor: theme.isDark ? 'rgba(55, 65, 81, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                    opacity: statAnimations[index],
                    transform: [
                      { translateY: statAnimations[index].interpolate({ inputRange: [0,1], outputRange: [20,0] }) },
                      { scale: scrollY.interpolate({ inputRange: [0, 100], outputRange: [1, 0.95], extrapolate: 'clamp' }) }
                    ]
                  }
                ]}
              >
                <Ionicons name={stat.icon as any} size={24} color={theme.colors.primary} />
                <Text style={[styles.statValue, { color: theme.colors.text }]}>{countUps[index]}</Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{stat.label}</Text>
              </Animated.View>
            ))}
          </Animated.View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>{t('account')}</Text>

          {/* Account detail rows */}
          <View style={[styles.detailRow, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}> 
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Full Name</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>{user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim()}</Text>
          </View>
          <View style={[styles.detailRow, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}> 
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Email</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>{user?.email}</Text>
          </View>
            <View style={[styles.detailRow, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}> 
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Phone</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>{user?.phoneNumber || user?.phoneNumbers?.find(p=>p.isPrimary)?.number || '—'}</Text>
          </View>
          <View style={[styles.detailRow, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}> 
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Vehicle Type</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>{vehicleType || '—'}</Text>
          </View>
          <View style={[styles.detailRowLast, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}> 
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Verified</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>{user?.isVerified ? 'Yes' : 'No'}</Text>
          </View>

          <TouchableOpacity style={[styles.refreshButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]} onPress={refreshProfile} disabled={profileLoading}>
            <Ionicons name="refresh" size={18} color={theme.colors.primary} />
            <Text style={[styles.refreshText, { color: theme.colors.primary }]}>{profileLoading ? 'Refreshing...' : 'Refresh'}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]} onPress={handleEditProfile}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="person-outline" size={24} color={theme.colors.textSecondary} />
              <Text style={[styles.menuItemText, { color: theme.colors.text }]}>{t('editProfile')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.menuItem, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="notifications-outline" size={24} color={theme.colors.textSecondary} />
              <Text style={[styles.menuItemText, { color: theme.colors.text }]}>{t('pushNotifications')}</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
              thumbColor={notifications ? theme.colors.primary : theme.colors.textSecondary}
            />
          </View>

          <LanguageSelector />

          <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]} onPress={handleSettings}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="settings-outline" size={24} color={theme.colors.textSecondary} />
              <Text style={[styles.menuItemText, { color: theme.colors.text }]}>{t('settings')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}
            onPress={() => navigation.navigate('VehicleInfo' as never)}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="car-outline" size={24} color={theme.colors.textSecondary} />
              <Text style={[styles.menuItemText, { color: theme.colors.text }]}>{t('vehicleInformation')}</Text>
            </View>
            <View style={styles.vehicleInfo}>
              <Text style={[styles.vehicleText, { color: theme.colors.textSecondary }]}>
                {user?.vehicles && user.vehicles.length > 0 
                  ? user.vehicles.find(v => v.default)?.name || user.vehicles[0].name 
                  : t('notSet') || 'Not set'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}
            onPress={() => navigation.navigate('PhoneNumbers' as never)}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="call-outline" size={24} color={theme.colors.textSecondary} />
              <Text style={[styles.menuItemText, { color: theme.colors.text }]}>{t('phoneNumber')}</Text>
            </View>
            <View style={styles.phoneInfo}>
              <Text style={[styles.phoneText, { color: theme.colors.textSecondary }]}>
                {user?.phoneNumber || 
                 (user?.phoneNumbers && user.phoneNumbers.length > 0 
                  ? user.phoneNumbers.find(p => p.isPrimary)?.number || user.phoneNumbers[0].number 
                  : t('notSet') || 'Not set')}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Notifications</Text>
          {renderNotifications()}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>{t('support')}</Text>
          
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]} onPress={handleSupport}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="help-circle-outline" size={24} color={theme.colors.textSecondary} />
              <Text style={[styles.menuItemText, { color: theme.colors.text }]}>{t('helpSupport')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]} onPress={handlePrivacy}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="shield-outline" size={24} color={theme.colors.textSecondary} />
              <Text style={[styles.menuItemText, { color: theme.colors.text }]}>{t('privacyPolicy')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]} onPress={handleTerms}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="document-text-outline" size={24} color={theme.colors.textSecondary} />
              <Text style={[styles.menuItemText, { color: theme.colors.text }]}>{t('termsService')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.logoutButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#DC2626" />
          <Text style={styles.logoutText}>{t('logout')}</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>Delivery Driver App v1.0.0</Text>
        </View>
      </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  profileOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    margin: 10,
  },
  profileInfo: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#DBEAFE',
    marginBottom: 24,
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  statusLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    marginRight: 12,
  },
  content: {
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  badgeRow: { flexDirection: 'row', marginTop: 8 },
  badgeVerified: { flexDirection: 'row', backgroundColor: '#059669', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 8, alignItems: 'center' },
  badgeText: { color: '#fff', fontSize: 12, marginLeft: 4, fontWeight: '600' },
  badgeNeutral: { flexDirection: 'row', backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignItems: 'center' },
  badgeNeutralText: { color: '#1E40AF', fontSize: 12, marginLeft: 4, fontWeight: '600' },
  section: {
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  detailRowLast: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  detailLabel: { fontSize: 14, fontWeight: '500' },
  detailValue: { fontSize: 14, fontWeight: '600' },
  refreshButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: 6, paddingVertical: 10, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth },
  refreshText: { marginLeft: 6, fontSize: 14, fontWeight: '600' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 16,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleText: {
    fontSize: 14,
    marginRight: 8,
  },
  phoneInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneText: {
    fontSize: 14,
    marginRight: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 30,
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 12,
  },
  pulseWrapper: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 72,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  notificationItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  notificationBody: {
    fontSize: 14,
    marginTop: 4,
  },
});
