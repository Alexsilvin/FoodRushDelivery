import { createStackNavigator, StackNavigationOptions } from '@react-navigation/stack';
import { useTheme } from '../contexts/ThemeContext';
import { PLATFORM_STYLES } from './platformStyles';
import { AuthStackParamList } from '../types/navigation.types';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import WaitingScreen from '../screens/auth/WaitingScreen';
import RejectedScreen from '../screens/auth/RejectedScreen';

const Stack = createStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  const { theme } = useTheme();

  const screenOptions: StackNavigationOptions = {
    headerShown: false,
    cardStyle: { backgroundColor: theme.colors.background },
    gestureEnabled: true,
  };

  const fullScreenOptions: StackNavigationOptions = {
    ...screenOptions,
  };

  return (
    <Stack.Navigator
      screenOptions={screenOptions}
      initialRouteName="Login"
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
