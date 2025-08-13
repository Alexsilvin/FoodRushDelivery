import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, riderAPI } from '../services/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: string;
  isVerified: boolean;
  phoneNumbers?: { id: string; number: string; isPrimary: boolean }[];
  vehicles?: { id: string; name: string; type: string; default: boolean }[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (firstName: string, lastName: string, email: string, password: string, phoneNumber: string, vehicle?: string, driverLicense?: string | null) => Promise<boolean>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (token: string, newPassword: string) => Promise<boolean>;
  updateUserProfile: (data: { firstName: string; lastName: string; email: string }) => Promise<boolean>;
  updateUserVehicles: (vehicles: { id: string; name: string; type: string; default: boolean }[], defaultVehicle: string) => Promise<boolean>;
  updateUserPhoneNumbers: (phoneNumbers: { id: string; number: string; isPrimary: boolean }[], primaryNumber: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Development flag - set to false to use real API
  const FORCE_SHOW_AUTH = false;

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (FORCE_SHOW_AUTH) {
          // Clear any existing auth data for development
          await AsyncStorage.removeItem('auth_token');
          await SecureStore.deleteItemAsync('user');
          setUser(null);
          setLoading(false);
          return;
        }

        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
          try {
            // Get the user profile from the API
            const userData = await authAPI.getProfile();
            if (userData.data) {
              setUser(userData.data);
            } else {
              // Token exists but profile fetch failed, clear token
              await AsyncStorage.removeItem('auth_token');
              setUser(null);
            }
          } catch (error) {
            console.error('Error fetching user profile:', error);
            // If there's an error fetching the profile, remove the token
            await AsyncStorage.removeItem('auth_token');
            setUser(null);
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
  }, [FORCE_SHOW_AUTH]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      if (FORCE_SHOW_AUTH && email === 'driver@demo.com' && password === 'demo123') {
        // Demo mode
        const demoUser: User = {
          id: '1',
          email: 'driver@demo.com',
          firstName: 'John',
          lastName: 'Driver',
          phoneNumber: '+1234567890',
          role: 'rider',
          isVerified: true
        };

        await AsyncStorage.setItem('auth_token', 'demo_token_123');
        await SecureStore.setItemAsync('user', JSON.stringify(demoUser));
        setUser(demoUser);
        return true;
      }
      
      // Real API call
      const response = await authAPI.login(email, password);
      
      if (response.success && response.data) {
        const { token, user } = response.data;
        
        // Ensure the user is a rider
        if (user.role !== 'rider') {
          throw new Error('This app is for delivery drivers only');
        }
        
        await AsyncStorage.setItem('auth_token', token);
        await SecureStore.setItemAsync('user', JSON.stringify(user));
        setUser(user);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      throw error; // Rethrow to handle in the component
    }
  };

  const register = async (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    phoneNumber: string,
    vehicle?: string,
    driverLicense?: string | null
  ): Promise<boolean> => {
    try {
      // Use the verified working payload format
      const registrationData = {
        firstName,
        lastName,
        email,
        password,
        phoneNumber,
        fullName: `${firstName} ${lastName}`,
        role: 'rider' // Set role to rider for delivery driver app
      };
      
      // Note: vehicle and driverLicense would typically be uploaded separately 
      // after registration in a real implementation
      
      const response = await authAPI.register(registrationData);
      
      if (response && response.status_code === 201) {
        // The API doesn't return a token directly, so we would need to login
        // But for now, we'll store the user data and redirect to the login screen
        console.log('Registration successful:', JSON.stringify(response));
        
        // Inform the user they need to login or verify their email
        return true;
      } else if (response && response.data) {
        // Handle if there's a nested data object with auth info
        const { data } = response;
        
        if (data.token && data.user) {
          // Format: { data: { token, user } }
          await AsyncStorage.setItem('auth_token', data.token);
          await SecureStore.setItemAsync('user', JSON.stringify(data.user));
          setUser(data.user);
          return true;
        }
        
        // Registration was technically successful but no token
        return true;
      }
      
      // Unexpected response format
      console.error('Registration succeeded but response format is unexpected:', response);
      return false;
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Enhanced error logging
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
      
      throw error; // Rethrow to handle in the component
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem('auth_token');
      await SecureStore.deleteItemAsync('user');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const forgotPassword = async (email: string): Promise<boolean> => {
    try {
      const response = await authAPI.forgotPassword(email);
      return response.success || false;
    } catch (error) {
      console.error('Forgot password error:', error);
      return false;
    }
  };

  const resetPassword = async (token: string, newPassword: string): Promise<boolean> => {
    try {
      const response = await authAPI.resetPassword(token, newPassword);
      return response.success || false;
    } catch (error) {
      console.error('Reset password error:', error);
      return false;
    }
  };

  const updateUserProfile = async (data: { firstName: string; lastName: string; email: string }): Promise<boolean> => {
    try {
      if (!user) return false;
      
      const response = await authAPI.updateProfile(data);
      
      if (response.success && response.data) {
        const updatedUser = {
          ...user,
          ...data
        };
        
        await SecureStore.setItemAsync('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Profile update error:', error);
      return false;
    }
  };

  const updateUserVehicles = async (
    vehicles: { id: string; name: string; type: string; default: boolean }[],
    defaultVehicle: string
  ): Promise<boolean> => {
    try {
      if (!user) return false;
      
      // In a real app, we would make an API call to update the vehicles
      // For now, we'll just update the local user data
      
      const updatedUser = {
        ...user,
        vehicles
      };

      await SecureStore.setItemAsync('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return true;
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
      updateUserVehicles,
      updateUserPhoneNumbers
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
