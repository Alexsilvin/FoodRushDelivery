import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, riderService } from '../services';
import { User as ApiUser } from '../types/api';

// Local User extends API user ensuring required fields while tolerating optional backend omissions
interface User extends ApiUser {
  // Enforce role presence
  role: string;
  // Normalize possibly undefined names to at least empty string when stored
  firstName?: string;
  lastName?: string;
  isVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{success: boolean; user?: User; token?:string; state?: string}>;
  register: (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    phoneNumber: string,
    vehicleType: string,
    documentUri?: string | null,
    vehiclePhotoUri?: string | null
  ) => Promise<{ success: boolean; user?: User; state?: string }>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (token: string, newPassword: string) => Promise<boolean>;
  updateUserProfile: (data: { firstName: string; lastName: string; email: string }) => Promise<boolean>;
  updateUserPhoneNumber: (phoneNumber: string) => Promise<boolean>;
  updateUserVehicles: (vehicles: { id: string; name: string; type: string; default: boolean }[], defaultVehicle: string) => Promise<boolean>;
  updateUserPhoneNumbers: (phoneNumbers: { id: string; number: string; isPrimary: boolean }[], primaryNumber: string) => Promise<boolean>;
  refreshUserProfile: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
  // Initialize auth from persisted storage (do NOT wipe token here)
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
          try {
            // Get the user profile from the API
            // Prefer rider account endpoint then fallback
            const userData = await riderService.getMyAccount();
            if (userData) {
              console.log('✅ Profile data loaded on init:', userData);
              
              // The data is already normalized by the API service
              const normalized: User = {
                ...userData,
                // Ensure required fields are present
                firstName: userData.firstName || userData.fullName?.split(' ')[0] || '',
                lastName: userData.lastName || userData.fullName?.split(' ').slice(1).join(' ') || '',
                role: userData.role || 'rider'
              };
              
              // Store the normalized user data
              await SecureStore.setItemAsync('user', JSON.stringify(normalized));
              setUser(normalized);
            } else {
              // Token exists but profile fetch failed, clear token
              await AsyncStorage.removeItem('auth_token');
              setUser(null);
            }
          } catch (error: any) {
            // Handle 403 errors gracefully - this means user is not approved yet
            if (error?.response?.status === 403) {
              console.log('📍 User not approved yet, keeping token but profile unavailable');
              // Keep the token but don't set user profile
              // This allows the app to show appropriate waiting/pending screens
              setUser(null);
            } else {
              console.error('Error fetching user profile:', error);
              // For other errors, remove the token
              await AsyncStorage.removeItem('auth_token');
              setUser(null);
            }
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

const login = async (
  email: string,
  password: string
): Promise<{ success: boolean; user?: User; token?: string; state?: string }> => {
  try {
    const response = await riderService.login(email, password);

    const { accessToken, user } = response;

    if (!accessToken || !user) {
      return { success: false };
    }

    await AsyncStorage.setItem('auth_token', accessToken);
    
    // After successful login, fetch the current rider profile to get the latest state
    let currentUser = user;
    try {
      const profileResponse = await riderService.getMyAccount();
      if (profileResponse) {
        currentUser = profileResponse;
        console.log('✅ Fetched current rider profile:', {
          state: currentUser.state,
          status: currentUser.status,
          id: currentUser.id
        });
      }
    } catch (profileError: any) {
      if (profileError?.response?.status === 403) {
        console.log('📍 User not approved yet, using login response data');
      } else {
        console.warn('⚠️ Could not fetch current profile, using login response:', profileError);
      }
    }

    await SecureStore.setItemAsync('user', JSON.stringify(currentUser));

    const normalized: User = {
      ...currentUser,
      firstName: currentUser.firstName || currentUser.fullName?.split(' ')[0] || '',
      lastName: currentUser.lastName || currentUser.fullName?.split(' ').slice(1).join(' ') || '',
      role: currentUser.role || 'rider',
    };

    setUser(normalized);

    // Use the current profile state, fallback to login response state, then 'pending'
    const finalState = normalized.state || normalized.status || state || 'pending';
    
    console.log('🔍 Final login state determination:', {
      profileState: normalized.state,
      profileStatus: normalized.status,
      loginResponseState: state,
      finalState
    });

    return {
      success: true,
      user: normalized,
      token: accessToken,
      state: finalState,
    };
  } catch (error: any) {
    console.error('Login error:', error);
    throw new Error(error?.response?.data?.message || 'Login failed. Please try again.');
  }
};

  const register = async (
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  phoneNumber: string,
  vehicleType: string,
  documentUri?: string | null,
  vehiclePhotoUri?: string | null
): Promise<{ success: boolean; user?: User; state?: string }> => {
  try {
    const fullName = `${firstName} ${lastName}`.trim();
    const formData = new FormData();
    formData.append('fullName', fullName);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('phoneNumber', phoneNumber);
    formData.append('vehicleType', vehicleType);
    
    if (documentUri) {
      formData.append('document', {
        uri: documentUri,
        type: 'image/jpeg',
        name: 'document.jpg',
      } as any);
    }
    
    if (vehiclePhotoUri) {
      formData.append('vehiclePhoto', {
        uri: vehiclePhotoUri,
        type: 'image/jpeg',
        name: 'vehicle.jpg',
      } as any);
    }
    
    const response = await riderService.registerAndApply(formData);

    if (response) {
      const { user, accessToken } = response;

      // Store tokens
      await AsyncStorage.setItem('auth_token', accessToken);
      if (response.refreshToken) {
        await AsyncStorage.setItem('refresh_token', response.refreshToken);
      }
      
      await SecureStore.setItemAsync('user', JSON.stringify(user));

      const normalized: User = {
        ...user,
        firstName: user.firstName || user.fullName?.split(' ')[0] || '',
        lastName: user.lastName || user.fullName?.split(' ').slice(1).join(' ') || '',
        role: user.role || 'rider',
      };

      setUser(normalized);

      // Best-effort: attach vehicle locally
      if (vehicleType) {
        try {
          normalized.vehicles = [...(normalized.vehicles || []), { type: vehicleType, default: true }];
          setUser({ ...normalized });
        } catch (vehErr) {
          console.warn('Vehicle post-registration save skipped:', vehErr);
        }
      }

      return {
        success: true,
        user: normalized,
        state: normalized.state || 'pending',
      };
    }

    return { success: false };
  } catch (error: any) {
    console.error('Registration error:', error);

    if (error?.response?.status === 400) {
      if (error.response.data?.message?.includes('already exists')) {
        throw new Error('Email or phone number already in use. Please use a different one.');
      } else {
        throw new Error(error.response.data?.message || 'Invalid registration data. Please check your information.');
      }
    } else if (error?.response?.status === 409) {
      const errorMsg = error.response.data?.message || '';
      if (errorMsg.includes('Email and phone number already used')) {
        throw new Error('Both email and phone number are already registered. Please use different credentials or try to login.');
      } else if (errorMsg.includes('Email already used')) {
        throw new Error('This email is already registered. Please use a different email or try to login.');
      } else if (errorMsg.includes('Phone number already used')) {
        throw new Error('This phone number is already registered. Please use a different phone number.');
      } else {
        throw new Error('This account already exists. Please try to login instead.');
      }
    } else if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else {
      throw error;
    }
  }
};

  const logout = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('refresh_token');
      await SecureStore.deleteItemAsync('user');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const forgotPassword = async (email: string): Promise<boolean> => {
    try {
      const response = await authService.forgotPassword(email);
      return !!response;
    } catch (error) {
      console.error('Forgot password error:', error);
      return false;
    }
  };

  const resetPassword = async (token: string, newPassword: string): Promise<boolean> => {
    try {
      const response = await authService.resetPassword(token, newPassword);
      return !!response;
    } catch (error) {
      console.error('Reset password error:', error);
      return false;
    }
  };

  const updateUserProfile = async (data: { firstName: string; lastName: string; email: string }): Promise<boolean> => {
    try {
      if (!user) return false;
      
      console.log('🔄 Updating profile with data:', data);
      
      // API accepts: fullName, phoneNumber, profilePicture (not firstName, lastName, email)
      const profileData = {
        fullName: `${data.firstName} ${data.lastName}`.trim()
      };
      
      const response = await authService.updateProfile(profileData);
      
      if (response) {
        console.log('✅ Profile updated successfully:', response);
        
        // Parse fullName back to firstName/lastName for local storage
        const fullName = response.fullName || `${data.firstName} ${data.lastName}`.trim();
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0] || data.firstName;
        const lastName = nameParts.slice(1).join(' ') || data.lastName;
        
        const updatedUser = {
          ...user,
          ...response,
          firstName: firstName,
          lastName: lastName,
          fullName: fullName,
          // Email is not updatable via this endpoint - keep original
          email: user.email
        };
        
        // Save to secure storage and update context
        await SecureStore.setItemAsync('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        return true;
      } else {
        console.warn('⚠️ Profile update failed');
        return false;
      }
    } catch (error: any) {
      console.error('❌ Profile update error:', error?.response?.data || error.message);
      
      // Log the specific error for debugging
      if (error?.response?.status === 404) {
        console.error('❌ Profile endpoint not found - check if /api/v1/auth/profile exists');
      } else if (error?.response?.status === 401) {
        console.error('❌ Unauthorized - JWT token may be invalid or expired');
      } else if (error?.response?.status === 422) {
        console.error('❌ Validation error - check request data format');
      }
      
      return false;
    }
  };

  const updateUserPhoneNumber = async (phoneNumber: string): Promise<boolean> => {
    try {
      if (!user) return false;
      
      console.log('🔄 Updating phone number:', phoneNumber);
      
      const response = await authService.updateProfile({ phoneNumber });
      
      if (response) {
        console.log('✅ Phone number updated successfully:', response);
        
        const updatedUser = {
          ...user,
          ...response,
          phoneNumber: phoneNumber
        };
        
        await SecureStore.setItemAsync('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        return true;
      } else {
        console.warn('⚠️ Phone number update failed');
        return false;
      }
    } catch (error: any) {
      console.error('❌ Phone number update error:', error?.response?.data || error.message);
      return false;
    }
  };

  const updateUserVehicles = async (
    vehicles: { id: string; name: string; type: string; default: boolean }[],
    defaultVehicle: string
  ): Promise<boolean> => {
    try {
      if (!user) return false;
      
      try {
        // Send only default + list meta (simplified) - adjust to backend contract when available
        await riderService.updateVehicle({ vehicles, defaultVehicle });
      } catch (e) {
        console.warn('Vehicle API update failed, persisting locally only');
      }
      const updatedUser = { ...user, vehicles };
      await SecureStore.setItemAsync('user', JSON.stringify(updatedUser));
      setUser(updatedUser); return true;
    } catch (error) {
      console.error('Vehicle update error:', error);
      return false;
    }
  };

  const updateUserPhoneNumbers = async (
    phoneNumbers: { id: string; number: string; isPrimary: boolean }[],
    primaryNumber: string
  ): Promise<boolean> => {
    try {
      if (!user) return false;
      
      // In a real app, we would make an API call to update the phone numbers
      // For now, we'll just update the local user data
      
      const updatedUser = {
        ...user,
        phoneNumbers,
        phoneNumber: primaryNumber
      };

      await SecureStore.setItemAsync('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return true;
    } catch (error) {
      console.error('Phone numbers update error:', error);
      return false;
    }
  };

  const refreshUserProfile = async (): Promise<boolean> => {
    try {
      if (!user) return false;
      
      console.log('🔄 Refreshing user profile from backend...');
      
      const userData = await riderService.getMyAccount();
      if (userData) {
        console.log('✅ Profile data refreshed:', userData);
        
        // The data is already normalized by the API service
        const normalized: User = {
          ...userData,
          // Ensure required fields are present
          firstName: userData.firstName || userData.fullName?.split(' ')[0] || '',
          lastName: userData.lastName || userData.fullName?.split(' ').slice(1).join(' ') || '',
          role: userData.role || 'rider'
        };
        
        // Store the updated user data
        await SecureStore.setItemAsync('user', JSON.stringify(normalized));
        setUser(normalized);
        
        return true;
      } else {
        console.warn('⚠️ Profile refresh failed - no data received');
        return false;
      }
    } catch (error: any) {
      // Handle 403 errors gracefully - user not approved yet
      if (error?.response?.status === 403) {
        console.log('📍 User not approved yet, profile refresh skipped');
        return false;
      }
      console.error('❌ Profile refresh error:', error?.response?.data || error.message);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      register, 
      logout,
      forgotPassword,
      resetPassword,
      updateUserProfile,
      updateUserPhoneNumber,
      updateUserVehicles,
      updateUserPhoneNumbers,
      refreshUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}