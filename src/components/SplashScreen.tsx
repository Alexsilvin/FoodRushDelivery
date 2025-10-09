import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onAnimationComplete: () => void;
  onTransitionStart?: () => void;
}

export default function SplashScreen({ onAnimationComplete, onTransitionStart }: SplashScreenProps) {
  // Use default theme since this component renders before providers
  const defaultTheme = {
    isDark: false,
    colors: {
      statusBar: '#0f1419',
      background: '#0f1419',
      surface: '#1a2332',
      primary: '#3B82F6',
    }
  };
  
  // Animated values for each letter in "Food"
  const foodLetterAnimations = useRef([
    new Animated.Value(0), // F
    new Animated.Value(0), // o
    new Animated.Value(0), // o
    new Animated.Value(0), // d
  ]).current;

  // Animated value for "Rush" image sliding from left
  const rushAnimation = useRef(new Animated.Value(-width)).current;

  // Overall fade in animation
  const fadeAnimation = useRef(new Animated.Value(0)).current;

  // Animation for moving logo to top during transition
  const logoTransitionY = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animateFoodLetters = () => {
      const letterAnimations = foodLetterAnimations.map((animation, index) =>
        Animated.spring(animation, {
          toValue: 1,
          tension: 100, // More bouncy
          friction: 8,
          delay: index * 200, // Slightly slower stagger for more dramatic effect
          useNativeDriver: true,
        })
      );

      // Start all letter animations
      Animated.stagger(200, letterAnimations).start(() => {
        // After "Food" is complete, animate "Rush" sliding in from left
        Animated.spring(rushAnimation, {
          toValue: 0, // Slide to center position
          tension: 80,
          friction: 8, // Smooth spring animation
          useNativeDriver: true,
        }).start(() => {
          // Wait a moment then start transition to top
          setTimeout(() => {
            startTransitionToTop();
          }, 1200);
        });
      });
    };

    const startTransitionToTop = () => {
      // Notify parent that transition is starting
      if (onTransitionStart) {
        onTransitionStart();
      }

      // Move logo up and scale down
      Animated.parallel([
        Animated.timing(logoTransitionY, {
          toValue: -height * 0.35, // Move to top area
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 0.6, // Scale down to fit header size
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // After transition animation, complete the splash
        setTimeout(() => {
          onAnimationComplete();
        }, 200);
      });
    };

    // Start the animation sequence with a fade in
    Animated.timing(fadeAnimation, {
      toValue: 1,
      duration: 600, // Slightly longer fade in
      useNativeDriver: true,
    }).start(() => {
      // Small delay before starting letter animation
      setTimeout(() => {
        animateFoodLetters();
      }, 300);
    });
  }, [fadeAnimation, foodLetterAnimations, rushAnimation, logoTransitionY, logoScale, onAnimationComplete, onTransitionStart]);

  return (
    <LinearGradient
      colors={['#0f1419', '#1a2332', '#2a3441']} // Fixed colors for splash
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor={defaultTheme.colors.statusBar} />
      
      <Animated.View style={[
        styles.content, 
        { 
          opacity: fadeAnimation,
          transform: [
            { translateY: logoTransitionY },
            { scale: logoScale }
          ]
        }
      ]}>
        {/* "Food" text with letter-by-letter animation */}
        <View style={styles.foodContainer}>
          {['F', 'o', 'o', 'd'].map((letter, index) => (
            <Animated.Text
              key={index}
              style={[
                styles.foodText,
                {
                  opacity: foodLetterAnimations[index],
                  transform: [
                    {
                      translateY: foodLetterAnimations[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0], // Slide up from below
                      }),
                    },
                    {
                      scale: foodLetterAnimations[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1], // Scale up animation
                      }),
                    },
                  ],
                },
              ]}
            >
              {letter}
            </Animated.Text>
          ))}
        </View>

        {/* "Rush" image sliding from left */}
        <Animated.View
          style={[
            styles.rushContainer,
            {
              transform: [
                {
                  translateX: rushAnimation,
                },
              ],
            },
          ]}
        >
          <Image
            source={require('../../assets/outoloyout.png')}
            style={styles.rushImage}
            resizeMode="contain"
            alt="Food Rush Logo"
          />
        </Animated.View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: -10, // Bring "Rush" closer to "Food"
  },
  foodText: {
    fontSize: 80, // Larger size to match your design
    fontWeight: '900', // Extra bold
    color: '#FFFFFF',
    fontFamily: 'System', 
    letterSpacing: -3, // Tighter letter spacing
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  rushContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -5, // Fine-tune positioning
  },
  rushImage: {
    width: width * 0.7, // Slightly larger
    height: 100, // Taller to match proportions
    maxWidth: 350,
  },
});