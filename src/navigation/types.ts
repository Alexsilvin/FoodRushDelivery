// Re-export types from the main navigation types file
export * from '../types/navigation.types';

// Legacy compatibility exports (deprecated - use types from navigation.types.ts)
export type { 
  AuthStackParamList,
  MainTabParamList,
  AppStackParamList,
  RootStackParamList,
  MainTabScreenProps,
  StackScreenProps as AppStackScreenProps,
  AuthStackScreenProps,
  AppStackNavigationProp as RootNavigationProp
} from '../types/navigation.types';
