import React, { useState } from 'react';
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
  ActivityIndicator,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { testAPI } from '../../services/api';

export default function RegisterScreen({ navigation }: any) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [driverLicense, setDriverLicense] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [verifyingLicense, setVerifyingLicense] = useState(false);
  const { register } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword || !phoneNumber || !vehicle) {
      Alert.alert(t('error') || 'Error', t('fillAllFields') || 'Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert(t('error') || 'Error', t('invalidEmail') || 'Invalid email format');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('error') || 'Error', t('passwordsDoNotMatch') || 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert(t('error') || 'Error', t('passwordTooShort') || 'Password must be at least 6 characters');
      return;
    }

    // Show license verification modal if we have a license
    if (driverLicense) {
      setVerifyingLicense(true);
      
      // Simulate license verification process (would be handled by API in production)
      setTimeout(async () => {
        setVerifyingLicense(false);
        proceedWithRegistration();
      }, 3000); // Simulate 3 seconds of license verification
    } else {
      proceedWithRegistration();
    }
  };
  
  const proceedWithRegistration = async () => {
    setLoading(true);
    
    try {
      const success = await register(
        firstName,
        lastName,
        email,
        password,
        phoneNumber,
        vehicle,
        driverLicense
      );
      
      if (success) {
        Alert.alert(
          t('success') || 'Success', 
          t('accountCreatedPleaseLogin') || 'Account created successfully! Please check your email and verify your account before logging in.',
          [
            {
              text: t('goToLogin') || 'Go to Login',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      } else {
        Alert.alert(t('error') || 'Error', t('registrationFailed') || 'Failed to create account. Please try again.');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      let errorMsg = t('somethingWentWrong') || 'Something went wrong. Please try again.';
      
      // Handle conflict error specifically
      if (error.name === 'ConflictError') {
        errorMsg = error.message || 'Email or phone number already in use. Please use different credentials.';
        
        Alert.alert(
          t('accountExists') || 'Account Exists', 
          errorMsg,
          [
            {
              text: t('goToLogin') || 'Go to Login',
              onPress: () => navigation.navigate('Login')
            },
            {
              text: t('tryAgain') || 'Try Again',
              style: 'cancel'
            }
          ]
        );
        setLoading(false);
        return;
      }
      
      // Log detailed error information
      console.error('Error response:', JSON.stringify(error.response?.data));
      console.error('Status code:', error.response?.status);
      console.error('Headers:', JSON.stringify(error.response?.headers));
      
      // Extract error message with a detailed approach
      if (error.response?.data) {
        const data = error.response.data;
        
        if (typeof data === 'string') {
          errorMsg = data;
        } else if (data.message) {
          errorMsg = data.message;
        } else if (data.error) {
          errorMsg = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
        } else if (data.errors) {
          if (Array.isArray(data.errors)) {
            errorMsg = data.errors.map((e: any) => 
              typeof e === 'string' ? e : (e.message || JSON.stringify(e))
            ).join('\n');
          } else {
            const errorMessages = [];
            for (const key in data.errors) {
              const value = data.errors[key];
              if (Array.isArray(value)) {
                errorMessages.push(`${key}: ${value.join(', ')}`);
              } else {
                errorMessages.push(`${key}: ${value}`);
              }
            }
            errorMsg = errorMessages.join('\n');
          }
        } else {
          errorMsg = JSON.stringify(data);
        }
        
        // In DEV mode, also include status code for better debugging
        if (__DEV__) {
          errorMsg = `Status: ${error.response.status}\n${errorMsg}`;
        }
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      Alert.alert(t('error') || 'Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      setUploadingImage(true);
      
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'We need camera roll permissions to upload your driver license');
        setUploadingImage(false);
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        // Store the image URI
        setDriverLicense(selectedAsset.uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const takePhoto = async () => {
    try {
      setUploadingImage(true);
      
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'We need camera permissions to take a photo of your driver license');
        setUploadingImage(false);
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        // Store the image URI
        setDriverLicense(selectedAsset.uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <LinearGradient colors={['#1E40AF', '#3B82F6']} style={styles.container}>
      {/* License Verification Modal */}
      <Modal
        visible={verifyingLicense}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color="#1E40AF" style={styles.modalSpinner} />
            <Text style={styles.modalText}>Checking license...</Text>
            <Text style={styles.modalSubText}>This won&apos;t take long</Text>
          </View>
        </View>
      </Modal>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join our delivery team</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="First Name"
                value={firstName}
                onChangeText={setFirstName}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Last Name"
                value={lastName}
                onChangeText={setLastName}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="car-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Vehicle (e.g., Honda Civic)"
                value={vehicle}
                onChangeText={setVehicle}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Driver License Upload */}
            <View style={styles.licenseContainer}>
              <Text style={styles.licenseLabel}>Driver License</Text>
              <Text style={styles.licenseSubLabel}>Upload a clear photo of your driver license</Text>
              
              {driverLicense ? (
                <View style={styles.uploadedImageContainer}>
                  <Image 
                    source={{ 
                      uri: driverLicense || 'https://via.placeholder.com/400x300?text=License+Preview'
                    }} 
                    style={styles.uploadedImage}
                    accessible={true}
                    accessibilityLabel="Driver's license photo"
                    alt="Driver's license photo" // Added for ESLint compatibility
                  />
                  <TouchableOpacity 
                    style={styles.changeImageButton}
                    onPress={pickImage}
                  >
                    <Text style={styles.changeImageText}>Change Image</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.uploadButtonsContainer}>
                  <TouchableOpacity 
                    style={styles.uploadButton}
                    onPress={pickImage}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <ActivityIndicator size="small" color="#1E40AF" />
                    ) : (
                      <>
                        <Ionicons name="images-outline" size={20} color="#1E40AF" style={styles.uploadIcon} />
                        <Text style={styles.uploadButtonText}>Gallery</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.uploadButton}
                    onPress={takePhoto}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <ActivityIndicator size="small" color="#1E40AF" />
                    ) : (
                      <>
                        <Ionicons name="camera-outline" size={20} color="#1E40AF" style={styles.uploadIcon} />
                        <Text style={styles.uploadButtonText}>Camera</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { paddingRight: 50 }]}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { paddingRight: 50 }]}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.registerButton, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.registerButtonText}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>
            
            {__DEV__ && (
              <TouchableOpacity
                style={[styles.registerButton, styles.diagnosticButton]}
                onPress={async () => {
                  try {
                    Alert.alert('API Tests', 'Running API tests, check console for results');
                    const results = await testAPI.testRegister();
                    
                    // Find if any test was successful
                    const successfulTest = results.find(r => r.success);
                    
                    if (successfulTest) {
                      Alert.alert(
                        'Test Success!', 
                        `Found working endpoint: ${successfulTest.endpoint}\n\nCheck console for details.`
                      );
                    } else {
                      // Create a summary of the failures
                      const errorSummary = results
                        .slice(0, 3) // Just show first few to avoid huge alert
                        .map(r => `${r.endpoint}: ${r.status || 'Error'}`)
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
                <Text style={[styles.registerButtonText, { color: '#FF5722' }]}>
                  Run API Tests (DEV)
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.signInText}>Sign In</Text>
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
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
  },
  registerButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: '#1E40AF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  diagnosticButton: {
    backgroundColor: '#FFF8E1',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    color: '#DBEAFE',
    fontSize: 16,
  },
  signInText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  licenseContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
  },
  licenseLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  licenseSubLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  uploadButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EBF5FF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 0.45,
  },
  uploadIcon: {
    marginRight: 8,
  },
  uploadButtonText: {
    color: '#1E40AF',
    fontWeight: '600',
  },
  uploadedImageContainer: {
    alignItems: 'center',
  },
  uploadedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  changeImageButton: {
    backgroundColor: '#EBF5FF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  changeImageText: {
    color: '#1E40AF',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalSpinner: {
    marginBottom: 16,
  },
  modalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  modalSubText: {
    fontSize: 14,
    color: '#6B7280',
  },
});
