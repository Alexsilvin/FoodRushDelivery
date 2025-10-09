import React from 'react';
import { View, StatusBar, StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useFloatingTabBarHeight } from '../hooks/useFloatingTabBarHeight';

interface CommonViewProps {
  children: React.ReactNode;
  showStatusBar?: boolean;
  paddingHorizontal?: number;
  safeAreaEdges?: ('top' | 'right' | 'bottom' | 'left')[];
  style?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  hasTabBar?: boolean; // Add bottom padding for floating tab bar
}

const CommonView: React.FC<CommonViewProps> = ({ 
  children, 
  showStatusBar = true,
  paddingHorizontal = 0,
  safeAreaEdges = ['top', 'right', 'bottom', 'left'],
  style,
  backgroundColor: customBackgroundColor,
  hasTabBar = false
}) => {
  const { theme } = useTheme();
  const tabBarHeight = useFloatingTabBarHeight();
  const backgroundColor = customBackgroundColor || theme.colors.background;
  const statusBarStyle = theme.isDark ? 'light-content' : 'dark-content';

  return (
    <>
      {showStatusBar && (
        <StatusBar
          barStyle={statusBarStyle}
          backgroundColor={backgroundColor}
          translucent={false}
        />
      )}

      <SafeAreaView
        edges={safeAreaEdges}
        style={[
          { 
            flex: 1, 
            backgroundColor 
          }
        ]}
      >
        <View
          style={[
            { 
              flex: 1, 
              backgroundColor,
              paddingHorizontal: paddingHorizontal,
              paddingBottom: hasTabBar ? tabBarHeight : 0 // Add bottom padding for floating tab bar
            },
            style
          ]}
        >
          {children}
        </View>
      </SafeAreaView>
    </>
  );
};

export default CommonView;
