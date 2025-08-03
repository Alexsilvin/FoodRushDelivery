import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

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

interface Route {
  id: string;
  name: string;
  distance: string;
  duration: string;
  stops: DeliveryLocation[];
  coordinates: Array<{ latitude: number; longitude: number }>;
  isOptimal: boolean;
}

export default function MapScreen({ navigation }: any) {
  const [deliveries, setDeliveries] = useState<DeliveryLocation[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryLocation | null>(null);
  const [availableRoutes, setAvailableRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    initializeLocation();
    loadDeliveries();
  }, []);

  const initializeLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to show your position on the map');
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setLoading(false);
    } catch (error) {
      console.error('Error getting location:', error);
      // Use default location (New York City) if location fails
      setCurrentLocation({
        latitude: 40.7128,
        longitude: -74.0060,
      });
      setLoading(false);
    }
  };

  const loadDeliveries = () => {
    // Mock delivery locations with coordinates
    const mockDeliveries: DeliveryLocation[] = [
      {
        id: '1',
        customerName: 'Sarah Johnson',
        address: '123 Oak Street, Downtown',
        lat: 40.7589,
        lng: -73.9851,
        status: 'pending',
        distance: '2.5 km',
        estimatedTime: '25 min',
        restaurant: 'Pizza Palace',
        payment: '$12.50',
      },
      {
        id: '2',
        customerName: 'Mike Chen',
        address: '456 Elm Avenue, Midtown',
        lat: 40.7505,
        lng: -73.9934,
        status: 'accepted',
        distance: '1.8 km',
        estimatedTime: '20 min',
        restaurant: 'Burger Barn',
        payment: '$18.75',
      },
      {
        id: '3',
        customerName: 'Emma Davis',
        address: '789 Pine Road, Uptown',
        lat: 40.7831,
        lng: -73.9712,
        status: 'pending',
        distance: '3.2 km',
        estimatedTime: '30 min',
        restaurant: 'Sushi Spot',
        payment: '$15.25',
      },
    ];
    setDeliveries(mockDeliveries);
  };

  const generateRoutes = () => {
    // Mock route generation with different optimization strategies
    const routes: Route[] = [
      {
        id: 'optimal',
        name: 'Optimal Route',
        distance: '7.2 km',
        duration: '45 min',
        stops: [], // Will be populated with sorted deliveries
        isOptimal: true,
      },
      {
        id: 'shortest',
        name: 'Shortest Distance',
        distance: '6.8 km',
        duration: '52 min',
        stops: [],
        isOptimal: false,
      },
      {
        id: 'fastest',
        name: 'Fastest Time',
        distance: '8.1 km',
        duration: '38 min',
        stops: [],
        isOptimal: false,
      },
    ];
    setAvailableRoutes(routes);
    setSelectedRoute(routes[0]); // Default to optimal route
  };

  const handleDeliveryPress = (delivery: DeliveryLocation) => {
    setSelectedDelivery(delivery);
  };

  const handleStartNavigation = () => {
    if (selectedRoute && selectedRoute.stops.length > 0) {
      Alert.alert(
        'Start Navigation',
        `Start navigating the ${selectedRoute.name}? This will guide you through ${selectedRoute.stops.length} stops.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Start',
            onPress: () => {
              // Here you would integrate with a mapping service like Google Maps
              Alert.alert('Navigation Started', 'Opening navigation app...');
            },
          },
        ]
      );
    }
  };

  const renderDeliveryMarker = (delivery: DeliveryLocation, index: number) => (
    <TouchableOpacity
      key={delivery.id}
      style={[
        styles.deliveryMarker,
        delivery.status === 'accepted' && styles.acceptedMarker,
        selectedDelivery?.id === delivery.id && styles.selectedMarker,
      ]}
      onPress={() => handleDeliveryPress(delivery)}
    >
      <Text style={styles.markerText}>{index + 1}</Text>
      {delivery.status === 'accepted' && (
        <View style={styles.acceptedIndicator}>
          <Ionicons name="checkmark" size={12} color="#FFFFFF" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Delivery Routes</Text>
        <TouchableOpacity
          style={styles.routeButton}
          onPress={() => setShowRouteModal(true)}
        >
          <Ionicons name="map-outline" size={24} color="#1E40AF" />
          <Text style={styles.routeButtonText}>Routes</Text>
        </TouchableOpacity>
      </View>

      {/* Map Placeholder */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map" size={80} color="#9CA3AF" />
          <Text style={styles.mapPlaceholderText}>Interactive Map</Text>
          <Text style={styles.mapSubtext}>
            Map integration will show delivery locations and optimal routes
          </Text>
        </View>

        {/* Delivery Markers Overlay */}
        <View style={styles.markersContainer}>
          {deliveries.map((delivery, index) => renderDeliveryMarker(delivery, index))}
        </View>
      </View>

      {/* Selected Delivery Info */}
      {selectedDelivery && (
        <View style={styles.deliveryInfo}>
          <View style={styles.deliveryHeader}>
            <Text style={styles.deliveryCustomer}>{selectedDelivery.customerName}</Text>
            <Text style={styles.deliveryPayment}>{selectedDelivery.payment}</Text>
          </View>
          <Text style={styles.deliveryAddress}>{selectedDelivery.address}</Text>
          <View style={styles.deliveryMeta}>
            <Text style={styles.deliveryMetaText}>
              <Ionicons name="restaurant-outline" size={14} /> {selectedDelivery.restaurant}
            </Text>
            <Text style={styles.deliveryMetaText}>
              <Ionicons name="time-outline" size={14} /> {selectedDelivery.estimatedTime}
            </Text>
          </View>
        </View>
      )}

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.navigationButton}
          onPress={handleStartNavigation}
        >
          <Ionicons name="navigate" size={24} color="#FFFFFF" />
          <Text style={styles.navigationButtonText}>Start Navigation</Text>
        </TouchableOpacity>
      </View>

      {/* Route Selection Modal */}
      <Modal
        visible={showRouteModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose Route</Text>
            <TouchableOpacity onPress={() => setShowRouteModal(false)}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.routesList}>
            {availableRoutes.map((route) => (
              <TouchableOpacity
                key={route.id}
                style={[
                  styles.routeItem,
                  selectedRoute?.id === route.id && styles.selectedRouteItem,
                ]}
                onPress={() => {
                  setSelectedRoute(route);
                  setShowRouteModal(false);
                }}
              >
                <View style={styles.routeHeader}>
                  <Text style={styles.routeName}>{route.name}</Text>
                  {route.isOptimal && (
                    <View style={styles.optimalBadge}>
                      <Text style={styles.optimalBadgeText}>Recommended</Text>
                    </View>
                  )}
                </View>
                <View style={styles.routeStats}>
                  <Text style={styles.routeStat}>
                    <Ionicons name="car-outline" size={16} /> {route.distance}
                  </Text>
                  <Text style={styles.routeStat}>
                    <Ionicons name="time-outline" size={16} /> {route.duration}
                  </Text>
                </View>
                <Text style={styles.routeDescription}>
                  Includes {deliveries.length} delivery stops
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  routeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#EBF4FF',
    borderRadius: 8,
  },
  routeButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    margin: 16,
    borderRadius: 12,
  },
  mapPlaceholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6B7280',
    marginTop: 16,
  },
  mapSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  markersContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  deliveryMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  acceptedMarker: {
    backgroundColor: '#10B981',
  },
  selectedMarker: {
    backgroundColor: '#1E40AF',
    transform: [{ scale: 1.2 }],
  },
  markerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  acceptedIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deliveryInfo: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  deliveryCustomer: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  deliveryPayment: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  deliveryAddress: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 12,
  },
  deliveryMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deliveryMetaText: {
    fontSize: 14,
    color: '#6B7280',
  },
  bottomActions: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  navigationButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E40AF',
    paddingVertical: 16,
    borderRadius: 12,
  },
  navigationButtonText: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  routesList: {
    flex: 1,
    padding: 20,
  },
  routeItem: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedRouteItem: {
    backgroundColor: '#EBF4FF',
    borderColor: '#1E40AF',
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  optimalBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  optimalBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  routeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  routeStat: {
    fontSize: 14,
    color: '#6B7280',
  },
  routeDescription: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
