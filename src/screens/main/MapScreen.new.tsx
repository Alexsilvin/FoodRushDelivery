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
  Linking,
  Platform,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { riderAPI } from '../../services/api';
import { useRoute, useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

interface DeliveryLocation {
  id: string;
  customerName: string;
  address: string;
  lat: number;
  lng: number;
  status: 'pending' | 'accepted' | 'picked_up' | 'delivered';
  distance: string;
  estimatedTime: string;
  restaurant: string;
  payment: string;
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

interface MapScreenProps {
  navigation: any;
  route: any;
}

const MapScreen: React.FC<MapScreenProps> = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const navigation = useNavigation();
  const routeParams = useRoute();
  const [deliveries, setDeliveries] = useState<DeliveryLocation[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryLocation | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [activeDirections, setActiveDirections] = useState<DirectionsRoute | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);

  // Calculate route between points
  const getDirections = useCallback(async (
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number }
  ): Promise<DirectionsRoute | null> => {
    try {
      // Generate points for a straight line route
      const coordinates = [];
      const steps = 10;
      for (let i = 0; i <= steps; i++) {
        coordinates.push({
          latitude: origin.latitude + (destination.latitude - origin.latitude) * (i / steps),
          longitude: origin.longitude + (destination.longitude - origin.longitude) * (i / steps)
        });
      }

      // Calculate approximate distance
      const R = 6371; // Earth's radius in km
      const dLat = (destination.latitude - origin.latitude) * Math.PI / 180;
      const dLon = (destination.longitude - origin.longitude) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(origin.latitude * Math.PI / 180) * Math.cos(destination.latitude * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      const duration = Math.ceil(distance * 3); // Rough estimate: 20 km/h average speed

      return {
        coordinates,
        distance: `${distance.toFixed(1)} km`,
        duration: `${duration} min`,
        steps: [{
          instruction: 'Follow route to destination',
          distance: `${distance.toFixed(1)} km`,
          duration: `${duration} min`,
          maneuver: 'straight'
        }],
        summary: 'Direct route'
      };
    } catch (e) {
      console.error('Error calculating route:', e);
      return null;
    }
  }, []);

  const startNavigation = useCallback((client: DeliveryLocation) => {
    // Open device's default navigation app
    const scheme = Platform.select({ ios: 'maps://0,0?q=', android: 'google.navigation:q=' });
    const latLng = `${client.lat},${client.lng}`;
    const label = encodeURIComponent(client.address);
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });

    if (url) {
      Linking.canOpenURL(url).then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert(t('error'), t('cannotOpenMaps'));
        }
      });
    }
  }, [t]);

  const calculateRouteToClient = useCallback(async (client: DeliveryLocation) => {
    if (!currentLocation) {
      Alert.alert(t('error'), t('locationNotAvailable'));
      return;
    }

    setIsCalculatingRoute(true);
    
    try {
      // Focus map on the selected delivery location
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: client.lat,
          longitude: client.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      }

      const route = await getDirections(
        {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude
        },
        {
          latitude: client.lat,
          longitude: client.lng
        }
      );

      if (!route) {
        throw new Error('Failed to calculate route');
      }

      setActiveDirections(route);
      setRouteCoordinates(route.coordinates);

      // Show route summary
      Alert.alert(
        t('routeCalculated'),
        `${t('totalDistance')}: ${route.distance}\n${t('estimatedTime')}: ${route.duration}`,
        [
          { text: t('cancel'), style: 'cancel' },
          { text: t('startNavigation'), onPress: () => startNavigation(client) }
        ]
      );
    } catch (error) {
      console.error('Route calculation error:', error);
      Alert.alert(t('error'), t('routeCalculationError'));
    } finally {
      setIsCalculatingRoute(false);
    }
  }, [currentLocation, getDirections, t, startNavigation]);

  const loadDeliveries = useCallback(async () => {
    try {
      const response = await riderAPI.getCurrentDeliveries();
      if (response.data && Array.isArray(response.data)) {
        const mappedDeliveries = response.data.map(delivery => ({
          id: delivery.id,
          customerName: delivery.customer?.name || t('unknownCustomer'),
          address: delivery.delivery_address || '',
          lat: parseFloat(delivery.delivery_latitude) || 0,
          lng: parseFloat(delivery.delivery_longitude) || 0,
          status: (delivery.status as 'pending' | 'accepted' | 'picked_up' | 'delivered') || 'pending',
          distance: delivery.distance || '0 km',
          estimatedTime: delivery.estimated_time || '0 min',
          restaurant: (typeof delivery.restaurant === 'object' && delivery.restaurant) ? 
            (delivery.restaurant as any).name || '' : 
            delivery.restaurant || '',
          payment: `$${delivery.total || 0}`
        }));
        setDeliveries(mappedDeliveries);
      }
    } catch (error) {
      console.error('Error loading deliveries:', error);
    }
  }, [t]);

  // Initialize location tracking
  useEffect(() => {
    const init = async () => {
      try {
        setLocationError(null);
        
        const isLocationEnabled = await Location.hasServicesEnabledAsync();
        if (!isLocationEnabled) {
          throw new Error(t('locationServicesDisabled'));
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          throw new Error(t('locationPermissionDenied'));
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });

        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });

        // Focus map on current location
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01
          }, 1000);
        }

        setLoading(false);
      } catch (error) {
        console.error('Location init error:', error);
        setLocationError(error instanceof Error ? error.message : t('locationError'));
        setLoading(false);
      }
    };

    init();
  }, [t]);

  // Load deliveries when location is available
  useEffect(() => {
    if (currentLocation) {
      loadDeliveries();
      const interval = setInterval(loadDeliveries, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [currentLocation, loadDeliveries]);

  // Render loading screen
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  // Render location error
  if (locationError) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="warning" size={48} color={theme.colors.error} />
        <Text style={styles.errorText}>{locationError}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.replace('Map')}
        >
          <Text style={styles.retryButtonText}>{t('retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation
        showsMyLocationButton
        initialRegion={currentLocation ? {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01
        } : undefined}
      >
        {deliveries.map((delivery) => (
          <Marker
            key={delivery.id}
            coordinate={{
              latitude: delivery.lat,
              longitude: delivery.lng
            }}
            title={delivery.customerName}
            description={delivery.address}
            pinColor={delivery.status === 'picked_up' ? 'green' : 'red'}
            onPress={() => setSelectedDelivery(delivery)}
          />
        ))}

        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeWidth={3}
            strokeColor={theme.colors.primary}
          />
        )}
      </MapView>

      {selectedDelivery && (
        <View style={[styles.bottomSheet, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.bottomSheetContent}>
            <View style={styles.deliveryInfo}>
              <Text style={styles.customerName}>{selectedDelivery.customerName}</Text>
              <Text style={styles.address}>{selectedDelivery.address}</Text>
              <Text style={styles.details}>
                {selectedDelivery.distance} • {selectedDelivery.estimatedTime} • {selectedDelivery.payment}
              </Text>
            </View>

            <View style={styles.actionButtons}>
              {!isCalculatingRoute && !activeDirections && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => calculateRouteToClient(selectedDelivery)}
                >
                  <Ionicons name="map" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>{t('calculateRoute')}</Text>
                </TouchableOpacity>
              )}

              {isCalculatingRoute && (
                <View style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>{t('calculating')}</Text>
                </View>
              )}

              {activeDirections && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.colors.success }]}
                  onPress={() => startNavigation(selectedDelivery)}
                >
                  <Ionicons name="navigate" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>{t('startNavigation')}</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setSelectedDelivery(null);
                setActiveDirections(null);
                setRouteCoordinates([]);
              }}
            >
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  bottomSheetContent: {
    padding: 20,
  },
  deliveryInfo: {
    marginBottom: 15,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  address: {
    fontSize: 14,
    marginTop: 4,
  },
  details: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
  },
});

export default MapScreen;
