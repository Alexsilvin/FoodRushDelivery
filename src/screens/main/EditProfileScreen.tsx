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
  const { user, updateUserProfile } = useAuth();
  
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    // Validation
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert(t('error') || 'Error', t('nameRequired') || 'Name is required');
      return;
    }
    
    if (!email.trim()) {
      Alert.alert(t('error') || 'Error', t('emailRequired') || 'Email is required');
      return;
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert(t('error') || 'Error', t('invalidEmail') || 'Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    try {
      console.log('📝 Saving profile changes:', { firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim() });
      
      const success = await updateUserProfile({ 
        firstName: firstName.trim(), 
        lastName: lastName.trim(), 
        email: email.trim() 
      });
      
      if (success) {
        console.log('✅ Profile update successful');
        Alert.alert(
          t('success') || 'Success', 
          t('profileUpdated') || 'Profile updated successfully',
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
          {t('firstName') || 'First Name'}
        </Text>
        <View style={[styles.inputContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Ionicons name="person-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: theme.colors.text }]}
            placeholder={t('enterFirstName') || 'Enter first name'}
            placeholderTextColor={theme.colors.textSecondary}
            value={firstName}
            onChangeText={setFirstName}
          />
        </View>

        <Text style={[styles.label, { color: theme.colors.textSecondary, marginTop: 20 }]}>
          {t('lastName') || 'Last Name'}
        </Text>
        <View style={[styles.inputContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Ionicons name="person-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: theme.colors.text }]}
            placeholder={t('enterLastName') || 'Enter last name'}
            placeholderTextColor={theme.colors.textSecondary}
            value={lastName}
            onChangeText={setLastName}
          />
        </View>

        <Text style={[styles.label, { color: theme.colors.textSecondary, marginTop: 20 }]}>
          {t('email') || 'Email'}
        </Text>
        <View style={[styles.inputContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Ionicons name="mail-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: theme.colors.text }]}
            placeholder={t('enterEmail')}
            placeholderTextColor={theme.colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
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
});
