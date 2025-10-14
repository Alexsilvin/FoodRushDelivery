import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Platform,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

interface FloatingTabBarProps extends BottomTabBarProps {
  userType?: 'driver';
}

const FloatingTabBar: React.FC<FloatingTabBarProps> = ({
  state,
  descriptors,
  navigation,
  userType = 'driver',
}) => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  // Calculate tab bar dimensions
  const tabBarWidth = screenWidth * 0.9; // 90% of screen width
  const tabBarHeight = 70;
  const bottomMargin = Platform.OS === 'ios' ? insets.bottom + 20 : 35;

  const getIconName = (routeName: string, focused: boolean): keyof typeof Ionicons.glyphMap => {
    switch (routeName) {
      case 'Dashboard':
        return focused ? 'home' : 'home-outline';
      case 'Deliveries':
        return focused ? 'car' : 'car-outline';
      case 'Map':
        return focused ? 'map' : 'map-outline';
      case 'Profile':
        return focused ? 'person' : 'person-outline';
      default:
        return 'help-outline';
    }
  };

  const getTabLabel = (routeKey: string): string => {
    const descriptor = descriptors[routeKey];
    const label = descriptor.options.tabBarLabel || descriptor.options.title;

    if (typeof label === 'string') {
      return label;
    }

    // If label is a function, call it and convert to string
    if (typeof label === 'function') {
      const result = label({ focused: false, color: '', position: 'beside-icon', children: '' });
      return String(result || descriptor.route.name);
    }

    return descriptor.route.name;
  };

  return (
    <View style={[styles.container, { bottom: bottomMargin }]}>
      <View
        style={[
          styles.tabBar,
          {
            width: tabBarWidth,
            height: tabBarHeight,
            backgroundColor: theme.colors.card,
            shadowColor: theme.isDark ? '#000' : '#000',
            borderWidth: theme.isDark ? 0.5 : 0,
            borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const iconName = getIconName(route.name, isFocused);
          const label = getTabLabel(route.key);

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[
                styles.tabItem,
                {
                  backgroundColor: isFocused
                    ? `${theme.colors.primary}15`
                    : 'transparent',
                },
              ]}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <Ionicons
                  name={iconName}
                  size={24}
                  color={
                    isFocused
                      ? theme.colors.primary
                      : theme.colors.textSecondary
                  }
                />
                {isFocused && (
                  <View
                    style={[
                      styles.indicator,
                      { backgroundColor: theme.colors.primary },
                    ]}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.label,
                  {
                    color: isFocused
                      ? theme.colors.primary
                      : theme.colors.textSecondary,
                    opacity: isFocused ? 1 : 0.7,
                  },
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
    // Enhanced shadow for better floating effect
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        elevation: 15,
      },
    }),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 20,
    minHeight: 50,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 2,
  },
  indicator: {
    position: 'absolute',
    bottom: -6,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
});

export default FloatingTabBar;