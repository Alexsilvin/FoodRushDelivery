import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import RootNavigator from './RootNavigator';

export default function AppNavigator() {
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  
  const isAuthenticated = !!user;

  const navigationTheme = {
    dark: theme.isDark,
    colors: {
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.card,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.primary,
    },
    fonts: {
      regular: {
        fontFamily: 'System',
        fontWeight: 'normal' as const,
      },
      medium: {
        fontFamily: 'System',
        fontWeight: '500' as const,
      },
      bold: {
        fontFamily: 'System',
        fontWeight: 'bold' as const,
      },
      heavy: {
        fontFamily: 'System',
        fontWeight: '900' as const,
      },
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <RootNavigator 
        isAuthenticated={isAuthenticated} 
        isLoading={loading} 
      />
    </NavigationContainer>
  );
}