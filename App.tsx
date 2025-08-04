import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { AuthProvider } from './src/contexts/AuthContext';
import AuthStack from './src/navigation/AuthStack';
import MainStack from './src/navigation/MainStack';
import { useAuth } from './src/contexts/AuthContext';
import LoadingScreen from './src/components/LoadingScreen';
import SplashScreen from './src/components/SplashScreen';

const Stack = createStackNavigator();

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {user ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleTransitionStart = () => {
    setIsTransitioning(true);
  };

  const handleSplashComplete = () => {
    setShowSplash(false);
    setIsTransitioning(false);
  };

  return (
    <View style={styles.container}>
      {/* Show splash screen */}
      {showSplash && (
        <SplashScreen 
          onAnimationComplete={handleSplashComplete}
          onTransitionStart={handleTransitionStart}
        />
      )}
      
      {/* Show auth/main content (always rendered but behind splash initially) */}
      {(isTransitioning || !showSplash) && (
        <View style={[styles.mainContent, showSplash && styles.behindSplash]}>
          <AuthProvider>
            <StatusBar style="light" backgroundColor="#1E40AF" />
            <AppContent />
          </AuthProvider>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
  },
  behindSplash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
