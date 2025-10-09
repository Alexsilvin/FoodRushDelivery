import React, { useEffect, useState } from 'react';
import { RouteProp } from '@react-navigation/native';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
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
          icon: 'document-text-outline'
        };
      case 'PENDING_VERIFICATION':
        return {
          title: 'Account Verification Pending',
          message: 'Please check your email for a verification link to complete your account setup.',
          icon: 'mail-outline'
        };
      case 'PENDING_APPROVAL':
      case 'PENDING':
        return {
          title: 'Awaiting Approval',
          message: 'Your application is being reviewed by our team. We\'ll notify you once it\'s approved.',
          icon: 'time-outline'
        };
      case 'UNDER_REVIEW':
        return {
          title: 'Application Under Review',
          message: 'Our team is currently reviewing your application. Please be patient while we process it.',
          icon: 'search-outline'
        };
      default:
        return {
          title: 'Account Pending',
          message: 'Your account is pending approval. Please wait for admin review.',
          icon: 'hourglass-outline'
        };
    }
  };

  const stateInfo = getStateMessage();

  // Handle refresh to check if status has changed
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

  // Handle logout
  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.replace('Login');
          }
        }
      ]
    );
  };

  return (
    <CommonView>
      <View style={styles.container}>
        {/* Status Icon */}
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
          <Ionicons 
            name={stateInfo.icon as any} 
            size={48} 
            color={theme.colors.primary} 
          />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {stateInfo.title}
        </Text>

        {/* Message */}
        <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
          {stateInfo.message}
        </Text>

        {/* User Info */}
        {user && (
          <View style={[styles.userInfo, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.userInfoLabel, { color: theme.colors.textSecondary }]}>Account:</Text>
            <Text style={[styles.userInfoValue, { color: theme.colors.text }]}>{user.email}</Text>
            <Text style={[styles.userInfoLabel, { color: theme.colors.textSecondary }]}>Status:</Text>
            <Text style={[styles.userInfoValue, { color: theme.colors.text }]}>{user.state || user.status || 'Pending'}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.refreshButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="refresh" size={20} color="#FFFFFF" />
            )}
            <Text style={styles.refreshButtonText}>
              {refreshing ? 'Checking...' : 'Check Status'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.logoutButton, { borderColor: theme.colors.border }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color={theme.colors.textSecondary} />
            <Text style={[styles.logoutButtonText, { color: theme.colors.textSecondary }]}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>

        {/* Help Text */}
        <Text style={[styles.helpText, { color: theme.colors.textSecondary }]}>
          Need help? Contact our support team for assistance.
        </Text>
      </View>
    </CommonView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
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
});
