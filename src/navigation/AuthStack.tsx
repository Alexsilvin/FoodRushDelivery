import React, { useEffect } from 'react';
import { createStackNavigator, StackNavigationOptions } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { PLATFORM_STYLES } from './platformStyles';
import { AuthStackParamList } from '../types/navigation.types';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import WaitingScreen from '../screens/auth/WaitingScreen';
import RejectedScreen from '../screens/auth/RejectedScreen';

const Stack = createStackNavigator<AuthStackParamList>();

function AuthStackNavigator() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const screenOptions: StackNavigationOptions = {
    headerShown: false,
    cardStyle: { backgroundColor: theme.colors.background },
    gestureEnabled: true,
  };

  const fullScreenOptions: StackNavigationOptions = {
    ...screenOptions,
  };

  // Helper function to normalize state strings
  const normalizeState = (state: string | undefined) => {
    if (!state) return '';
    return state.replace(/\s+/g, '_').replace(/-/g, '_').replace(/\W/g, '').toUpperCase();
  };

  // Auto-navigate based on user state when user exists but is not ready
  useEffect(() => {
    if (user) {
      const userState = normalizeState(user.state || user.status);
      console.log('🔍 AuthStack - Auto-navigation check:', {
        userState,
        originalState: user.state,
        originalStatus: user.status
      });

      // If user is authenticated but not ready, navigate to appropriate screen
      if (userState === 'REJECTED') {
        console.log('❌ Navigating to Rejected screen');
        navigation.navigate('Rejected');
      } else if (userState !== 'READY' && userState !== 'ACTIVE' && userState !== 'APPROVED') {
        console.log('⏳ Navigating to Waiting screen for state:', userState);
        navigation.navigate('Waiting');
      }
    }
  }, [user, navigation]);

  // Determine initial route based on user state
  const getInitialRouteName = () => {
    if (!user) return 'Login';
    
    const userState = normalizeState(user.state || user.status);
    
    if (userState === 'REJECTED') {
      return 'Rejected';
    } else if (userState !== 'READY' && userState !== 'ACTIVE' && userState !== 'APPROVED') {
      return 'Waiting';
    }
    
    return 'Login';
  };

  return (
    <Stack.Navigator
      screenOptions={screenOptions}
      initialRouteName={getInitialRouteName()}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={screenOptions}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={screenOptions}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={screenOptions}
      />
      <Stack.Screen
        name="Waiting"
        component={WaitingScreen}
        options={{
          ...fullScreenOptions,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="Rejected"
        component={RejectedScreen}
        options={{
          ...fullScreenOptions,
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
}

export default function AuthStack() {
  return <AuthStackNavigator />;
}
