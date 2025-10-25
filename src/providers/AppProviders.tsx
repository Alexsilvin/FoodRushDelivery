import React, { memo } from 'react';
import Constants from 'expo-constants';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';
import { AuthProvider } from '../contexts/AuthContext';
import { NetworkProvider } from '../contexts/NetworkContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { CallProvider } from '../contexts/CallContext';
import { LocationProvider } from '../contexts/LocationContext';
import { NotificationProvider } from '../contexts/NotificationContext';

// Check if we're running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * Optimized App Providers Component
 * 
 * Provider hierarchy (order matters):
 * 1. QueryClientProvider - React Query for data fetching and caching
 * 2. LanguageProvider - Must be first for translations
 * 3. ThemeProvider - Depends on language for theme names
 * 4. AuthProvider - Core authentication state
 * 5. CallProvider - Depends on auth for user context
 * 6. LocationProvider - Depends on auth for user-specific tracking
 * 7. NotificationProvider - Depends on auth for user-specific notifications
 */
const AppProviders: React.FC<AppProvidersProps> = memo(({ children }) => {
  return (
    <NetworkProvider>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <ThemeProvider>
            <AuthProvider>
              <CallProvider>
                <LocationProvider
                  config={{
                    updateInterval: 30000, // 30 seconds
                    distanceInterval: 50, // 50 meters
                    enableHighAccuracy: true,
                  }}
                >
                  <NotificationProvider>
                    {children}
                    {/* React Query DevTools removed for mobile - causes 'div' component errors */}
                  </NotificationProvider>
                </LocationProvider>
              </CallProvider>
            </AuthProvider>
          </ThemeProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </NetworkProvider>
  );
});

AppProviders.displayName = 'AppProviders';

export default AppProviders;