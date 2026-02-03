import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView as ExpoBlurView } from 'expo-blur';

interface BlurViewProps {
  intensity?: number;
  style?: ViewStyle;
  children: React.ReactNode;
}

export const BlurView: React.FC<BlurViewProps> = ({
  intensity = 90,
  style,
  children,
}) => {
  return (
    <ExpoBlurView intensity={intensity} style={[styles.container, style]}>
      {children}
    </ExpoBlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default BlurView;
