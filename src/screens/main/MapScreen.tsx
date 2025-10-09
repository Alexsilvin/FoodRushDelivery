import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
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
  Linking,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { riderService, restaurantService } from '../../services';
import { mapApiDeliveries } from '../../utils/mappers';
import { useLocation } from '../../contexts/LocationContext';
import { Restaurant, Delivery } from '../../types/api';
import { TabScreenProps } from '../../types/navigation.types';
import CommonView from '../../components/CommonView';
import { useFloatingTabBarHeight } from '../../hooks/useFloatingTabBarHeight';

const GOOGLE_MAPS_APIKEY = 'AIzaSyAlILoX4PV-nTzRcwdkP6iTOcFbV0IURMA';

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
  verificationStatus?: string;
  restaurantLat?: number;
  restaurantLng?: number;
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

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
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

const convertToDeliveryLocations = (deliveries: Delivery[]): DeliveryLocation[] => {
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
};

type Props = TabScreenProps<'Map'>;

export default function MapScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const tabBarHeight = useFloatingTabBarHeight();
  const { 
    currentLocation, 
    isLocationTracking,
    isInitializing,
    locationError,
    lastUpdateTime,
    updateFrequency,
    forceLocationUpdate,
    getServiceStatus,
    getErrorLog,
    clearLocationError,
  } = useLocation();

  // State
  const [deliveries, setDeliveries] = useState<DeliveryLocation[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryLocation | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  const [fetchingDeliveries, setFetchingDeliveries] = useState(false);
  const [fetchingRestaurants, setFetchingRestaurants] = useState(false);
  const [loading, setLoading] = useState(true);

  const [showDeliveriesModal, setShowDeliveriesModal] = useState(false);
  const [showRestaurantModal, setShowRestaurantModal] = useState(false);

  const [activeDirections, setActiveDirections] = useState<DirectionsRoute | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [showDirections, setShowDirections] = useState(false);
  const [isDrivingMode, setIsDrivingMode] = useState(false);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

  const [driverPosition, setDriverPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const [showDebugPanel, setShowDebugPanel] = useState(false);

  const mapRef = useRef<MapView>(null);
  const animIndexRef = useRef<number>(0);
  const animIntervalRef = useRef<any>(null);

  // Format time helper
  const formatLastUpdate = useCallback((): string => {
    if (!lastUpdateTime) return 'Never';
    const now = Date.now();
    const diff = Math.floor((now - lastUpdateTime) / 1000);

    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    return `${Math.floor(diff / 3600)}h`;
  }, [lastUpdateTime]);

  // Calculate distance
  const calculateDistance = useCallback(
    (point1: { latitude: number; longitude: number }, point2: { latitude: number; longitude: number }) => {
      const R = 6371e3;
      const φ1 = (point1.latitude * Math.PI) / 180;
      const φ2 = (point2.latitude * Math.PI) / 180;
      const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
      const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

      const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    []
  );

  // Decode polyline
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

  // Get directions from Google Maps API
  const getDirections = useCallback(
    async (
      origin: { latitude: number; longitude: number },
      destination: { latitude: number; longitude: number }
    ): Promise<DirectionsRoute | null> => {
      try {
        const originStr = `${origin.latitude},${origin.longitude}`;
        const destinationStr = `${destination.latitude},${destination.longitude}`;

        const url =
          `https://maps.googleapis.com/maps/api/directions/json?` +
          `origin=${originStr}&` +
          `destination=${destinationStr}&` +
          `mode=driving&` +
          `avoid=tolls&` +
          `key=${GOOGLE_MAPS_APIKEY}`;

        const response = await fetch(url);
        const data = await response.json();

        if (!data || data.status !== 'OK' || !data.routes?.length) {
          console.warn('Google Directions API error:', data?.status);
          return null;
        }

        const route = data.routes[0];
        const leg = route.legs[0];
        const coordinates = decodePolyline(route.overview_polyline.points);

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
          summary: route.summary || 'Route',
        };
      } catch (error) {
        console.error('Error getting directions:', error);
        return null;
      }
    },
    []
  );

  // Fetch deliveries
  useEffect(() => {
    const fetchDeliveries = async () => {
      setFetchingDeliveries(true);
      try {
        const res = await riderService.getCurrentDeliveries().catch(() => []);
        if (res) {
          const mapped = mapApiDeliveries(res);
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

  // Fetch restaurants
  const fetchRestaurants = useCallback(async () => {
    if (!currentLocation || currentLocation.latitude === 0) {
      console.log('No location available for restaurant fetching');
      return;
    }

    setFetchingRestaurants(true);
    try {
      const response = await restaurantService.getNearbyRestaurants({
        nearLat: currentLocation.latitude,
        nearLng: currentLocation.longitude,
        radiusKm: 10,
        limit: 50,
        offset: 0,
        isOpen: true,
      });

      if (response?.data && Array.isArray(response.data)) {
        const validRestaurants = response.data.filter((r: Restaurant) => {
          const lat = typeof r.latitude === 'string' ? parseFloat(r.latitude) : r.latitude;
          const lng = typeof r.longitude === 'string' ? parseFloat(r.longitude) : r.longitude;
          return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
        });
        setRestaurants(validRestaurants);
      } else {
        setRestaurants([]);
      }
    } catch (err) {
      console.error('Failed to fetch restaurants:', err);
      setRestaurants([]);
    } finally {
      setFetchingRestaurants(false);
    }
  }, [currentLocation]);

  useEffect(() => {
    if (currentLocation && currentLocation.latitude !== 0) {
      fetchRestaurants();
    }
  }, [currentLocation, fetchRestaurants]);

  // Initialize map
  useEffect(() => {
    if (currentLocation && currentLocation.latitude !== 0) {
      setLoading(false);
      setDriverPosition(currentLocation);

      mapRef.current?.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);

      console.log('Map initialized with location:', currentLocation);
    }
  }, [currentLocation]);

  // Timeout for loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading && (!currentLocation || currentLocation.latitude === 0)) {
        console.warn('Loading timeout');
        setLoading(false);
      }
    }, 15000);

    return () => clearTimeout(timeout);
  }, [loading, currentLocation]);

  // Driver animation
  useEffect(() => {
    if (isAnimating) {
      if (!routeCoordinates || routeCoordinates.length === 0) {
        setIsAnimating(false);
        Alert.alert('No route', 'Calculate a route first');
        return;
      }

      animIntervalRef.current = setInterval(() => {
        const idx = animIndexRef.current;
        if (idx >= routeCoordinates.length) {
          clearInterval(animIntervalRef.current);
          animIntervalRef.current = null;
          setIsAnimating(false);
          return;
        }

        const next = routeCoordinates[idx];
        setDriverPosition(next);
        animIndexRef.current = idx + 1;
      }, 700);
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

  const toggleAnimation = useCallback(() => {
    if (!routeCoordinates || routeCoordinates.length === 0) {
      Alert.alert('No route', 'Calculate a route first');
      return;
    }
    if (animIndexRef.current >= routeCoordinates.length) {
      animIndexRef.current = 0;
    }
    setIsAnimating((v) => !v);
  }, [routeCoordinates]);

  const centerOnLocation = useCallback(() => {
    if (currentLocation) {
      mapRef.current?.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    }
  }, [currentLocation]);

  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FCD34D';
      case 'accepted':
        return '#60A5FA';
      case 'picked_up':
        return '#34D399';
      case 'delivered':
        return '#9CA3AF';
      default:
        return '#EF4444';
    }
  };

  const handleDeliveryPress = useCallback((delivery: DeliveryLocation) => {
    setSelectedDelivery(delivery);
    mapRef.current?.animateToRegion({
      latitude: delivery.lat,
      longitude: delivery.lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 800);

    if (!isDrivingMode) {
      Alert.alert(
        delivery.customerName,
        `Address: ${delivery.address}\n${delivery.restaurant} • ${delivery.payment}\nDistance: ${delivery.distance} • ETA: ${delivery.estimatedTime}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Calculate Route',
            onPress: () => calculateRouteToClient(delivery),
          },
          {
            text: 'Accept Delivery',
            onPress: () => acceptDelivery(delivery),
          },
        ]
      );
    }
  }, [isDrivingMode]);

  const calculateRouteToClient = useCallback(async (delivery: DeliveryLocation) => {
    if (!currentLocation) {
      Alert.alert('Error', 'Current location not available');
      return;
    }

    setIsCalculatingRoute(true);
    try {
      const route = await getDirections(
        currentLocation,
        { latitude: delivery.lat, longitude: delivery.lng }
      );

      if (route) {
        setActiveDirections(route);
        setRouteCoordinates(route.coordinates);
        setShowDirections(true);

        mapRef.current?.fitToCoordinates(
          [currentLocation, { latitude: delivery.lat, longitude: delivery.lng }],
          {
            edgePadding: { top: 50, right: 50, bottom: 200, left: 50 },
            animated: true,
          }
        );

        Alert.alert(
          'Route Calculated',
          `Distance: ${route.distance}\nEstimated Time: ${route.duration}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Could not calculate route');
      }
    } catch (error) {
      console.error('Error calculating route:', error);
      Alert.alert('Error', 'Failed to calculate route');
    } finally {
      setIsCalculatingRoute(false);
    }
  }, [currentLocation, getDirections]);

  const acceptDelivery = useCallback((delivery: DeliveryLocation) => {
    setSelectedDelivery(delivery);
    setIsDrivingMode(true);

    if (currentLocation) {
      getDirections(currentLocation, { latitude: delivery.lat, longitude: delivery.lng }).then(
        (route) => {
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
        }
      );
    }
  }, [currentLocation, getDirections]);

  const exitDrivingMode = useCallback(() => {
    setIsDrivingMode(false);
    setSelectedDelivery(null);
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
  }, [currentLocation]);

  const onRestaurantPress = useCallback((restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setShowRestaurantModal(true);

    const lat = typeof restaurant.latitude === 'string'
      ? parseFloat(restaurant.latitude)
      : restaurant.latitude;
    const lng = typeof restaurant.longitude === 'string'
      ? parseFloat(restaurant.longitude)
      : restaurant.longitude;

    if (!isNaN(lat) && !isNaN(lng)) {
      mapRef.current?.animateToRegion({
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 700);
    }
  }, []);

  const handleRefreshLocation = useCallback(async () => {
    try {
      await forceLocationUpdate();
      if (currentLocation) {
        await fetchRestaurants();
      }
    } catch (error) {
      console.error('Refresh failed:', error);
    }
  }, [forceLocationUpdate, currentLocation, fetchRestaurants]);

  const renderLocationStatus = useCallback(() => {
    if (isInitializing) {
      return (
        <View style={[styles.statusBadge, styles.statusBadgeInitializing]}>
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text style={styles.statusBadgeText}>Initializing...</Text>
        </View>
      );
    }

    if (!isLocationTracking) {
      return (
        <View style={[styles.statusBadge, styles.statusBadgeInactive]}>
          <Ionicons name="radio-button-off" size={12} color="#FFFFFF" />
          <Text style={styles.statusBadgeText}>Inactive</Text>
        </View>
      );
    }

    return (
      <View style={[styles.statusBadge, styles.statusBadgeActive]}>
        <Ionicons name="radio-button-on" size={12} color="#FFFFFF" />
        <Text style={styles.statusBadgeText}>
          Tracking • {formatLastUpdate()} • {updateFrequency}/min
        </Text>
      </View>
    );
  }, [isInitializing, isLocationTracking, formatLastUpdate, updateFrequency]);

  const renderDebugPanel = useCallback(() => {
    if (!showDebugPanel) return null;

    const status = getServiceStatus();
    const errors = getErrorLog();

    return (
      <Modal visible={showDebugPanel} animationType="slide" transparent>
        <View style={styles.debugOverlay}>
          <View style={[styles.debugPanel, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.debugHeader}>
              <Text style={[styles.debugTitle, { color: theme.colors.text }]}>
                Debug Information
              </Text>
              <TouchableOpacity onPress={() => setShowDebugPanel(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.debugContent}>
              <Text style={[styles.debugSectionTitle, { color: theme.colors.text }]}>
                Location Service Status
              </Text>

              <View style={styles.debugItem}>
                <Text style={[styles.debugLabel, { color: theme.colors.textSecondary }]}>
                  Initialized:
                </Text>
                <Text style={[styles.debugValue, { color: theme.colors.text }]}>
                  {status.isInitialized ? 'Yes' : 'No'}
                </Text>
              </View>

              <View style={styles.debugItem}>
                <Text style={[styles.debugLabel, { color: theme.colors.textSecondary }]}>
                  Tracking:
                </Text>
                <Text style={[styles.debugValue, { color: theme.colors.text }]}>
                  {status.isTracking ? 'Active' : 'Inactive'}
                </Text>
              </View>

              <View style={styles.debugItem}>
                <Text style={[styles.debugLabel, { color: theme.colors.textSecondary }]}>
                  Current Location:
                </Text>
                <Text style={[styles.debugValue, { color: theme.colors.text, fontFamily: 'monospace' }]}>
                  {status.currentLocation
                    ? `${status.currentLocation.latitude.toFixed(6)}, ${status.currentLocation.longitude.toFixed(6)}`
                    : 'Not available'}
                </Text>
              </View>

              <View style={styles.debugItem}>
                <Text style={[styles.debugLabel, { color: theme.colors.textSecondary }]}>
                  Batch Size:
                </Text>
                <Text style={[styles.debugValue, { color: theme.colors.text }]}>
                  {status.batchSize} locations
                </Text>
              </View>

              <View style={styles.debugItem}>
                <Text style={[styles.debugLabel, { color: theme.colors.textSecondary }]}>
                  Errors:
                </Text>
                <Text style={[styles.debugValue, { color: theme.colors.text }]}>
                  {status.errorCount} total
                </Text>
              </View>

              {errors.length > 0 && (
                <>
                  <Text style={[styles.debugSectionTitle, { color: theme.colors.text, marginTop: 16 }]}>
                    Recent Errors
                  </Text>
                  {errors.slice(-5).map((error, i) => (
                    <View key={i} style={styles.debugError}>
                      <Text style={[styles.debugErrorCode, { color: '#EF4444' }]}>
                        [{error.code}]
                      </Text>
                      <Text style={[styles.debugErrorMessage, { color: theme.colors.textSecondary }]}>
                        {error.message}
                      </Text>
                    </View>
                  ))}
                </>
              )}

              <View style={styles.debugConfigSection}>
                <Text style={[styles.debugSectionTitle, { color: theme.colors.text }]}>
                  Configuration
                </Text>
                <Text style={[styles.debugConfigText, { color: theme.colors.textSecondary }]}>
                  {JSON.stringify(status.config, null, 2)}
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  }, [showDebugPanel, theme, getServiceStatus, getErrorLog]);

  if (loading) {
    return (
      <CommonView>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>
            {isInitializing ? 'Initializing location...' : 'Loading map...'}
          </Text>
          {locationError && (
            <Text style={styles.errorText}>{locationError}</Text>
          )}
        </View>
      </CommonView>
    );
  }

  return (
    <CommonView showStatusBar={true} paddingHorizontal={0}>
      <View style={[styles.container]}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: currentLocation?.latitude || 0,
          longitude: currentLocation?.longitude || 0,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        customMapStyle={darkMapStyle}
      >
        {/* Route polyline */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={theme.colors.primary}
            strokeWidth={4}
          />
        )}

        {/* Delivery markers */}
        {!isDrivingMode &&
          deliveries.map((delivery) => (
            <Marker
              key={delivery.id}
              coordinate={{ latitude: delivery.lat, longitude: delivery.lng }}
              onPress={() => handleDeliveryPress(delivery)}
            >
              <View
                style={[
                  styles.marker,
                  {
                    backgroundColor:
                      selectedDelivery?.id === delivery.id
                        ? '#3B82F6'
                        : getMarkerColor(delivery.status),
                    transform: [
                      {
                        scale: selectedDelivery?.id === delivery.id ? 1.2 : 1,
                      },
                    ],
                  },
                ]}
              >
                <Ionicons name="location" size={20} color="#FFFFFF" />
              </View>
            </Marker>
          ))}

        {/* Restaurant markers */}
        {restaurants.map((restaurant) => {
          const lat = typeof restaurant.latitude === 'string'
            ? parseFloat(restaurant.latitude)
            : restaurant.latitude;
          const lng = typeof restaurant.longitude === 'string'
            ? parseFloat(restaurant.longitude)
            : restaurant.longitude;

          if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
            return null;
          }

          return (
            <Marker
              key={String(restaurant.id)}
              coordinate={{ latitude: lat, longitude: lng }}
              onPress={() => onRestaurantPress(restaurant)}
            >
              <View
                style={[
                  styles.marker,
                  styles.restaurantMarker,
                  {
                    backgroundColor: restaurant.isOpen ? '#10B981' : '#6B7280',
                  },
                ]}
              >
                <Ionicons name="restaurant" size={18} color="#FFFFFF" />
              </View>
            </Marker>
          );
        })}

        {/* Active delivery markers */}
        {isDrivingMode && selectedDelivery && (
          <>
            <Marker
              coordinate={{
                latitude: selectedDelivery.lat,
                longitude: selectedDelivery.lng,
              }}
            >
              <View style={[styles.marker, styles.customerMarker]}>
                <Ionicons name="home" size={20} color="#FFFFFF" />
              </View>
            </Marker>

            {selectedDelivery.restaurantLat && selectedDelivery.restaurantLng && (
              <Marker
                coordinate={{
                  latitude: selectedDelivery.restaurantLat,
                  longitude: selectedDelivery.restaurantLng,
                }}
              >
                <View style={[styles.marker, styles.restaurantLocationMarker]}>
                  <Ionicons name="restaurant" size={18} color="#FFFFFF" />
                </View>
              </Marker>
            )}

            {driverPosition && (
              <Marker coordinate={driverPosition}>
                <View style={[styles.marker, styles.driverMarker]}>
                  <Ionicons name="car" size={18} color="#FFFFFF" />
                </View>
              </Marker>
            )}
          </>
        )}
      </MapView>

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              {isDrivingMode ? 'Driving Mode' : 'Map'}
            </Text>
            {renderLocationStatus()}
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setShowDebugPanel(true)}
          style={styles.debugButton}
        >
          <Ionicons name="bug" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Location Error Banner */}
      {locationError && !locationError.includes('default') && (
        <View style={[styles.errorBanner, { backgroundColor: '#FEE2E2' }]}>
          <Ionicons name="warning" size={16} color="#EF4444" />
          <Text style={[styles.errorBannerText, { color: '#DC2626' }]}>
            {locationError}
          </Text>
          <TouchableOpacity onPress={clearLocationError}>
            <Ionicons name="close" size={16} color="#DC2626" />
          </TouchableOpacity>
        </View>
      )}

      {/* Controls FAB */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={centerOnLocation}
        >
          <Ionicons name="locate" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.fab,
            {
              backgroundColor: fetchingRestaurants ? '#6B7280' : '#F59E0B',
              marginBottom: 70,
            },
          ]}
          onPress={handleRefreshLocation}
          disabled={fetchingRestaurants}
        >
          <Ionicons
            name={fetchingRestaurants ? 'hourglass' : 'refresh'}
            size={20}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        {isDrivingMode && (
          <TouchableOpacity
            style={[
              styles.fab,
              {
                backgroundColor: isAnimating ? '#EF4444' : '#10B981',
                marginBottom: 140,
              },
            ]}
            onPress={toggleAnimation}
          >
            <Ionicons
              name={isAnimating ? 'stop' : 'play'}
              size={18}
              color="#fff"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Directions Panel */}
      {showDirections && activeDirections && (
        <View
          style={[styles.directionsPanel, { backgroundColor: theme.colors.surface }]}
        >
          <View style={styles.directionsPanelHeader}>
            <View>
              <Text
                style={[
                  styles.routeDistance,
                  { color: theme.colors.primary },
                ]}
              >
                {activeDirections.distance}
              </Text>
              <Text
                style={[
                  styles.routeDuration,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {activeDirections.duration}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setShowDirections(false);
                setActiveDirections(null);
              }}
            >
              <Ionicons
                name="close"
                size={20}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.directionsList}>
            {activeDirections.steps.map((step, index) => (
              <View
                key={index}
                style={[
                  styles.directionStep,
                  { borderBottomColor: theme.colors.border },
                ]}
              >
                <View
                  style={[
                    styles.stepIcon,
                    { backgroundColor: theme.colors.primary },
                  ]}
                >
                  <Ionicons name="arrow-up" size={14} color="#FFFFFF" />
                </View>
                <View style={styles.stepDetails}>
                  <Text
                    style={[styles.stepInstruction, { color: theme.colors.text }]}
                  >
                    {step.instruction}
                  </Text>
                  <Text
                    style={[
                      styles.stepDistance,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {step.distance} • {step.duration}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Selected Delivery Card */}
      {selectedDelivery && (
        <View
          style={[styles.deliveryCard, { backgroundColor: theme.colors.surface }]}
        >
          <View style={styles.deliveryCardHeader}>
            <View style={styles.deliveryInfo}>
              <Text
                style={[
                  styles.customerName,
                  { color: theme.colors.text },
                ]}
              >
                {selectedDelivery.customerName}
              </Text>
              <Text
                style={[
                  styles.deliveryAddress,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {selectedDelivery.address}
              </Text>
            </View>

            {!isDrivingMode && (
              <TouchableOpacity onPress={() => setSelectedDelivery(null)}>
                <Ionicons
                  name="close"
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.deliveryActions}>
            {!activeDirections && !isDrivingMode && (
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={() => calculateRouteToClient(selectedDelivery)}
                disabled={isCalculatingRoute}
              >
                {isCalculatingRoute ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <Ionicons
                    name="map"
                    size={18}
                    color={theme.colors.primary}
                  />
                )}
                <Text
                  style={[
                    styles.actionButtonText,
                    { color: theme.colors.primary },
                  ]}
                >
                  {isCalculatingRoute ? 'Calculating...' : 'Calculate Route'}
                </Text>
              </TouchableOpacity>
            )}

            {(activeDirections || isDrivingMode) && (
              <TouchableOpacity
                style={[styles.actionButton, styles.successButton]}
                onPress={exitDrivingMode}
              >
                <Ionicons name="stop" size={18} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Exit Driving</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Deliveries Modal */}
      <Modal
        visible={showDeliveriesModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowDeliveriesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Available Deliveries
              </Text>
              <TouchableOpacity onPress={() => setShowDeliveriesModal(false)}>
                <Ionicons
                  name="close"
                  size={24}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalList}>
              {deliveries.map((delivery) => (
                <TouchableOpacity
                  key={delivery.id}
                  style={[
                    styles.deliveryItem,
                    { backgroundColor: theme.colors.card },
                  ]}
                  onPress={() => {
                    setShowDeliveriesModal(false);
                    handleDeliveryPress(delivery);
                  }}
                >
                  <View style={styles.deliveryItemContent}>
                    <Text
                      style={[
                        styles.deliveryItemName,
                        { color: theme.colors.text },
                      ]}
                    >
                      {delivery.customerName}
                    </Text>
                    <Text
                      style={[
                        styles.deliveryItemAddress,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {delivery.address}
                    </Text>
                  </View>
                  <View style={styles.deliveryItemMeta}>
                    <Text
                      style={[
                        styles.deliveryDistance,
                        { color: theme.colors.primary },
                      ]}
                    >
                      {delivery.distance}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Restaurant Modal */}
      <Modal
        visible={showRestaurantModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowRestaurantModal(false);
          setSelectedRestaurant(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            {selectedRestaurant && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                    {selectedRestaurant.name}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setShowRestaurantModal(false);
                      setSelectedRestaurant(null);
                    }}
                  >
                    <Ionicons
                      name="close"
                      size={24}
                      color={theme.colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalList}>
                  <Text
                    style={[
                      styles.restaurantAddress,
                      { color: theme.colors.text },
                    ]}
                  >
                    {selectedRestaurant.address}
                  </Text>

                  <View style={styles.restaurantDetails}>
                    {selectedRestaurant.distanceKm && (
                      <Text style={[styles.detailText, { color: theme.colors.primary }]}>
                        📍 {selectedRestaurant.distanceKm.toFixed(2)} km away
                      </Text>
                    )}

                    <Text
                      style={[
                        styles.detailText,
                        {
                          color: selectedRestaurant.isOpen
                            ? '#10B981'
                            : '#EF4444',
                        },
                      ]}
                    >
                      {selectedRestaurant.isOpen ? '🟢 Open' : '🔴 Closed'}
                    </Text>

                    {selectedRestaurant.rating && (
                      <Text
                        style={[
                          styles.detailText,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        ⭐ {selectedRestaurant.rating}/5 (
                        {selectedRestaurant.ratingCount || 0} reviews)
                      </Text>
                    )}
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Debug Panel */}
      {renderDebugPanel()}
      </View>
    </CommonView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  map: {
    flex: 1,
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
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusBadgeActive: {
    backgroundColor: '#10B981',
  },
  statusBadgeInactive: {
    backgroundColor: '#6B7280',
  },
  statusBadgeInitializing: {
    backgroundColor: '#3B82F6',
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  debugButton: {
    padding: 8,
  },
  errorBanner: {
    position: 'absolute',
    top: 130,
    left: 20,
    right: 20,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  restaurantMarker: {
    backgroundColor: '#10B981',
  },
  customerMarker: {
    backgroundColor: '#EF4444',
  },
  restaurantLocationMarker: {
    backgroundColor: '#F59E0B',
  },
  driverMarker: {
    backgroundColor: '#3B82F6',
  },
  directionsPanel: {
    position: 'absolute',
    top: 140,
    left: 20,
    right: 20,
    maxHeight: height * 0.4,
    borderRadius: 12,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  directionsPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  routeDistance: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  routeDuration: {
    fontSize: 14,
    fontWeight: '500',
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
  deliveryCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 16,
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  deliveryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  deliveryInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  deliveryAddress: {
    fontSize: 13,
    lineHeight: 18,
  },
  deliveryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  secondaryButton: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  successButton: {
    backgroundColor: '#10B981',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
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
  modalList: {
    padding: 16,
  },
  deliveryItem: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  deliveryItemContent: {
    flex: 1,
  },
  deliveryItemName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  deliveryItemAddress: {
    fontSize: 12,
    lineHeight: 16,
  },
  deliveryItemMeta: {
    alignItems: 'flex-end',
  },
  deliveryDistance: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  restaurantAddress: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  restaurantDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailText: {
    fontSize: 13,
    fontWeight: '500',
  },
  debugOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  debugPanel: {
    flex: 1,
    marginTop: 60,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
  },
  debugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  debugTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  debugContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  debugSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 12,
  },
  debugItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  debugLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  debugValue: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  debugError: {
    paddingVertical: 8,
    marginBottom: 8,
  },
  debugErrorCode: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  debugErrorMessage: {
    fontSize: 11,
    marginTop: 2,
  },
  debugConfigSection: {
    marginVertical: 16,
    paddingBottom: 40,
  },
  debugConfigText: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 14,
  },
});
