import React from 'react';
import { createStackNavigator, StackNavigationOptions } from '@react-navigation/stack';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types/navigation.types';
import { PLATFORM_STYLES } from './platformStyles';
import AuthStack from './AuthStack';
import MainStack from './MainStack';

const Stack = createStackNavigator<RootStackParamList>();

interface RootNavigatorProps {
  isAuthenticated: boolean;
  isLoading: boolean;
}

export default function RootNavigator({ isAuthenticated, isLoading }: RootNavigatorProps) {
  const { theme } = useTheme();
  const { user } = useAuth();

  const screenOptions: StackNavigationOptions = {
    cardStyle: { backgroundColor: theme.colors.background },
    headerShown: false,
  };

  if (isLoading) {
    // You can render a splash screen here instead
    return null;
  }

  // Helper function to normalize state strings
  const normalizeState = (state: string | undefined) => {
    if (!state) return '';
    return state.replace(/\s+/g, '_').replace(/-/g, '_').replace(/\W/g, '').toUpperCase();
  };

  // Check if user is authenticated and has proper state
  const isUserReady = () => {
    if (!isAuthenticated || !user) return false;
    
    const userState = normalizeState(user.state || user.status);
    console.log('🔍 RootNavigator - User state check:', {
      isAuthenticated,
      userState,
      originalState: user.state,
      originalStatus: user.status
    });
    
    // Allow access to main app only if state is READY or ACTIVE
    return userState === 'READY' || userState === 'ACTIVE' || userState === 'APPROVED';
  };

  const shouldShowMainApp = isUserReady();

  return (
    <Stack.Navigator
      screenOptions={screenOptions}
      initialRouteName={shouldShowMainApp ? 'App' : 'Auth'}
    >
      {shouldShowMainApp ? (
        <Stack.Screen
          name="App"
          component={MainStack}
        />
      ) : (
        <Stack.Screen
          name="Auth"
          component={AuthStack}
        />
      )}
    </Stack.Navigator>
  );
}

