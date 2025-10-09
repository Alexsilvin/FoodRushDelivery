import { Platform, ViewStyle, TextStyle, ImageStyle } from 'react-native';

export const PLATFORM = Platform.OS as 'ios' | 'android';

export const PLATFORM_STYLES = {
  headerHeight: Platform.OS === 'ios' ? 54 : 56,
  statusBarHeight: Platform.OS === 'ios' ? 20 : 0,
  safeAreaPadding: Platform.OS === 'ios' ? 16 : 12,
  
  // Shadow styles (iOS vs Android)
  shadowBox: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 3.84,
    },
    android: {
      elevation: 5,
    },
  }),

  shadowSmall: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 1.5,
    },
    android: {
      elevation: 2,
    },
  }),

  // Border radius (consistent across platforms)
  borderRadiusSmall: 8,
  borderRadiusMedium: 12,
  borderRadiusLarge: 16,

  // Animation durations
  animationDurationShort: 200,
  animationDurationMedium: 300,
  animationDurationLong: 500,

  // Tab bar inset
  tabBarBottomInset: Platform.OS === 'ios' ? 20 : 0,
};

