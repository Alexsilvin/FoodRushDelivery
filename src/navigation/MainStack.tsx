import React, { use } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import DashboardScreen from '../screens/main/DashboardScreen';
import DeliveriesScreen from '../screens/main/DeliveriesScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import DeliveryDetailsScreen from '../screens/main/DeliveryDetailsScreen';
import CustomerProfileScreen from '../screens/main/CustomerProfileScreen';
import MapScreen from '../screens/main/MapScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import VehicleInfoScreen from '../screens/main/VehicleInfoScreen';
import PhoneNumbersScreen from '../screens/main/PhoneNumbersScreen';
import AvailabilityScheduleScreen from '../screens/main/AvailabilityScheduleScreen';
import GlobalCallOverlay from '../components/GlobalCallOverlay';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Deliveries') {
            iconName = focused ? 'car' : 'car-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Map') {
            iconName = focused ? 'map' : 'map-outline';
          } else {
            iconName = 'home-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.card,
          // paddingBottom: 5,
          paddingTop: -1,
          // height: 70,
           height: (Platform.OS === 'ios' ? 50 : 60) + insets.bottom,
      paddingBottom: (Platform.OS === 'ios' ? 25 : 10) + insets.bottom,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 10,
          overflow: 'hidden',
          marginTop: -20,
        },
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ title: t('dashboard'), headerShown: false }}
      />
      <Tab.Screen 
        name="Deliveries" 
        component={DeliveriesScreen}
        options={{ title: t('myDeliveries'), headerShown: false }}
      />
      <Tab.Screen 
        name="Map" 
        component={MapScreen}
        options={{ title: t('map'), headerShown: false }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: t('profile'), headerShown: false }}
      />
    </Tab.Navigator>
  );
}

export default function MainStack() {
  const { theme } = useTheme();
  
  return (
    <>
      <Stack.Navigator>
        <Stack.Screen 
          name="Main" 
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="DeliveryDetails" 
          component={DeliveryDetailsScreen}
          options={{
            title: 'Delivery Details',
            headerStyle: {
              backgroundColor: theme.colors.primary,
            },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
        <Stack.Screen 
          name="CustomerProfile" 
          component={CustomerProfileScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{
            title: 'Settings',
            headerStyle: {
              backgroundColor: theme.colors.primary,
            },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
        <Stack.Screen 
          name="EditProfile" 
          component={EditProfileScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="VehicleInfo" 
          component={VehicleInfoScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="PhoneNumbers" 
          component={PhoneNumbersScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="AvailabilitySchedule"
          component={AvailabilityScheduleScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
      <GlobalCallOverlay />
    </>
  );
}
