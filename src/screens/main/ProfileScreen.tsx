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

  // Ensure user info is fetched on mount if missing
  useEffect(() => {
    if (!user) {
      refreshUserProfile();
    }
  }, [user, refreshUserProfile]);
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
  const updateAvailabilityMutation = useUpdateAvailability();
  
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
  // Prefer nested user fields if present
  const displayName = user?.fullName || user?.user?.fullName || 'User';
  const displayEmail = user?.email || user?.user?.email || 'No email provided';
  const displayPhone = user?.phoneNumber || user?.user?.phoneNumber || '—';
  const vehicleType = user?.vehicleType || user?.user?.vehicleType || '';
  // Render user info directly from context
  // ...existing code...

  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Collapsing header animations
  const avatarSize = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [100, 40],
    extrapolate: 'clamp',
  });

  const avatarPositionY = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, -40],
    extrapolate: 'clamp',
  });

  const avatarPositionX = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, 120],
    extrapolate: 'clamp',
  });

  const profileInfoOpacity = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [280, 70],
    extrapolate: 'clamp',
  });

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
          const analyticsData = summaryRes;
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
          const balanceData = balanceRes;
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
        const analyticsData = summaryRes;
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
        const balanceData = balanceRes;
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
        {/* Collapsing Header Section */}
        <Animated.View 
          style={[
            styles.collapsibleHeader,
            { 
              height: headerHeight,
              backgroundColor: theme.isDark ? '#0F172A' : '#F8FAFC',
              overflow: 'hidden'
            }
          ]}
        >
          <LinearGradient 
            colors={theme.isDark ? ['#0F172A', '#1E3A8A'] : ['#F0F9FF', '#E0F2FE']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            {/* Large Avatar */}
            <Animated.View 
              style={[
                styles.largeAvatarContainer,
                {
                  width: avatarSize,
                  height: avatarSize,
                  transform: [
                    { translateY: avatarPositionY },
                    { translateX: avatarPositionX },
                  ]
                }
              ]}
            >
              <Text style={styles.avatarText}>
                {user?.fullName ? user.fullName.split(' ').map(name => name[0]).join('').substring(0, 2).toUpperCase() : 'U'}
              </Text>
            </Animated.View>

            {/* Profile Info - Fades out on scroll */}
            <Animated.View 
              style={[
                styles.profileInfoContainer,
                { opacity: profileInfoOpacity }
              ]}
            >
              <Text style={[styles.headerName, { color: theme.isDark ? '#FFFFFF' : '#0F172A' }]}>
                {String(displayName || 'User')}
              </Text>
              <Text style={[styles.headerEmail, { color: theme.isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(15, 23, 42, 0.6)' }]}>{String(displayEmail || 'No email')}</Text>
              
              <View style={styles.headerBadgeContainer}>
                {user?.isVerified && (
                  <View style={[styles.headerVerifiedBadge, { backgroundColor: theme.isDark ? '#10B981' : '#D1FAE5' }]}>
                    <Ionicons name="checkmark-circle" size={13} color={theme.isDark ? '#FFFFFF' : '#059669'} />
                    <Text style={[styles.headerBadgeText, { color: theme.isDark ? '#FFFFFF' : '#059669' }]}>Verified</Text>
                  </View>
                )}
                {vehicleType && (
                  <View style={[styles.headerVehicleBadge, { backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(59, 130, 246, 0.1)', borderColor: theme.isDark ? 'rgba(96, 165, 250, 0.3)' : 'rgba(59, 130, 246, 0.2)' }]}>
                    <Ionicons name="car-outline" size={13} color={theme.isDark ? '#60A5FA' : '#3B82F6'} />
                    <Text style={[styles.headerVehicleBadgeText, { color: theme.isDark ? '#93C5FD' : '#1E40AF' }]}>{String(vehicleType || 'Vehicle')}</Text>
                  </View>
                )}
              </View>

              {/* Status Toggle */}
              <View style={[styles.headerStatusContainer, { backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(59, 130, 246, 0.08)', borderColor: theme.isDark ? 'rgba(96, 165, 250, 0.2)' : 'rgba(59, 130, 246, 0.2)' }]}>
                <Text style={[styles.headerStatusLabel, { color: theme.isDark ? '#FFFFFF' : '#0F172A' }]}>Available for Deliveries</Text>
                <Switch
                  value={isOnline}
                  onValueChange={toggleOnline}
                  trackColor={{ false: theme.isDark ? 'rgba(255,255,255,0.3)' : 'rgba(100, 116, 139, 0.3)', true: theme.isDark ? 'rgba(255,255,255,0.6)' : 'rgba(59, 130, 246, 0.4)' }}
                  thumbColor={(updateStatusMutation.isPending || updateAvailabilityMutation.isPending) ? '#F59E0B' : (isOnline ? (theme.isDark ? '#FFFFFF' : '#3B82F6') : '#E5E7EB')}
                  disabled={updateStatusMutation.isPending || updateAvailabilityMutation.isPending}
                />
              </View>
            </Animated.View>
          </LinearGradient>
        </Animated.View>

        {/* Stats Section */}
        <View style={[styles.statsSection, { backgroundColor: theme.isDark ? '#0F172A' : '#F8FAFC' }]}>
          <View style={styles.statsGrid}>
            {profileStats.map((stat, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.statCard,
                  { 
                    backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(59, 130, 246, 0.08)',
                    borderColor: theme.isDark ? 'rgba(96, 165, 250, 0.2)' : 'rgba(59, 130, 246, 0.15)'
                  },
                  { opacity: statAnimations[index] }
                ]}
              >
                <View style={[styles.statIconContainer, { backgroundColor: theme.isDark ? stat.color + '15' : stat.color + '20' }]}>
                  <Ionicons name={stat.icon as any} size={24} color={stat.color} />
                </View>
                <Text style={[styles.statValue, { color: theme.isDark ? '#FFFFFF' : '#0F172A' }]}>
                  {String(countUps[index] || '—')}
                </Text>
                <Text style={[styles.statLabel, { color: theme.isDark ? '#93C5FD' : '#1E40AF' }]}>
                  {stat.label}
                </Text>
              </Animated.View>
            ))}
          </View>
        </View>

        <SectionSeparator />

        {/* Account Details Section */}
        <View style={[styles.section, { backgroundColor: theme.isDark ? '#0F172A' : '#F8FAFC' }]}>
          <Text style={[styles.sectionTitle, { color: theme.isDark ? '#FFFFFF' : '#0F172A' }]}>
            {t('account')}
          </Text>
          
          <View style={[
            styles.card, 
            { 
              backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(59, 130, 246, 0.05)',
              borderWidth: 1,
              borderColor: theme.isDark ? 'rgba(96, 165, 250, 0.2)' : 'rgba(59, 130, 246, 0.15)'
            }
          ]}>
            <View style={[styles.detailRow, { borderBottomColor: theme.isDark ? 'rgba(96, 165, 250, 0.1)' : 'rgba(59, 130, 246, 0.1)' }]}>
              <Text style={[styles.detailLabel, { color: theme.isDark ? '#93C5FD' : '#1E40AF' }]}>
                Full Name
              </Text>
              <Text style={[styles.detailValue, { color: theme.isDark ? '#FFFFFF' : '#0F172A' }]}>
                {String(displayName || 'User')}
              </Text>
            </View>
            
            <View style={[styles.detailRow, { borderBottomColor: theme.isDark ? 'rgba(96, 165, 250, 0.1)' : 'rgba(59, 130, 246, 0.1)' }]}>
              <Text style={[styles.detailLabel, { color: theme.isDark ? '#93C5FD' : '#1E40AF' }]}>
                Email
              </Text>
              <Text style={[styles.detailValue, { color: theme.isDark ? '#FFFFFF' : '#0F172A' }]}>
                {String(displayEmail || 'No email')}
              </Text>
            </View>
            
            <View style={[styles.detailRow, { borderBottomColor: theme.isDark ? 'rgba(96, 165, 250, 0.1)' : 'rgba(59, 130, 246, 0.1)' }]}>
              <Text style={[styles.detailLabel, { color: theme.isDark ? '#93C5FD' : '#1E40AF' }]}>
                Phone
              </Text>
              <Text style={[styles.detailValue, { color: theme.isDark ? '#FFFFFF' : '#0F172A' }]}>
                {String(displayPhone || '—')}
              </Text>
            </View>
            
            <View style={[styles.detailRow, { borderBottomColor: theme.isDark ? 'rgba(96, 165, 250, 0.1)' : 'rgba(59, 130, 246, 0.1)' }]}>
              <Text style={[styles.detailLabel, { color: theme.isDark ? '#93C5FD' : '#1E40AF' }]}>
                Vehicle Type
              </Text>
              <Text style={[styles.detailValue, { color: theme.isDark ? '#FFFFFF' : '#0F172A' }]}>
                {String(vehicleType || '—')}
              </Text>
            </View>
            
            <View style={[styles.detailRow, styles.lastDetailRow]}>
              <Text style={[styles.detailLabel, { color: theme.isDark ? '#93C5FD' : '#1E40AF' }]}>
                Verified
              </Text>
              <Text style={[styles.detailValue, { color: theme.isDark ? '#FFFFFF' : '#0F172A' }]}>
                {user?.isVerified ? 'Yes' : 'No'}
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={[
              styles.refreshButton, 
              { 
                backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(59, 130, 246, 0.08)',
                borderWidth: 1,
                borderColor: theme.isDark ? 'rgba(96, 165, 250, 0.2)' : 'rgba(59, 130, 246, 0.15)'
              }
            ]} 
            onPress={refreshProfile} 
            disabled={profileLoading}
          >
            <Ionicons name="refresh" size={18} color={theme.isDark ? '#60A5FA' : '#3B82F6'} />
            <Text style={[styles.refreshText, { color: theme.isDark ? '#60A5FA' : '#3B82F6' }]}>
              {profileLoading ? 'Refreshing...' : 'Refresh Profile'}
            </Text>
          </TouchableOpacity>
        </View>

        <SectionSeparator />

        {/* Settings Section */}
        <View style={[styles.section, { backgroundColor: theme.isDark ? '#0F172A' : '#F8FAFC' }]}>
          <Text style={[styles.sectionTitle, { color: theme.isDark ? '#FFFFFF' : '#0F172A' }]}>
            Settings
          </Text>
          
          <View style={[
            styles.card, 
            { 
              backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(59, 130, 246, 0.05)',
              borderWidth: 1,
              borderColor: theme.isDark ? 'rgba(96, 165, 250, 0.2)' : 'rgba(59, 130, 246, 0.15)'
            }
          ]}>
            <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.isDark ? 'rgba(96, 165, 250, 0.1)' : 'rgba(59, 130, 246, 0.1)' }]} onPress={handleEditProfile}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconContainer, { backgroundColor: theme.isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.2)' }]}>
                  <Ionicons name="person-outline" size={20} color="#3B82F6" />
                </View>
                <Text style={[styles.menuItemText, { color: theme.isDark ? '#FFFFFF' : '#0F172A' }]}>
                  {t('editProfile')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.isDark ? '#64748B' : '#94A3B8'} />
            </TouchableOpacity>

            <View style={[styles.menuItem, { borderBottomColor: theme.isDark ? 'rgba(96, 165, 250, 0.1)' : 'rgba(59, 130, 246, 0.1)' }]}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconContainer, { backgroundColor: theme.isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.2)' }]}>
                  <Ionicons name="notifications-outline" size={20} color="#F59E0B" />
                </View>
                <Text style={[styles.menuItemText, { color: theme.isDark ? '#FFFFFF' : '#0F172A' }]}>
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
              style={[styles.menuItem, styles.lastMenuItem, { borderBottomColor: theme.isDark ? 'rgba(96, 165, 250, 0.1)' : 'rgba(59, 130, 246, 0.1)' }]}
              onPress={() => navigation.navigate('PhoneNumbers' as never)}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconContainer, { backgroundColor: theme.isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.2)' }]}>
                  <Ionicons name="call-outline" size={20} color="#10B981" />
                </View>
                <Text style={[styles.menuItemText, { color: theme.isDark ? '#FFFFFF' : '#0F172A' }]}>
                  {t('phoneNumber')}
                </Text>
              </View>
              <View style={styles.menuItemRight}>
                <Text style={[styles.menuItemSubtext, { color: theme.isDark ? '#64748B' : '#94A3B8' }]}>
                  {displayPhone === '—' ? (t('notSet') || 'Not set') : displayPhone}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={theme.isDark ? '#64748B' : '#94A3B8'} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <SectionSeparator />

        {/* Support Section */}
        <View style={[styles.section, { backgroundColor: theme.isDark ? '#0F172A' : '#F8FAFC' }]}>
          <Text style={[styles.sectionTitle, { color: theme.isDark ? '#FFFFFF' : '#0F172A' }]}>
            {t('support')}
          </Text>
          
          <View style={[
            styles.card, 
            { 
              backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(59, 130, 246, 0.05)',
              borderWidth: 1,
              borderColor: theme.isDark ? 'rgba(96, 165, 250, 0.2)' : 'rgba(59, 130, 246, 0.15)'
            }
          ]}>
            <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.isDark ? 'rgba(96, 165, 250, 0.1)' : 'rgba(59, 130, 246, 0.1)' }]} onPress={handleSupport}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconContainer, { backgroundColor: theme.isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.2)' }]}>
                  <Ionicons name="help-circle-outline" size={20} color="#3B82F6" />
                </View>
                <Text style={[styles.menuItemText, { color: theme.isDark ? '#FFFFFF' : '#0F172A' }]}>
                  {t('helpSupport')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.isDark ? '#64748B' : '#94A3B8'} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.isDark ? 'rgba(96, 165, 250, 0.1)' : 'rgba(59, 130, 246, 0.1)' }]} onPress={handlePrivacy}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconContainer, { backgroundColor: theme.isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.2)' }]}>
                  <Ionicons name="shield-outline" size={20} color="#10B981" />
                </View>
                <Text style={[styles.menuItemText, { color: theme.isDark ? '#FFFFFF' : '#0F172A' }]}>
                  {t('privacyPolicy')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.isDark ? '#64748B' : '#94A3B8'} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuItem, styles.lastMenuItem, { borderBottomColor: theme.isDark ? 'rgba(96, 165, 250, 0.1)' : 'rgba(59, 130, 246, 0.1)' }]} onPress={handleTerms}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconContainer, { backgroundColor: theme.isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.2)' }]}>
                  <Ionicons name="document-text-outline" size={20} color="#F59E0B" />
                </View>
                <Text style={[styles.menuItemText, { color: theme.isDark ? '#FFFFFF' : '#0F172A' }]}>
                  {t('termsService')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.isDark ? '#64748B' : '#94A3B8'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications Section */}
        {notificationList.length > 0 && (
          <>
            <SectionSeparator />
            <View style={[styles.section, { backgroundColor: theme.isDark ? '#0F172A' : '#F8FAFC' }]}>
            <Text style={[styles.sectionTitle, { color: theme.isDark ? '#FFFFFF' : '#0F172A' }]}>
              Notifications
            </Text>
            <View style={[
              styles.card, 
              { 
                backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(59, 130, 246, 0.05)',
                borderWidth: 1,
                borderColor: theme.isDark ? 'rgba(96, 165, 250, 0.2)' : 'rgba(59, 130, 246, 0.15)'
              }
            ]}>
              {renderNotifications()}
            </View>
            </View>
          </>
        )}

        <SectionSeparator />

        {/* Logout Button */}
        <View style={[styles.section, { backgroundColor: theme.isDark ? '#0F172A' : '#F8FAFC' }]}>
          <TouchableOpacity 
            style={[
              styles.logoutButton, 
              { 
                backgroundColor: theme.isDark ? 'rgba(220, 38, 38, 0.15)' : 'rgba(220, 38, 38, 0.1)',
                borderWidth: 1,
                borderColor: theme.isDark ? 'rgba(220, 38, 38, 0.3)' : 'rgba(220, 38, 38, 0.2)'
              }
            ]} 
            onPress={handleLogout}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: theme.isDark ? 'rgba(220, 38, 38, 0.25)' : 'rgba(220, 38, 38, 0.2)' }]}>
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
  collapsibleHeader: {
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 20,
  },
  headerGradient: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  largeAvatarContainer: {
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(96, 165, 250, 0.4)',
    position: 'absolute',
    left: 20,
    top: 20,
    borderRadius: 100,
  },
  avatarText: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileInfoContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  headerName: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerEmail: {
    fontSize: 13,
    marginBottom: 12,
  },
  headerBadgeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  headerVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 4,
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  headerVehicleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 4,
    borderWidth: 1,
  },
  headerVehicleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  headerStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 12,
    borderWidth: 1,
  },
  headerStatusLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  statsSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
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
    borderWidth: 1,
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
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
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
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    minHeight: 56,
  },
  lastDetailRow: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  detailValue: {
    fontSize: 14,
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
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
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