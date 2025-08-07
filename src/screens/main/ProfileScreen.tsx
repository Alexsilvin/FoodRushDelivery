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
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNavigation } from '@react-navigation/native';
import LanguageSelector from '../../components/LanguageSelector';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const navigation = useNavigation();
  const [isOnline, setIsOnline] = useState(true);
  const [notifications, setNotifications] = useState(true);

  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

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
    Alert.alert(t('editProfile'), t('editProfileComingSoon'));
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
    { label: t('totalDeliveries'), value: '247', icon: 'car-outline' },
    { label: t('rating'), value: '4.8', icon: 'star' },
    { label: t('thisMonth'), value: '$1,247', icon: 'wallet-outline' },
    { label: t('completionRate'), value: '98%', icon: 'checkmark-circle-outline' },
  ];

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
                  {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
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
                <Text style={styles.name}>{user?.name || 'User'}</Text>
                <Text style={styles.email}>{user?.email || 'No email'}</Text>
              </Animated.View>
              
              <View style={styles.onlineStatus}>
                <Text style={styles.statusLabel}>{t('availableForDeliveries')}</Text>
                <Switch
                  value={isOnline}
                  onValueChange={setIsOnline}
                  trackColor={{ false: 'rgba(255,255,255,0.3)', true: 'rgba(255,255,255,0.5)' }}
                  thumbColor={isOnline ? '#FFFFFF' : '#D1D5DB'}
                />
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
                    transform: [{
                      scale: scrollY.interpolate({
                        inputRange: [0, 100],
                        outputRange: [1, 0.95],
                        extrapolate: 'clamp',
                      })
                    }]
                  }
                ]}
              >
                <Ionicons name={stat.icon as any} size={24} color={theme.colors.primary} />
                <Text style={[styles.statValue, { color: theme.colors.text }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{stat.label}</Text>
              </Animated.View>
            ))}
          </Animated.View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>{t('account')}</Text>
          
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

          <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="car-outline" size={24} color={theme.colors.textSecondary} />
              <Text style={[styles.menuItemText, { color: theme.colors.text }]}>{t('vehicleInformation')}</Text>
            </View>
            <View style={styles.vehicleInfo}>
              <Text style={[styles.vehicleText, { color: theme.colors.textSecondary }]}>{user?.vehicle || t('notSet')}</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="call-outline" size={24} color={theme.colors.textSecondary} />
              <Text style={[styles.menuItemText, { color: theme.colors.text }]}>{t('phoneNumber')}</Text>
            </View>
            <View style={styles.phoneInfo}>
              <Text style={[styles.phoneText, { color: theme.colors.textSecondary }]}>{user?.phone || t('notSet')}</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </View>
          </TouchableOpacity>
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
  section: {
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
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
});
