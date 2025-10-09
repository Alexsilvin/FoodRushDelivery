import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useRef,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LocationService, {
  LocationCoordinates,
  LocationServiceConfig,
  LocationError,
} from '../services/locationService';
import { useAuth } from './AuthContext';

interface LocationContextType {
  currentLocation: LocationCoordinates | null;
  isLocationTracking: boolean;
  locationError: string | null;
  isLocationPermissionGranted: boolean;
  isInitializing: boolean;
  lastUpdateTime: number | null;
  updateFrequency: number; // updates per minute
  startLocationTracking: () => Promise<boolean>;
  stopLocationTracking: () => Promise<void>;
  getCurrentLocation: () => Promise<LocationCoordinates | null>;
  forceLocationUpdate: () => Promise<boolean>;
  updateLocationConfig: (config: Partial<LocationServiceConfig>) => void;
  getServiceStatus: () => any;
  getErrorLog: () => LocationError[];
  clearErrorLog: () => void;
  clearLocationError: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(
  undefined
);

interface LocationProviderProps {
  children: ReactNode;
  config?: Partial<LocationServiceConfig>;
  onLocationError?: (error: string) => void;
  onLocationSuccess?: (location: LocationCoordinates) => void;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({
  children,
  config = {},
  onLocationError,
  onLocationSuccess,
}) => {
  const { user } = useAuth();
  const [currentLocation, setCurrentLocation] =
    useState<LocationCoordinates | null>(null);
  const [isLocationTracking, setIsLocationTracking] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocationPermissionGranted, setIsLocationPermissionGranted] =
    useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<number | null>(null);
  const [updateFrequency, setUpdateFrequency] = useState(0);

  const [locationService] = useState(() =>
    LocationService.getInstance()
  );

  const appStateRef = useRef<AppStateStatus>('active');
  const initTimeoutRef = useRef<NodeJS.Timeout>();
  const trackingCheckIntervalRef = useRef<NodeJS.Timeout>();
  const updateCountRef = useRef(0);
  const frequencyCheckIntervalRef = useRef<NodeJS.Timeout>();

