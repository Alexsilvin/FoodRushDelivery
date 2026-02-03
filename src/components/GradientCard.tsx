import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GradientCardProps {
  colors: string[];
  children: React.ReactNode;
  style?: ViewStyle;
  borderRadius?: number;
  opacity?: number;
  blur?: boolean;
}

export const GradientCard: React.FC<GradientCardProps> = ({
  colors,
  children,
  style,
  borderRadius = 16,
  opacity = 1,
  blur = false,
}) => {
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.container,
        {
          borderRadius,
          opacity,
        },
        style,
      ]}
    >
      {blur ? (
        <View style={[styles.blurOverlay, { borderRadius }]} />
      ) : null}
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
  },
});

export default GradientCard;
