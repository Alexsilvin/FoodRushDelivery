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
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

export default function RegisterScreen({ navigation }: any) {
  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const [stepProgress] = useState(new Animated.Value(0));

  // Form data
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [vehicleTypeOpen, setVehicleTypeOpen] = useState(false);
  const VEHICLE_TYPES = ['BICYCLE','MOTORCYCLE','CAR','VAN','TRUCK','WALKER'];
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [documentUri, setDocumentUri] = useState<string | null>(null);
  const [vehiclePhotoUri, setVehiclePhotoUri] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [verifyingLicense, setVerifyingLicense] = useState(false);
  
  const { register } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();

  const validateStep1 = () => {
    if (!firstName || !lastName || !email || !phoneNumber) {
      Alert.alert(t('error') || 'Error', 'Please fill in all required fields');
      return false;
    }

    if (!email.includes('@')) {
      Alert.alert(t('error') || 'Error', t('invalidEmail') || 'Invalid email format');
      return false;
    }

    return true;
  };

  const validateStep2 = () => {
    if (!password || !confirmPassword || !vehicleType) {
      Alert.alert(t('error') || 'Error', 'Please fill in all required fields');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('error') || 'Error', t('passwordsDoNotMatch') || 'Passwords do not match');
      return false;
    }

    if (password.length < 6) {
      Alert.alert(t('error') || 'Error', t('passwordTooShort') || 'Password must be at least 6 characters');
      return false;
    }

    // If motorized vehicle selected require vehicle photo
    const motorized = ['MOTORCYCLE','CAR','VAN','TRUCK'];
    if (motorized.includes(vehicleType) && !vehiclePhotoUri) {
      Alert.alert('Vehicle Photo Required','Please upload a vehicle photo with plate visible for selected vehicle type.');
      return false;
    }

    return true;
  };

  const nextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
      Animated.timing(stepProgress, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  const prevStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
      Animated.timing(stepProgress, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleRegister = async () => {
    if (!validateStep2()) return;

    // Show document verification modal if we have a document
    if (documentUri) {
      setVerifyingLicense(true);
      
      // Simulate license verification process
      setTimeout(async () => {
        setVerifyingLicense(false);
        proceedWithRegistration();
      }, 3000);
    } else {
      proceedWithRegistration();
    }
  };
  
  const proceedWithRegistration = async () => {
    setLoading(true);

    try {
      const response = await register(
        firstName,
        lastName,
        email,
        password,
        phoneNumber,
        vehicleType,
        documentUri,
        vehiclePhotoUri
      );

      const userState = response?.user?.state?.toLowerCase();

      if (response?.success) {
        console.log('🎯 Registration successful, user state:', userState);
        
        // Handle navigation based on user state
        if (userState === 'pending' || userState === 'pending_verification') {
          Alert.alert(
            t('success') || 'Success',
            t('accountPending') || 'Your account has been created and is pending approval. Please check your email for verification.',
            [
              {
                text: t('ok') || 'OK',
                onPress: () => navigation.replace('Waiting', {
                  reason: 'Your account is pending approval. Please wait for admin review.'
                }),
              },
            ]
          );
        } else if (userState === 'active' || userState === 'approved') {
          Alert.alert(
            t('success') || 'Success',
            'Account created successfully! Welcome to Food Rush.',
            [
              {
                text: t('getStarted') || 'Get Started',
                onPress: () => navigation.replace('Login'),
              },
            ]
          );
        } else if (userState === 'rejected') {
          navigation.replace('Rejected');
        } else {
          // Default case - go to login
          Alert.alert(
            t('success') || 'Success',
            'Account created successfully! Please log in to continue.',
            [
              {
                text: 'Go to Login',
                onPress: () => navigation.navigate('Login'),
              },
            ]
          );
        }
      } else {
        // Registration failed
        Alert.alert(
          t('error') || 'Error',
          'Registration failed. Please check your information and try again.'
        );
      }
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.message ||
        error.message ||
        t('somethingWentWrong') ||
        'Something went wrong. Please try again.';

      if (errorMsg.includes('already registered') || errorMsg.includes('already in use')) {
        Alert.alert(t('error') || 'Error', errorMsg, [
          {
            text: t('goToLogin') || 'Go to Login',
            onPress: () => navigation.navigate('Login'),
          },
          {
            text: t('tryAgain') || 'Try Again',
            style: 'cancel',
          },
        ]);
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
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'We need camera roll permissions to upload your image');
        setUploadingImage(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        if (target === 'document') setDocumentUri(selectedAsset.uri); 
        else setVehiclePhotoUri(selectedAsset.uri);
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
      
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'We need camera permissions to take a photo');
        setUploadingImage(false);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        if (target === 'document') setDocumentUri(selectedAsset.uri); 
        else setVehiclePhotoUri(selectedAsset.uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Personal Information</Text>
      <Text style={styles.stepSubtitle}>Tell us about yourself</Text>

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

      <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
        <Text style={styles.nextButtonText}>Continue</Text>
        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={styles.buttonIcon} />
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Account & Vehicle Details</Text>
      <Text style={styles.stepSubtitle}>Complete your registration</Text>

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

      {/* Password Fields */}
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

      {/* Document Upload */}
      <View style={styles.uploadSection}>
        <Text style={styles.uploadLabel}>ID Document</Text>
        <Text style={styles.uploadSubLabel}>Upload ID card or driver license</Text>
        {documentUri ? (
          <View style={styles.uploadedImageContainer}>
            <View style={styles.inlineButtons}>
              <Image source={{ uri: documentUri }} style={styles.uploadedImage} alt='Uploaded Document'/>
              <TouchableOpacity style={styles.smallButton} onPress={() => pickImage('document')}>
                <Text style={styles.smallButtonText}>Replace</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.smallButtonOutline} onPress={() => takePhoto('document')}>
                <Text style={styles.smallButtonOutlineText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.removeBtn} onPress={() => setDocumentUri(null)}>
                <Ionicons name="trash" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.inlineButtons}>
            <TouchableOpacity style={styles.smallButton} onPress={() => pickImage('document')}>
              <Ionicons name="images" size={16} color="#FFF" style={styles.smallButtonIcon} />
              <Text style={styles.smallButtonText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.smallButtonOutline} onPress={() => takePhoto('document')}>
              <Ionicons name="camera" size={16} color="#1E40AF" style={styles.smallButtonIcon} />
              <Text style={styles.smallButtonOutlineText}>Camera</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Vehicle Photo Upload */}
      <View style={styles.uploadSection}>
        <Text style={styles.uploadLabel}>Vehicle Photo</Text>
        <Text style={styles.uploadSubLabel}>Required for motorized vehicles (plate visible)</Text>
        {vehiclePhotoUri ? (
          <View style={styles.uploadedImageContainer}>
            <Image source={{ uri: vehiclePhotoUri }} style={styles.uploadedImage} alt='Uploaded Vehicle Photo'/>
            <View style={styles.inlineButtons}>
              <TouchableOpacity style={styles.smallButton} onPress={() => pickImage('vehicle')}>
                <Text style={styles.smallButtonText}>Replace</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.smallButtonOutline} onPress={() => takePhoto('vehicle')}>
                <Text style={styles.smallButtonOutlineText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.removeBtn} onPress={() => setVehiclePhotoUri(null)}>
                <Ionicons name="trash" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.inlineButtons}>
            <TouchableOpacity style={styles.smallButton} onPress={() => pickImage('vehicle')}>
              <Ionicons name="images" size={16} color="#FFF" style={styles.smallButtonIcon} />
              <Text style={styles.smallButtonText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.smallButtonOutline} onPress={() => takePhoto('vehicle')}>
              <Ionicons name="camera" size={16} color="#1E40AF" style={styles.smallButtonIcon} />
              <Text style={styles.smallButtonOutlineText}>Camera</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Navigation Buttons */}
      <View style={styles.navigationButtons}>
        <TouchableOpacity style={styles.backButton} onPress={prevStep}>
          <Ionicons name="arrow-back" size={20} color="#6B7280" style={styles.buttonIcon} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.registerButton, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.registerButtonText}>
            {loading ? 'Creating...' : 'Create Account'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
            <Text style={styles.modalSubText}>This will not take long</Text>
          </View>
        </View>
      </Modal>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.headerBackButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.title}>Join Our Team</Text>
            <Text style={styles.subtitle}>Become a delivery partner</Text>
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View 
                style={[
                  styles.progressFill,
                  {
                    width: stepProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['50%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>Step {currentStep} of 2</Text>
          </View>

          {/* Form Content */}
          <View style={styles.form}>
            {currentStep === 1 ? renderStep1() : renderStep2()}
          </View>

          {/* Footer */}
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
    marginBottom: 30,
  },
  headerBackButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#DBEAFE',
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  progressText: {
    color: '#DBEAFE',
    fontSize: 14,
    fontWeight: '500',
  },
  form: {
    marginBottom: 30,
  },
  stepContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  nextButton: {
    backgroundColor: '#1E40AF',
    borderRadius: 12,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flex: 0.4,
  },
  backButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: '#1E40AF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flex: 0.55,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  selectorContainer: {
    marginBottom: 20,
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  dropdownSelected: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dropdownText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  dropdownPlaceholder: {
    color: '#9CA3AF',
    fontWeight: '400',
  },
  dropdownOptionsContainer: {
    marginTop: 4,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#111827',
  },
  uploadSection: {
    marginBottom: 20,
  },
  uploadLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  uploadSubLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  uploadedImageContainer: {
    alignItems: 'center',
  },
  uploadedImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginBottom: 12,
  },
  inlineButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallButton: {
    backgroundColor: '#1E40AF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  smallButtonOutline: {
    borderColor: '#1E40AF',
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallButtonOutlineText: {
    color: '#1E40AF',
    fontWeight: '600',
    fontSize: 14,
  },
  smallButtonIcon: {
    marginRight: 6,
  },
  removeBtn: {
    backgroundColor: '#DC2626',
    padding: 10,
    borderRadius: 8,
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 32,
    width: '85%',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalSpinner: {
    marginBottom: 20,
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