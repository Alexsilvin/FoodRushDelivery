import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export function useStaggeredFadeIn(count: number, options: { delay?: number; duration?: number } = {}) {
  const { delay = 60, duration = 400 } = options;
  const animValues = useRef([...Array(count)].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = animValues.map((val, index) => (
      Animated.timing(val, {
        toValue: 1,
        duration,
        delay: index * delay,
        useNativeDriver: true,
      })
    ));
    Animated.stagger(delay / 2, animations).start();
  }, [animValues, delay, duration]);

  return animValues;
}