  // Initialize location service when user is authenticated
  useEffect(() => {
    let isActive = true;

    const initializeLocationService = async () => {
      if (!user) {
        console.log(
          '📍 User not authenticated, skipping location initialization'
        );
        if (isLocationTracking) {
          console.log('🛑 Stopping location tracking due to no user');
          await locationService.stopTracking();
          setIsLocationTracking(false);
          setCurrentLocation(null);
        }
        return;
      }

      if (!isActive) return;

      setIsInitializing(true);
      setLocationError(null);

      try {
        console.log(
          '🚀 Initializing location service for authenticated user...'
        );

        if (initTimeoutRef.current) {
          clearTimeout(initTimeoutRef.current);
        }

        initTimeoutRef.current = setTimeout(() => {
          if (
            isActive &&
            !currentLocation &&
            isLocationTracking === false
          ) {
            console.warn(
              '⚠️ Location initialization timeout'
            );
            const fallbackLocation: LocationCoordinates = {
              latitude: 0,
              longitude: 0,
              accuracy: 5000,
              timestamp: Date.now(),
            };
            setCurrentLocation(fallbackLocation);
            setLocationError(
              'Location services taking longer than expected. Please enable location access.'
            );
            onLocationError?.(
              'Timeout acquiring location'
            );
          }
        }, 15000);

        const success = await locationService.initialize({
          updateInterval: 30000,
          distanceInterval: 50,
          enableHighAccuracy: true,
          enableLocationCaching: true,
          ...config,
        });

        if (!isActive) return;

        if (success) {
          setIsLocationPermissionGranted(true);

          const location = await locationService.getCurrentLocation();
          if (location && isActive) {
            setCurrentLocation(location);
            setLastUpdateTime(Date.now());
            clearTimeout(initTimeoutRef.current);
            onLocationSuccess?.(location);

            if (isActive) {
              const trackingStarted =
                await locationService.startTracking();
              setIsLocationTracking(trackingStarted);

              startTrackingVerification();
              startFrequencyMonitoring();

              console.log(
                '✅ Location service initialized and tracking started'
              );
            }
          }
        } else {
          if (isActive) {
            setLocationError(
              'Failed to initialize location service. Check permissions.'
            );
            setIsLocationPermissionGranted(false);
            onLocationError?.('Location permission denied');

            const fallbackLocation: LocationCoordinates = {
              latitude: 0,
              longitude: 0,
              accuracy: 5000,
              timestamp: Date.now(),
            };
            setCurrentLocation(fallbackLocation);
          }
        }
      } catch (error) {
        console.error('❌ Location service initialization error:', error);
        if (isActive) {
          const errorMsg =
            error instanceof Error
              ? error.message
              : 'Unknown location error';
          setLocationError(errorMsg);
          setIsLocationPermissionGranted(false);
          onLocationError?.(errorMsg);

          const fallbackLocation: LocationCoordinates = {
            latitude: 0,
            longitude: 0,
            accuracy: 5000,
            timestamp: Date.now(),
          };
          setCurrentLocation(fallbackLocation);
        }
      } finally {
        if (isActive) {
          setIsInitializing(false);
        }
      }
    };

    initializeLocationService();

    return () => {
      isActive = false;
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
      if (trackingCheckIntervalRef.current) {
        clearInterval(trackingCheckIntervalRef.current);
      }
      if (frequencyCheckIntervalRef.current) {
        clearInterval(frequencyCheckIntervalRef.current);
      }
      if (!user && isLocationTracking) {
        console.log('🛑 User logged out, stopping location tracking');
        locationService.stopTracking();
        setIsLocationTracking(false);
        setCurrentLocation(null);
      }
    };
  }, [user, locationService, config]);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );

