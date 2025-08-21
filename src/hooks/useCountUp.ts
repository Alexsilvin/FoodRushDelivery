import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';

export function useCountUp(target: number | null, duration = 800) {
  const animated = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (target == null || isNaN(target as any)) return;
    animated.setValue(0);
    const listener = animated.addListener(({ value }) => {
      const current = Math.round((value as number) * target);
      setDisplay(String(current));
    });
    Animated.timing(animated, { toValue: 1, duration, useNativeDriver: false }).start(() => {
      animated.removeListener(listener);
      setDisplay(String(Math.round(target)));
    });
    return () => animated.removeAllListeners();
  }, [target, duration, animated]);

  return display;
}
