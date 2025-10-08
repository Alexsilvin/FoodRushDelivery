import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { authAPI } from '../../services/api';

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();

  // Animation for logo fade in (after splash transition)
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in the logo after a short delay (allowing splash transition to complete)
    const timer = setTimeout(() => {
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 100);

    return () => clearTimeout(timer);
  }, [logoOpacity]);

  const handleLogin = async () => {
  if (!email || !password) {
    Alert.alert(t('error'), t('fillAllFields'));
    return;
  }

  if (!email.includes('@')) {
    Alert.alert(t('error'), t('invalidEmail'));
    return;
  }

  setLoading(true);
  try {
    const response = await login(email, password); // returns { success, user, token, state }

    if (!response.success || !response.user) {
      Alert.alert(t('loginFailed'), t('invalidCredentials'), [
        { text: t('ok'), style: 'cancel' },
      ]);
      return;
    }
// Log everything for debugging
    console.log('=== LOGIN DEBUG ===');
    console.log('Response state:', response.state);
    console.log('User state:', response.user.state);
    console.log('User status:', response.user.status);

    // Normalize backend state
    const normalizeState = (state: string | undefined) => {
      if (!state) return '';
      return state.replace(/\s+/g, '_').replace(/-/g, '_').replace(/\W/g, '').toUpperCase();
    };

    const riderState = normalizeState(response.state);
    console.log('Normalized state:', riderState);

    // Navigation logic based on normalized state
    if (riderState === 'ACTIVE' || riderState === 'READY' || riderState === 'APPROVED') {
      console.log('✅ Navigating to dashboard for state:', riderState);
      navigation.replace('Home');
    } else if (riderState === 'REJECTED') {
      console.log('❌ Navigating to Rejected screen for state:', riderState);
      navigation.replace('Rejected');
    } else {
      // All other states (PENDING, PENDING_VERIFICATION, etc.) go to waiting
      console.log('⏳ Navigating to Waiting screen for state:', riderState);
      navigation.replace('Waiting', {
        reason: `Your account is currently "${response.state}". Please wait for approval.`,
      });
    }

  } catch (error: any) {
    const errorMsg = error.message || t('somethingWentWrong');

    if (errorMsg.includes('not activated') || errorMsg.includes('not verified')) {
      Alert.alert(
        t('accountNotVerified') || 'Account Not Verified',
        'Your account needs to be verified before you can log in. Please check your email for a verification link.',
        [
          {
            text: t('ok') || 'OK',
            style: 'cancel',
          },
          {
            text: t('resendVerification') || 'Resend Verification',
            onPress: async () => {
              try {
                setLoading(true);
                const result = await authAPI.resendVerificationEmail(email);
                if (result.success) {
                  Alert.alert(
                    t('verificationSent') || 'Verification Sent',
                    t('verificationEmailResent') || 'A new verification email has been sent. Please check your inbox and click the verification link.'
                  );
                } else {
                  Alert.alert(t('error') || 'Error', result.message || t('somethingWentWrong'));
                }
              } catch (resendError: any) {
                Alert.alert(t('error') || 'Error', resendError.message || t('somethingWentWrong'));
              } finally {
                setLoading(false);
              }
            },
          },
          {
            text: t('activateNow') || 'Activate Now',
            onPress: async () => {
              try {
                setLoading(true);
                const result = await authAPI.activateAccount(email);
                if (result.success) {
                  Alert.alert(
                    t('accountActivated') || 'Account Activated',
                    t('accountActivationSuccess') || 'Your account has been activated! You can now log in.',
                    [
                      {
                        text: t('login') || 'Log In',
                        onPress: () => handleLogin(),
                      },
                    ]
                  );
                } else {
                  Alert.alert(
                    t('activationFailed') || 'Activation Failed',
                    result.message || t('activationNotSupported') || 'Account activation through the app is not supported. Please check your email for a verification link.'
                  );
                }
              } catch (activateError: any) {
                Alert.alert(t('error') || 'Error', activateError.message || t('somethingWentWrong'));
              } finally {
                setLoading(false);
              }
            },
          },
        ]
      );
    } else {
      Alert.alert(t('error') || 'Error', errorMsg);
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <LinearGradient 
      colors={theme.isDark 
        ? [theme.colors.background, theme.colors.surface, theme.colors.primary + '40'] 
        : ['#0f1419', '#1a2332', '#2a3441']} 
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Logo Header - positioned where splash screen logo transitions to */}
          <Animated.View style={[styles.logoHeader, { opacity: logoOpacity }]}>
            <Image
              source={require('../../../assets/outoloyout.png')}
              style={styles.logoImage}
              resizeMode="contain"
              alt="Food Rush Logo"
            />
            <View style={styles.logoTextContainer}>
              <Text style={styles.logoText}>Food Rush</Text>
              <Text style={styles.logoSubText}>Driver App</Text>
            </View>
          </Animated.View>

          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Welcome Back!</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Sign in to continue delivering</Text>
          </View>

          <View style={styles.form}>
            <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Ionicons name="mail-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { paddingRight: 50, color: theme.colors.text }]}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor={theme.colors.textSecondary}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={[styles.forgotPasswordText, { color: theme.colors.primary }]}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, { backgroundColor: theme.colors.primary }, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>Don&apos;t have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[styles.signUpText, { color: theme.colors.primary }]}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  form: {
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  inputIcon: {
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    height: '100%',
    justifyContent: 'center',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
  },
  loginButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
  },
  signUpText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  logoHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  logoTextContainer: {
    marginLeft: 10,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ff6b00',
  },
  logoSubText: {
    fontSize: 14,
    color: '#ff9a4d',
    fontStyle: 'italic',
  },
  logoImage: {
    width: 60,
    height: 60,
  },
});
