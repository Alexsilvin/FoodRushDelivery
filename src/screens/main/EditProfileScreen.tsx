import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';

export default function EditProfileScreen({ navigation }: { navigation: any }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user, updateUserProfile, updateUserPhoneNumber } = useAuth();
  
  const [fullName, setFullName] = useState(user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    // Validation
    if (!fullName.trim()) {
      Alert.alert(t('error') || 'Error', t('nameRequired') || 'Full name is required');
      return;
    }
    
    // Phone number validation (optional but if provided, should be valid)
    if (phoneNumber.trim() && !/^\+?[1-9]\d{1,14}$/.test(phoneNumber.trim().replace(/\s/g, ''))) {
      Alert.alert(t('error') || 'Error', 'Please enter a valid phone number (e.g., +237612345678)');
      return;
    }
    
    setLoading(true);
    try {
      console.log('📝 Saving profile changes:', { fullName: fullName.trim(), phoneNumber: phoneNumber.trim() });
      
      // Parse fullName to firstName and lastName for the existing updateUserProfile method
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const success = await updateUserProfile({ 
        firstName: firstName, 
        lastName: lastName, 
        email: user?.email || '' // Keep existing email
      });
      
      if (success) {
        console.log('✅ Profile update successful');
        
        // Update phone number if it changed
        let phoneUpdateSuccess = true;
        if (phoneNumber.trim() !== user?.phoneNumber) {
          try {
            phoneUpdateSuccess = await updateUserPhoneNumber(phoneNumber.trim());
            if (phoneUpdateSuccess) {
              console.log('✅ Phone number updated successfully');
            }
          } catch (phoneError) {
            console.warn('⚠️ Phone number update failed:', phoneError);
            phoneUpdateSuccess = false;
          }
        }
        
        const message = phoneUpdateSuccess 
          ? 'Profile updated successfully'
          : 'Name updated successfully, but phone number update failed';
          
        Alert.alert(
          t('success') || 'Success', 
          t('profileUpdated') || message,
          [
            {
              text: t('ok') || 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        console.warn('⚠️ Profile update failed');
        Alert.alert(
          t('error') || 'Error', 
          t('updateFailed') || 'Failed to update profile. Please try again.'
        );
      }
    } catch (error: any) {
      console.error('❌ Profile update error:', error);
      
      // Extract meaningful error message
      let errorMessage = t('somethingWentWrong') || 'Something went wrong';
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(t('error') || 'Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {t('editProfile')}
        </Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Text style={[styles.saveText, { color: theme.colors.primary }]}>
              {t('save')}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          {t('fullName') || 'Full Name'}
        </Text>
        <View style={[styles.inputContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Ionicons name="person-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: theme.colors.text }]}
            placeholder={t('enterFullName') || 'Enter your full name'}
            placeholderTextColor={theme.colors.textSecondary}
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        <Text style={[styles.label, { color: theme.colors.textSecondary, marginTop: 20 }]}>
          {t('phoneNumber') || 'Phone Number'}
        </Text>
        <View style={[styles.inputContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Ionicons name="call-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: theme.colors.text }]}
            placeholder={t('enterPhoneNumber') || 'Enter phone number (e.g., +237612345678)'}
            placeholderTextColor={theme.colors.textSecondary}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />
        </View>

        <View style={[styles.infoContainer, { backgroundColor: theme.colors.card, marginTop: 20 }]}>
          <Ionicons name="information-circle-outline" size={20} color={theme.colors.textSecondary} style={styles.infoIcon} />
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            Email updates are not supported through this screen. Contact support if you need to change your email address.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  saveButton: {
    padding: 8,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    height: 56,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
