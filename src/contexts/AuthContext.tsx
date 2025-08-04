import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  vehicle?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, phone: string, vehicle: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Development flag - set to true to force showing auth screens
  const FORCE_SHOW_AUTH = true;

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (FORCE_SHOW_AUTH) {
          // Clear any existing auth data for development
          await SecureStore.deleteItemAsync('auth_token');
          await SecureStore.deleteItemAsync('user');
          setUser(null);
          setLoading(false);
          return;
        }

        const token = await SecureStore.getItemAsync('auth_token');
        const userString = await SecureStore.getItemAsync('user');
        
        if (token && userString) {
          const userData = JSON.parse(userString);
          setUser(userData);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [FORCE_SHOW_AUTH]);

  const checkAuthStatus = async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const userString = await SecureStore.getItemAsync('user');
      
      if (token && userString) {
        const userData = JSON.parse(userString);
        setUser(userData);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // For demo purposes - in production, this would call your API
      if (email === 'driver@demo.com' && password === 'demo123') {
        const demoUser: User = {
          id: '1',
          email: 'driver@demo.com',
          name: 'John Driver',
          phone: '+1234567890',
          vehicle: 'Honda Civic'
        };

        await SecureStore.setItemAsync('auth_token', 'demo_token_123');
        await SecureStore.setItemAsync('user', JSON.stringify(demoUser));
        setUser(demoUser);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (
    name: string, 
    email: string, 
    password: string, 
    phone: string, 
    vehicle: string
  ): Promise<boolean> => {
    try {
      // Demo registration
      const newUser: User = {
        id: Date.now().toString(),
        email,
        name,
        phone,
        vehicle
      };

      await SecureStore.setItemAsync('auth_token', `token_${Date.now()}`);
      await SecureStore.setItemAsync('user', JSON.stringify(newUser));
      setUser(newUser);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('user');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
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
