import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { riderAPI } from '../../services/api';
import { mapApiDeliveries } from '../../utils/mappers';
import { Delivery } from '../../types/api';
import { useRoute } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

interface DeliveryLocation {
  id: string;
  customerName: string;
  customerPhone?: string;
  address: string;
  lat: number;
  lng: number;
  status: 'pending' | 'accepted' | 'picked_up' | 'delivered';
  distance: string;
  estimatedTime: string;
  restaurant: string;
  payment: string;
  restaurant_active?: boolean;
  verificationStatus?: string; // ADDED: for filtering approved restaurants
}

interface DirectionsStep {
  instruction: string;
  distance: string;
  duration: string;
  maneuver: string;
}

interface DirectionsRoute {
  distance: string;
  duration: string;
  coordinates: Array<{ latitude: number; longitude: number }>;
  steps: DirectionsStep[];
  summary: string;
}

interface Route {
  id: string;
  name: string;
  distance: string;
  duration: string;
  stops: DeliveryLocation[];
  coordinates: Array<{ latitude: number; longitude: number }>;
  isOptimal: boolean;
  directionsRoute?: DirectionsRoute;
}

export default function MapScreen({ navigation, route }: any) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const routeParams = useRoute();
  
  // State
  const [showAcceptedRestaurantsOnly, setShowAcceptedRestaurantsOnly] = useState(false);
  const [showApprovedOnly, setShowApprovedOnly] = useState(false); // NEW: filter for approved restaurants
  const [deliveries, setDeliveries] = useState<DeliveryLocation[]>([]);
  const [fetchingDeliveries, setFetchingDeliveries] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryLocation | null>(null);
  const [availableRoutes, setAvailableRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [isDrivingMode, setIsDrivingMode] = useState(false);
  const [activeDelivery, setActiveDelivery] = useState<DeliveryLocation | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [activeDirections, setActiveDirections] = useState<DirectionsRoute | null>(null);
  const [targetClient, setTargetClient] = useState<DeliveryLocation | null>(null);
  const [showDirections, setShowDirections] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  // Refs
  const mapRef = useRef<MapView>(null);

  // Navigation params
  const targetLocation = (routeParams.params as any)?.targetLocation;
  const targetCustomerName = (routeParams.params as any)?.customerName;
  const targetAddress = (routeParams.params as any)?.address;

  // Utility function to calculate distance between two points
  const calculateDistance = useCallback((
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = point1.latitude * Math.PI / 180;
    const φ2 = point2.latitude * Math.PI / 180;
    const Δφ = (point2.latitude - point1.latitude) * Math.PI / 180;
    const Δλ = (point2.longitude - point1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }, []);

  // Create demo route function
  const createDemoRoute = useCallback((
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number }
  ): DirectionsRoute => {
    const coordinates = [];
    coordinates.push(origin);
    
    const latDiff = destination.latitude - origin.latitude;
    const lngDiff = destination.longitude - origin.longitude;
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
    
    // Create more realistic road-like path
    const numberOfSegments = Math.max(10, Math.floor(distance * 1000)); // More segments for longer routes
    
    // Define some waypoints that simulate turns and road patterns
    const waypoints: Array<{ latitude: number; longitude: number }> = [];
    
    // Add intermediate waypoints to simulate realistic routing
    if (Math.abs(latDiff) > Math.abs(lngDiff)) {
      // Primarily north-south route
      waypoints.push({
        latitude: origin.latitude + latDiff * 0.3,
        longitude: origin.longitude + lngDiff * 0.1
      });
      waypoints.push({
        latitude: origin.latitude + latDiff * 0.7,
        longitude: origin.longitude + lngDiff * 0.4
      });
      waypoints.push({
        latitude: origin.latitude + latDiff * 0.9,
        longitude: origin.longitude + lngDiff * 0.8
      });
    } else {
      // Primarily east-west route
      waypoints.push({
        latitude: origin.latitude + latDiff * 0.1,
        longitude: origin.longitude + lngDiff * 0.3
      });
      waypoints.push({
        latitude: origin.latitude + latDiff * 0.4,
        longitude: origin.longitude + lngDiff * 0.7
      });
      waypoints.push({
        latitude: origin.latitude + latDiff * 0.8,
        longitude: origin.longitude + lngDiff * 0.9
      });
    }
    
    const allPoints = [origin, ...waypoints, destination];
    
    // Generate smooth path between waypoints
    for (let i = 0; i < allPoints.length - 1; i++) {
      const start = allPoints[i];
      const end = allPoints[i + 1];
      const segmentSteps = Math.floor(numberOfSegments / (allPoints.length - 1));
      
      for (let j = 0; j < segmentSteps; j++) {
        const progress = j / segmentSteps;
        const smoothProgress = 0.5 * (1 - Math.cos(progress * Math.PI)); // Smooth transition
        
        let lat = start.latitude + (end.latitude - start.latitude) * smoothProgress;
        let lng = start.longitude + (end.longitude - start.longitude) * smoothProgress;
        
        // Add realistic road variations (following street grid patterns)
        const roadVariation = 0.0003; // Reduced for more realistic movement
        const gridAlignment = 0.0001; // Slight grid alignment for city roads
        
        // Simulate following street grid
        const latGrid = Math.floor(lat / gridAlignment) * gridAlignment;
        const lngGrid = Math.floor(lng / gridAlignment) * gridAlignment;
        
        lat = latGrid + (Math.random() - 0.5) * roadVariation;
        lng = lngGrid + (Math.random() - 0.5) * roadVariation;
        
        // Avoid duplicate coordinates
        const lastCoord = coordinates[coordinates.length - 1];
        if (Math.abs(lat - lastCoord.latitude) > 0.00001 || Math.abs(lng - lastCoord.longitude) > 0.00001) {
          coordinates.push({ latitude: lat, longitude: lng });
        }
      }
    }
    
    coordinates.push(destination);

    // Calculate realistic distance and time
    let totalDistance = 0;
    for (let i = 0; i < coordinates.length - 1; i++) {
      totalDistance += calculateDistance(coordinates[i], coordinates[i + 1]);
    }
    const distanceKm = (totalDistance / 1000).toFixed(1);
    const estimatedTimeMinutes = Math.ceil(totalDistance / 300); // Assuming 18 km/h average in city
    
    // Create realistic turn-by-turn directions
    const steps: DirectionsStep[] = [];
    const totalSegments = coordinates.length - 1;
    const segmentDistance = totalDistance / totalSegments;
    
    steps.push({
      instruction: `Head ${getDirection(origin, coordinates[Math.floor(coordinates.length * 0.1)])} on local roads`,
      distance: `${(segmentDistance * 3 / 1000).toFixed(1)} km`,
      duration: `${Math.ceil(segmentDistance * 3 / 300)} min`,
      maneuver: 'depart'
    });
    
    if (waypoints.length > 0) {
      waypoints.forEach((waypoint, index) => {
        const direction = getDirection(
          waypoints[index - 1] || origin, 
          waypoint
        );
        steps.push({
          instruction: `Continue ${direction}`,
          distance: `${(segmentDistance * 2 / 1000).toFixed(1)} km`,
          duration: `${Math.ceil(segmentDistance * 2 / 300)} min`,
          maneuver: 'continue'
        });
      });
    }
    
    steps.push({
      instruction: 'Arrive at your destination on the right',
      distance: '0.0 km',
      duration: '1 min',
      maneuver: 'arrive'
    });

    return {
      distance: `${distanceKm} km`,
      duration: `${estimatedTimeMinutes} min`,
      coordinates,
      steps,
      summary: `Fastest route via city roads`
    };
  }, [calculateDistance]);

  // Helper function to determine direction
  const getDirection = (from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }) => {
    const latDiff = to.latitude - from.latitude;
    const lngDiff = to.longitude - from.longitude;
    
    if (Math.abs(latDiff) > Math.abs(lngDiff)) {
      return latDiff > 0 ? 'north' : 'south';
    } else {
      return lngDiff > 0 ? 'east' : 'west';
    }
  };

  // Helper function to get maneuver icons
  const getManeuverIcon = (maneuver: string) => {
    switch (maneuver) {
      case 'depart':
      case 'start':
        return 'play';
      case 'turn-left':
        return 'arrow-back';
      case 'turn-right':
        return 'arrow-forward';
      case 'turn-slight-left':
        return 'arrow-up-outline';
      case 'turn-slight-right':
        return 'arrow-up-outline';
      case 'continue':
      case 'straight':
        return 'arrow-up';
      case 'ramp-left':
        return 'arrow-back';
      case 'ramp-right':
        return 'arrow-forward';
      case 'merge':
        return 'git-merge-outline';
      case 'fork-left':
        return 'git-branch-outline';
      case 'fork-right':
        return 'git-branch-outline';
      case 'arrive':
        return 'flag';
      case 'roundabout-left':
        return 'refresh-circle';
      case 'roundabout-right':
        return 'refresh-circle';
      default:
        return 'arrow-up';
    }
  };

  // Google Directions API - Replace YOUR_API_KEY with your actual Google Maps API key
  const GOOGLE_MAPS_API_KEY = 'AIzaSyAlILoX4PV-nTzRcwdkP6iTOcFbV0IURMA'; // Get this from Google Cloud Console

  const getDirections = useCallback(async (
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number }
  ): Promise<DirectionsRoute | null> => {
    try {
      // If no API key is provided, fall back to demo route
      if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'AIzaSyAlILoX4PV-nTzRcwdkP6iTOcFbV0IURMA') {
        console.log('Using demo route - add Google Maps API key for real routing');
        return createDemoRoute(origin, destination);
      }

      const originStr = `${origin.latitude},${origin.longitude}`;
      const destinationStr = `${destination.latitude},${destination.longitude}`;
      
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
        console.warn('Google Directions API error:', data.status);
        return createDemoRoute(origin, destination);
      }

      const route = data.routes[0];
      const leg = route.legs[0];
      
      // Decode the polyline points to get coordinates
      const coordinates = decodePolyline(route.overview_polyline.points);
      
      // Extract turn-by-turn directions
      const steps: DirectionsStep[] = leg.steps.map((step: any) => ({
        instruction: step.html_instructions.replace(/<[^>]*>/g, ''), // Remove HTML tags
        distance: step.distance.text,
        duration: step.duration.text,
        maneuver: step.maneuver || 'continue',
      }));

      return {
        distance: leg.distance.text,
        duration: leg.duration.text,
        coordinates,
        steps,
        summary: route.summary || 'Route via roads',
      };
    } catch (error) {
      console.warn('Google Directions API failed, using demo route:', error);
      return createDemoRoute(origin, destination);
    }
  }, [createDemoRoute]);

  // Polyline decoder for Google Directions API
  const decodePolyline = (encoded: string): Array<{ latitude: number; longitude: number }> => {
    const poly = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      poly.push({
        latitude: lat / 1E5,
        longitude: lng / 1E5,
      });
    }

    return poly;
  };

  // Start navigation function
  const startNavigation = useCallback((client: DeliveryLocation) => {
    const url = Platform.OS === 'ios' 
      ? `maps://app?daddr=${client.lat},${client.lng}`
      : `google.navigation:q=${client.lat},${client.lng}`;
    
    Alert.alert(
      t('startNavigation'),
      t('startNavigationConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('openMaps'), 
          onPress: () => {
            console.log('Opening navigation to:', client.address);
            // In real app, use Linking.openURL(url)
          }
        }
      ]
    );
  }, [t]);

  // Calculate route to client
  const calculateRouteToClient = useCallback(async (client: DeliveryLocation) => {
    if (!currentLocation) {
      Alert.alert(t('error'), 'Current location not available');
      return;
    }

    setIsCalculatingRoute(true);
    setTargetClient(client);
    setSelectedDelivery(client);
    
    try {
      // Animate map to show the selected delivery
      mapRef.current?.animateToRegion({
        latitude: client.lat,
        longitude: client.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);

      // Get directions
      const directionsRoute = await getDirections(
        currentLocation,
        { latitude: client.lat, longitude: client.lng }
      );
      
      if (directionsRoute) {
        setActiveDirections(directionsRoute);
        setRouteCoordinates(directionsRoute.coordinates);
        setShowDirections(true);

        // Fit map to show the entire route
        const coordinates = [currentLocation, { latitude: client.lat, longitude: client.lng }];
        mapRef.current?.fitToCoordinates(coordinates, {
          edgePadding: { top: 50, right: 50, bottom: 200, left: 50 },
          animated: true,
        });

        Alert.alert(
          t('routeCalculated'),
          `${t('distance')}: ${directionsRoute.distance}\n${t('estTime')}: ${directionsRoute.duration}\n\n${t('startNavigationConfirm')}`,
          [
            { text: t('cancel'), style: 'cancel' },
            { text: t('startNavigation'), onPress: () => startNavigation(client) },
          ]
        );
      }
    } catch (error) {
      console.error('Error calculating route:', error);
      Alert.alert(t('error'), 'Could not calculate route. Please try again.');
    } finally {
      setIsCalculatingRoute(false);
    }
  }, [currentLocation, getDirections, startNavigation, t]);

  // Initialize location and fetch deliveries
  useEffect(() => {

    // Add verificationStatus to mock deliveries for demo
    const mockDeliveries: DeliveryLocation[] = [
      {
        id: '1',
        customerName: 'Emma Davis',
        customerPhone: '+1 (555) 123-4567',
        address: '123 Broadway, New York, NY',
        lat: 40.7589,
        lng: -73.9851,
        status: 'accepted',
        distance: '1.2 km',
        estimatedTime: '15 min',
        restaurant: 'Sushi Spot',
        payment: '$25.50',
        verificationStatus: 'APPROVED',
      },
      {
        id: '2',
        customerName: 'John Smith',
        customerPhone: '+1 (555) 234-5678',
        address: '456 5th Avenue, New York, NY',
        lat: 40.7505,
        lng: -73.9934,
        status: 'pending',
        distance: '2.1 km',
        estimatedTime: '12 min',
        restaurant: 'Taco Bell',
        payment: '$18.75',
        verificationStatus: 'PENDING',
      },
      {
        id: '3',
        customerName: 'Sarah Johnson',
        customerPhone: '+1 (555) 345-6789',
        address: '789 Madison Avenue, New York, NY',
        lat: 40.7614,
        lng: -73.9776,
        status: 'picked_up',
        distance: '0.8 km',
        estimatedTime: '8 min',
        restaurant: 'Pizza Palace',
        payment: '$32.25',
        verificationStatus: 'APPROVED',
      },
      {
        id: '4',
        customerName: 'Mike Chen',
        customerPhone: '+1 (555) 456-7890',
        address: '321 Park Avenue, New York, NY',
        lat: 40.7549,
        lng: -73.9707,
        status: 'pending',
        distance: '1.7 km',
        estimatedTime: '20 min',
        restaurant: 'Burger King',
        payment: '$22.00',
        verificationStatus: 'REJECTED',
      },
    ];

    setDeliveries(mockDeliveries);

    const initializeLocation = async () => {
      try {
        setLocationError(null);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Location permission denied');
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const userLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        setCurrentLocation(userLocation);
        setLoading(false);

        // Center map on user location
        mapRef.current?.animateToRegion({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);

      } catch (error) {
        console.error('Error getting location:', error);
        setLocationError(error instanceof Error ? error.message : 'Failed to get location');
        const defaultLocation = {
          latitude: 40.7128,
          longitude: -74.0060,
        };
        setCurrentLocation(defaultLocation);
        setLoading(false);
        
        Alert.alert(
          t('locationError'), 
          t('locationErrorMessage'),
          [{ text: 'OK' }]
        );
      }
    };

    initializeLocation();
  }, [t]);

  // Get marker color based on status
  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FCD34D';
      case 'accepted': return '#60A5FA';
      case 'picked_up': return '#34D399';
      case 'delivered': return '#9CA3AF';
      default: return '#EF4444';
    }
  };

  // Accept delivery and enter driving mode
  const acceptDelivery = (delivery: DeliveryLocation) => {
    setActiveDelivery(delivery);
    setIsDrivingMode(true);
    setSelectedDelivery(delivery);

    if (currentLocation) {
      getDirections(currentLocation, { latitude: delivery.lat, longitude: delivery.lng })
        .then((route) => {
          if (route) {
            setRouteCoordinates(route.coordinates);
            setActiveDirections(route);
            
            // Fit map to show route
            mapRef.current?.fitToCoordinates(route.coordinates, {
              edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
              animated: true,
            });
          }
        });
    }
  };

  // Exit driving mode
  const exitDrivingMode = () => {
    setIsDrivingMode(false);
    setActiveDelivery(null);
    setRouteCoordinates([]);
    setActiveDirections(null);
    
    // Return to user location
    if (currentLocation) {
      mapRef.current?.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 800);
    }
  };

  // Handle delivery press
  const handleDeliveryPress = (delivery: DeliveryLocation) => {
    setSelectedDelivery(delivery);
    mapRef.current?.animateToRegion({
      latitude: delivery.lat,
      longitude: delivery.lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 800);

    if (!isDrivingMode) {
      Alert.alert(
        `${delivery.customerName}`,
        `${t('address')}: ${delivery.address}\n${delivery.restaurant} • ${delivery.payment}\n${t('distance')}: ${delivery.distance} • ${t('estTime')}: ${delivery.estimatedTime}`,
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('calculateRoute'),
            onPress: () => calculateRouteToClient(delivery),
          },
          {
            text: t('acceptDeliveryAction'),
            onPress: () => acceptDelivery(delivery),
          },
        ]
      );
    }
  };

  // Center on current location
  const centerOnLocation = () => {
    if (currentLocation) {
      mapRef.current?.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>{t('loadingMap')}</Text>
        {locationError && (
          <Text style={styles.errorText}>{locationError}</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Modern Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              {isDrivingMode ? t('drivingMode') : t('map')}
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
              {deliveries.length} {t('deliveries')} available
            </Text>
          </View>
        </View>
        
        <View style={styles.headerActions}>
          {isDrivingMode ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.exitButton]}
              onPress={exitDrivingMode}
            >
              <Ionicons name="stop" size={18} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>{t('exit')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => setShowRouteModal(true)}
            >
              <Ionicons name="list" size={18} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>{t('deliveries')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: currentLocation?.latitude || 40.7128,
          longitude: currentLocation?.longitude || -74.0060,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        customMapStyle={theme.isDark ? darkMapStyle : []}
      >
        {/* Route Polyline */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={theme.colors.primary}
            strokeWidth={4}
            lineDashPattern={[0]}
          />
        )}

        {/* Delivery Markers (filtered by showApprovedOnly) */}
        {!isDrivingMode && deliveries
          .filter(delivery => !showApprovedOnly || delivery.verificationStatus === 'APPROVED')
          .map((delivery) => (
            <Marker
              key={delivery.id}
              coordinate={{ latitude: delivery.lat, longitude: delivery.lng }}
              onPress={() => handleDeliveryPress(delivery)}
            >
              <View style={[
                styles.markerContainer,
                { 
                  backgroundColor: selectedDelivery?.id === delivery.id ? '#3B82F6' : getMarkerColor(delivery.status),
                  transform: [{ scale: selectedDelivery?.id === delivery.id ? 1.2 : 1 }]
                }
              ]}>
                <Ionicons 
                  name="location" 
                  size={20} 
                  color="#FFFFFF" 
                />
              </View>
            </Marker>
        ))}

        {/* Active Delivery Marker */}
        {isDrivingMode && activeDelivery && (
          <Marker
            coordinate={{ latitude: activeDelivery.lat, longitude: activeDelivery.lng }}
            title={activeDelivery.customerName}
            description={activeDelivery.address}
          >
            <View style={[styles.markerContainer, styles.activeMarker]}>
              <Ionicons name="flag" size={20} color="#FFFFFF" />
            </View>
          </Marker>
        )}

        {/* Target Location Marker (not filtered) */}
        {targetLocation && (
          <Marker
            coordinate={{
              latitude: targetLocation.latitude || targetLocation.lat,
              longitude: targetLocation.longitude || targetLocation.lng
            }}
            title={targetCustomerName || 'Target Location'}
          >
            <View style={[styles.markerContainer, styles.targetMarker]}>
              <Ionicons name="pin" size={20} color="#FFFFFF" />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Directions Panel */}
      {showDirections && activeDirections && (
        <View style={[styles.directionsPanel, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.directionsPanelHeader}>
            <View style={styles.routeSummary}>
              <Text style={[styles.routeDistance, { color: theme.colors.primary }]}>
                {activeDirections.distance}
              </Text>
              <Text style={[styles.routeDuration, { color: theme.colors.textSecondary }]}>
                {activeDirections.duration}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.directionsCloseButton}
              onPress={() => {
                setShowDirections(false);
                setActiveDirections(null);
                setRouteCoordinates([]);
              }}
            >
              <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.directionsList} showsVerticalScrollIndicator={false}>
            {activeDirections.steps.map((step, index) => (
              <View key={index} style={[styles.directionStep, { borderBottomColor: theme.colors.border }]}>
                <View style={[styles.stepIcon, { backgroundColor: theme.colors.primary }]}>
                  <Ionicons 
                    name={getManeuverIcon(step.maneuver)} 
                    size={16} 
                    color="#FFFFFF" 
                  />
                </View>
                <View style={styles.stepDetails}>
                  <Text style={[styles.stepInstruction, { color: theme.colors.text }]}>
                    {step.instruction}
                  </Text>
                  <Text style={[styles.stepDistance, { color: theme.colors.textSecondary }]}>
                    {step.distance} • {step.duration}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Directions Toggle Button */}
      {activeDirections && !showDirections && (
        <TouchableOpacity
          style={[styles.directionsToggle, { backgroundColor: theme.colors.primary }]}
          onPress={() => setShowDirections(true)}
        >
          <Ionicons name="list" size={20} color="#FFFFFF" />
          <Text style={styles.directionsToggleText}>Directions</Text>
        </TouchableOpacity>
      )}

      {/* Filter Button (Floating) */}
      <TouchableOpacity
        style={[
          styles.filterFab,
          { backgroundColor: showApprovedOnly ? '#10B981' : theme.colors.primary }
        ]}
        onPress={() => setShowApprovedOnly(v => !v)}
        activeOpacity={0.85}
      >
        <Ionicons name={showApprovedOnly ? 'filter' : 'filter-outline'} size={22} color="#FFF" />
        <Text style={styles.filterFabText}>{showApprovedOnly ? 'Approved Only' : 'All'}</Text>
      </TouchableOpacity>

      {/* Center Location Button (Floating) */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: theme.colors.primary }]} 
        onPress={centerOnLocation}
      >
        <Ionicons name="locate" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Selected Delivery Card */}
      {(selectedDelivery || activeDelivery) && (
        <View style={[styles.deliveryCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.deliveryCardHeader}>
            <View style={styles.deliveryInfo}>
              <Text style={[styles.customerName, { color: theme.colors.text }]}>
                {(selectedDelivery || activeDelivery)?.customerName}
              </Text>
              <Text style={[styles.deliveryAddress, { color: theme.colors.textSecondary }]}>
                {(selectedDelivery || activeDelivery)?.address}
              </Text>
              <View style={styles.deliveryMeta}>
                <View style={[styles.statusBadge, { backgroundColor: getMarkerColor((selectedDelivery || activeDelivery)?.status || 'pending') }]}>
                  <Text style={styles.statusText}>
                    {((selectedDelivery || activeDelivery)?.status || '').toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                  {(selectedDelivery || activeDelivery)?.distance} • {(selectedDelivery || activeDelivery)?.estimatedTime}
                </Text>
              </View>
              <Text style={[styles.restaurantInfo, { color: theme.colors.text }]}>
                {(selectedDelivery || activeDelivery)?.restaurant} • {(selectedDelivery || activeDelivery)?.payment}
              </Text>
            </View>
            
            {!isDrivingMode && (
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedDelivery(null)}
              >
                <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.deliveryActions}>
            {!activeDirections && !isDrivingMode && (
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={() => calculateRouteToClient(selectedDelivery!)}
                disabled={isCalculatingRoute}
              >
                {isCalculatingRoute ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <Ionicons name="map" size={18} color={theme.colors.primary} />
                )}
                <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>
                  {isCalculatingRoute ? t('calculating') : t('calculateRoute')}
                </Text>
              </TouchableOpacity>
            )}
            
            {(activeDirections || isDrivingMode) && (
              <TouchableOpacity
                style={[styles.actionButton, styles.successButton]}
                onPress={() => startNavigation(selectedDelivery || activeDelivery!)}
              >
                <Ionicons name="navigate" size={18} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>{t('startNavigation')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Deliveries Modal */}
      <Modal
        visible={showRouteModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRouteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {t('availableDeliveries')}
              </Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowRouteModal(false)}
              >
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.deliveriesList} showsVerticalScrollIndicator={false}>
              {deliveries
                .filter((delivery) => {
                  // If filter is off, show all deliveries
                  if (!showAcceptedRestaurantsOnly) return true;
                  // If filter is on, only show deliveries with active/accepted restaurants
                  return delivery.restaurant_active === true;
                })
                .map((delivery) => (
                <TouchableOpacity
                  key={delivery.id}
                  style={[styles.deliveryItem, { backgroundColor: theme.colors.card }]}
                  onPress={() => {
                    setShowRouteModal(false);
                    handleDeliveryPress(delivery);
                  }}
                >
                  <View style={styles.deliveryItemHeader}>
                    <View style={styles.deliveryItemInfo}>
                      <Text style={[styles.deliveryItemName, { color: theme.colors.text }]}>
                        {delivery.customerName}
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: getMarkerColor(delivery.status) }]}>
                        <Text style={styles.statusText}>{delivery.status.toUpperCase()}</Text>
                      </View>
                    </View>
                    <View style={styles.deliveryItemMeta}>
                      <Text style={[styles.deliveryDistance, { color: theme.colors.primary }]}>
                        {delivery.distance}
                      </Text>
                      <Text style={[styles.deliveryTime, { color: theme.colors.textSecondary }]}>
                        {delivery.estimatedTime}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={[styles.deliveryItemAddress, { color: theme.colors.textSecondary }]}>
                    {delivery.address}
                  </Text>
                  
                  <View style={styles.deliveryItemFooter}>
                    <Text style={[styles.deliveryItemRestaurant, { color: theme.colors.text }]}>
                      {delivery.restaurant}
                    </Text>
                    <Text style={[styles.deliveryItemPayment, { color: theme.colors.primary }]}>
                      {delivery.payment}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Dark map style for Google Maps
const darkMapStyle = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#242f3e' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#746855' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#242f3e' }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#263c3f' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b9a76' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#38414e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca5b3' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#746855' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f2937' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f3d19c' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#2f3948' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#17263c' }],
  },
];

// Floating filter button style
const filterFabHeight = 56;
const filterFabWidth = 140;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  filterFab: {
    position: 'absolute',
    top: 140,
    right: 20,
    width: filterFabWidth,
    height: filterFabHeight,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 10,
    gap: 8,
  },
  filterFabText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
  },
  secondaryButton: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  successButton: {
    backgroundColor: '#10B981',
  },
  exitButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  map: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 140,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  activeMarker: {
    backgroundColor: '#EF4444',
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  targetMarker: {
    backgroundColor: '#8B5CF6',
  },
  deliveryCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  deliveryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  deliveryInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  deliveryAddress: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  deliveryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  restaurantInfo: {
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
  },
  deliveryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.75,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    padding: 4,
  },
  deliveriesList: {
    padding: 20,
  },
  deliveryItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  deliveryItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  deliveryItemInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deliveryItemName: {
    fontSize: 16,
    fontWeight: '600',
  },
  deliveryItemMeta: {
    alignItems: 'flex-end',
  },
  deliveryDistance: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  deliveryTime: {
    fontSize: 14,
    marginTop: 2,
  },
  deliveryItemAddress: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 8,
  },
  deliveryItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deliveryItemRestaurant: {
    fontSize: 14,
    fontWeight: '500',
  },
  deliveryItemPayment: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Directions Panel Styles
  directionsPanel: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    maxHeight: height * 0.4,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  directionsPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  routeSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  routeDistance: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  routeDuration: {
    fontSize: 14,
    fontWeight: '500',
  },
  directionsCloseButton: {
    padding: 8,
    borderRadius: 8,
  },
  directionsList: {
    maxHeight: height * 0.25,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  directionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepDetails: {
    flex: 1,
  },
  stepInstruction: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 4,
  },
  stepDistance: {
    fontSize: 12,
    fontWeight: '400',
  },
  directionsToggle: {
    position: 'absolute',
    top: 120,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  directionsToggleText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});