import { useMemo } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Hook to calculate the total height occupied by the floating tab bar
 * including its height, bottom margin, and safe area insets
 */
export const useFloatingTabBarHeight = () => {
  const insets = useSafeAreaInsets();

  const tabBarHeight = useMemo(() => {
    // These values should match the FloatingTabBar component
    const TAB_BAR_HEIGHT = 70; // Height of the tab bar itself
    const BOTTOM_MARGIN = Platform.OS === 'ios' ? insets.bottom + 20 : 35; // Bottom margin from screen edge
    const ADDITIONAL_PADDING = 20; // Extra padding for better UX

    return TAB_BAR_HEIGHT + BOTTOM_MARGIN + ADDITIONAL_PADDING;
  }, [insets.bottom]);

  return tabBarHeight;
};