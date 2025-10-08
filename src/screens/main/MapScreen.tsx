// MapScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { useRoute } from '@react-navigation/native';

// Add imports for API and mappers (like DashboardScreen)
import { riderAPI, restaurantAPI } from '../../services/api';
import { mapApiDeliveries } from '../../utils/mappers';
import { useLocation } from '../../contexts/LocationContext';
import { Restaurant } from '../../types/api';

// Helper to convert Delivery[] (from API/mappers) to DeliveryLocation[] (for MapScreen)
import { Delivery } from '../../types/api';

function convertToDeliveryLocations(deliveries: Delivery[]): DeliveryLocation[] {
  if (!Array.isArray(deliveries)) return [];
  return deliveries.map((d) => ({
    id: d.id,
    customerName: d.customerName || '',
    customerPhone: d.customerPhone,
    address: d.address || '',
    lat: d.dropoffLat ?? d.lat ?? 0,
    lng: d.dropoffLng ?? d.lng ?? 0,
    status: (d.status as 'pending' | 'accepted' | 'picked_up' | 'delivered'),
    distance: d.distance || '',
    estimatedTime: d.estimatedTime || '',
    restaurant: d.restaurant || '',
    payment: d.payment || '',
    restaurant_active: d.restaurant_active,
    verificationStatus: d.verificationStatus,
    restaurantLat: d.pickupLat ?? d.restaurantLat ?? 0,
    restaurantLng: d.pickupLng ?? d.restaurantLng ?? 0,
  }));
}

const { width, height } = Dimensions.get('window');

/* ---------- Types ---------- */
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
  verificationStatus?: string;
  restaurantLat?: number;
  restaurantLng?: number;
}

// Restaurant interface moved to types/api.ts

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

// Config
// Your Google Directions API key (you provided this)
const GOOGLE_MAPS_APIKEY = 'AIzaSyAlILoX4PV-nTzRcwdkP6iTOcFbV0IURMA';

// Restaurant browsing configuration
const RESTAURANT_CONFIG = {
  radiusKm: 10, // 10km radius
  limit: 50, // Max 50 restaurants
  sortBy: 'distance' as const,
  sortDir: 'ASC' as const,
  verificationStatus: 'APPROVED' as const, // Only show approved restaurants
  isOpen: true, // Only show open restaurants
};

/* ---------- Dark map style (used by default) ---------- */
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2937' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] },
];

