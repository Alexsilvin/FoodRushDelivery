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
      const success = await login(email, password);
      
      if (!success) {
        Alert.alert(
          t('loginFailed'), 
          t('invalidCredentials'), 
          [
            {
              text: t('ok'),
              style: 'cancel',
            },
            {
              text: t('demoLogin'),
              onPress: async () => {
                setEmail('driver@demo.com');
                setPassword('demo123');
                setTimeout(async () => {
                  await login('driver@demo.com', 'demo123');
                }, 500);
              },
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('Login error details:', error);
      
      // Handle specific error types
      if (error.name === 'VerificationError') {
        Alert.alert(
          t('verificationRequired') || 'Verification Required', 
          t('pleaseVerifyEmail') || 'Please check your email and verify your account before logging in.',
          [
            {
              text: t('ok') || 'OK',
              style: 'cancel',
            },
            {
              text: 'Use Demo Account',
              onPress: async () => {
                setEmail('driver@demo.com');
                setPassword('demo123');
                setTimeout(async () => {
                  await login('driver@demo.com', 'demo123');
                }, 500);
              },
            }
          ]
        );
      } else if (error.name === 'InvalidCredentialsError') {
        // Handle specifically invalid credentials
        Alert.alert(
          t('loginFailed') || 'Login Failed', 
          t('invalidCredentials') || 'The email or password you entered is incorrect',
          [
            {
              text: t('ok') || 'OK',
              style: 'cancel',
            },
            {
              text: 'Use Demo Account',
              onPress: async () => {
                setEmail('driver@demo.com');
                setPassword('demo123');
                setTimeout(async () => {
                  try {
                    await login('driver@demo.com', 'demo123');
                  } catch (e) {
                    console.error("Demo login failed:", e);
                  }
                }, 500);
              },
            }
          ]
        );
      } else {
        // Extract error message from different possible formats
        let errorMsg = t('somethingWentWrong') || 'Something went wrong';
        
        if (error.response?.data?.message) {
          errorMsg = error.response.data.message;
        } else if (error.response?.data?.error) {
          errorMsg = error.response.data.error;
        } else if (error.message) {
          errorMsg = error.message;
        }
        
        Alert.alert(t('loginFailed') || 'Login Failed', errorMsg);
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
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>Food</Text>
            </View>
            <View style={styles.logoImageContainer}>
              <Image
                source={require('../../../assets/outoloyout.png')}
                style={styles.logoImage}
                resizeMode="contain"
                alt="Food Rush Logo"
              />
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

            <View style={[styles.demoContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.demoText, { color: theme.colors.textSecondary }]}>Demo Account:</Text>
              <Text style={[styles.demoCredentials, { color: theme.colors.text }]}>driver@demo.com / demo123</Text>
              <TouchableOpacity 
                style={styles.demoLoginButton}
                onPress={async () => {
                  setEmail('driver@demo.com');
                  setPassword('demo123');
                  setTimeout(async () => {
                    try {
                      setLoading(true);
                      await login('driver@demo.com', 'demo123');
                    } catch (e) {
                      console.error("Demo login failed:", e);
                      Alert.alert("Demo Login Failed", "Unable to log in with demo account. Please try again.");
                    } finally {
                      setLoading(false);
                    }
                  }, 300);
                }}
              >
                <Text style={styles.demoLoginButtonText}>Login with Demo</Text>
              </TouchableOpacity>
            </View>
            
            {/* Verification help link */}
            <TouchableOpacity
              style={styles.verificationHelp}
              onPress={() => {
                Alert.alert(
                  'Account Verification',
                  'After registration, you need to verify your email address by clicking the link sent to your email.\n\nIf you haven\'t received the verification email, you can request a new one or contact support for assistance.',
                  [
                    {
                      text: 'OK',
                      style: 'cancel'
                    },
                    {
                      text: 'Use Demo Account',
                      onPress: () => {
                        setEmail('driver@demo.com');
                        setPassword('demo123');
                        setTimeout(async () => {
                          try {
                            await login('driver@demo.com', 'demo123');
                          } catch (e) {
                            console.error("Demo login failed:", e);
                          }
                        }, 500);
                      }
                    }
                  ]
                );
              }}
            >
              <Text style={[styles.verificationHelpText, { color: theme.colors.primary }]}>
                Need help with account verification?
              </Text>
            </TouchableOpacity>
            
            {/* Debug/test button in development */}
            {__DEV__ && (
              <TouchableOpacity
                style={[styles.testButton, { backgroundColor: '#ff5722', marginTop: 16 }]}
                onPress={async () => {
                  try {
                    Alert.alert('API Tests', 'Testing login endpoints, check console for results');
                    const { testAPI } = require('../../services/api');
                    
                    // Generate a unique test email if needed
                    // const timestamp = new Date().getTime();
                    // const testEmail = `test${timestamp}@example.com`;
                    
                    // Use the demo account credentials for login test
                    const results = await testAPI.testLogin('driver@demo.com', 'demo123');
                    
                    // Find if any test was successful
                    const successfulTest = results.find((r: any) => r.success);
                    
                    if (successfulTest) {
                      // Show details about the successful login
                      Alert.alert(
                        'Test Success!', 
                        `Successfully found working login endpoint: ${successfulTest.endpoint}\n\nStatus: ${successfulTest.status}`
                      );
                      
                      // Automatically fill in the credentials
                      setEmail('driver@demo.com');
                      setPassword('demo123');
                    } else {
                      // Create a summary of the failures
                      const errorSummary = results
                        .slice(0, 3) // Just show first few to avoid huge alert
                        .map((r: any) => `${r.endpoint}: ${r.status || 'Error'}`)
                        .join('\n');
                        
                      Alert.alert(
                        'API Tests Failed', 
                        `All endpoints failed. Examples:\n${errorSummary}\n\nSee console for complete details.`
                      );
                    }
                  } catch (error: any) {
                    console.error('Test error:', error);
                    Alert.alert('Test Error', error.message);
                  }
                }}
              >
                <Text style={styles.testButtonText}>Test Login API (DEV)</Text>
              </TouchableOpacity>
            )}
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
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#DBEAFE',
  },
  form: {
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
  },
  loginButton: {
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  demoContainer: {
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  demoText: {
    fontSize: 14,
    marginBottom: 4,
  },
  demoCredentials: {
    fontSize: 14,
    fontWeight: '600',
  },
  logoHeader: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    marginBottom: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: -5,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  logoImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: width * 0.4,
    height: 60,
    maxWidth: 200,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
  },
  signUpText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  verificationHelp: {
    alignItems: 'center',
    marginTop: 12,
  },
  verificationHelpText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  demoLoginButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#4a5568',
    borderRadius: 8,
  },
  demoLoginButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  testButton: {
    borderRadius: 8,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
