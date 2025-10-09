import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { riderService } from './riderService';
import PermissionHelper from '../utils/permissionHelper';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
}

export interface LocationServiceConfig {
  updateInterval?: number; // milliseconds
  distanceInterval?: number; // meters
  enableHighAccuracy?: boolean;
  maxBatchSize?: number;
  batchTimeout?: number; // milliseconds
  enableLocationCaching?: boolean;
}

export interface LocationError {
  code: string;
  message: string;
  timestamp: number;
}

// Location service for driver tracking

class LocationService {
  private static instance: LocationService;
  private currentLocation: LocationCoordinates | null = null;
  private isTracking = false;
  private locationSubscription: Location.LocationSubscription | null = null;
  private updateTimer: NodeJS.Timeout | null = null;
  private lastUpdateTime = 0;
  private lastSentLocation: LocationCoordinates | null = null;
  private locationBatch: LocationCoordinates[] = [];
  private errorLog: LocationError[] = [];
  private isInitialized = false;
  private retryCount = 0;
  private maxRetries = 3;

  private config: LocationServiceConfig = {
    updateInterval: 30000, // 30 seconds
    distanceInterval: 50, // 50 meters
    enableHighAccuracy: true,
    maxBatchSize: 50,
    batchTimeout: 300000, // 5 minutes
    enableLocationCaching: true,
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
      if (this.isInitialized) {
        console.log('📍 Location service already initialized');
        return true;
      }

      if (config) {
        this.config = { ...this.config, ...config };
      }

      console.log('🗺️ Initializing location service with config:', this.config);

      // Use permission helper for better user experience
      const permissionResult = await PermissionHelper.requestLocationPermissions();
      
      if (!permissionResult.granted) {
        this.logError('PERMISSION_DENIED', `Location permission denied: ${permissionResult.status}`);
        
        // Show appropriate guidance to user
        await PermissionHelper.handleLocationPermissionError();
        return false;
      }
      
      console.log('✅ Location permissions granted');
      
      // Try to get background permissions for better tracking
      try {
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus === 'granted') {
          console.log('✅ Background location permission granted');
        } else {
          console.warn('⚠️ Background location permission denied, continuing with foreground only');
        }
      } catch (error) {
        console.warn('⚠️ Background permission request failed:', error);
      }

      // Load cached location if available
      if (this.config.enableLocationCaching) {
        await this.loadCachedLocation();
      }

      // Get initial location
      const initialLocation = await this.getCurrentLocation();
      if (!initialLocation) {
        console.warn('⚠️ Could not get initial location');
      }

      this.isInitialized = true;
      console.log('✅ Location service initialized successfully');
      return true;
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize';
      this.logError('INIT_ERROR', errorMessage);
      
