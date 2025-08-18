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

export default function RegisterScreen({ navigation }: any) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [vehicleType, setVehicleType] = useState(''); // BICYCLE | MOTORCYCLE | CAR | VAN | TRUCK | WALKER
  const [vehicleTypeOpen, setVehicleTypeOpen] = useState(false);
  const VEHICLE_TYPES = ['BICYCLE','MOTORCYCLE','CAR','VAN','TRUCK','WALKER'];
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [documentUri, setDocumentUri] = useState<string | null>(null); // ID card / driver license image
  const [vehiclePhotoUri, setVehiclePhotoUri] = useState<string | null>(null); // Vehicle with plate visible
  const [uploadingImage, setUploadingImage] = useState(false);
  const [verifyingLicense, setVerifyingLicense] = useState(false);
  const { register } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword || !phoneNumber || !vehicleType) {
      Alert.alert(t('error') || 'Error', t('fillAllFields') || 'Please fill in all fields');
      return;
    }

    // If motorized vehicle selected require vehicle photo
    const motorized = ['MOTORCYCLE','CAR','VAN','TRUCK'];
    if (motorized.includes(vehicleType) && !vehiclePhotoUri) {
      Alert.alert('Vehicle Photo Required','Please upload a vehicle photo with plate visible for selected vehicle type.');
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

  // Show document verification modal if we have a document
  if (documentUri) {
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
        vehicleType,
        documentUri,
        vehiclePhotoUri
      );
      
      if (success) {
        Alert.alert(
          t('success') || 'Success', 
          t('accountCreated') || 'Account created successfully! Please check your email for a verification link. You can now log in.',
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
      // Display specific backend message including normalized hints
      const errorMsg = error?.response?.data?.message || error.message || t('somethingWentWrong') || 'Something went wrong. Please try again.';
      
      // If it's a duplicate account error (409 conflict), offer to go to login
      if (errorMsg.includes('already registered') || errorMsg.includes('already in use')) {
        Alert.alert(
          t('error') || 'Error', 
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
      } else {
        Alert.alert(t('error') || 'Error', errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async (target: 'document' | 'vehicle') => {
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
  if (target === 'document') setDocumentUri(selectedAsset.uri); else setVehiclePhotoUri(selectedAsset.uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const takePhoto = async (target: 'document' | 'vehicle') => {
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
  if (target === 'document') setDocumentUri(selectedAsset.uri); else setVehiclePhotoUri(selectedAsset.uri);
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
            <Text style={styles.modalText}>Validating document...</Text>
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

            {/* Vehicle Type Dropdown */}
            <View style={styles.selectorContainer}>
              <Text style={styles.selectorLabel}>Vehicle Type</Text>
              <TouchableOpacity style={styles.dropdownSelected} onPress={() => setVehicleTypeOpen(o => !o)}>
                <Text style={[styles.dropdownText, !vehicleType && styles.dropdownPlaceholder]}>
                  {vehicleType || 'Select vehicle type'}
                </Text>
                <Ionicons name={vehicleTypeOpen ? 'chevron-up' : 'chevron-down'} size={18} color="#374151" />
              </TouchableOpacity>
              {vehicleTypeOpen && (
                <View style={styles.dropdownOptionsContainer}>
                  {VEHICLE_TYPES.map(opt => (
                    <TouchableOpacity key={opt} style={styles.dropdownOption} onPress={() => { setVehicleType(opt); setVehicleTypeOpen(false); }}>
                      <Text style={styles.dropdownOptionText}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Document Upload */}
            <View style={styles.licenseContainer}>
              <Text style={styles.licenseLabel}>Identification Document</Text>
              <Text style={styles.licenseSubLabel}>Upload ID card or driver license (optional now)</Text>
              {documentUri ? (
                <View style={styles.uploadedImageContainer}>
                  <Image
                    source={{ uri: documentUri || 'https://via.placeholder.com/400x300?text=Document' }}
                    style={styles.uploadedImage}
                    accessible={true}
                    accessibilityLabel="Identification document"
                    alt="Identification document"
                  />
                  <View style={styles.inlineButtons}>
                    <TouchableOpacity style={styles.smallButton} onPress={() => pickImage('document')}>
                      <Text style={styles.smallButtonText}>Replace</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.smallButtonOutline} onPress={() => takePhoto('document')}>
                      <Text style={styles.smallButtonOutlineText}>Camera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.removeBtn} onPress={() => setDocumentUri(null)}>
                      <Ionicons name="trash" size={18} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.inlineButtons}>
                  <TouchableOpacity style={styles.smallButton} onPress={() => pickImage('document')}>
                    <Text style={styles.smallButtonText}>Pick</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.smallButtonOutline} onPress={() => takePhoto('document')}>
                    <Text style={styles.smallButtonOutlineText}>Camera</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Vehicle Photo Upload */}
            <View style={styles.licenseContainer}>
              <Text style={styles.licenseLabel}>Vehicle Photo</Text>
              <Text style={styles.licenseSubLabel}>Plate visible if motorized vehicle</Text>
              {vehiclePhotoUri ? (
                <View style={styles.uploadedImageContainer}>
                  <Image
                    source={{ uri: vehiclePhotoUri || 'https://via.placeholder.com/400x300?text=Vehicle' }}
                    style={styles.uploadedImage}
                    accessible={true}
                    accessibilityLabel="Vehicle photo"
                    alt="Vehicle photo"
                  />
                  <View style={styles.inlineButtons}>
                    <TouchableOpacity style={styles.smallButton} onPress={() => pickImage('vehicle')}>
                      <Text style={styles.smallButtonText}>Replace</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.smallButtonOutline} onPress={() => takePhoto('vehicle')}>
                      <Text style={styles.smallButtonOutlineText}>Camera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.removeBtn} onPress={() => setVehiclePhotoUri(null)}>
                      <Ionicons name="trash" size={18} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.inlineButtons}>
                  <TouchableOpacity style={styles.smallButton} onPress={() => pickImage('vehicle')}>
                    <Text style={styles.smallButtonText}>Pick</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.smallButtonOutline} onPress={() => takePhoto('vehicle')}>
                    <Text style={styles.smallButtonOutlineText}>Camera</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Driver License Upload */}

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
  // Added styles for vehicle type selector & new upload buttons
  selectorContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  segmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    marginHorizontal: 4,
    paddingVertical: 10,
    borderRadius: 8,
  },
  segmentButtonActive: {
    backgroundColor: '#DBEAFE',
  },
  segmentButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  segmentButtonTextActive: {
    color: '#1E3A8A',
  },
  segmentIcon: {
    marginRight: 6,
  },
  inlineButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  smallButton: {
    backgroundColor: '#1E40AF',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginRight: 8,
  },
  smallButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  smallButtonOutline: {
    borderColor: '#1E40AF',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginRight: 8,
  },
  smallButtonOutlineText: {
    color: '#1E40AF',
    fontWeight: '600',
    fontSize: 14,
  },
  removeBtn: {
    backgroundColor: '#DC2626',
    padding: 8,
    borderRadius: 8,
  },
  dropdownSelected: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 8,
  },
  dropdownText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  dropdownPlaceholder: {
    color: '#6B7280',
    fontWeight: '400',
  },
  dropdownOptionsContainer: {
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  dropdownOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownOptionText: {
    fontSize: 14,
    color: '#111827',
  },
});
