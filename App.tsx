import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { CallProvider } from './src/contexts/CallContext';
import AuthStack from './src/navigation/AuthStack';
import MainStack from './src/navigation/MainStack';
import { useAuth } from './src/contexts/AuthContext';
import LoadingScreen from './src/components/LoadingScreen';
import SplashScreen from './src/components/SplashScreen';

const Stack = createStackNavigator();

function AppContent() {
  const { user, loading } = useAuth();
  const { theme } = useTheme();

  if (loading) {
    return <LoadingScreen />;
  }

  // Helper function to normalize state strings
  const normalizeState = (state: string | undefined) => {
    if (!state) return '';
    return state.replace(/\s+/g, '_').replace(/-/g, '_').replace(/\W/g, '').toUpperCase();
  };

  // Check if user should access main app
  const canAccessMainApp = () => {
    if (!user) return false;
    
    const userState = normalizeState(user.state || user.status);
    
    console.log('App.tsx Navigation Check:', {
      userState,
      rawState: user.state,
      rawStatus: user.status,
    });

    // Only allow access to main app if user is ACTIVE, READY, or APPROVED
    const activeStates = ['ACTIVE', 'READY', 'APPROVED'];
    return activeStates.includes(userState);
  };

  return (
    <NavigationContainer>
      <StatusBar style={theme.isDark ? "light" : "dark"} backgroundColor={theme.colors.statusBar} />
      {canAccessMainApp() ? <MainStack /> : <AuthStack />}
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
    <LanguageProvider>
      <ThemeProvider>
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
              <CallProvider>
                <AuthProvider>
                  <AppContent />
                </AuthProvider>
              </CallProvider>
            </View>
          )}
        </View>
      </ThemeProvider>
    </LanguageProvider>
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