      // Handle specific permission errors
      if (errorMessage.includes('NSLocation') || errorMessage.includes('Info.plist')) {
        await PermissionHelper.handleLocationPermissionError(error);
      }
      
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
      });

      const coordinates: LocationCoordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
        timestamp: location.timestamp,
        altitude: location.coords.altitude || undefined,
        heading: location.coords.heading || undefined,
        speed: location.coords.speed || undefined,
      };

      this.currentLocation = coordinates;

      // Cache location if enabled
      if (this.config.enableLocationCaching) {
        await this.cacheLocation(coordinates);
      }

      console.log('📍 Current location:', coordinates);
      this.retryCount = 0; // Reset retry count on success
      return coordinates;
    } catch (error) {
      this.logError('GET_LOCATION_ERROR', error instanceof Error ? error.message : 'Failed to get location');
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

      // Start foreground location subscription
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
      this.logError('START_TRACKING_ERROR', error instanceof Error ? error.message : 'Failed to start tracking');
      return false;
    }
  }

  /**
   * Stop location tracking
   */
  public async stopTracking(): Promise<void> {
    console.log('🛑 Stopping location tracking...');

    try {
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
    } catch (error) {
      this.logError('STOP_TRACKING_ERROR', error instanceof Error ? error.message : 'Failed to stop tracking');
    }
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
      altitude: location.coords.altitude || undefined,
      heading: location.coords.heading || undefined,
      speed: location.coords.speed || undefined,
    };

    this.currentLocation = coordinates;

    // Check if we should send update to backend
    if (this.shouldSendLocationUpdate(coordinates)) {
      this.addLocationToBatch(coordinates);
    }
  }

  /**
   * Add location to batch for efficient backend updates
   */
  private async addLocationToBatch(location: LocationCoordinates): Promise<void> {
    this.locationBatch.push(location);

    // Send batch if max size reached
    if (this.locationBatch.length >= this.config.maxBatchSize!) {
      await this.sendLocationBatch();
    }
  }

  /**
   * Send batched locations to backend with retry logic
   */
  private async sendLocationBatch(): Promise<void> {
    if (this.locationBatch.length === 0) return;

    const batch = [...this.locationBatch];
    this.locationBatch = [];

    try {
      console.log(`📤 Sending ${batch.length} location updates to backend`);

      // Send most recent location as primary update
      const mostRecent = batch[batch.length - 1];
      await this.sendLocationWithRetry(mostRecent, 0);

      this.lastSentLocation = mostRecent;
      this.lastUpdateTime = Date.now();

      console.log('✅ Location batch sent successfully');
    } catch (error: any) {
      // Re-add to batch for retry if failed (but limit batch size to prevent memory issues)
      if (this.locationBatch.length < this.config.maxBatchSize!) {
        this.locationBatch.unshift(...batch.slice(0, 10)); // Only re-add last 10 locations
      }
      
      console.warn('⚠️ Failed to send location batch (non-critical):', {
        status: error?.response?.status,
        message: error?.response?.data?.message || error.message,
        batchSize: batch.length,
        remainingInQueue: this.locationBatch.length
      });
    }
  }

  /**
   * Send location with exponential backoff retry
   */
  private async sendLocationWithRetry(
    coordinates: LocationCoordinates,
    attempt: number
  ): Promise<void> {
    try {
      await riderService.updateLocation(coordinates.latitude, coordinates.longitude);
      this.retryCount = 0;
    } catch (error: any) {
      const errorInfo = {
        status: error?.response?.status,
        message: error?.response?.data?.message || error.message,
        attempt: attempt + 1,
        maxRetries: this.maxRetries
      };
      
      if (attempt < this.maxRetries) {
        const backoffMs = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.warn(`⚠️ Location update failed (${errorInfo.status}), retrying in ${backoffMs}ms...`, errorInfo);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        await this.sendLocationWithRetry(coordinates, attempt + 1);
      } else {
        console.error('❌ Location update failed after all retries:', errorInfo);
        // Don't throw error - location updates should be non-blocking
        this.logError('LOCATION_UPDATE_FAILED', `Failed after ${this.maxRetries} attempts: ${errorInfo.message}`);
      }
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
    const φ1 = (coord1.latitude * Math.PI) / 180;
    const φ2 = (coord2.latitude * Math.PI) / 180;
    const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
    const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Start periodic updates to backend
   */
  private startPeriodicUpdates(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }

    this.updateTimer = setInterval(async () => {
      if (this.locationBatch.length > 0) {
        await this.sendLocationBatch();
      }
    }, this.config.batchTimeout);
  }

  /**
   * Cache location to AsyncStorage
   */
  private async cacheLocation(location: LocationCoordinates): Promise<void> {
    try {
      await AsyncStorage.setItem(
        '@location_cache',
        JSON.stringify({
          ...location,
          cachedAt: Date.now(),
        })
      );
    } catch (error) {
      console.warn('⚠️ Failed to cache location:', error);
    }
  }

  /**
   * Load cached location from AsyncStorage
   */
  private async loadCachedLocation(): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem('@location_cache');
      if (cached) {
        const location = JSON.parse(cached);
        // Only use cache if less than 30 minutes old
        if (Date.now() - location.cachedAt < 30 * 60 * 1000) {
          this.currentLocation = location;
          console.log('📍 Loaded cached location');
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to load cached location:', error);
    }
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
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...config };

    // Restart tracking if critical config changed and tracking is active
    if (
      this.isTracking &&
      (oldConfig.updateInterval !== config.updateInterval ||
        oldConfig.distanceInterval !== config.distanceInterval ||
        oldConfig.enableHighAccuracy !== config.enableHighAccuracy)
    ) {
      console.log('🔄 Restarting location tracking due to config change');
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
        await this.sendLocationWithRetry(location, 0);
        this.lastSentLocation = location;
        this.lastUpdateTime = Date.now();
        return true;
      }
      return false;
    } catch (error) {
      this.logError('FORCE_UPDATE_ERROR', error instanceof Error ? error.message : 'Failed to force update');
      return false;
    }
  }

  /**
   * Get error log
   */
  public getErrorLog(): LocationError[] {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  public clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Log error for debugging
   */
  private logError(code: string, message: string): void {
    const error: LocationError = {
      code,
      message,
      timestamp: Date.now(),
    };
    this.errorLog.push(error);

    // Keep only last 50 errors
    if (this.errorLog.length > 50) {
      this.errorLog.shift();
    }

    console.error(`❌ [${code}] ${message}`);
  }

  /**
   * Get service status
   */
  public getStatus() {
    return {
      isInitialized: this.isInitialized,
      isTracking: this.isTracking,
      currentLocation: this.currentLocation,
      lastSentLocation: this.lastSentLocation,
      batchSize: this.locationBatch.length,
      errorCount: this.errorLog.length,
      config: this.config,
    };
  }
}

export default LocationService;