    return () => {
      subscription.remove();
    };
  }, [isLocationTracking]);

  const handleAppStateChange = useCallback(
    async (state: AppStateStatus) => {
      appStateRef.current = state;

      if (state === 'active') {
        console.log('📱 App moved to foreground');
        if (isLocationTracking) {
          const location = await locationService.getCurrentLocation();
          if (location) {
            setCurrentLocation(location);
            setLastUpdateTime(Date.now());
          }
        }
      } else if (state === 'background') {
        console.log('📱 App moved to background');
        if (isLocationTracking && user) {
          console.log('✅ Background location tracking active');
        }
      }
    },
    [isLocationTracking, user, locationService]
  );

  const startTrackingVerification = useCallback(() => {
    if (trackingCheckIntervalRef.current) {
      clearInterval(trackingCheckIntervalRef.current);
    }

    trackingCheckIntervalRef.current = setInterval(async () => {
      if (!isLocationTracking || !user) return;

        const status = locationService.getStatus();
        if (!status.isTracking) {
          console.warn('⚠️ Location tracking was stopped unexpectedly, restarting...');
          const restarted = await locationService.startTracking();
          if (restarted) {
            setIsLocationTracking(true);
            console.log('✅ Location tracking restarted');
          }
        }
    }, 60000);
  }, [isLocationTracking, user, locationService]);

  const startFrequencyMonitoring = useCallback(() => {
    if (frequencyCheckIntervalRef.current) {
      clearInterval(frequencyCheckIntervalRef.current);
    }

    updateCountRef.current = 0;

    frequencyCheckIntervalRef.current = setInterval(() => {
      setUpdateFrequency(updateCountRef.current);
      updateCountRef.current = 0;
    }, 60000);
  }, []);

  // Periodic location updates
  useEffect(() => {
    if (!isLocationTracking) return;

    const interval = setInterval(() => {
      const lastKnownLocation = locationService.getLastKnownLocation();
      if (lastKnownLocation) {
        setCurrentLocation(lastKnownLocation);
        setLastUpdateTime(Date.now());
        updateCountRef.current += 1;
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isLocationTracking, locationService]);

  const startLocationTracking = useCallback(
    async (): Promise<boolean> => {
      try {
        setLocationError(null);
        const success = await locationService.startTracking();
        setIsLocationTracking(success);

        if (success) {
          startTrackingVerification();
          startFrequencyMonitoring();
          const location = await locationService.getCurrentLocation();
          if (location) {
            setCurrentLocation(location);
            setLastUpdateTime(Date.now());
            onLocationSuccess?.(location);
          }
        }

        return success;
      } catch (error) {
        const errorMsg =
          error instanceof Error
            ? error.message
            : 'Failed to start location tracking';
        console.error('❌ Failed to start location tracking:', error);
        setLocationError(errorMsg);
        onLocationError?.(errorMsg);
        return false;
      }
    },
    [locationService, startTrackingVerification, startFrequencyMonitoring]
  );

  const stopLocationTracking = useCallback(async (): Promise<void> => {
    try {
      await locationService.stopTracking();
      setIsLocationTracking(false);
      if (trackingCheckIntervalRef.current) {
        clearInterval(trackingCheckIntervalRef.current);
      }
      if (frequencyCheckIntervalRef.current) {
        clearInterval(frequencyCheckIntervalRef.current);
      }
    } catch (error) {
      console.error('❌ Failed to stop location tracking:', error);
    }
  }, [locationService]);

  const getCurrentLocation = useCallback(
    async (): Promise<LocationCoordinates | null> => {
      try {
        setLocationError(null);
        const location = await locationService.getCurrentLocation();
        if (location) {
          setCurrentLocation(location);
          setLastUpdateTime(Date.now());
          onLocationSuccess?.(location);
        }
        return location;
      } catch (error) {
        const errorMsg =
          error instanceof Error
            ? error.message
            : 'Failed to get location';
        console.error('❌ Failed to get current location:', error);
        setLocationError(errorMsg);
        onLocationError?.(errorMsg);
        return null;
      }
    },
    [locationService]
  );

  const forceLocationUpdate = useCallback(
    async (): Promise<boolean> => {
      try {
        setLocationError(null);
        const success = await locationService.forceLocationUpdate();

        if (success) {
          const location = locationService.getLastKnownLocation();
          if (location) {
            setCurrentLocation(location);
            setLastUpdateTime(Date.now());
            onLocationSuccess?.(location);
          }
        }

        return success;
      } catch (error) {
        const errorMsg =
          error instanceof Error
            ? error.message
            : 'Failed to update location';
        console.error('❌ Failed to force location update:', error);
        setLocationError(errorMsg);
        onLocationError?.(errorMsg);
        return false;
      }
    },
    [locationService]
  );

  const updateLocationConfig = useCallback(
    (newConfig: Partial<LocationServiceConfig>): void => {
      locationService.updateConfig(newConfig);
    },
    [locationService]
  );

  const getServiceStatus = useCallback(() => {
    return locationService.getStatus();
  }, [locationService]);

  const getErrorLog = useCallback(() => {
    return locationService.getErrorLog();
  }, [locationService]);

  const clearErrorLog = useCallback(() => {
    locationService.clearErrorLog();
  }, [locationService]);

  const clearLocationError = useCallback(() => {
    setLocationError(null);
  }, []);

  const value: LocationContextType = {
    currentLocation,
    isLocationTracking,
    locationError,
    isLocationPermissionGranted,
    isInitializing,
    lastUpdateTime,
    updateFrequency,
    startLocationTracking,
    stopLocationTracking,
    getCurrentLocation,
    forceLocationUpdate,
    updateLocationConfig,
    getServiceStatus,
    getErrorLog,
    clearErrorLog,
    clearLocationError,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error(
      'useLocation must be used within a LocationProvider'
    );
  }
  return context;
};

export default LocationContext;
