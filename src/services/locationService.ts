import * as Location from 'expo-location';
import { riderAPI } from './api';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

export interface LocationServiceConfig {
  enableBackgroundLocation?: boolean;
  updateInterval?: number; // in milliseconds
  distanceInterval?: number; // in meters
  enableHighAccuracy?: boolean;
}

class LocationService {
  private static instance: LocationService;
  private currentLocation: LocationCoordinates | null = null;
  private isTracking = false;
  private locationSubscription: Location.LocationSubscription | null = null;
  private updateTimer: NodeJS.Timeout | null = null;
  private lastUpdateTime = 0;
  private lastSentLocation: LocationCoordinates | null = null;
  private config: LocationServiceConfig = {
    enableBackgroundLocation: true,
    updateInterval: 30000, // 30 seconds
    distanceInterval: 50, // 50 meters
    enableHighAccuracy: true,
  };

  private constructor() {}

  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Initialize location service and request permissions
   */
  public async initialize(config?: Partial<LocationServiceConfig>): Promise<boolean> {
    try {
      if (config) {
        this.config = { ...this.config, ...config };
      }

      console.log('🗺️ Initializing location service...');

      // Request foreground permissions
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        console.error('❌ Foreground location permission denied');
        return false;
      }

      // Request background permissions if enabled
      if (this.config.enableBackgroundLocation) {
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus !== 'granted') {
          console.warn('⚠️ Background location permission denied, continuing with foreground only');
          this.config.enableBackgroundLocation = false;
        }
      }

      // Get initial location
      await this.getCurrentLocation();
      
      console.log('✅ Location service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize location service:', error);
      return false;
    }
  }

  /**
   * Get current location once
   */
  public async getCurrentLocation(): Promise<LocationCoordinates | null> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: this.config.enableHighAccuracy 
          ? Location.Accuracy.High 
          : Location.Accuracy.Balanced,
        maximumAge: 10000, // 10 seconds
      });

      const coordinates: LocationCoordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
        timestamp: location.timestamp,
      };

      this.currentLocation = coordinates;
      console.log('📍 Current location:', coordinates);

      return coordinates;
    } catch (error) {
      console.error('❌ Failed to get current location:', error);
      return null;
    }
  }

  /**
   * Start continuous location tracking
   */
  public async startTracking(): Promise<boolean> {
    if (this.isTracking) {
      console.log('📍 Location tracking already active');
      return true;
    }

    try {
      console.log('🚀 Starting location tracking...');

      // Start location subscription
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: this.config.enableHighAccuracy 
            ? Location.Accuracy.High 
            : Location.Accuracy.Balanced,
          timeInterval: this.config.updateInterval,
          distanceInterval: this.config.distanceInterval,
        },
        (location) => {
          this.handleLocationUpdate(location);
        }
      );

      // Start periodic backend updates
      this.startPeriodicUpdates();

      this.isTracking = true;
      console.log('✅ Location tracking started');
      return true;
    } catch (error) {
      console.error('❌ Failed to start location tracking:', error);
      return false;
    }
  }

  /**
   * Stop location tracking
   */
  public stopTracking(): void {
    console.log('🛑 Stopping location tracking...');

    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }

    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }

    this.isTracking = false;
    console.log('✅ Location tracking stopped');
  }

  /**
   * Handle location updates from the subscription
   */
  private handleLocationUpdate(location: Location.LocationObject): void {
    const coordinates: LocationCoordinates = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy || undefined,
      timestamp: location.timestamp,
    };

    this.currentLocation = coordinates;
    
    // Check if we should send update to backend
    if (this.shouldSendLocationUpdate(coordinates)) {
      this.sendLocationToBackend(coordinates);
    }
  }

  /**
   * Check if location should be sent to backend
   */
  private shouldSendLocationUpdate(newLocation: LocationCoordinates): boolean {
    const now = Date.now();
    
    // Always send if no previous location
    if (!this.lastSentLocation) {
      return true;
    }

    // Send if enough time has passed
    if (now - this.lastUpdateTime >= this.config.updateInterval!) {
      return true;
    }

    // Send if moved significant distance
    const distance = this.calculateDistance(this.lastSentLocation, newLocation);
    if (distance >= this.config.distanceInterval!) {
      return true;
    }

    return false;
  }

  /**
   * Calculate distance between two coordinates in meters
   */
  private calculateDistance(coord1: LocationCoordinates, coord2: LocationCoordinates): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = coord1.latitude * Math.PI / 180;
    const φ2 = coord2.latitude * Math.PI / 180;
    const Δφ = (coord2.latitude - coord1.latitude) * Math.PI / 180;
    const Δλ = (coord2.longitude - coord1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  /**
   * Send location to backend
   */
  private async sendLocationToBackend(coordinates: LocationCoordinates): Promise<void> {
    try {
      console.log('📤 Sending location to backend:', coordinates);
      
      await riderAPI.updateLocation(coordinates.latitude, coordinates.longitude);
      
      this.lastSentLocation = coordinates;
      this.lastUpdateTime = Date.now();
      
      console.log('✅ Location sent to backend successfully');
    } catch (error) {
      console.error('❌ Failed to send location to backend:', error);
    }
  }

  /**
   * Start periodic updates to backend
   */
  private startPeriodicUpdates(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }

    this.updateTimer = setInterval(() => {
      if (this.currentLocation) {
        this.sendLocationToBackend(this.currentLocation);
      }
    }, this.config.updateInterval);
  }

  /**
   * Get the last known location
   */
  public getLastKnownLocation(): LocationCoordinates | null {
    return this.currentLocation;
  }

  /**
   * Check if location tracking is active
   */
  public isLocationTracking(): boolean {
    return this.isTracking;
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<LocationServiceConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Restart tracking if active to apply new config
    if (this.isTracking) {
      this.stopTracking();
      this.startTracking();
    }
  }

  /**
   * Force send current location to backend
   */
  public async forceLocationUpdate(): Promise<boolean> {
    try {
      const location = await this.getCurrentLocation();
      if (location) {
        await this.sendLocationToBackend(location);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Failed to force location update:', error);
      return false;
    }
  }
}

export default LocationService;