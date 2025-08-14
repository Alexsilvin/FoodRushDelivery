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

  useEffect(() => {
    const initAuth = async () => {
      try {
        // First, clear any existing auth data to ensure we start fresh
        await AsyncStorage.removeItem('auth_token');
        await SecureStore.deleteItemAsync('user');
        setUser(null);
        
        // Now, let's initialize auth properly
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
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
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
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Provide more specific error messages based on response
      if (error?.response?.status === 401) {
        throw new Error('Invalid email or password');
      } else if (error?.response?.status === 403) {
        throw new Error('Account not verified. Please check your email for verification link.');
      } else if (error?.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw error; // Rethrow original error if we can't categorize it
      }
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
      const registrationData = {
        firstName,
        lastName,
        email,
        password,
        phoneNumber,
        role: 'rider' // Set role to rider for delivery driver app
      };

      // Add vehicle data if provided
      if (vehicle) {
        // If we had a proper API endpoint for this, we would handle the vehicle differently
        // For now, we'll just include it in the registration data
        Object.assign(registrationData, { vehicleName: vehicle });
      }
      
      // Note: driverLicense would typically be uploaded separately in a real implementation
      // Here we're just simulating that it's part of the registration process
      
      const response = await authAPI.register(registrationData);
      
      if (response.success && response.data) {
        const { token, user } = response.data;
        
        await AsyncStorage.setItem('auth_token', token);
        await SecureStore.setItemAsync('user', JSON.stringify(user));
        setUser(user);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Registration error:', error);
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
