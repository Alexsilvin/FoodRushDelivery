import { Alert, Linking, Platform } from 'react-native';
import * as Location from 'expo-location';

/**
 * Permission Helper Utilities
 * Provides user-friendly permission handling and guidance
 */

export interface PermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: string;
}

export class PermissionHelper {
  /**
   * Check and request location permissions with user guidance
   */
  static async requestLocationPermissions(): Promise<PermissionStatus> {
    try {
      // Check current permission status
      const { status: currentStatus } = await Location.getForegroundPermissionsAsync();
      
      if (currentStatus === 'granted') {
        return {
          granted: true,
          canAskAgain: true,
          status: currentStatus
        };
      }

      // Request foreground permissions
      const { status: foregroundStatus, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus === 'granted') {
        // Try to get background permissions too
        try {
          await Location.requestBackgroundPermissionsAsync();
        } catch (error) {
          console.warn('Background location permission request failed:', error);
        }
        
        return {
          granted: true,
          canAskAgain,
          status: foregroundStatus
        };
      }

      // Permission denied
      return {
        granted: false,
        canAskAgain,
        status: foregroundStatus
      };
    } catch (error: any) {
      console.error('Permission request error:', error);
      
      // Check if this is the Info.plist error
      if (error.message?.includes('NSLocation') || error.message?.includes('Info.plist')) {
        this.showDevelopmentBuildRequired();
      }
      
      return {
        granted: false,
        canAskAgain: false,
        status: 'error'
      };
    }
  }

  /**
   * Show alert explaining that a development build is required for location permissions
   */
  static showDevelopmentBuildRequired(): void {
    Alert.alert(
      'Development Build Required',
      'Location permissions require a development build to work properly. The current Expo Go app cannot access native location permissions.\n\nTo fix this:\n\n1. Run: npx expo install --fix\n2. Run: npx expo prebuild\n3. Build and install the app on your device\n\nOr use EAS Build for a cloud build.',
      [
        {
          text: 'Learn More',
          onPress: () => {
            Linking.openURL('https://docs.expo.dev/develop/development-builds/introduction/');
          }
        },
        {
          text: 'OK',
          style: 'default'
        }
      ]
    );
  }

  /**
   * Show permission denied guidance
   */
  static showPermissionDeniedGuidance(): void {
    Alert.alert(
      'Location Permission Required',
      'This app needs location access to provide delivery tracking and navigation. Please enable location permissions in your device settings.',
      [
        {
          text: 'Open Settings',
          onPress: () => {
            if (Platform.OS === 'ios') {
              Linking.openURL('app-settings:');
            } else {
              Linking.openSettings();
            }
          }
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  }

  /**
   * Check if running in Expo Go (which has permission limitations)
   */
  static isExpoGo(): boolean {
    return __DEV__ && !Platform.select({
      ios: false,
      android: false,
      default: true
    });
  }

  /**
   * Show appropriate guidance based on the environment and permission status
   */
  static async handleLocationPermissionError(error?: any): Promise<void> {
    if (error?.message?.includes('NSLocation') || error?.message?.includes('Info.plist')) {
      this.showDevelopmentBuildRequired();
      return;
    }

    const permissionStatus = await this.requestLocationPermissions();
    
    if (!permissionStatus.granted) {
      if (permissionStatus.canAskAgain) {
        // User can still grant permission
        Alert.alert(
          'Location Access Needed',
          'This app needs location access to track deliveries and provide navigation. Please grant location permission when prompted.',
          [{ text: 'OK' }]
        );
      } else {
        // User has permanently denied permission
        this.showPermissionDeniedGuidance();
      }
    }
  }
}

export default PermissionHelper;