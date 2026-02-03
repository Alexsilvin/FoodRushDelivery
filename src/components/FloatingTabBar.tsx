import React, { useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Platform,
  Dimensions,
  StyleSheet,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
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

  // Animation for the moving ball
  const ballPosition = useRef(new Animated.Value(0)).current;

  // Calculate tab bar dimensions
  const tabBarWidth = screenWidth * 0.9;
  const tabBarHeight = 70;
  const bottomMargin = Platform.OS === 'ios' ? insets.bottom + 20 : 35;
  const itemWidth = (tabBarWidth - 24) / state.routes.length; // Accounting for padding

  // Animate ball position when tab changes
  useEffect(() => {
    Animated.spring(ballPosition, {
      toValue: state.index * itemWidth,
      useNativeDriver: false,
      tension: 50,
      friction: 8,
    }).start();
  }, [state.index, itemWidth]);

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

    if (typeof label === 'function') {
      const result = label({ focused: false, color: '', position: 'beside-icon', children: '' });
      return String(result || descriptor.route.name);
    }

    return descriptor.route.name;
  };

  return (
    <View style={[styles.container, { bottom: bottomMargin }]}>
      <BlurView intensity={90} style={styles.blurContainer}>
        <LinearGradient
          colors={theme.isDark 
            ? ['rgba(30, 58, 138, 0.3)', 'rgba(15, 23, 42, 0.3)']
            : ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.9)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.tabBar,
            {
              width: tabBarWidth,
              height: tabBarHeight,
              borderWidth: 1,
              borderColor: theme.isDark 
                ? 'rgba(96, 165, 250, 0.2)' 
                : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          {/* Animated ball indicator */}
          <Animated.View
            style={[
              styles.animatedBall,
              {
                transform: [{ translateX: ballPosition }],
                width: itemWidth - 8,
              },
            ]}
          >
            <LinearGradient
              colors={['#60A5FA', '#3B82F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ballGradient}
            />
          </Animated.View>

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
                  { width: itemWidth },
                ]}
                activeOpacity={0.7}
              >
                <View style={styles.iconContainer}>
                  <Ionicons
                    name={iconName}
                    size={24}
                    color={
                      isFocused
                        ? '#FFFFFF'
                        : theme.isDark
                        ? theme.colors.textSecondary
                        : '#64748B'
                    }
                  />
                </View>
                <Text
                  style={[
                    styles.label,
                    {
                      color: isFocused
                        ? '#FFFFFF'
                        : theme.isDark
                        ? theme.colors.textSecondary
                        : '#64748B',
                      fontSize: isFocused ? 11 : 10,
                      fontWeight: isFocused ? '700' : '500',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </LinearGradient>
      </BlurView>
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
  blurContainer: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  animatedBall: {
    position: 'absolute',
    height: 50,
    left: 12,
    top: 10,
    borderRadius: 25,
    zIndex: 0,
  },
  ballGradient: {
    flex: 1,
    borderRadius: 25,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    zIndex: 10,
    minHeight: 60,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  label: {
    textAlign: 'center',
    marginTop: 2,
  },
});

export default FloatingTabBar;
