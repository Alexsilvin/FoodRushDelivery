import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import LocationService, { LocationCoordinates, LocationServiceConfig } from '../services/locationService';
import { useAuth } from './AuthContext';

interface LocationContextType {
  currentLocation: LocationCoordinates | null;
  isLocationTracking: boolean;
  locationError: string | null;
  isLocationPermissionGranted: boolean;
  startLocationTracking: () => Promise<boolean>;
  stopLocationTracking: () => void;
  getCurrentLocation: () => Promise<LocationCoordinates | null>;
  forceLocationUpdate: () => Promise<boolean>;
  updateLocationConfig: (config: Partial<LocationServiceConfig>) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

interface LocationProviderProps {
  children: ReactNode;
  config?: Partial<LocationServiceConfig>;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ 
  children, 
  config = {} 
}) => {
  const { user } = useAuth();
  const [currentLocation, setCurrentLocation] = useState<LocationCoordinates | null>(null);
  const [isLocationTracking, setIsLocationTracking] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocationPermissionGranted, setIsLocationPermissionGranted] = useState(false);
  const [locationService] = useState(() => LocationService.getInstance());

  // Initialize location service when user is authenticated
  useEffect(() => {
    const initializeLocationService = async () => {
      if (!user) {
        console.log('📍 User not authenticated, skipping location initialization');
        return;
      }

      try {
        setLocationError(null);
        console.log('🚀 Initializing location service for authenticated user...');
        
        const success = await locationService.initialize({
          enableBackgroundLocation: true,
          updateInterval: 30000, // 30 seconds
          distanceInterval: 50, // 50 meters
          enableHighAccuracy: true,
          ...config,
        });

        if (success) {
          setIsLocationPermissionGranted(true);
          
          // Get initial location
          const location = await locationService.getCurrentLocation();
          if (location) {
            setCurrentLocation(location);
          }

          // Start tracking automatically for authenticated users
          const trackingStarted = await locationService.startTracking();
          setIsLocationTracking(trackingStarted);
          
          console.log('✅ Location service initialized and tracking started');
        } else {
          setLocationError('Failed to initialize location service. Please check permissions.');
          setIsLocationPermissionGranted(false);
        }
      } catch (error) {
        console.error('❌ Location service initialization error:', error);
        setLocationError(error instanceof Error ? error.message : 'Unknown location error');
        setIsLocationPermissionGranted(false);
      }
    };

    initializeLocationService();

    // Cleanup on unmount or user logout
    return () => {
      if (!user) {
        console.log('🛑 User logged out, stopping location tracking');
        locationService.stopTracking();
        setIsLocationTracking(false);
        setCurrentLocation(null);
      }
    };
  }, [user, locationService, config]);

  // Periodic location updates
  useEffect(() => {
    if (!isLocationTracking) return;

    const interval = setInterval(() => {
      const lastKnownLocation = locationService.getLastKnownLocation();
      if (lastKnownLocation) {
        setCurrentLocation(lastKnownLocation);
      }
    }, 5000); // Update UI every 5 seconds

    return () => clearInterval(interval);
  }, [isLocationTracking, locationService]);

  const startLocationTracking = async (): Promise<boolean> => {
    try {
      setLocationError(null);
      const success = await locationService.startTracking();
      setIsLocationTracking(success);
      
      if (success) {
        const location = await locationService.getCurrentLocation();
        if (location) {
          setCurrentLocation(location);
        }
      }
      
      return success;
    } catch (error) {
      console.error('❌ Failed to start location tracking:', error);
      setLocationError(error instanceof Error ? error.message : 'Failed to start location tracking');
      return false;
    }
  };

  const stopLocationTracking = (): void => {
    locationService.stopTracking();
    setIsLocationTracking(false);
  };

  const getCurrentLocation = async (): Promise<LocationCoordinates | null> => {
    try {
      setLocationError(null);
      const location = await locationService.getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
      }
      return location;
    } catch (error) {
      console.error('❌ Failed to get current location:', error);
      setLocationError(error instanceof Error ? error.message : 'Failed to get location');
      return null;
    }
  };

  const forceLocationUpdate = async (): Promise<boolean> => {
    try {
      setLocationError(null);
      const success = await locationService.forceLocationUpdate();
      
      if (success) {
        const location = locationService.getLastKnownLocation();
        if (location) {
          setCurrentLocation(location);
        }
      }
      
      return success;
    } catch (error) {
      console.error('❌ Failed to force location update:', error);
      setLocationError(error instanceof Error ? error.message : 'Failed to update location');
      return false;
    }
  };

  const updateLocationConfig = (newConfig: Partial<LocationServiceConfig>): void => {
    locationService.updateConfig(newConfig);
  };

  const value: LocationContextType = {
    currentLocation,
    isLocationTracking,
    locationError,
    isLocationPermissionGranted,
    startLocationTracking,
    stopLocationTracking,
    getCurrentLocation,
    forceLocationUpdate,
    updateLocationConfig,
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
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

export default LocationContext;