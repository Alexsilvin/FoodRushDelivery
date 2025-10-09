import { StackNavigationProp, StackScreenProps as RNStackScreenProps } from '@react-navigation/stack';
import { BottomTabNavigationProp, BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

// ====================== AUTH STACK TYPES ======================

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Waiting: undefined;
  Rejected: undefined;
};

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = RNStackScreenProps<
  AuthStackParamList,
  T
>;

// ====================== MAIN TAB TYPES ======================

export type MainTabParamList = {
  Dashboard: undefined;
  Map: undefined;
  Profile: undefined;
};

export type MainTabScreenProps<T extends keyof MainTabParamList> = BottomTabScreenProps<
  MainTabParamList,
  T
>;

// ====================== APP STACK TYPES ======================

export type AppStackParamList = {
  // Tab Navigator
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  
  // Stack Screens
  DeliveryDetails: { deliveryId: string };
  CustomerProfile: { customerId: string };
  MapDetail: { deliveryId?: string; mode?: 'view' | 'route' };
  Settings: undefined;
  EditProfile: undefined;
  VehicleInfo: undefined;
  PhoneNumbers: undefined;
  AvailabilitySchedule: undefined;
  Notifications: undefined;
  CallScreen: { 
    customerName: string; 
    customerPhone: string; 
    deliveryId: string; 
  };
};

export type AppStackScreenProps<T extends keyof AppStackParamList> = RNStackScreenProps<
  AppStackParamList,
  T
>;

// ====================== ROOT STACK TYPES ======================

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  App: NavigatorScreenParams<AppStackParamList>;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = RNStackScreenProps<
  RootStackParamList,
  T
>;

// ====================== COMPOSITE NAVIGATION TYPES ======================

// For Tab screens that need to navigate to App stack screens
export type TabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  RNStackScreenProps<AppStackParamList>
>;

// For App stack screens
export type StackScreenProps<T extends keyof AppStackParamList> = CompositeScreenProps<
  RNStackScreenProps<AppStackParamList, T>,
  RNStackScreenProps<RootStackParamList>
>;

// For Auth screens
export type AuthScreenProps<T extends keyof AuthStackParamList> = AuthStackScreenProps<T>;

// ====================== NAVIGATION PROP TYPES ======================

export type TabNavigationProp<T extends keyof MainTabParamList> = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, T>,
  StackNavigationProp<AppStackParamList>
>;

export type AppStackNavigationProp<T extends keyof AppStackParamList> = CompositeNavigationProp<
  StackNavigationProp<AppStackParamList, T>,
  StackNavigationProp<RootStackParamList>
>;

export type AuthNavigationProp<T extends keyof AuthStackParamList> = StackNavigationProp<
  AuthStackParamList,
  T
>;

// ====================== GLOBAL NAVIGATION DECLARATION ======================

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

export {};