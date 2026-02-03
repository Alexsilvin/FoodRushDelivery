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
import { authService } from '../../services';
import { AuthScreenProps } from '../../types/navigation.types';
import CommonView from '../../components/CommonView';

const { width } = Dimensions.get('window');

type Props = AuthScreenProps<'Login'>;

export default function LoginScreen({ navigation, route }: Props) {
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
    // Log for debugging
    console.log('=== LOGIN SUCCESS ===');
    console.log('Response state:', response.state);
    console.log('User state:', response.user.state);
    console.log('User status:', response.user.status);
    
    // The AuthStack and RootNavigator will handle navigation based on user state automatically
    // No manual navigation needed here

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
                // Note: This function needs to be implemented in authService
                Alert.alert(
                  t('featureNotAvailable') || 'Feature Not Available',
                  'Email verification resend is not yet implemented. Please check your email for the original verification link.'
                );
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
                // Note: This function needs to be implemented in authService
                Alert.alert(
                  t('featureNotAvailable') || 'Feature Not Available',
                  'Account activation through the app is not yet implemented. Please check your email for the verification link.'
                );
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
    <CommonView showStatusBar={true} paddingHorizontal={0}>
      <LinearGradient 
        colors={['#0F172A', '#1E3A8A', '#0F172A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        {/* Decorative shapes */}
        <View style={styles.shapeContainer}>
          <View style={[styles.shape, styles.shapeTop]} />
          <View style={[styles.shape, styles.shapeBottom]} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          >
            {/* Logo and Branding */}
            <Animated.View style={[styles.logoHeader, { opacity: logoOpacity }]}>
              <View style={styles.brandContainer}>
                <Text style={styles.brandNameGradient}>FOOD</Text>
                <Image
                  source={require('../../../assets/outoloyout.png')}
                  style={styles.rushImage}
                  resizeMode="contain"
                  alt="Rush Logo"
                />
              </View>
            </Animated.View>

            {/* Main Card */}
            <View style={styles.card}>
              {/* Welcome Text */}
              <View style={styles.header}>
                <Text style={styles.title}>Welcome Back</Text>
              </View>

              {/* Form Section */}
              <View style={styles.form}>
                {/* Email Input */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Email address</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="your@email.com"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color="rgba(255, 255, 255, 0.6)"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Forgot Password Link */}
                <TouchableOpacity
                  style={styles.forgotPasswordContainer}
                  onPress={() => navigation.navigate('ForgotPassword')}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password ?</Text>
                </TouchableOpacity>

                {/* Login Button */}
                <LinearGradient
                  colors={['#6366F1', '#3B82F6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.loginButton}
                >
                  <TouchableOpacity
                    onPress={handleLogin}
                    disabled={loading}
                    style={styles.buttonContent}
                  >
                    <Text style={styles.loginButtonText}>
                      {loading ? 'Signing In...' : 'Login'}
                    </Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>

              {/* Sign Up Link */}
              <View style={styles.signUpContainer}>
                <Text style={styles.signUpText}>Are You New Member? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.signUpLink}>Sign UP</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </CommonView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  shapeContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  shape: {
    position: 'absolute',
    borderRadius: 500,
    opacity: 0.15,
  },
  shapeTop: {
    width: 400,
    height: 400,
    top: -150,
    right: -100,
    backgroundColor: '#60A5FA',
  },
  shapeBottom: {
    width: 350,
    height: 350,
    bottom: -120,
    left: -80,
    backgroundColor: '#3B82F6',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  logoHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 50,
    zIndex: 10,
  },
  logoCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  logoImage: {
    width: 45,
    height: 45,
  },
  rushImage: {
    width: 140,
    height: 140,
    marginLeft: 12,
  },
  brandName: {
    fontSize: 29,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: 3,
    marginLeft: 0,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 0,
  },
  brandNameGradient: {
    fontSize: 29,
    fontWeight: '700',
    color: '#3B82F6',
    letterSpacing: 3,
    marginRight: 8,
  },
  card: {
    backgroundColor: 'rgba(30, 58, 138, 0.25)',
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: 'rgba(96, 165, 250, 0.2)',
    padding: 32,
    zIndex: 10,
    backdropFilter: 'blur(20px)',
  },
  header: {
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 36,
  },
  form: {
    marginBottom: 24,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    color: '#FFFFFF',
    marginBottom: 8,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.25)',
    paddingHorizontal: 14,
    height: 52,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 15,
    color: '#FFFFFF',
    padding: 0,
  },
  eyeIcon: {
    padding: 8,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 28,
  },
  forgotPasswordText: {
    fontSize: 13,
    color: '#93C5FD',
    fontWeight: '500',
  },
  loginButton: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  buttonContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(96, 165, 250, 0.2)',
  },
  signUpText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  signUpLink: {
    fontSize: 13,
    color: '#60A5FA',
    fontWeight: '700',
  },
});