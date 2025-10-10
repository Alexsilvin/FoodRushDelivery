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
import { riderService, analyticsService } from '../../services';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import LanguageSelector from '../../components/LanguageSelector';
import { useStaggeredFadeIn } from '../../hooks/useStaggeredFadeIn';
import { useCountUp } from '../../hooks/useCountUp';
import { useNotifications } from '../../contexts/NotificationContext';
import { useUpdateRiderStatus, useUpdateAvailability } from '../../hooks';
import { TabScreenProps } from '../../types/navigation.types';
import CommonView from '../../components/CommonView';
import { useFloatingTabBarHeight } from '../../hooks/useFloatingTabBarHeight';

type Props = TabScreenProps<'Profile'>;

export default function ProfileScreen({ navigation, route }: Props) {
  const { user, logout, refreshUserProfile } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const tabBarHeight = useFloatingTabBarHeight();
  const {
    notifications: notificationList,
    unreadCount,
    notificationsEnabled,
    setNotificationsEnabled,
    permissions,
    requestPermissions,
  } = useNotifications();
  
  // Rider status hooks
  const updateStatusMutation = useUpdateRiderStatus();
  const updateAvailabilityMutatin = useUpdateAvailability();
  
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [todayEarnings, setTodayEarnings] = useState<number | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [completedDeliveries, setCompletedDeliveries] = useState<number | null>(null);
  const [completionRate, setCompletionRate] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  // Debug user data
  useEffect(() => {
    console.log('🔍 ProfileScreen - User data:', {
      user,
      fullName: user?.fullName,
      firstName: user?.firstName,
      lastName: user?.lastName,
      email: user?.email,
      phoneNumber: user?.phoneNumber,
      vehicleType: user?.vehicleType,
      vehicles: user?.vehicles,
      isVerified: user?.isVerified,
      state: user?.state
    });
  }, [user]);

  // Use the data directly from the normalized user object
  const displayName = user?.fullName || 'User';
  const displayEmail = user?.email || 'No email provided';
  const displayPhone = user?.phoneNumber || '—';
  const vehicleType = user?.vehicleType || '';

  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

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
    const termsContent = `Terms and Conditions

1. Parties

1.1 These Terms and Conditions ("Terms") are between FoodRush, a food ordering and delivery company ("FoodRush", "we", "our", or "us") and
1.2 Any individual or entity applying to deliver orders via the FoodRush mobile application or platform ("Driver", "you", "your").

2. Definitions

• Customer: A person or entity who places an order through FoodRush for food or other items.
• Merchant: Restaurant or food-retail business partnered with FoodRush that prepares items for delivery.
• Delivery Order: Order placed by a Customer to be delivered to a given address.
• Third-Party Courier Partner (Courier Partner): An independent third party engaging with FoodRush to provide delivery services under terms defined by these Terms.
• Incident: Any accident, injury, damage, loss, theft, or other unwanted event involving a Driver, a third party, food, or property, during or related to provision of delivery services.

3. Driver Status and Relationship

3.1 You are an independent contractor, not an employee of FoodRush. Nothing in these Terms will create an employment, agency, partnership, or joint-venture relationship between you and FoodRush.

3.2 As a Courier Partner/Driver, you agree to comply with all applicable Cameroonian laws, local regulations, ordinances, and required licenses (e.g., transportation permits, motor vehicle registration, insurance, driver's license, etc.).

4. Eligibility, Background, Safety Requirements

4.1 You warrant that you meet all of the following:

• Are at least 18 years old.
• Legally permitted to work in Cameroon.
• Hold a valid and applicable driver's license.
• Own or have regular access to a motor vehicle or motorcycle which is roadworthy, properly registered and insured in Cameroon.
• Have valid insurance covering the driver and vehicle (third-party liability at minimum; additional coverage is strongly recommended).

4.2 FoodRush may require screening, including identity verification, criminal-history check, driving record check, and/or health check. FoodRush may refuse or suspend access to the app if these checks are unsatisfactory.

4.3 You must always comply with safety standards, including but not limited to:

• Wearing appropriate safety gear (helmet, reflective clothing, etc.) when applicable.
• Following traffic laws, speed limits, and road safety regulations.
• Ensuring food is delivered in sanitary conditions (covered containers, clean transport, proper packaging).
• Only driving when physically and mentally fit (no intoxication, fatigue, etc.).

5. Courier Partner Services & Obligations

5.1 You will accept Delivery Orders via the FoodRush app, pick up the ordered items from Merchants, transport them safely, and deliver them to Customers at the requested delivery address.

5.2 You must handle the food and items with care to avoid damage, spoilage, or contamination.

5.3 You are responsible for the custody, care, and security of the food and order between pick up and delivery.

5.4 You must maintain communication (via app or telephone) about any delays, issues, or inability to fulfill an order, and follow directions or instructions from FoodRush or the Merchant when feasible and reasonable.

6. Payment, Fees & Expenses

6.1 FoodRush will pay you a delivery fee, calculated according to the rates shown in the app or as otherwise agreed.

6.2 You are responsible for all costs incurred in performing deliveries, including but not limited to fuel, vehicle maintenance, insurance, permits, parking fees, mobile data, etc.

6.3 Any applicable deductions (e.g., for taxes, social contributions, damages, etc.) may be made in accordance with Cameroonian law.

7. Liability, Indemnity, Insurance

7.1 Limitation of Liability

• FoodRush will not be liable for any direct or indirect losses, costs, claims, or damages you suffer arising out of or in connection with your performance as a Driver, except to the extent required by law.
• FoodRush makes no guarantees of minimum earnings.

7.2 Indemnification
You agree to defend, indemnify and hold harmless FoodRush, its owners, shareholders, directors, employees, agents, and affiliates from and against any and all claims, liabilities, losses, damages, costs, and expenses (including reasonable legal fees) arising out of or in connection with:

• Your breach of these Terms;
• Your negligence or willful misconduct;
• Any incident caused during transportation or delivery;
• Violation by you of any law or regulation;

7.3 Insurance & Risk

• You are responsible for obtaining and maintaining any required insurance coverage.
• In the case of accidents, injuries to third parties, or damage to property, you are liable, unless liability is otherwise accepted under applicable insurance covering you or your vehicle.
• FoodRush may require proof of insurance in a form acceptable to us.

8. Safety and Incident Response

8.1 If there is an incident, you must immediately:

• Secure the scene and ensure safety (e.g. move the vehicle if safe to do so).
• Call emergency services if there are injuries.
• Report the incident through the app or by contacting FoodRush support, providing all requested information (photos, statements, driver license, vehicle documents, insurance, etc.).

8.2 You must cooperate fully with any investigation by FoodRush or relevant authorities, including submitting to interviews and providing documentation.

8.3 FoodRush may suspend access to the app or deactivate your Driver account pending investigation.

8.4 In the event of food spoilage, contamination, or health/safety issue, you may be held responsible and FoodRush may require you to cover costs of remedy (refunds, replacement food, penalties, etc.), unless fault lies elsewhere.

9. Term, Termination & Suspension

9.1 These Terms become effective when you accept them and continue until terminated.

9.2 Either party may terminate this relationship at any time, with or without cause, by giving notice:

• By you: via the app or written communication;
• By FoodRush: via app / written communication.

9.3 FoodRush may immediately suspend or deactivate your access, without notice, in cases including but not limited to:

• Serious breach of these Terms;
• Safety violations;
• Criminal acts;
• Fraud or misrepresentation;
• Repeated customer complaints;

10. Confidentiality and Data Protection

10.1 You will protect all Customer, Merchant, and FoodRush confidential information obtained in the course of your work, including but not limited to addresses, order contents, customer phone numbers, private communications, etc.

10.2 FoodRush will process your personal data in accordance with applicable Cameroonian data protection laws. By accepting these Terms, you consent to the collection, storage, processing, and use of your data for purposes necessary for the service (identity verification, payments, safety, customer service, etc.).

11. Intellectual Property

11.1 FoodRush retains all rights, title, and interest in its trademarks, logos, app, website, software, data, algorithms, etc. You may not use them except as required to perform deliveries under these Terms.

11.2 Any feedback, suggestions, improvements you submit may be used by FoodRush without obligation to you.

12. Dispute Resolution

12.1 If a dispute arises between you and FoodRush, you agree to attempt to resolve it amicably by discussion.

12.2 If not resolved within 30 days, either party may submit the dispute to arbitration under Cameroonian law, or to a competent court in Cameroon.

13. Governing Law

These Terms are governed by and construed in accordance with the laws of the Republic of Cameroon.

14. Amendments

FoodRush may revise these Terms from time to time. We will provide notice of changes via the app or other reasonable means. Continued use of the app/delivery services after such notice constitutes acceptance of the updated Terms.

15. Miscellaneous

15.1 Severability: If any provision of these Terms is held invalid or unenforceable, the remaining provisions will remain in full force.

15.2 Waiver: Failure by FoodRush to enforce any right under these Terms is not a waiver of that right.

15.3 Assignment: You may not assign or transfer these Terms or your obligations without FoodRush's written consent. FoodRush may assign or transfer these Terms to any successor.

15.4 Entire Agreement: These Terms, together with any policies, privacy policy, or other agreements referenced herein, constitute the entire agreement between you and FoodRush regarding your role as a Delivery Driver.`;

    Alert.alert(
      'Terms and Conditions',
      termsContent,
      [
        {
          text: 'Close',
          style: 'cancel'
        }
      ],
      {
        cancelable: true
      }
    );
  };

  const handleSettings = () => {
    navigation.navigate('Settings' as never);
  };

  const profileStats = [
    { label: t('totalDeliveries'), value: completedDeliveries, icon: 'car-outline', type: 'int' as const, color: '#3B82F6' },
    { label: t('rating'), value: rating, icon: 'star', type: 'rating' as const, color: '#F59E0B' },
    { label: t('todayEarnings') || 'Today', value: todayEarnings, icon: 'wallet-outline', type: 'currency' as const, color: '#10B981' },
    { label: t('completionRate'), value: completionRate ? parseFloat(String(completionRate).replace(/%/, '')) : null, icon: 'checkmark-circle-outline', type: 'percent' as const, color: '#8B5CF6' },
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
    
    // Ensure val is always a string or number, never an object
    const safeVal = typeof val === 'object' ? '0' : String(val);
    
    switch (stat.type) {
      case 'currency': return `${safeVal}`;
      case 'percent': return `${safeVal}%`;
      default: return safeVal;
    }
  });

  // Fetch dynamic profile info
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setProfileLoading(true);
        console.log('📊 Fetching analytics data...');
        
        // Fetch all stats from analytics summary endpoint
        const summaryRes = await analyticsService.getRiderSummary().catch((error) => {
          console.warn('⚠️ Analytics summary failed:', error?.response?.data || error.message);
          return null;
        });
        
        if (mounted && summaryRes) {
          // Handle the API response structure: {status_code, message, data}
          const analyticsData = summaryRes.data || summaryRes;
          console.log('✅ Analytics data received:', analyticsData);
          
          // Safely extract values with proper type checking
          const earnings = typeof analyticsData.todayEarnings === 'number' ? analyticsData.todayEarnings : null;
          const deliveries = typeof analyticsData.completedDeliveries === 'number' ? analyticsData.completedDeliveries : null;
          const ratingValue = typeof analyticsData.rating === 'number' ? analyticsData.rating : null;
          const completionValue = typeof analyticsData.completionRate === 'number' ? analyticsData.completionRate : null;
          
          setTodayEarnings(earnings);
          setCompletedDeliveries(deliveries);
          setRating(ratingValue);
          setCompletionRate(completionValue != null ? `${completionValue}%` : null);
        } else {
          console.log('📊 No analytics data available');
          // Don't set dummy data - leave as null to show "—"
          setTodayEarnings(null);
          setCompletedDeliveries(null);
          setRating(null);
          setCompletionRate(null);
        }
        
        // Fetch balance if needed
        const balanceRes = await analyticsService.getRiderBalance().catch((error) => {
          console.warn('⚠️ Balance fetch failed:', error?.response?.data || error.message);
          return null;
        });
        
        if (mounted && balanceRes) {
          // Handle the API response structure: {status_code, message, data}
          const balanceData = balanceRes.data || balanceRes;
          console.log('💰 Balance data received:', balanceData);
          
          // Safely extract balance value
          const balanceValue = typeof balanceData.balance === 'number' ? balanceData.balance : null;
          setBalance(balanceValue);
        } else {
          console.log('💰 No balance data available');
          setBalance(null); // No dummy data
        }
      } finally {
        mounted && setProfileLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  // Handle notification permission requests
  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled && permissions && !permissions.granted) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(
          '⚠️ Permission Required',
          'Notification permissions are required to receive delivery updates. Please enable them in your device settings.',
          [{ text: 'OK', style: 'default' }]
        );
        return; // Don't enable if permissions not granted
      }
    }
    
    setNotificationsEnabled(enabled);
    
    // Show success message
    Alert.alert(
      '✅ Notifications Updated',
      `Push notifications have been ${enabled ? 'enabled' : 'disabled'}.`,
      [{ text: 'OK', style: 'default' }]
    );
  };

  const toggleOnline = async (value: boolean) => {
    const previousValue = isOnline;
    setIsOnline(value);
    
    try {
      // Use the new rider status mutation
      await updateStatusMutation.mutateAsync(value);
      console.log(`✅ Rider status updated to: ${value ? 'online' : 'offline'}`);
      
      // Show success alert
      Alert.alert(
        '✅ Status Updated',
        `You are now ${value ? 'online and available' : 'offline'} for deliveries.`,
        [{ text: 'OK', style: 'default' }]
      );
    } catch (e: any) {
      try {
        // Fallback to availability mutation
        await updateAvailabilityMutation.mutateAsync({ available: value });
        console.log(`✅ Rider availability updated to: ${value}`);
        
        // Show success alert for fallback
        Alert.alert(
          '✅ Availability Updated',
          `You are now ${value ? 'available' : 'unavailable'} for deliveries.`,
          [{ text: 'OK', style: 'default' }]
        );
      } catch (finalErr: any) {
        console.warn('Status toggle failed:', finalErr?.response?.data || finalErr?.message);
        setIsOnline(previousValue); // Revert to previous state
        const message = finalErr?.response?.data?.message || 'Could not change status';
        Alert.alert(
          '❌ Status Update Failed', 
          message,
          [{ text: 'Try Again', style: 'default' }]
        );
      }
    }
  };

  const refreshProfile = async () => {
    setProfileLoading(true);
    try {
      console.log('🔄 Refreshing profile data...');
      
      // First refresh the user profile from backend
      const profileRefreshed = await refreshUserProfile();
      if (profileRefreshed) {
        console.log('✅ User profile refreshed successfully');
      }
      
      // Then refresh analytics data
      const summaryRes = await analyticsService.getRiderSummary().catch((error) => {
        console.warn('⚠️ Refresh analytics failed:', error?.response?.data || error.message);
        return null;
      });
      
      if (summaryRes) {
        // Handle the API response structure: {status_code, message, data}
        const analyticsData = summaryRes.data || summaryRes;
        console.log('✅ Refresh analytics data received:', analyticsData);
        
        // Safely extract values with proper type checking
        const earnings = typeof analyticsData.todayEarnings === 'number' ? analyticsData.todayEarnings : null;
        const deliveries = typeof analyticsData.completedDeliveries === 'number' ? analyticsData.completedDeliveries : null;
        const ratingValue = typeof analyticsData.rating === 'number' ? analyticsData.rating : null;
        const completionValue = typeof analyticsData.completionRate === 'number' ? analyticsData.completionRate : null;
        
        setTodayEarnings(earnings);
        setCompletedDeliveries(deliveries);
        setRating(ratingValue);
        setCompletionRate(completionValue != null ? `${completionValue}%` : null);
      } else {
        console.log('📊 Refresh: No analytics data, keeping current values');
      }
      
      const balanceRes = await analyticsService.getRiderBalance().catch((error) => {
        console.warn('⚠️ Refresh balance failed:', error?.response?.data || error.message);
        return null;
      });
      
      if (balanceRes) {
        // Handle the API response structure: {status_code, message, data}
        const balanceData = balanceRes.data || balanceRes;
        console.log('💰 Refresh balance data received:', balanceData);
        
        // Safely extract balance value
        const balanceValue = typeof balanceData.balance === 'number' ? balanceData.balance : null;
        setBalance(balanceValue);
      } else {
        console.log('💰 Refresh: No balance data, keeping current value');
      }
      
      // Show success message
      Alert.alert(
        '✅ Profile Refreshed',
        'Your profile data has been updated successfully.',
        [{ text: 'OK', style: 'default' }]
      );
    } catch (error: any) {
      console.error('❌ Profile refresh failed:', error);
      Alert.alert(
        '❌ Refresh Failed',
        'Unable to refresh profile data. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const renderNotifications = () => {
    return notificationList.map((notification, index) => (
      <View key={index} style={[styles.notificationItem, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.notificationTitle, { color: theme.colors.text }]}>
          {String(notification.title || 'Notification')}
        </Text>
        <Text style={[styles.notificationBody, { color: theme.colors.textSecondary }]}>
          {String(notification.body || 'No content')}
        </Text>
      </View>
    ));
  };

  // Section separator component
  const SectionSeparator = () => (
    <View style={[styles.sectionSeparator, { backgroundColor: theme.colors.border }]} />
  );

  return (
    <CommonView showStatusBar={true} paddingHorizontal={0}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: tabBarHeight }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Header Section */}
        <LinearGradient 
          colors={theme.isDark ? [theme.colors.primary, '#1E40AF'] : ['#3B82F6', '#1E40AF']} 
          style={styles.header}
        >
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {user?.fullName ? user.fullName.split(' ').map(name => name[0]).join('').substring(0, 2).toUpperCase() : 'U'}
              </Text>
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={styles.name}>
                {String(displayName || 'User')}
              </Text>
              <Text style={styles.email}>{String(displayEmail || 'No email')}</Text>
              
              <View style={styles.badgeContainer}>
                {user?.isVerified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
                    <Text style={styles.badgeText}>Verified</Text>
                  </View>
                )}
                {vehicleType && (
                  <View style={styles.vehicleBadge}>
                    <Ionicons name="car-outline" size={14} color="#3B82F6" />
                    <Text style={styles.vehicleBadgeText}>{String(vehicleType || 'Vehicle')}</Text>
                  </View>
                )}
              </View>
            </View>
            
            <View style={styles.statusContainer}>
              <Text style={styles.statusLabel}>{t('availableForDeliveries')}</Text>
              <Switch
                value={isOnline}
                onValueChange={toggleOnline}
                trackColor={{ false: 'rgba(255,255,255,0.3)', true: 'rgba(255,255,255,0.6)' }}
                thumbColor={(updateStatusMutation.isPending || updateAvailabilityMutation.isPending) ? '#F59E0B' : (isOnline ? '#FFFFFF' : '#E5E7EB')}
                disabled={updateStatusMutation.isPending || updateAvailabilityMutation.isPending}
              />
            </View>
          </View>
        </LinearGradient>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            {profileStats.map((stat, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.statCard,
                  { backgroundColor: theme.colors.card },
                  { opacity: statAnimations[index] }
                ]}
              >
                <View style={[styles.statIconContainer, { backgroundColor: stat.color + '15' }]}>
                  <Ionicons name={stat.icon as any} size={24} color={stat.color} />
                </View>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {String(countUps[index] || '—')}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  {stat.label}
                </Text>
              </Animated.View>
            ))}
          </View>
        </View>

        <SectionSeparator />

        {/* Account Details Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t('account')}
          </Text>
          
          <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                Full Name
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                {String(displayName || 'User')}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                Email
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                {String(displayEmail || 'No email')}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                Phone
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                {String(displayPhone || '—')}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                Vehicle Type
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                {String(vehicleType || '—')}
              </Text>
            </View>
            
            <View style={[styles.detailRow, styles.lastDetailRow]}>
              <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                Verified
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                {user?.isVerified ? 'Yes' : 'No'}
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.refreshButton, { backgroundColor: theme.colors.card }]} 
            onPress={refreshProfile} 
            disabled={profileLoading}
          >
            <Ionicons name="refresh" size={18} color="#3B82F6" />
            <Text style={styles.refreshText}>
              {profileLoading ? 'Refreshing...' : 'Refresh Profile'}
            </Text>
          </TouchableOpacity>
        </View>

        <SectionSeparator />

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Settings
          </Text>
          
          <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
            <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#3B82F615' }]}>
                  <Ionicons name="person-outline" size={20} color="#3B82F6" />
                </View>
                <Text style={[styles.menuItemText, { color: theme.colors.text }]}>
                  {t('editProfile')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#F59E0B15' }]}>
                  <Ionicons name="notifications-outline" size={20} color="#F59E0B" />
                </View>
                <Text style={[styles.menuItemText, { color: theme.colors.text }]}>
                  {t('pushNotifications')}
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: theme.colors.border, true: '#3B82F640' }}
                thumbColor={notificationsEnabled ? '#3B82F6' : theme.colors.textSecondary}
              />
            </View>

            <LanguageSelector />

            <TouchableOpacity style={styles.menuItem} onPress={handleSettings}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#6B728015' }]}>
                  <Ionicons name="settings-outline" size={20} color="#6B7280" />
                </View>
                <Text style={[styles.menuItemText, { color: theme.colors.text }]}>
                  {t('settings')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigation.navigate('VehicleInfo' as never)}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#8B5CF615' }]}>
                  <Ionicons name="car-outline" size={20} color="#8B5CF6" />
                </View>
                <Text style={[styles.menuItemText, { color: theme.colors.text }]}>
                  {t('vehicleInformation')}
                </Text>
              </View>
              <View style={styles.menuItemRight}>
                <Text style={[styles.menuItemSubtext, { color: theme.colors.textSecondary }]}>
                  {vehicleType || t('notSet') || 'Not set'}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.menuItem, styles.lastMenuItem]}
              onPress={() => navigation.navigate('PhoneNumbers' as never)}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#10B98115' }]}>
                  <Ionicons name="call-outline" size={20} color="#10B981" />
                </View>
                <Text style={[styles.menuItemText, { color: theme.colors.text }]}>
                  {t('phoneNumber')}
                </Text>
              </View>
              <View style={styles.menuItemRight}>
                <Text style={[styles.menuItemSubtext, { color: theme.colors.textSecondary }]}>
                  {displayPhone === '—' ? (t('notSet') || 'Not set') : displayPhone}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <SectionSeparator />

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t('support')}
          </Text>
          
          <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
            <TouchableOpacity style={styles.menuItem} onPress={handleSupport}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#3B82F615' }]}>
                  <Ionicons name="help-circle-outline" size={20} color="#3B82F6" />
                </View>
                <Text style={[styles.menuItemText, { color: theme.colors.text }]}>
                  {t('helpSupport')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handlePrivacy}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#10B98115' }]}>
                  <Ionicons name="shield-outline" size={20} color="#10B981" />
                </View>
                <Text style={[styles.menuItemText, { color: theme.colors.text }]}>
                  {t('privacyPolicy')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuItem, styles.lastMenuItem]} onPress={handleTerms}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#F59E0B15' }]}>
                  <Ionicons name="document-text-outline" size={20} color="#F59E0B" />
                </View>
                <Text style={[styles.menuItemText, { color: theme.colors.text }]}>
                  {t('termsService')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications Section */}
        {notificationList.length > 0 && (
          <>
            <SectionSeparator />
            <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Notifications
            </Text>
            <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
              {renderNotifications()}
            </View>
            </View>
          </>
        )}

        <SectionSeparator />

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.logoutButton, { backgroundColor: theme.colors.card }]} 
            onPress={handleLogout}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: '#DC262615' }]}>
              <Ionicons name="log-out-outline" size={20} color="#DC2626" />
            </View>
            <Text style={styles.logoutText}>{t('logout')}</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
            Delivery Driver App v1.0.0
          </Text>
        </View>
      </ScrollView>
    </CommonView>
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
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  profileSection: {
    alignItems: 'center',
  },
  avatarContainer: {
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
  profileInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  vehicleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  vehicleBadgeText: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 12,
  },
  statusLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  statsSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
    minHeight: 56,
  },
  lastDetailRow: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 12,
    gap: 8,
  },
  refreshText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
    minHeight: 60,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  menuItemSubtext: {
    fontSize: 14,
    maxWidth: 120,
    textAlign: 'right',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    gap: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
  },
  notificationItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 14,
  },
  sectionSeparator: {
    height: 1,
    marginHorizontal: 20,
    marginVertical: 16,
    opacity: 0.3,
  },
});