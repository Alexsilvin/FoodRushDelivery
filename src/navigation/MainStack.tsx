import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { AppStackParamList, MainTabParamList } from '../types/navigation.types';

// Tab Screens
import DashboardScreen from '../screens/main/DashboardScreen';
import MapScreen from '../screens/main/MapScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

// Stack Screens
import SettingsScreen from '../screens/main/SettingsScreen';
import DeliveryDetailsScreen from '../screens/main/DeliveryDetailsScreen';
import CustomerProfileScreen from '../screens/main/CustomerProfileScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import VehicleInfoScreen from '../screens/main/VehicleInfoScreen';
import PhoneNumbersScreen from '../screens/main/PhoneNumbersScreen';
import AvailabilityScheduleScreen from '../screens/main/AvailabilityScheduleScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import CallScreen from '../screens/main/CallScreen';

// Components
import FloatingTabBar from '../components/FloatingTabBar';

const Stack = createStackNavigator<AppStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function TabNavigator() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Tab.Navigator
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
        }}
      >
        <Tab.Screen 
          name="Dashboard" 
          component={DashboardScreen}
          options={{ title: t('dashboard') || 'Dashboard' }}
        />
        <Tab.Screen 
          name="Map" 
          component={MapScreen}
          options={{ title: t('map') || 'Map' }}
        />
        <Tab.Screen 
          name="Profile" 
          component={ProfileScreen}
          options={{ title: t('profile') || 'Profile' }}
        />
      </Tab.Navigator>
    </View>
  );
}

export default function MainStack() {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        cardStyle: { 
          backgroundColor: theme.colors.background 
        },
      }}
      initialRouteName="MainTabs"
    >
      {/* Main Tab Navigator */}
      <Stack.Screen 
        name="MainTabs" 
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      
      {/* Stack Screens */}
      <Stack.Screen 
        name="DeliveryDetails" 
        component={DeliveryDetailsScreen}
        options={{ title: 'Delivery Details' }}
      />
      <Stack.Screen 
        name="CustomerProfile" 
        component={CustomerProfileScreen}
        options={{ title: 'Customer Profile' }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{ title: 'Edit Profile' }}
      />
      <Stack.Screen 
        name="VehicleInfo" 
        component={VehicleInfoScreen}
        options={{ title: 'Vehicle Information' }}
      />
      <Stack.Screen 
        name="PhoneNumbers" 
        component={PhoneNumbersScreen}
        options={{ title: 'Phone Numbers' }}
      />
      <Stack.Screen
        name="AvailabilitySchedule"
        component={AvailabilityScheduleScreen}
        options={{ title: 'Availability Schedule' }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />
     
      <Stack.Screen 
        name="CallScreen" 
        component={CallScreen}
        options={{ 
          title: 'Call',
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
}