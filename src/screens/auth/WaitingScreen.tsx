import React, { useEffect, useState } from 'react';
import { RouteProp } from '@react-navigation/native';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity,
  Alert,
  ScrollView,
  RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import CommonView from '../../components/CommonView';
import { AuthScreenProps } from '../../types/navigation.types';

type Props = AuthScreenProps<'Waiting'>;

export default function WaitingScreen({ route, navigation }: Props) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user, logout, refreshUserProfile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Helper function to normalize state strings
  const normalizeState = (state: string | undefined) => {
    if (!state) return '';
    return state.replace(/\s+/g, '_').replace(/-/g, '_').replace(/\W/g, '').toUpperCase();
  };

  // Get user state for display
  const userState = normalizeState(user?.state || user?.status);

  // Get appropriate message based on state
  const getStateMessage = () => {
    switch (userState) {
      case 'PENDING_DOCUMENTS':
        return {
          title: 'Documents Under Review',
          message: 'Your documents are being reviewed by our team. This usually takes 1-2 business days.',
          icon: 'document-text-outline',
          color: '#F59E0B',
          bgColor: '#FEF3C7',
        };
      case 'PENDING_VERIFICATION':
        return {
          title: 'Account Verification Pending',
          message: 'Please check your email for a verification link to complete your account setup.',
          icon: 'mail-outline',
          color: '#3B82F6',
          bgColor: '#DBEAFE',
        };
      case 'PENDING_APPROVAL':
      case 'PENDING':
        return {
          title: 'Awaiting Approval',
          message: 'Your application is being reviewed by our team. We\'ll notify you once it\'s approved.',
          icon: 'time-outline',
          color: '#3B82F6',
          bgColor: '#DBEAFE',
        };
      case 'UNDER_REVIEW':
        return {
          title: 'Application Under Review',
          message: 'Our team is currently reviewing your application. Please be patient while we process it.',
          icon: 'search-outline',
          color: '#10B981',
          bgColor: '#D1FAE5',
        };
      default:
        return {
          title: 'Account Pending',
          message: 'Your account is pending approval. Please wait for admin review.',
          icon: 'hourglass-outline',
          color: '#6B7280',
          bgColor: '#F3F4F6',
        };
    }
  };

  const stateInfo = getStateMessage();

  // Auto-refresh profile every 30 seconds to check for status updates
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await refreshUserProfile();
      } catch (error) {
        console.warn('Auto-refresh failed:', error);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [refreshUserProfile]);


  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const success = await refreshUserProfile();
      if (success) {
        // The AuthContext and navigation will handle state changes automatically
        console.log('✅ Profile refreshed successfully');
      } else {
        Alert.alert(
          'Unable to Refresh',
          'Could not check your current status. Please try again later.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
      Alert.alert(
        'Error',
        'An error occurred while checking your status. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? You can login again anytime to check your application status.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await logout();
              navigation.replace('Login');
            } catch (error) {
              console.error('Logout error:', error);
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  return (
    <CommonView showStatusBar={true} paddingHorizontal={0}>
      <LinearGradient colors={['#1E40AF', '#3B82F6']} style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#FFFFFF"
              colors={['#FFFFFF']}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.welcomeText}>Welcome, {user?.firstName || 'Driver'}!</Text>
              <Text style={styles.headerSubtitle}>Food Rush Delivery Partner</Text>
            </View>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>

          {/* Status Card */}
          <View style={styles.statusCard}>
            <View style={[styles.statusIconContainer, { backgroundColor: stateInfo.bgColor }]}>
              <Ionicons name={stateInfo.icon as any} size={32} color={stateInfo.color} />
            </View>
            
            <Text style={styles.statusTitle}>{stateInfo.title}</Text>
            <Text style={styles.statusSubtitle}>{stateInfo.message}</Text>
            
            <View style={styles.progressContainer}>
              <ActivityIndicator size="large" color="#1E40AF" />
              <Text style={styles.progressText}>Processing...</Text>
            </View>

            {/* User Info */}
            {user && (
              <View style={styles.reasonContainer}>
                <Text style={styles.reasonText}>Account: {user.email}</Text>
                <Text style={styles.reasonText}>Status: {user.state || user.status || 'Pending'}</Text>
              </View>
            )}
          </View>

          {/* Information Cards */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>What happens next?</Text>
            
            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="document-text" size={20} color="#1E40AF" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Document Verification</Text>
                <Text style={styles.infoDescription}>
                  We verify your identity and vehicle documents for safety and compliance.
                </Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="shield-checkmark" size={20} color="#1E40AF" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Background Check</Text>
                <Text style={styles.infoDescription}>
                  A quick background verification to ensure platform safety.
                </Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="checkmark-circle" size={20} color="#1E40AF" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Account Activation</Text>
                <Text style={styles.infoDescription}>
                  Once approved, you'll receive an email and can start delivering immediately.
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <ActivityIndicator size="small" color="#1E40AF" />
              ) : (
                <Ionicons name="refresh" size={20} color="#1E40AF" />
              )}
              <Text style={styles.refreshButtonText}>
                {refreshing ? 'Checking...' : 'Check Status'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.supportButton}
              onPress={() => {
                Alert.alert(
                  'Contact Support',
                  'Need help with your application?',
                  [
                    {
                      text: 'Email Support',
                      onPress: () => Alert.alert('Support', 'Please email support@foodrush.com'),
                    },
                    {
                      text: 'Call Support',
                      onPress: () => Alert.alert('Support', 'Call us at +1-800-FOODRUSH'),
                    },
                    {
                      text: 'Cancel',
                      style: 'cancel',
                    },
                  ]
                );
              }}
            >
              <Ionicons name="help-circle-outline" size={20} color="#6B7280" />
              <Text style={styles.supportButtonText}>Need Help?</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Approval typically takes 24-48 hours. You'll be notified via email once your account is ready.
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </CommonView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerContent: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#DBEAFE',
  },
  logoutButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
<<<<<<< HEAD
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
=======
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
>>>>>>> 502270625cd580c1bd9df10530795b44a07b500b
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  userInfo: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  userInfoLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  userInfoValue: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 24,
    fontStyle: 'italic',
  },
  statusSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
    fontWeight: '500',
  },
  reasonContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  reasonText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 20,
  },
  infoSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  actionSection: {
    marginBottom: 30,
  },
  refreshButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginLeft: 8,
  },
  supportButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  supportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  footer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#DBEAFE',
    textAlign: 'center',
    lineHeight: 20,
  },
});