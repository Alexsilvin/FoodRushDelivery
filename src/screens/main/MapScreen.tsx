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
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useRoute } from '@react-navigation/native';

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

export default function MapScreen({ navigation, route }: any) {
  const { theme } = useTheme();
  const routeParams = useRoute();
  const [deliveries, setDeliveries] = useState<DeliveryLocation[]>([]);
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
  const mapRef = useRef<MapView>(null);

  // Check if we have a target location from navigation params
  const targetLocation = (routeParams.params as any)?.targetLocation;
  const targetCustomerName = (routeParams.params as any)?.customerName;
  const targetAddress = (routeParams.params as any)?.address;

  // Google Directions API integration
  const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY'; // You'll need to add your API key

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

  const createDemoRoute = useCallback((
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number }
  ): DirectionsRoute => {
    // Create a simple route with some waypoints for demo
    const coordinates = [
      origin,
      {
        latitude: origin.latitude + (destination.latitude - origin.latitude) * 0.3,
        longitude: origin.longitude + (destination.longitude - origin.longitude) * 0.3,
      },
      {
        latitude: origin.latitude + (destination.latitude - origin.latitude) * 0.7,
        longitude: origin.longitude + (destination.longitude - origin.longitude) * 0.7,
      },
      destination,
    ];

    // Calculate approximate distance
    const distance = calculateDistance(origin, destination);
    const distanceKm = (distance / 1000).toFixed(1);
    const estimatedTime = Math.ceil(distance / 800); // Rough estimate: 800m per minute in city traffic

    return {
      distance: `${distanceKm} km`,
      duration: `${estimatedTime} min`,
      coordinates,
      steps: [
        {
          instruction: 'Head northeast on current street',
          distance: '0.2 km',
          duration: '1 min',
          maneuver: 'turn-right'
        },
        {
          instruction: `Continue straight`,
          distance: `${(parseFloat(distanceKm) - 0.2).toFixed(1)} km`,
          duration: `${estimatedTime - 1} min`,
          maneuver: 'continue'
        },
        {
          instruction: 'Arrive at destination',
          distance: '0 km',
          duration: '0 min',
          maneuver: 'arrive'
        }
      ],
      summary: `Fastest route to destination`
    };
  }, [calculateDistance]);

  const getDirections = useCallback(async (
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number }
  ): Promise<DirectionsRoute | null> => {
    try {
      const originStr = `${origin.latitude},${origin.longitude}`;
      const destinationStr = `${destination.latitude},${destination.longitude}`;
      
      // For demo purposes, we'll simulate Google Directions API response
      // In production, uncomment the actual API call below
      
      /*
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}&key=${GOOGLE_MAPS_API_KEY}&mode=driving&alternatives=true&traffic_model=best_guess&departure_time=now`
      );
      
      const data = await response.json();
      
      if (data.status !== 'OK' || !data.routes.length) {
        throw new Error('No routes found');
      }
      
      const route = data.routes[0];
      const leg = route.legs[0];
      
      // Decode polyline
      const coordinates = decodePolyline(route.overview_polyline.points);
      
      // Extract steps
      const steps: DirectionsStep[] = leg.steps.map((step: any) => ({
        instruction: step.html_instructions.replace(/<[^>]*>/g, ''), // Remove HTML tags
        distance: step.distance.text,
        duration: step.duration.text,
        maneuver: step.maneuver || 'continue'
      }));
      
      return {
        distance: leg.distance.text,
        duration: leg.duration.text,
        coordinates,
        steps,
        summary: route.summary
      };
      */
      
      // Demo implementation - replace with actual API call
      return createDemoRoute(origin, destination);
      
    } catch (error) {
      console.error('Directions API error:', error);
      return null;
    }
  }, [createDemoRoute]);

  const startNavigation = useCallback((client: DeliveryLocation) => {
    // Open device's default navigation app
    const url = `maps://app?daddr=${client.lat},${client.lng}`;
    const androidUrl = `google.navigation:q=${client.lat},${client.lng}`;
    
    Alert.alert(
      'Start Navigation',
      'This will open your device\'s navigation app',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Maps', 
          onPress: () => {
            // In a real app, you'd use Linking.openURL() here
            console.log('Opening navigation to:', client.address);
          }
        }
      ]
    );
  }, []);

  const calculateRouteToClient = useCallback(async (client: DeliveryLocation) => {
    if (!currentLocation) {
      Alert.alert('Error', 'Current location not available');
      return;
    }

    setIsCalculatingRoute(true);
    setTargetClient(client);
    
    try {
      const directionsRoute = await getDirections(
        currentLocation,
        { latitude: client.lat, longitude: client.lng }
      );
      
      if (directionsRoute) {
        setActiveDirections(directionsRoute);
        setShowDirections(true);
        
        // Center map on route
        if (mapRef.current) {
          const allCoordinates = [
            currentLocation,
            ...directionsRoute.coordinates,
            { latitude: client.lat, longitude: client.lng }
          ];
          
          mapRef.current.fitToCoordinates(allCoordinates, {
            edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
            animated: true,
          });
        }
        
        Alert.alert(
          'Route Calculated',
          `Distance: ${directionsRoute.distance}\nEstimated time: ${directionsRoute.duration}`,
          [
            { text: 'Start Navigation', onPress: () => startNavigation(client) },
            { text: 'OK', style: 'default' }
          ]
        );
      }
    } catch (error) {
      console.error('Error calculating route:', error);
      Alert.alert('Error', 'Could not calculate route. Please try again.');
    } finally {
      setIsCalculatingRoute(false);
    }
  }, [currentLocation, getDirections, startNavigation]);

  // Check if a specific client was passed from Dashboard for navigation
  useEffect(() => {
    if (route?.params?.clientId) {
      const client = deliveries.find(d => d.id === route.params.clientId);
      if (client && currentLocation) {
        calculateRouteToClient(client);
      }
    }
  }, [route?.params?.clientId, deliveries, currentLocation, calculateRouteToClient]);

  // Handle target location from navigation params
  useEffect(() => {
    if (targetLocation && mapRef.current) {
      // Focus map on target location
      mapRef.current.animateToRegion({
        latitude: targetLocation.latitude,
        longitude: targetLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);

      // If we have current location, calculate route to target
      if (currentLocation) {
        getDirections(currentLocation, targetLocation);
      }
    }
  }, [targetLocation, currentLocation, getDirections]);

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
        setLocationError(null);
        
        // First check if location services are enabled
        const isLocationEnabled = await Location.hasServicesEnabledAsync();
        if (!isLocationEnabled) {
          throw new Error('Location services are disabled. Please enable location services in your device settings.');
        }

        // Request permissions with more specific handling
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Location permission denied. Please grant location permission to use the map.');
        }

        // Try multiple location methods with fallbacks
        let location = null;
        
        try {
          // First try with high accuracy
          location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
        } catch (highAccuracyError) {
          console.log('High accuracy failed, trying balanced accuracy:', highAccuracyError);
          
          try {
            // Try with balanced accuracy
            location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
          } catch (balancedError) {
            console.log('Balanced accuracy failed, trying low accuracy:', balancedError);
            
            try {
              // Last resort: try with low accuracy
              location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Low,
              });
            } catch (lowAccuracyError) {
              console.log('All accuracy levels failed, trying last location:', lowAccuracyError);
              
              // Try to get the last known location
              location = await Location.getLastKnownPositionAsync({
                requiredAccuracy: 1000, // Accept location within 1km accuracy
              });
            }
          }
        }
        
        if (!location) {
          throw new Error('Unable to obtain location after multiple attempts');
        }
        
        const userLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        
        console.log('Successfully obtained location:', userLocation);
        setCurrentLocation(userLocation);
        setLoading(false);
        
        // Load deliveries but don't generate routes automatically
        loadDeliveries();
        
        // Center map on user location
        if (mapRef.current && userLocation) {
          mapRef.current.animateToRegion({
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }, 1000);
        }
        
      } catch (error) {
        console.error('Error getting location:', error);
        setLocationError(error instanceof Error ? error.message : 'Failed to get location');
        
        // Use default location (New York City) if location fails
        const defaultLocation = {
          latitude: 40.7128,
          longitude: -74.0060,
        };
        setCurrentLocation(defaultLocation);
        setLoading(false);
        loadDeliveries();
        
        // Show user-friendly error message
        Alert.alert(
          'Location Error', 
          `Unable to get your current location. Using default location (New York City).\n\nTip: Make sure location services are enabled and try restarting the app.`,
          [{ text: 'OK' }]
        );
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

  // Driving Mode Functions
  const acceptDelivery = (delivery: DeliveryLocation) => {
    setActiveDelivery(delivery);
    setIsDrivingMode(true);
    setSelectedDelivery(delivery);
    
    // Generate route to this delivery
    if (currentLocation) {
      const routeCoords = generateSimpleRoute(currentLocation, {
        latitude: delivery.lat,
        longitude: delivery.lng
      });
      setRouteCoordinates(routeCoords);
      
      // Focus map on route
      if (mapRef.current) {
        mapRef.current.fitToCoordinates([
          { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
          { latitude: delivery.lat, longitude: delivery.lng }
        ], {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }
    }
  };

  const generateSimpleRoute = (
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number }
  ): Array<{ latitude: number; longitude: number }> => {
    // Simple route generation - in production, use Google Directions API
    const latStep = (destination.latitude - origin.latitude) / 20;
    const lngStep = (destination.longitude - origin.longitude) / 20;
    
    const coordinates = [];
    for (let i = 0; i <= 20; i++) {
      // Add some randomness to simulate real roads
      const randomLat = (Math.random() - 0.5) * 0.001;
      const randomLng = (Math.random() - 0.5) * 0.001;
      coordinates.push({
        latitude: origin.latitude + (latStep * i) + randomLat,
        longitude: origin.longitude + (lngStep * i) + randomLng,
      });
    }
    
    return coordinates;
  };

  const exitDrivingMode = () => {
    setIsDrivingMode(false);
    setActiveDelivery(null);
    setRouteCoordinates([]);
    setSelectedDelivery(null);
    
    // Reset map to user location
    if (mapRef.current && currentLocation) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  const handleDeliveryPress = (delivery: DeliveryLocation) => {
    if (!isDrivingMode) {
      // Show delivery options
      Alert.alert(
        'Accept Delivery',
        `Accept delivery to ${delivery.customerName}?\nAddress: ${delivery.address}\nPayment: ${delivery.payment}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Accept',
            onPress: () => acceptDelivery(delivery),
          },
        ]
      );
    } else {
      setSelectedDelivery(delivery);
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
        {locationError && (
          <Text style={styles.errorText}>{locationError}</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {isDrivingMode ? 'Driving Mode' : 'Map'}
        </Text>
        <View style={styles.headerActions}>
          {isDrivingMode && (
            <TouchableOpacity
              style={[styles.exitButton, { backgroundColor: theme.colors.error + '20' }]}
              onPress={exitDrivingMode}
            >
              <Ionicons name="close" size={20} color={theme.colors.error} />
              <Text style={[styles.exitButtonText, { color: theme.colors.error }]}>Exit</Text>
            </TouchableOpacity>
          )}
          {!isDrivingMode && (
            <TouchableOpacity
              style={styles.routeButton}
              onPress={() => setShowRouteModal(true)}
            >
              <Ionicons name="list-outline" size={20} color={theme.colors.primary} />
              <Text style={[styles.routeButtonText, { color: theme.colors.primary }]}>Deliveries</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Google Maps */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: currentLocation?.latitude || 40.7128,
          longitude: currentLocation?.longitude || -74.0060,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsTraffic={isDrivingMode}
        showsBuildings={true}
        mapType={theme.isDark ? 'standard' : 'standard'}
        userInterfaceStyle={theme.isDark ? 'dark' : 'light'}
      >
        {/* Show destination marker only in driving mode */}
        {isDrivingMode && activeDelivery && (
          <Marker
            coordinate={{
              latitude: activeDelivery.lat,
              longitude: activeDelivery.lng,
            }}
            title={activeDelivery.customerName}
            description={activeDelivery.address}
            pinColor={theme.colors.error}
          />
        )}

        {/* Show route polyline in driving mode */}
        {isDrivingMode && routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={theme.colors.primary}
            strokeWidth={4}
            lineDashPattern={[1]}
          />
        )}

        {/* Show all delivery markers only when NOT in driving mode */}
        {!isDrivingMode && deliveries.map((delivery) => (
          <Marker
            key={delivery.id}
            coordinate={{ latitude: delivery.lat, longitude: delivery.lng }}
            title={delivery.customerName}
            description={`${delivery.restaurant} - ${delivery.payment}`}
            pinColor={getMarkerColor(delivery.status)}
            onPress={() => handleDeliveryPress(delivery)}
          />
        ))}

        {/* Target Location Marker (from navigation params) */}
        {targetLocation && (
          <Marker
            coordinate={targetLocation}
            title={targetCustomerName || "Target Location"}
            description={targetAddress || "Delivery Address"}
            pinColor="#FF6B6B"
          />
        )}
      </MapView>

      {/* Control Buttons */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={[styles.controlButton, { backgroundColor: theme.colors.surface }]} 
          onPress={centerOnLocation}
        >
          <Ionicons name="locate" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.controlButton, styles.routeButton, { backgroundColor: theme.colors.primary }]} 
          onPress={() => setShowRouteModal(true)}
        >
          <Ionicons name="map" size={24} color="#FFFFFF" />
          <Text style={styles.routeButtonText}>Routes</Text>
        </TouchableOpacity>
      </View>

      {/* Selected Delivery Info */}
      {selectedDelivery && (
        <View style={[styles.deliveryInfo, { backgroundColor: theme.colors.card }]}>
          <View style={styles.deliveryHeader}>
            <View>
              <Text style={[styles.deliveryName, { color: theme.colors.text }]}>
                {selectedDelivery.customerName}
              </Text>
              <Text style={[styles.deliveryAddress, { color: theme.colors.text }]}>
                {selectedDelivery.address}
              </Text>
              <Text style={[styles.deliveryDetails, { color: theme.colors.textSecondary }]}>
                {selectedDelivery.restaurant} • {selectedDelivery.distance} • {selectedDelivery.estimatedTime}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedDelivery(null)}
            >
              <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.deliveryActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
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
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Available Deliveries</Text>
              <TouchableOpacity onPress={() => setShowRouteModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.routesList}>
              {deliveries.map((delivery) => (
                <TouchableOpacity
                  key={delivery.id}
                  style={[
                    styles.routeItem,
                    { backgroundColor: theme.colors.card },
                  ]}
                  onPress={() => {
                    setShowRouteModal(false);
                    handleDeliveryPress(delivery);
                  }}
                >
                  <View style={styles.routeHeader}>
                    <View style={styles.routeInfo}>
                      <Text style={[styles.routeName, { color: theme.colors.text }]}>{delivery.customerName}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: getMarkerColor(delivery.status) }]}>
                        <Text style={styles.statusText}>{delivery.status.toUpperCase()}</Text>
                      </View>
                    </View>
                    <View style={styles.routeStats}>
                      <Text style={[styles.routeDistance, { color: theme.colors.primary }]}>
                        {delivery.distance}
                      </Text>
                      <Text style={[styles.routeDuration, { color: theme.colors.textSecondary }]}>
                        {delivery.estimatedTime}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.deliveryAddress, { color: theme.colors.textSecondary }]}>
                    {delivery.address}
                  </Text>
                  <Text style={[styles.restaurantName, { color: theme.colors.text }]}>
                    {delivery.restaurant} • {delivery.payment}
                  </Text>
                  
                  <Text style={[styles.stopsCount, { color: theme.colors.textSecondary }]}>
                    Status: {delivery.status}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  exitButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
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
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  map: {
    flex: 1,
  },
  controlsContainer: {
    position: 'absolute',
    top: 120,
    right: 20,
    gap: 10,
  },
  controlButton: {
    borderRadius: 25,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  },
  deliveryInfo: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
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
  },
  deliveryAddress: {
    fontSize: 14,
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
  },
  routesList: {
    padding: 20,
  },
  routeItem: {
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
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  restaurantName: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
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
  },
  routeDuration: {
    fontSize: 14,
  },
  stopsCount: {
    fontSize: 12,
  },
});
