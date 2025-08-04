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
    const generateRoutes = (deliveryList: DeliveryLocation[], userLocation?: { latitude: number; longitude: number } | null) => {
      // Generate sample route coordinates (in real app, you'd use Google Directions API)
      const generateRouteCoordinates = (stops: DeliveryLocation[]) => {
        const coords = [];
        if (userLocation) {
          coords.push(userLocation);
        }
        stops.forEach(stop => {
          coords.push({ latitude: stop.lat, longitude: stop.lng });
        });
        return coords;
      };

      const routes: Route[] = [
        {
          id: 'optimal',
          name: 'Optimal Route',
          distance: '7.2 km',
          duration: '45 min',
          stops: deliveryList.slice().sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance)),
          coordinates: generateRouteCoordinates(deliveryList),
          isOptimal: true,
        },
        {
          id: 'shortest',
          name: 'Shortest Distance',
          distance: '6.8 km',
          duration: '52 min',
          stops: deliveryList.slice().sort((a, b) => a.customerName.localeCompare(b.customerName)),
          coordinates: generateRouteCoordinates(deliveryList),
          isOptimal: false,
        },
        {
          id: 'fastest',
          name: 'Fastest Time',
          distance: '8.1 km',
          duration: '38 min',
          stops: deliveryList.slice().sort((a, b) => parseFloat(a.estimatedTime) - parseFloat(b.estimatedTime)),
          coordinates: generateRouteCoordinates(deliveryList),
          isOptimal: false,
        },
      ];

      setAvailableRoutes(routes);
      setSelectedRoute(routes[0]); // Select optimal route by default
    };

    const loadDeliveries = () => {
      // Mock delivery locations with real coordinates around New York City
      const mockDeliveries: DeliveryLocation[] = [
        {
          id: '1',
          customerName: 'Emma Davis',
          address: '123 Broadway, New York, NY',
          lat: 40.7589,
          lng: -73.9851,
          status: 'accepted',
          distance: '1.2 km',
          estimatedTime: '15 min',
          restaurant: 'Sushi Spot',
          payment: '$25.50',
        },
        {
          id: '2',
          customerName: 'John Smith',
          address: '456 5th Avenue, New York, NY',
          lat: 40.7505,
          lng: -73.9934,
          status: 'pending',
          distance: '2.1 km',
          estimatedTime: '12 min',
          restaurant: 'Taco Bell',
          payment: '$18.75',
        },
        {
          id: '3',
          customerName: 'Sarah Johnson',
          address: '789 Madison Avenue, New York, NY',
          lat: 40.7614,
          lng: -73.9776,
          status: 'picked_up',
          distance: '0.8 km',
          estimatedTime: '8 min',
          restaurant: 'Pizza Palace',
          payment: '$32.25',
        },
        {
          id: '4',
          customerName: 'Mike Chen',
          address: '321 Park Avenue, New York, NY',
          lat: 40.7549,
          lng: -73.9707,
          status: 'pending',
          distance: '1.7 km',
          estimatedTime: '20 min',
          restaurant: 'Burger King',
          payment: '$22.00',
        },
      ];

      setDeliveries(mockDeliveries);
      return mockDeliveries;
    };

    const init = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required to show your position on the map');
          // Use default location (New York City) if permission denied
          const defaultLocation = {
            latitude: 40.7128,
            longitude: -74.0060,
          };
          setCurrentLocation(defaultLocation);
          setLoading(false);
          const mockDeliveries = loadDeliveries();
          generateRoutes(mockDeliveries, defaultLocation);
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10000,
        });
        const userLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setCurrentLocation(userLocation);
        setLoading(false);
        const mockDeliveries = loadDeliveries();
        generateRoutes(mockDeliveries, userLocation);
      } catch (error) {
        console.error('Error getting location:', error);
        // Use default location (New York City) if location fails
        const defaultLocation = {
          latitude: 40.7128,
          longitude: -74.0060,
        };
        setCurrentLocation(defaultLocation);
        setLoading(false);
        const mockDeliveries = loadDeliveries();
        generateRoutes(mockDeliveries, defaultLocation);
      }
    };

    init();
  }, []); // Remove currentLocation dependency to prevent infinite loop

  const loadDeliveries = () => {
    // Mock delivery locations with real coordinates around New York City
    const mockDeliveries: DeliveryLocation[] = [
      {
        id: '1',
        customerName: 'Emma Davis',
        address: '123 Broadway, New York, NY',
        lat: 40.7589,
        lng: -73.9851,
        status: 'accepted',
        distance: '1.2 km',
        estimatedTime: '15 min',
        restaurant: 'Sushi Spot',
        payment: '$25.50',
      },
      {
        id: '2',
        customerName: 'John Smith',
        address: '456 5th Avenue, New York, NY',
        lat: 40.7505,
        lng: -73.9934,
        status: 'pending',
        distance: '2.1 km',
        estimatedTime: '12 min',
        restaurant: 'Taco Bell',
        payment: '$18.75',
      },
      {
        id: '3',
        customerName: 'Sarah Johnson',
        address: '789 Madison Avenue, New York, NY',
        lat: 40.7614,
        lng: -73.9776,
        status: 'picked_up',
        distance: '0.8 km',
        estimatedTime: '8 min',
        restaurant: 'Pizza Palace',
        payment: '$32.25',
      },
      {
        id: '4',
        customerName: 'Mike Chen',
        address: '321 Park Avenue, New York, NY',
        lat: 40.7549,
        lng: -73.9707,
        status: 'pending',
        distance: '1.7 km',
        estimatedTime: '20 min',
        restaurant: 'Burger King',
        payment: '$22.00',
      },
    ];

    setDeliveries(mockDeliveries);
    generateRoutes(mockDeliveries);
  };

  const generateRoutes = (deliveryList: DeliveryLocation[]) => {
    // Generate sample route coordinates (in real app, you'd use Google Directions API)
    const generateRouteCoordinates = (stops: DeliveryLocation[]) => {
      const coords = [];
      if (currentLocation) {
        coords.push(currentLocation);
      }
      stops.forEach(stop => {
        coords.push({ latitude: stop.lat, longitude: stop.lng });
      });
      return coords;
    };

    const routes: Route[] = [
      {
        id: 'optimal',
        name: 'Optimal Route',
        distance: '7.2 km',
        duration: '45 min',
        stops: deliveryList.slice().sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance)),
        coordinates: generateRouteCoordinates(deliveryList),
        isOptimal: true,
      },
      {
        id: 'shortest',
        name: 'Shortest Distance',
        distance: '6.8 km',
        duration: '52 min',
        stops: deliveryList.slice().sort((a, b) => a.customerName.localeCompare(b.customerName)),
        coordinates: generateRouteCoordinates(deliveryList),
        isOptimal: false,
      },
      {
        id: 'fastest',
        name: 'Fastest Time',
        distance: '8.1 km',
        duration: '38 min',
        stops: deliveryList.slice().sort((a, b) => parseFloat(a.estimatedTime) - parseFloat(b.estimatedTime)),
        coordinates: generateRouteCoordinates(deliveryList),
        isOptimal: false,
      },
    ];

    setAvailableRoutes(routes);
    setSelectedRoute(routes[0]); // Select optimal route by default
  };

  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FCD34D';
      case 'accepted': return '#60A5FA';
      case 'picked_up': return '#34D399';
      case 'delivered': return '#9CA3AF';
      default: return '#EF4444';
    }
  };

  const selectRoute = (route: Route) => {
    setSelectedRoute(route);
    setShowRouteModal(false);
    
    // Fit map to show all markers in the route
    if (mapRef.current && route.coordinates.length > 0) {
      mapRef.current.fitToCoordinates(route.coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  };

  const startNavigation = (delivery: DeliveryLocation) => {
    Alert.alert(
      'Start Navigation',
      `Navigate to ${delivery.customerName} at ${delivery.address}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Maps',
          onPress: () => {
            // In a real app, you'd open the device's navigation app
            const url = `http://maps.google.com/maps?daddr=${delivery.lat},${delivery.lng}`;
            // Linking.openURL(url);
            Alert.alert('Navigation', 'Would open navigation to the delivery location');
          },
        },
      ]
    );
  };

  const centerOnLocation = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E40AF" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Google Maps */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: currentLocation?.latitude || 40.7128,
          longitude: currentLocation?.longitude || -74.0060,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsTraffic={true}
      >
        {/* Current Location Marker */}
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="Your Location"
            description="Driver Location"
            pinColor="#1E40AF"
          />
        )}

        {/* Delivery Markers */}
        {deliveries.map((delivery) => (
          <Marker
            key={delivery.id}
            coordinate={{ latitude: delivery.lat, longitude: delivery.lng }}
            title={delivery.customerName}
            description={`${delivery.restaurant} - ${delivery.payment}`}
            pinColor={getMarkerColor(delivery.status)}
            onPress={() => setSelectedDelivery(delivery)}
          />
        ))}

        {/* Route Polyline */}
        {selectedRoute && selectedRoute.coordinates.length > 1 && (
          <Polyline
            coordinates={selectedRoute.coordinates}
            strokeColor="#1E40AF"
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* Control Buttons */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.controlButton} onPress={centerOnLocation}>
          <Ionicons name="locate" size={24} color="#1E40AF" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.controlButton, styles.routeButton]} 
          onPress={() => setShowRouteModal(true)}
        >
          <Ionicons name="map" size={24} color="#FFFFFF" />
          <Text style={styles.routeButtonText}>Routes</Text>
        </TouchableOpacity>
      </View>

      {/* Selected Delivery Info */}
      {selectedDelivery && (
        <View style={styles.deliveryInfo}>
          <View style={styles.deliveryHeader}>
            <View>
              <Text style={styles.deliveryName}>{selectedDelivery.customerName}</Text>
              <Text style={styles.deliveryAddress}>{selectedDelivery.address}</Text>
              <Text style={styles.deliveryDetails}>
                {selectedDelivery.restaurant} • {selectedDelivery.distance} • {selectedDelivery.estimatedTime}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedDelivery(null)}
            >
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.deliveryActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => startNavigation(selectedDelivery)}
            >
              <Ionicons name="navigate" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Navigate</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.callButton]}
              onPress={() => Alert.alert('Call', `Call ${selectedDelivery.customerName}?`)}
            >
              <Ionicons name="call" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Call</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Route Selection Modal */}
      <Modal
        visible={showRouteModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRouteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Route</Text>
              <TouchableOpacity onPress={() => setShowRouteModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
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
                  onPress={() => selectRoute(route)}
                >
                  <View style={styles.routeHeader}>
                    <View style={styles.routeInfo}>
                      <Text style={styles.routeName}>{route.name}</Text>
                      {route.isOptimal && (
                        <View style={styles.optimalBadge}>
                          <Text style={styles.optimalText}>OPTIMAL</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.routeStats}>
                      <Text style={styles.routeDistance}>{route.distance}</Text>
                      <Text style={styles.routeDuration}>{route.duration}</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.stopsCount}>
                    {route.stops.length} stops
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  map: {
    flex: 1,
  },
  controlsContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    gap: 10,
  },
  controlButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeButton: {
    backgroundColor: '#1E40AF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  routeButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  deliveryInfo: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  deliveryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  deliveryAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  deliveryDetails: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  closeButton: {
    padding: 4,
  },
  deliveryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#1E40AF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  callButton: {
    backgroundColor: '#10B981',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  routesList: {
    padding: 20,
  },
  routeItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedRouteItem: {
    borderColor: '#1E40AF',
    backgroundColor: '#EFF6FF',
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  optimalBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  optimalText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  routeStats: {
    alignItems: 'flex-end',
  },
  routeDistance: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  routeDuration: {
    fontSize: 14,
    color: '#6B7280',
  },
  stopsCount: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