/* ---------- Component ---------- */
export default function MapScreen({ navigation, route }: any) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const routeParams = useRoute();
  const { currentLocation, isLocationTracking, forceLocationUpdate } = useLocation();

  // state
  const [deliveries, setDeliveries] = useState<DeliveryLocation[]>([]);
  const [fetchingDeliveries, setFetchingDeliveries] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryLocation | null>(null);
  const [availableRoutes, setAvailableRoutes] = useState<DirectionsRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<DirectionsRoute | null>(null);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [isDrivingMode, setIsDrivingMode] = useState(false);
  const [activeDelivery, setActiveDelivery] = useState<DeliveryLocation | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingRestaurants, setFetchingRestaurants] = useState(false);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [activeDirections, setActiveDirections] = useState<DirectionsRoute | null>(null);
  const [targetClient, setTargetClient] = useState<DeliveryLocation | null>(null);
  const [showDirections, setShowDirections] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Restaurants
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [showRestaurantModal, setShowRestaurantModal] = useState(false);

  // Driver animation
  const [driverPosition, setDriverPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const animIndexRef = useRef<number>(0);
  const animIntervalRef = useRef<any>(null);
  const mapRef = useRef<MapView>(null);

  // Route params (if any)
  const targetLocation = (routeParams.params as any)?.targetLocation;
  const targetCustomerName = (routeParams.params as any)?.customerName;
  const targetAddress = (routeParams.params as any)?.address;
  
  // New navigation params from DeliveryDetailsScreen
  const driverLocation = (routeParams.params as any)?.driverLocation;
  const restaurantLocation = (routeParams.params as any)?.restaurantLocation;
  const customerLocation = (routeParams.params as any)?.customerLocation;
  const deliveryId = (routeParams.params as any)?.deliveryId;
  const deliveryStatus = (routeParams.params as any)?.deliveryStatus;
  const navigationMode = (routeParams.params as any)?.navigationMode; // 'toRestaurant' or 'toCustomer'
  const customerName = (routeParams.params as any)?.customerName;
  const restaurantName = (routeParams.params as any)?.restaurantName;

  /* ---------- Utilities ---------- */
  const calculateDistance = useCallback((point1: { latitude: number; longitude: number }, point2: { latitude: number; longitude: number }) => {
    const R = 6371e3;
    const φ1 = point1.latitude * Math.PI / 180;
    const φ2 = point2.latitude * Math.PI / 180;
    const Δφ = (point2.latitude - point1.latitude) * Math.PI / 180;
    const Δλ = (point2.longitude - point1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  const getDirection = (from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }) => {
    const latDiff = to.latitude - from.latitude;
    const lngDiff = to.longitude - from.longitude;
    if (Math.abs(latDiff) > Math.abs(lngDiff)) return latDiff > 0 ? 'north' : 'south';
    return lngDiff > 0 ? 'east' : 'west';
  };

  const getManeuverIcon = (maneuver: string) => {
    switch (maneuver) {
      case 'depart':
      case 'start': return 'play';
      case 'turn-left': return 'arrow-back';
      case 'turn-right': return 'arrow-forward';
      case 'turn-slight-left':
      case 'turn-slight-right': return 'arrow-up-outline';
      case 'continue':
      case 'straight': return 'arrow-up';
      case 'ramp-left': return 'arrow-back';
      case 'ramp-right': return 'arrow-forward';
      case 'merge': return 'git-merge-outline';
      case 'fork-left':
      case 'fork-right': return 'git-branch-outline';
      case 'arrive': return 'flag';
      case 'roundabout-left':
      case 'roundabout-right': return 'refresh-circle';
      default: return 'arrow-up';
    }
  };

  /* ---------- Demo route generator (fallback) ---------- */
  const createDemoRoute = useCallback((
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number }
  ): DirectionsRoute => {
    const coordinates: Array<{ latitude: number; longitude: number }> = [];
    coordinates.push(origin);

    const latDiff = destination.latitude - origin.latitude;
    const lngDiff = destination.longitude - origin.longitude;
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
    const numberOfSegments = Math.max(10, Math.floor(distance * 10000));

    const waypoints: Array<{ latitude: number; longitude: number }> = [];
    if (Math.abs(latDiff) > Math.abs(lngDiff)) {
      waypoints.push({ latitude: origin.latitude + latDiff * 0.3, longitude: origin.longitude + lngDiff * 0.1 });
      waypoints.push({ latitude: origin.latitude + latDiff * 0.7, longitude: origin.longitude + lngDiff * 0.4 });
      waypoints.push({ latitude: origin.latitude + latDiff * 0.9, longitude: origin.longitude + lngDiff * 0.8 });
    } else {
      waypoints.push({ latitude: origin.latitude + latDiff * 0.1, longitude: origin.longitude + lngDiff * 0.3 });
      waypoints.push({ latitude: origin.latitude + latDiff * 0.4, longitude: origin.longitude + lngDiff * 0.7 });
      waypoints.push({ latitude: origin.latitude + latDiff * 0.8, longitude: origin.longitude + lngDiff * 0.9 });
    }

    const allPoints = [origin, ...waypoints, destination];

    for (let i = 0; i < allPoints.length - 1; i++) {
      const start = allPoints[i];
      const end = allPoints[i + 1];
      const segmentSteps = Math.floor(numberOfSegments / (allPoints.length - 1)) || 5;

      for (let j = 0; j < segmentSteps; j++) {
        const progress = j / segmentSteps;
        const smoothProgress = 0.5 * (1 - Math.cos(progress * Math.PI));
        let lat = start.latitude + (end.latitude - start.latitude) * smoothProgress;
        let lng = start.longitude + (end.longitude - start.longitude) * smoothProgress;

        const roadVariation = 0.00012;
        const gridAlignment = 0.00005;
        const latGrid = Math.floor(lat / gridAlignment) * gridAlignment;
        const lngGrid = Math.floor(lng / gridAlignment) * gridAlignment;

        lat = latGrid + (Math.random() - 0.5) * roadVariation;
        lng = lngGrid + (Math.random() - 0.5) * roadVariation;

        const lastCoord = coordinates[coordinates.length - 1];
        if (!lastCoord || Math.abs(lat - lastCoord.latitude) > 0.00001 || Math.abs(lng - lastCoord.longitude) > 0.00001) {
          coordinates.push({ latitude: lat, longitude: lng });
        }
      }
    }

    coordinates.push(destination);

    let totalDistance = 0;
    for (let i = 0; i < coordinates.length - 1; i++) {
      totalDistance += calculateDistance(coordinates[i], coordinates[i + 1]);
    }
    const distanceKm = (totalDistance / 1000).toFixed(1);
    const estimatedTimeMinutes = Math.max(1, Math.ceil(totalDistance / 300));

    const steps: DirectionsStep[] = [
      { instruction: `Head ${getDirection(origin, coordinates[Math.floor(coordinates.length * 0.1)])} on local roads`, distance: `${(totalDistance / 1000).toFixed(1)} km`, duration: `${Math.ceil(estimatedTimeMinutes)} min`, maneuver: 'depart' },
      { instruction: 'Continue on main streets', distance: '—', duration: `${Math.max(1, Math.floor(estimatedTimeMinutes / 2))} min`, maneuver: 'continue' },
      { instruction: 'Arrive at your destination on the right', distance: '0.0 km', duration: '1 min', maneuver: 'arrive' },
    ];

    return {
      distance: `${distanceKm} km`,
      duration: `${estimatedTimeMinutes} min`,
      coordinates,
      steps,
      summary: 'Demo route via local roads',
    };
  }, [calculateDistance]);

  /* ---------- Polyline decoder (for Google Directions) ---------- */
  const decodePolyline = (encoded: string): Array<{ latitude: number; longitude: number }> => {
    const poly: Array<{ latitude: number; longitude: number }> = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let b: number;
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

      poly.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }

    return poly;
  };

  /* ---------- Google Directions (primary) ---------- */
  const getDirections = useCallback(async (
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number }
  ): Promise<DirectionsRoute | null> => {
    try {
      const originStr = `${origin.latitude},${origin.longitude}`;
      const destinationStr = `${destination.latitude},${destination.longitude}`;
      
      // Enhanced URL with optimizations for real roads and avoiding buildings
      const url = `https://maps.googleapis.com/maps/api/directions/json?` +
        `origin=${originStr}&` +
        `destination=${destinationStr}&` +
        `mode=driving&` +
        `avoid=tolls&` + // Avoid tolls for delivery drivers
        `optimize=true&` + // Optimize route
        `traffic_model=best_guess&` + // Consider traffic
        `departure_time=now&` + // Current traffic conditions
        `alternatives=false&` + // Get best route only
        `key=${GOOGLE_MAPS_APIKEY}`;

      console.log('🗺️ Fetching directions from Google Maps API...');
      const response = await fetch(url);
      const data = await response.json();

      if (!data || data.status !== 'OK' || !data.routes || data.routes.length === 0) {
        console.warn('Google Directions API error (status != OK or no routes), falling back to demo route:', data?.status, data?.error_message);
        return createDemoRoute(origin, destination);
      }

      const route = data.routes[0];
      const leg = route.legs[0];

      // Decode the polyline to get precise road coordinates
      const coordinates = decodePolyline(route.overview_polyline.points);
      console.log(`✅ Route calculated: ${coordinates.length} coordinate points`);
      
      const steps: DirectionsStep[] = leg.steps.map((step: any) => ({
        instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
        distance: step.distance?.text || '',
        duration: step.duration?.text || '',
        maneuver: step.maneuver || 'continue',
      }));

      return {
        distance: leg.distance?.text || '0 km',
        duration: leg.duration?.text || '0 min',
        coordinates,
        steps,
        summary: route.summary || 'Route via real roads',
      };
    } catch (error) {
      console.warn('Google Directions fetch failed — using demo route:', error);
      return createDemoRoute(origin, destination);
    }
  }, [createDemoRoute]);

  /* ---------- Start navigation (open external maps) ---------- */
  const startNavigation = useCallback((destLat: number, destLng: number) => {
    const url = Platform.OS === 'ios' ? `maps://app?daddr=${destLat},${destLng}` : `google.navigation:q=${destLat},${destLng}`;
    Alert.alert(
      t('startNavigation'),
      t('startNavigationConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('openMaps'),
          onPress: () => {
            console.log('Open maps URL:', url);
            // in a real app: Linking.openURL(url)
          }
        }
      ]
    );
  }, [t]);

  /* ---------- Calculate route driver -> restaurant -> customer ---------- */
  const calculateDriverRestaurantCustomerRoute = useCallback(async (delivery: DeliveryLocation) => {
    if (!currentLocation) {
      Alert.alert(t('error'), 'Current location not available');
      return;
    }
    if (delivery.restaurantLat == null || delivery.restaurantLng == null) {
      Alert.alert(t('error'), 'Restaurant location not provided for this delivery.');
      return;
    }

    setIsCalculatingRoute(true);
    try {
      const driver = { latitude: currentLocation.latitude, longitude: currentLocation.longitude };
      const restaurant = { latitude: delivery.restaurantLat!, longitude: delivery.restaurantLng! };
      const customer = { latitude: delivery.lat, longitude: delivery.lng };

      const seg1 = await getDirections(driver, restaurant);
      const seg2 = await getDirections(restaurant, customer);

      // combine coordinates
      const coords1 = seg1?.coordinates || [];
      const coords2 = seg2?.coordinates || [];
      const combined: Array<{ latitude: number; longitude: number }> = [...coords1];

      if (coords2.length > 0) {
        const last1 = combined[combined.length - 1];
        const first2 = coords2[0];
        if (last1 && first2 && Math.abs(last1.latitude - first2.latitude) < 0.000001 && Math.abs(last1.longitude - first2.longitude) < 0.000001) {
          combined.push(...coords2.slice(1));
        } else {
          combined.push(...coords2);
        }
      }

      const combinedDistance = `${((parseFloat(seg1?.distance || '0') || 0) + (parseFloat(seg2?.distance || '0') || 0)).toFixed(1)} km`;
      const combinedDuration = `${(parseInt(seg1?.duration || '0') + parseInt(seg2?.duration || '0')).toString()} min`;
      const combinedSteps = [...(seg1?.steps || []), ...(seg2?.steps || [])];

      const combinedRoute: DirectionsRoute = {
        distance: combinedDistance,
        duration: combinedDuration,
        coordinates: combined,
        steps: combinedSteps,
        summary: 'Driver → Restaurant → Customer'
      };

      setActiveDirections(combinedRoute);
      setRouteCoordinates(combinedRoute.coordinates);
      setShowDirections(true);
      setSelectedDelivery(delivery);
      setActiveDelivery(delivery);
      setIsDrivingMode(true);

      // set driver initial position to current location
      setDriverPosition(currentLocation);
      animIndexRef.current = 0;

      // fit map
      if (combinedRoute.coordinates.length > 0) {
        mapRef.current?.fitToCoordinates(combinedRoute.coordinates, {
          edgePadding: { top: 80, right: 80, bottom: 220, left: 80 },
          animated: true,
        });
      }

      Alert.alert(t('routeCalculated'), `${t('distance')}: ${combinedRoute.distance}\n${t('estTime')}: ${combinedRoute.duration}`, [{ text: t('ok') }]);
    } catch (err) {
      console.error('Calculate combined route error:', err);
      Alert.alert(t('error'), 'Failed to calculate route.');
    } finally {
      setIsCalculatingRoute(false);
    }
  }, [currentLocation, getDirections, t]);

  /* ---------- Calculate route to client only (existing behavior) ---------- */
  const calculateRouteToClient = useCallback(async (client: DeliveryLocation) => {
    if (!currentLocation) {
      Alert.alert(t('error'), 'Current location not available');
      return;
    }

    setIsCalculatingRoute(true);
    setTargetClient(client);
    setSelectedDelivery(client);

    try {
      mapRef.current?.animateToRegion({
        latitude: client.lat,
        longitude: client.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);

      const directionsRoute = await getDirections(currentLocation, { latitude: client.lat, longitude: client.lng });

      if (directionsRoute) {
        setActiveDirections(directionsRoute);
        setRouteCoordinates(directionsRoute.coordinates);
        setShowDirections(true);

        mapRef.current?.fitToCoordinates([currentLocation, { latitude: client.lat, longitude: client.lng }], {
          edgePadding: { top: 50, right: 50, bottom: 200, left: 50 },
          animated: true,
        });

        Alert.alert(
          t('routeCalculated'),
          `${t('distance')}: ${directionsRoute.distance}\n${t('estTime')}: ${directionsRoute.duration}\n\n${t('startNavigationConfirm')}`,
          [
            { text: t('cancel'), style: 'cancel' },
            { text: t('startNavigation'), onPress: () => startNavigation(client.lat, client.lng) },
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

  /* ---------- Accept delivery (driving toward client) ---------- */
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

            mapRef.current?.fitToCoordinates(route.coordinates, {
              edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
              animated: true,
            });

            setDriverPosition(currentLocation);
            animIndexRef.current = 0;
          }
        });
    }
  };

  /* ---------- Exit driving mode ---------- */
  const exitDrivingMode = () => {
    setIsDrivingMode(false);
    setActiveDelivery(null);
    setRouteCoordinates([]);
    setActiveDirections(null);
    setIsAnimating(false);
    if (animIntervalRef.current) {
      clearInterval(animIntervalRef.current);
      animIntervalRef.current = null;
    }
    if (currentLocation) {
      setDriverPosition(currentLocation);
      mapRef.current?.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 800);
    }
  };

  /* ---------- Handle delivery press ---------- */
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
            text: 'Driver → Restaurant → Customer',
            onPress: () => calculateDriverRestaurantCustomerRoute(delivery),
          },
          {
            text: t('acceptDeliveryAction'),
            onPress: () => acceptDelivery(delivery),
          },
        ]
      );
    }
  };

  /* ---------- Center on user ---------- */
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

  /* ---------- Handle navigation from DeliveryDetailsScreen ---------- */
  useEffect(() => {
    if (navigationMode && driverLocation && (restaurantLocation || customerLocation)) {
      console.log('🗺️ Navigation mode:', navigationMode);
      
      // Set current location from passed driver location
      setCurrentLocation(driverLocation);
      setDriverPosition(driverLocation);
      setLoading(false);
      
      // Calculate route based on navigation mode
      if (navigationMode === 'toRestaurant' && restaurantLocation) {
        console.log('🏪 Calculating route to restaurant:', restaurantName);
        calculateRouteToDestination(driverLocation, restaurantLocation, 'restaurant');
      } else if (navigationMode === 'toCustomer' && customerLocation) {
        console.log('🏠 Calculating route to customer:', customerName);
        calculateRouteToDestination(driverLocation, customerLocation, 'customer');
      }
    }
  }, [navigationMode, driverLocation, restaurantLocation, customerLocation]);
  
  /* ---------- Calculate route to specific destination ---------- */
  const calculateRouteToDestination = async (
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    destinationType: 'restaurant' | 'customer'
  ) => {
    setIsCalculatingRoute(true);
    try {
      const route = await getDirections(origin, destination);
      if (route) {
        setActiveDirections(route);
        setRouteCoordinates(route.coordinates);
        setShowDirections(true);
        setIsDrivingMode(true);
        
        // Fit map to show the route
        mapRef.current?.fitToCoordinates(route.coordinates, {
          edgePadding: { top: 80, right: 80, bottom: 220, left: 80 },
          animated: true,
        });
        
        const destinationName = destinationType === 'restaurant' ? restaurantName : customerName;
        Alert.alert(
          'Route Calculated',
          `Route to ${destinationName}\nDistance: ${route.distance}\nEstimated Time: ${route.duration}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error calculating route to destination:', error);
      Alert.alert('Error', 'Could not calculate route. Please try again.');
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  /* ---------- Fetch deliveries from backend ---------- */
  useEffect(() => {
    const fetchDeliveries = async () => {
      setFetchingDeliveries(true);
      try {
        const res = await riderAPI.getCurrentDeliveries().catch(() => ({ success: false, data: [] }));
        if (res?.data) {
          const mapped = mapApiDeliveries(res.data);
          setDeliveries(convertToDeliveryLocations(mapped));
        } else {
          setDeliveries([]);
        }
      } catch (err) {
        console.warn('Could not fetch deliveries:', err);
        setDeliveries([]);
      } finally {
        setFetchingDeliveries(false);
      }
    };

    fetchDeliveries();
  }, []);

  /* ---------- Initialize map when location is available ---------- */
  useEffect(() => {
    if (currentLocation) {
      setLoading(false);
      setDriverPosition(currentLocation);
      
      // Animate to current location
      mapRef.current?.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
      
      console.log('📍 Map initialized with location:', currentLocation);
    }
  }, [currentLocation]);

  /* ---------- Fetch restaurants from backend ---------- */
  const fetchRestaurants = useCallback(async (location?: { latitude: number; longitude: number }) => {
    if (!location) {
      console.log('📍 No location available for restaurant fetching');
      return;
    }

    setFetchingRestaurants(true);
    try {
      console.log('🍽️ Fetching restaurants near location:', location);
      
      const response = await restaurantAPI.browseRestaurants({
        nearLat: location.latitude,
        nearLng: location.longitude,
        ...RESTAURANT_CONFIG,
      });

      if (response.success && response.data) {
        console.log(`✅ Fetched ${response.data.length} restaurants`);
        setRestaurants(response.data);
      } else {
        console.warn('⚠️ Restaurant API returned no data');
        setRestaurants([]);
      }
    } catch (err) {
      console.error('❌ Failed to fetch restaurants:', err);
      setRestaurants([]);
    } finally {
      setFetchingRestaurants(false);
    }
  }, []);

  // Fetch restaurants when location changes
  useEffect(() => {
    if (currentLocation) {
      fetchRestaurants(currentLocation);
    }
  }, [currentLocation, fetchRestaurants]);

  /* ---------- Marker color logic ---------- */
  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FCD34D';
      case 'accepted': return '#60A5FA';
      case 'picked_up': return '#34D399';
      case 'delivered': return '#9CA3AF';
      default: return '#EF4444';
    }
  };

  /* ---------- Restaurant marker tap: show details ---------- */
  const onRestaurantPress = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setShowRestaurantModal(true);

    // animate map to restaurant
    mapRef.current?.animateToRegion({
      latitude: restaurant.latitude,
      longitude: restaurant.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 700);
  };

  /* ---------- Driver animation control ---------- */
  useEffect(() => {
    if (isAnimating) {
      // small guard
      if (!routeCoordinates || routeCoordinates.length === 0) {
        setIsAnimating(false);
        Alert.alert('No route', 'Calculate a route first (driver → restaurant → customer).');
        return;
      }

      animIntervalRef.current = setInterval(() => {
        const idx = animIndexRef.current;
        if (idx >= routeCoordinates.length) {
          // reached end
          clearInterval(animIntervalRef.current);
          animIntervalRef.current = null;
          setIsAnimating(false);
          return;
        }

        const next = routeCoordinates[idx];
        setDriverPosition(next);
        animIndexRef.current = idx + 1;
      }, 700); // 700ms per step (tweak to change speed)
    } else {
      if (animIntervalRef.current) {
        clearInterval(animIntervalRef.current);
        animIntervalRef.current = null;
      }
    }

    return () => {
      if (animIntervalRef.current) {
        clearInterval(animIntervalRef.current);
        animIntervalRef.current = null;
      }
    };
  }, [isAnimating, routeCoordinates]);

  const toggleAnimation = () => {
    if (!routeCoordinates || routeCoordinates.length === 0) {
      Alert.alert('No route', 'Calculate route first (Driver → Restaurant → Customer).');
      return;
    }
    // if we reached the end, reset index to start
    if (animIndexRef.current >= routeCoordinates.length) animIndexRef.current = 0;
    setIsAnimating(v => !v);
  };

  /* ---------- Render loading ---------- */
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>{t('loadingMap')}</Text>
        {locationError && <Text style={styles.errorText}>{locationError}</Text>}
      </View>
    );
  }

  /* ---------- UI ---------- */
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{isDrivingMode ? t('drivingMode') : t('map')}</Text>
            <View style={styles.headerSubtitleContainer}>
              <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
                {deliveries.length} {t('deliveries')} • {restaurants.length} restaurants
              </Text>
              <View style={[styles.locationStatus, { backgroundColor: isLocationTracking ? '#10B981' : '#EF4444' }]}>
                <Ionicons name={isLocationTracking ? "radio-button-on" : "radio-button-off"} size={12} color="#FFFFFF" />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.headerActions}>
          {isDrivingMode ? (
            <TouchableOpacity style={[styles.actionButton, styles.exitButton]} onPress={exitDrivingMode}>
              <Ionicons name="stop" size={18} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>{t('exit')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.actionButton, styles.primaryButton]} onPress={() => setShowRouteModal(true)}>
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
        customMapStyle={darkMapStyle} // dark style set as default
      >
        {/* Route polyline */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={theme.colors.primary}
            strokeWidth={4}
            lineDashPattern={[0]}
          />
        )}

        {/* Delivery markers */}
        {!isDrivingMode && deliveries.map((delivery) => (
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
              <Ionicons name="location" size={20} color="#FFFFFF" />
            </View>
          </Marker>
        ))}

        {/* Restaurants markers (fetched from backend) */}
        {restaurants.map((restaurant) => (
          <Marker
            key={String(restaurant.id)}
            coordinate={{ 
              latitude: typeof restaurant.latitude === 'string' ? parseFloat(restaurant.latitude) : restaurant.latitude,
              longitude: typeof restaurant.longitude === 'string' ? parseFloat(restaurant.longitude) : restaurant.longitude
            }}
            title={restaurant.name}
            description={`${restaurant.address || 'No address'} • ${restaurant.distanceKm ? `${restaurant.distanceKm.toFixed(2)}km` : 'Distance unknown'}`}
            onPress={() => onRestaurantPress(restaurant)}
          >
            <View style={[
              styles.markerContainer, 
              styles.restaurantMarker,
              { backgroundColor: restaurant.isOpen ? '#10B981' : '#6B7280' }
            ]}>
              <Ionicons name="restaurant" size={18} color="#FFFFFF" />
            </View>
          </Marker>
        ))}

        {/* Active delivery markers (when driving) */}
        {isDrivingMode && activeDelivery && (
          <>
            {/* customer */}
            <Marker coordinate={{ latitude: activeDelivery.lat, longitude: activeDelivery.lng }} title={activeDelivery.customerName} description={activeDelivery.address}>
              <View style={[styles.markerContainer, styles.activeMarker]}>
                <Ionicons name="flag" size={20} color="#FFFFFF" />
              </View>
            </Marker>

            {/* restaurant */}
            {typeof activeDelivery.restaurantLat === 'number' && typeof activeDelivery.restaurantLng === 'number' && (
              <Marker coordinate={{ latitude: activeDelivery.restaurantLat!, longitude: activeDelivery.restaurantLng! }} title={activeDelivery.restaurant}>
                <View style={[styles.markerContainer, styles.targetMarker]}>
                  <Ionicons name="restaurant" size={18} color="#FFFFFF" />
                </View>
              </Marker>
            )}

            {/* driver (animated) */}
            {driverPosition && (
              <Marker coordinate={driverPosition}>
                <View style={[styles.markerContainer, { backgroundColor: '#374151' }]}>
                  <Ionicons name="car" size={18} color="#FFFFFF" />
                </View>
              </Marker>
            )}
          </>
        )}

        {/* targetLocation param if provided */}
        {targetLocation && (
          <Marker coordinate={{
            latitude: targetLocation.latitude || targetLocation.lat,
            longitude: targetLocation.longitude || targetLocation.lng
          }} title={targetCustomerName || 'Target Location'}>
            <View style={[styles.markerContainer, styles.targetMarker]}>
              <Ionicons name="pin" size={20} color="#FFFFFF" />
            </View>
          </Marker>
        )}
        
        {/* Navigation mode markers */}
        {navigationMode && restaurantLocation && (
          <Marker 
            coordinate={restaurantLocation} 
            title={restaurantName || 'Restaurant'}
            description="Pickup location"
          >
            <View style={[styles.markerContainer, { backgroundColor: '#F59E0B' }]}>
              <Ionicons name="restaurant" size={20} color="#FFFFFF" />
            </View>
          </Marker>
        )}
        
        {navigationMode && customerLocation && (
          <Marker 
            coordinate={customerLocation} 
            title={customerName || 'Customer'}
            description="Delivery location"
          >
            <View style={[styles.markerContainer, { backgroundColor: '#10B981' }]}>
              <Ionicons name="home" size={20} color="#FFFFFF" />
            </View>
          </Marker>
        )}
        
        {/* Driver position in navigation mode */}
        {navigationMode && driverPosition && (
          <Marker coordinate={driverPosition} title="Your Location">
            <View style={[styles.markerContainer, { backgroundColor: '#3B82F6' }]}>
              <Ionicons name="car" size={20} color="#FFFFFF" />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Directions Panel */}
      {showDirections && activeDirections && (
        <View style={[styles.directionsPanel, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.directionsPanelHeader}>
            <View style={styles.routeSummary}>
              <Text style={[styles.routeDistance, { color: theme.colors.primary }]}>{activeDirections.distance}</Text>
              <Text style={[styles.routeDuration, { color: theme.colors.textSecondary }]}>{activeDirections.duration}</Text>
            </View>
            <TouchableOpacity style={styles.directionsCloseButton} onPress={() => { setShowDirections(false); setActiveDirections(null); setRouteCoordinates([]); }}>
              <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.directionsList} showsVerticalScrollIndicator={false}>
            {activeDirections.steps.map((step, index) => (
              <View key={index} style={[styles.directionStep, { borderBottomColor: theme.colors.border }]}>
                <View style={[styles.stepIcon, { backgroundColor: theme.colors.primary }]}>
                  <Ionicons name={getManeuverIcon(step.maneuver)} size={16} color="#FFFFFF" />
                </View>
                <View style={styles.stepDetails}>
                  <Text style={[styles.stepInstruction, { color: theme.colors.text }]}>{step.instruction}</Text>
                  <Text style={[styles.stepDistance, { color: theme.colors.textSecondary }]}>{step.distance} • {step.duration}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Directions Toggle Button */}
      {activeDirections && !showDirections && (
        <TouchableOpacity style={[styles.directionsToggle, { backgroundColor: theme.colors.primary }]} onPress={() => setShowDirections(true)}>
          <Ionicons name="list" size={20} color="#FFFFFF" />
          <Text style={styles.directionsToggleText}>Directions</Text>
        </TouchableOpacity>
      )}

      {/* Center Location Button */}
      <TouchableOpacity style={[styles.fab, { backgroundColor: theme.colors.primary }]} onPress={centerOnLocation}>
        <Ionicons name="locate" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Refresh Location & Restaurants Button */}
      <TouchableOpacity 
        style={[styles.refreshFab, { backgroundColor: fetchingRestaurants ? '#6B7280' : '#F59E0B' }]} 
        onPress={async () => {
          if (fetchingRestaurants) return;
          console.log('🔄 Manual refresh triggered');
          await forceLocationUpdate();
          if (currentLocation) {
            await fetchRestaurants(currentLocation);
          }
        }}
        disabled={fetchingRestaurants}
      >
        <Ionicons 
          name={fetchingRestaurants ? "hourglass" : "refresh"} 
          size={20} 
          color="#FFFFFF" 
        />
      </TouchableOpacity>

      {/* Animate driver toggle (small FAB) */}
      <TouchableOpacity
        style={[styles.animateFab, { backgroundColor: isAnimating ? '#EF4444' : '#10B981' }]}
        onPress={toggleAnimation}
      >
        <Ionicons name={isAnimating ? 'stop' : 'play'} size={18} color="#fff" />
      </TouchableOpacity>

      {/* Selected Delivery Card */}
      {(selectedDelivery || activeDelivery) && (
        <View style={[styles.deliveryCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.deliveryCardHeader}>
            <View style={styles.deliveryInfo}>
              <Text style={[styles.customerName, { color: theme.colors.text }]}>{(selectedDelivery || activeDelivery)?.customerName}</Text>
              <Text style={[styles.deliveryAddress, { color: theme.colors.textSecondary }]}>{(selectedDelivery || activeDelivery)?.address}</Text>
              <View style={styles.deliveryMeta}>
                <View style={[styles.statusBadge, { backgroundColor: getMarkerColor((selectedDelivery || activeDelivery)?.status || 'pending') }]}>
                  <Text style={styles.statusText}>{((selectedDelivery || activeDelivery)?.status || '').toUpperCase()}</Text>
                </View>
                <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>{(selectedDelivery || activeDelivery)?.distance} • {(selectedDelivery || activeDelivery)?.estimatedTime}</Text>
              </View>
              <Text style={[styles.restaurantInfo, { color: theme.colors.text }]}>{(selectedDelivery || activeDelivery)?.restaurant} • {(selectedDelivery || activeDelivery)?.payment}</Text>
            </View>

            {!isDrivingMode && (
              <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedDelivery(null)}>
                <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.deliveryActions}>
            {!activeDirections && !isDrivingMode && (
              <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={() => calculateRouteToClient(selectedDelivery!)} disabled={isCalculatingRoute}>
                {isCalculatingRoute ? <ActivityIndicator size="small" color={theme.colors.primary} /> : <Ionicons name="map" size={18} color={theme.colors.primary} />}
                <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>{isCalculatingRoute ? t('calculating') : t('calculateRoute')}</Text>
              </TouchableOpacity>
            )}

            {(activeDirections || isDrivingMode) && (
              <TouchableOpacity style={[styles.actionButton, styles.successButton]} onPress={() => startNavigation((selectedDelivery || activeDelivery)!.lat, (selectedDelivery || activeDelivery)!.lng)}>
                <Ionicons name="navigate" size={18} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>{t('startNavigation')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Deliveries Modal */}
      <Modal visible={showRouteModal} animationType="slide" transparent onRequestClose={() => setShowRouteModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{t('availableDeliveries')}</Text>
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowRouteModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.deliveriesList} showsVerticalScrollIndicator={false}>
              {deliveries.map((delivery) => (
                <TouchableOpacity key={delivery.id} style={[styles.deliveryItem, { backgroundColor: theme.colors.card }]} onPress={() => { setShowRouteModal(false); handleDeliveryPress(delivery); }}>
                  <View style={styles.deliveryItemHeader}>
                    <View style={styles.deliveryItemInfo}>
                      <Text style={[styles.deliveryItemName, { color: theme.colors.text }]}>{delivery.customerName}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: getMarkerColor(delivery.status) }]}>
                        <Text style={styles.statusText}>{delivery.status.toUpperCase()}</Text>
                      </View>
                    </View>
                    <View style={styles.deliveryItemMeta}>
                      <Text style={[styles.deliveryDistance, { color: theme.colors.primary }]}>{delivery.distance}</Text>
                      <Text style={[styles.deliveryTime, { color: theme.colors.textSecondary }]}>{delivery.estimatedTime}</Text>
                    </View>
                  </View>

                  <Text style={[styles.deliveryItemAddress, { color: theme.colors.textSecondary }]}>{delivery.address}</Text>

                  <View style={styles.deliveryItemFooter}>
                    <Text style={[styles.deliveryItemRestaurant, { color: theme.colors.text }]}>{delivery.restaurant}</Text>
                    <Text style={[styles.deliveryItemPayment, { color: theme.colors.primary }]}>{delivery.payment}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Restaurant Modal */}
      <Modal visible={showRestaurantModal} animationType="slide" transparent onRequestClose={() => { setShowRestaurantModal(false); setSelectedRestaurant(null); }}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            {selectedRestaurant ? (
              <>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{selectedRestaurant.name}</Text>
                  <TouchableOpacity style={styles.modalCloseButton} onPress={() => { setShowRestaurantModal(false); setSelectedRestaurant(null); }}>
                    <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.deliveriesList}>
                  <Text style={[styles.deliveryItemAddress, { color: theme.colors.text, marginBottom: 8 }]}>{selectedRestaurant.address}</Text>
                  
                  {/* Restaurant Details */}
                  <View style={styles.restaurantDetails}>
                    {selectedRestaurant.distanceKm && (
                      <Text style={[styles.metaText, { color: theme.colors.primary }]}>📍 {selectedRestaurant.distanceKm.toFixed(2)} km away</Text>
                    )}
                    
                    {selectedRestaurant.verificationStatus && (
                      <Text style={[styles.metaText, { color: selectedRestaurant.verificationStatus === 'APPROVED' ? '#10B981' : '#F59E0B' }]}>
                        ✓ {selectedRestaurant.verificationStatus}
                      </Text>
                    )}
                    
                    <Text style={[styles.metaText, { color: selectedRestaurant.isOpen ? '#10B981' : '#EF4444' }]}>
                      {selectedRestaurant.isOpen ? '🟢 Open' : '🔴 Closed'}
                    </Text>
                    
                    {selectedRestaurant.rating && (
                      <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                        ⭐ {selectedRestaurant.rating}/5 ({selectedRestaurant.ratingCount || 0} reviews)
                      </Text>
                    )}
                    
                    {selectedRestaurant.deliveryPrice && (
                      <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                        🚚 Delivery: {selectedRestaurant.deliveryPrice} FCFA
                      </Text>
                    )}
                    
                    {selectedRestaurant.estimatedDeliveryTime && (
                      <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                        ⏱️ {selectedRestaurant.estimatedDeliveryTime}
                      </Text>
                    )}
                  </View>
                  
                  <View style={{ height: 16 }} />

                  <TouchableOpacity style={[styles.actionButton, styles.primaryButton, { alignSelf: 'stretch', justifyContent: 'center' }]} onPress={async () => {
                    // route driver -> this restaurant -> nearest delivery (optional)
                    setShowRestaurantModal(false);
                    // Option: find a delivery belonging to this restaurant. If none, just route to restaurant.
                    const deliveryForThisRestaurant = deliveries.find(d => d.restaurant === selectedRestaurant.name);
                    if (deliveryForThisRestaurant && deliveryForThisRestaurant.restaurantLat && deliveryForThisRestaurant.restaurantLng) {
                      // route to driver->restaurant->customer using that delivery
                      await calculateDriverRestaurantCustomerRoute(deliveryForThisRestaurant);
                    } else {
                      // just calculate driver -> restaurant
                      if (!currentLocation) { Alert.alert(t('error'), 'Current location not available'); return; }
                      const route = await getDirections(currentLocation, { latitude: selectedRestaurant.latitude, longitude: selectedRestaurant.longitude });
                      if (route) {
                        setActiveDirections(route);
                        setRouteCoordinates(route.coordinates);
                        setShowDirections(true);
                        setIsDrivingMode(true);
                        setDriverPosition(currentLocation);
                        animIndexRef.current = 0;
                        mapRef.current?.fitToCoordinates(route.coordinates, { edgePadding: { top: 80, right: 80, bottom: 220, left: 80 }, animated: true });
                      }
                    }
                  }}>
                    <Ionicons name="map" size={18} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={[styles.actionButtonText, { color: '#fff' }]}>Route via this restaurant</Text>
                  </TouchableOpacity>

                  <View style={{ height: 12 }} />
                  <TouchableOpacity style={[styles.actionButton, styles.secondaryButton, { alignSelf: 'stretch', justifyContent: 'center' }]} onPress={() => {
                    // center on restaurant
                    mapRef.current?.animateToRegion({ latitude: selectedRestaurant.latitude, longitude: selectedRestaurant.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 500);
                  }}>
                    <Ionicons name="locate" size={18} color={theme.colors.primary} style={{ marginRight: 8 }} />
                    <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>Center on restaurant</Text>
                  </TouchableOpacity>
                </ScrollView>
              </>
            ) : (
              <ActivityIndicator size="large" />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ---------- Styles ---------- */
const filterFabHeight = 56;
const filterFabWidth = 140;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#64748B', fontWeight: '500' },
  errorText: { marginTop: 8, fontSize: 14, color: '#EF4444', textAlign: 'center', paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  backButton: { marginRight: 16, padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 2 },
  headerSubtitle: { fontSize: 14, fontWeight: '500' },
  headerSubtitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locationStatus: { width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  actionButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, gap: 6 },
  primaryButton: { backgroundColor: '#3B82F6' },
  secondaryButton: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  successButton: { backgroundColor: '#10B981' },
  exitButton: { backgroundColor: '#EF4444' },
  actionButtonText: { fontSize: 14, fontWeight: '600' },
  map: { flex: 1 },
  fab: { position: 'absolute', bottom: 140, right: 20, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 6 },
  refreshFab: { position: 'absolute', bottom: 140, right: 90, width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 6 },
  animateFab: { position: 'absolute', bottom: 80, right: 20, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 6 },
  markerContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 3 },
  activeMarker: { backgroundColor: '#EF4444', width: 44, height: 44, borderRadius: 22 },
  targetMarker: { backgroundColor: '#8B5CF6' },
  restaurantMarker: { backgroundColor: '#10B981' },
  deliveryCard: { position: 'absolute', bottom: 20, left: 20, right: 20, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  deliveryCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  deliveryInfo: { flex: 1 },
  customerName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  deliveryAddress: { fontSize: 14, marginBottom: 8, lineHeight: 20 },
  deliveryMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 12 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
  metaText: { fontSize: 12, fontWeight: '500' },
  restaurantInfo: { fontSize: 14, fontWeight: '600' },
  closeButton: { padding: 8, borderRadius: 8 },
  deliveryActions: { flexDirection: 'row', gap: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: height * 0.75, paddingBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  modalCloseButton: { padding: 4 },
  deliveriesList: { padding: 20 },
  deliveryItem: { borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  deliveryItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  deliveryItemInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  deliveryItemName: { fontSize: 16, fontWeight: '600' },
  deliveryItemMeta: { alignItems: 'flex-end' },
  deliveryDistance: { fontSize: 16, fontWeight: 'bold' },
  deliveryTime: { fontSize: 14, marginTop: 2 },
  deliveryItemAddress: { fontSize: 14, lineHeight: 18, marginBottom: 8 },
  deliveryItemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  deliveryItemRestaurant: { fontSize: 14, fontWeight: '500' },
  deliveryItemPayment: { fontSize: 14, fontWeight: 'bold' },
  restaurantDetails: { marginVertical: 8, gap: 4 },
  directionsPanel: { position: 'absolute', top: 100, left: 20, right: 20, maxHeight: height * 0.4, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6 },
  directionsPanelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  routeSummary: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  routeDistance: { fontSize: 18, fontWeight: 'bold' },
  routeDuration: { fontSize: 14, fontWeight: '500' },
  directionsCloseButton: { padding: 8, borderRadius: 8 },
  directionsList: { maxHeight: height * 0.25, paddingHorizontal: 16, paddingBottom: 16 },
  directionStep: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, borderBottomWidth: 1, gap: 12 },
  stepIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  stepDetails: { flex: 1 },
  stepInstruction: { fontSize: 14, fontWeight: '500', lineHeight: 18, marginBottom: 4 },
  stepDistance: { fontSize: 12, fontWeight: '400' },
  directionsToggle: { position: 'absolute', top: 120, left: 20, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4 },
  directionsToggleText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
});
