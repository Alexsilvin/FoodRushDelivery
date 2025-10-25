import React, { useState, memo } from 'react';
import { Modal, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetwork } from './src/contexts/NetworkContext';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { useTheme } from './src/contexts/ThemeContext';
import { useAuth } from './src/contexts/AuthContext';
import AuthStack from './src/navigation/AuthStack';
import MainStack from './src/navigation/MainStack';
import SplashScreen from './src/components/SplashScreen';
import { AppProviders } from './src/providers';
import { ActivityIndicator } from 'react-native';

// Memoized AppContent to prevent unnecessary re-renders
// This component MUST be inside the AppProviders to access contexts
const AppContent = memo(() => {
  const { user, loading } = useAuth();
  const { theme } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
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
});

AppContent.displayName = 'AppContent';

// Main App component that wraps everything with providers
export default function App() {
  // Global network state
  const { isOffline } = useNetwork();
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
    <AppProviders>
      <View style={styles.container}>
        {/* Global offline notification */}
        <Modal
          visible={isOffline}
          transparent={true}
          animationType="fade"
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 32, alignItems: 'center', elevation: 5 }}>
              <Ionicons name="cloud-offline" size={48} color="#1E40AF" style={{ marginBottom: 12 }} />
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 8 }}>No Internet Connection</Text>
              <Text style={{ fontSize: 16, color: '#6B7280', textAlign: 'center' }}>You are currently offline. Please check your network connection to continue.</Text>
            </View>
          </View>
        </Modal>

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
            <AppContent />
          </View>
        )}
      </View>
    </AppProviders>
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