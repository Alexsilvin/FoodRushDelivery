import React from 'react';
import { createStackNavigator, StackNavigationOptions } from '@react-navigation/stack';
import { useTheme } from '../contexts/ThemeContext';
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

  const screenOptions: StackNavigationOptions = {
    cardStyle: { backgroundColor: theme.colors.background },
    headerShown: false,
  };

  if (isLoading) {
    // You can render a splash screen here instead
    return null;
  }

  return (
    <Stack.Navigator
      screenOptions={screenOptions}
      initialRouteName={isAuthenticated ? 'App' : 'Auth'}
    >
      {isAuthenticated ? (
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

