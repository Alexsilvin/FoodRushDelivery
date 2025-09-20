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
import { useCall } from '../../contexts/CallContext';
import { riderAPI } from '../../services/api';
import { GOOGLE_MAPS_API_KEY } from '../../config/env';
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
  const { startCall } = useCall();
  const routeParams = useRoute();
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
  const mapRef = useRef<MapView>(null);

  // Check if we have a target location from navigation params
  const targetLocation = (routeParams.params as any)?.targetLocation;
  const targetCustomerName = (routeParams.params as any)?.customerName;
  const targetAddress = (routeParams.params as any)?.address;

  // Google Directions API integration
  const GOOGLE_MAPS_API_KEY = 'AIzaSyAYc29K0OTxkOfBxHgJNVPrPMvkakqcr18'; // You'll need to add your API key

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
    // Enhanced route algorithm that simulates real road networks
    const coordinates = [];
    
    // Start from origin
    coordinates.push(origin);
    
    // Calculate the difference in coordinates
    const latDiff = destination.latitude - origin.latitude;
    const lngDiff = destination.longitude - origin.longitude;
    
    // Create waypoints that simulate following roads (grid-like movement)
    const numberOfSegments = 15;
    
    for (let i = 1; i < numberOfSegments; i++) {
      const progress = i / numberOfSegments;
      
      // Add some road-like variation - alternate between lat and lng movement
      let lat, lng;
      
      if (i % 3 === 0) {
        // Move more in latitude direction (simulating north-south roads)
        lat = origin.latitude + (latDiff * progress);
        lng = origin.longitude + (lngDiff * (progress * 0.7));
      } else if (i % 3 === 1) {
        // Move more in longitude direction (simulating east-west roads)
        lat = origin.latitude + (latDiff * (progress * 0.7));
        lng = origin.longitude + (lngDiff * progress);
      } else {
        // Diagonal movement
        lat = origin.latitude + (latDiff * progress);
        lng = origin.longitude + (lngDiff * progress);
      }
      
      // Add slight randomness to simulate real road curves
      const roadVariation = 0.0005;
      lat += (Math.random() - 0.5) * roadVariation;
      lng += (Math.random() - 0.5) * roadVariation;
      
      coordinates.push({ latitude: lat, longitude: lng });
    }
    
    // End at destination
    coordinates.push(destination);

    // Calculate more accurate distance and time
    let totalDistance = 0;
    for (let i = 0; i < coordinates.length - 1; i++) {
      totalDistance += calculateDistance(coordinates[i], coordinates[i + 1]);
    }
    
    const distanceKm = (totalDistance / 1000).toFixed(1);
    // More realistic time calculation: city traffic average 20-30 km/h
    const estimatedTimeMinutes = Math.ceil(totalDistance / 400); // 400m per minute = 24 km/h average
    
    // Generate step-by-step directions
    const steps: DirectionsStep[] = [];
    const segmentDistance = totalDistance / (coordinates.length - 1);
    
    // First step
    steps.push({
      instruction: 'Head toward your destination',
      distance: `${(segmentDistance * 3 / 1000).toFixed(1)} km`,
      duration: `${Math.ceil(segmentDistance * 3 / 400)} min`,
      maneuver: 'start'
    });
    
    // Middle steps
    if (coordinates.length > 4) {
      steps.push({
        instruction: 'Continue straight',
        distance: `${(segmentDistance * (coordinates.length - 6) / 1000).toFixed(1)} km`,
        duration: `${Math.ceil(segmentDistance * (coordinates.length - 6) / 400)} min`,
        maneuver: 'continue'
      });
    }
    
    // Final step
    steps.push({
      instruction: 'Arrive at destination',
      distance: '0 km',
      duration: '0 min',
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

  const decodePolyline = (poly: string) => {
    let index = 0, len = poly.length; let lat = 0, lng = 0; const coords: { latitude:number; longitude:number }[] = [];
    while (index < len) {
      let b, shift = 0, result = 0; do { b = poly.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1)); lat += dlat;
      shift = 0; result = 0; do { b = poly.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1)); lng += dlng;
      coords.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return coords;
  };

  const getDirections = useCallback(async (
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number }
  ): Promise<DirectionsRoute | null> => {
    try {
  const key = String(GOOGLE_MAPS_API_KEY || '');
  if (!key || ['DEMO_KEY','CHANGE_ME_ADD_REAL_KEY','YOUR_GOOGLE_MAPS_API_KEY'].includes(key)) {
        return createDemoRoute(origin, destination);
      }
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${key}&mode=driving&alternatives=false`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status !== 'OK' || !data.routes?.length) return createDemoRoute(origin, destination);
      const route = data.routes[0];
      const leg = route.legs[0];
      const coordinates = decodePolyline(route.overview_polyline.points);
      const steps: DirectionsStep[] = leg.steps.map((s: any) => ({
        instruction: s.html_instructions.replace(/<[^>]*>/g,'') ,
        distance: s.distance.text,
        duration: s.duration.text,
        maneuver: s.maneuver || 'continue'
      }));
      return { distance: leg.distance.text, duration: leg.duration.text, coordinates, steps, summary: route.summary };
    } catch (e) {
      console.warn('Directions fallback to demo route', e);
      return createDemoRoute(origin, destination);
    }
  }, [createDemoRoute]);

  const startNavigation = useCallback((client: DeliveryLocation) => {
    // Open device's default navigation app
    const url = `maps://app?daddr=${client.lat},${client.lng}`;
    const androidUrl = `google.navigation:q=${client.lat},${client.lng}`;
    
    Alert.alert(
      t('startNavigation'),
      t('startNavigationConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('openMaps'), 
          onPress: () => {
            // In a real app, you'd use Linking.openURL() here
            console.log('Opening navigation to:', client.address);
          }
        }
      ]
    );
  }, [t]);

  const handleCall = useCallback((customerName: string, phoneNumber?: string) => {
    // Directly start the call and navigate to call screen
    startCall(customerName, 'voice');
  }, [startCall]);

  // Enhanced route calculation with better algorithm
  const calculateRouteToClient = useCallback(async (client: DeliveryLocation) => {
    if (!currentLocation) {
      Alert.alert(t('error'), 'Current location not available');
      return;
    }

    setIsCalculatingRoute(true);
    setTargetClient(client);
    setSelectedDelivery(client);
    
    try {
      // First, focus map on the selected delivery location
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: client.lat,
          longitude: client.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      }

      // Calculate route using enhanced algorithm
      const directionsRoute = await getDirections(
        currentLocation,
        { latitude: client.lat, longitude: client.lng }
      );
      
      if (directionsRoute) {
        setActiveDirections(directionsRoute);
        setRouteCoordinates(directionsRoute.coordinates);
        setShowDirections(true);
        
        // Center map on route with better fitting
        if (mapRef.current) {
          const allCoordinates = [
            currentLocation,
            ...directionsRoute.coordinates,
            { latitude: client.lat, longitude: client.lng }
          ];
          
          setTimeout(() => {
            mapRef.current?.fitToCoordinates(allCoordinates, {
              edgePadding: { top: 120, right: 50, bottom: 200, left: 50 },
              animated: true,
            });
          }, 1500);
        }
        
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
          customerPhone: '+1 (555) 123-4567',
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
          customerPhone: '+1 (555) 234-5678',
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
          customerPhone: '+1 (555) 345-6789',
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
          customerPhone: '+1 (555) 456-7890',
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
        
  // Fetch real deliveries after location resolves
  fetchDeliveries();
        
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
  fetchDeliveries();
        
        // Show user-friendly error message
        Alert.alert(
          t('locationError'), 
          t('locationErrorMessage'),
          [{ text: 'OK' }]
        );
      }
    };

    init();
  // Intentionally excluding fetchDeliveries to avoid early call before set; fetchDeliveries triggers after location set
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  // Compute haversine distance in meters
  const haversineMeters = useCallback((a: {latitude:number; longitude:number}, b: {latitude:number; longitude:number}) => {
    const R = 6371e3;
    const dLat = (b.latitude - a.latitude) * Math.PI / 180;
    const dLon = (b.longitude - a.longitude) * Math.PI / 180;
    const lat1 = a.latitude * Math.PI/180;
    const lat2 = b.latitude * Math.PI/180;
    const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
    return 2*R*Math.atan2(Math.sqrt(h), Math.sqrt(1-h));
  }, []);

  const synthesizeCoordinate = useCallback((index: number): { latitude: number; longitude: number } => {
      const base = currentLocation || { latitude: 40.7128, longitude: -74.0060 };
      const radius = 0.01;
      const angle = (index * 137.508) % 360;
      const rad = angle * Math.PI/180;
      return {
        latitude: base.latitude + Math.cos(rad) * radius * 0.5,
        longitude: base.longitude + Math.sin(rad) * radius * 0.5,
      };
    }, [currentLocation]);

  const generateRoutes = useCallback((deliveryList: DeliveryLocation[]) => {
      const generateRouteCoordinates = (stops: DeliveryLocation[]) => {
        const coords = [] as { latitude: number; longitude: number }[];
        if (currentLocation) coords.push(currentLocation);
        stops.forEach(s => coords.push({ latitude: s.lat, longitude: s.lng }));
        return coords;
      };
      const remaining = [...deliveryList];
      const ordered: DeliveryLocation[] = [];
      let cursor = currentLocation ? { latitude: currentLocation.latitude, longitude: currentLocation.longitude } : null;
      while (remaining.length) {
        let bestIdx = 0; let bestDist = Number.MAX_VALUE;
        for (let i=0;i<remaining.length;i++) {
          const d = remaining[i];
          const dist = cursor ? haversineMeters(cursor, { latitude: d.lat, longitude: d.lng }) : 0;
          if (dist < bestDist) { bestDist = dist; bestIdx = i; }
        }
        const next = remaining.splice(bestIdx,1)[0];
        ordered.push(next);
        cursor = { latitude: next.lat, longitude: next.lng };
      }
      const coordinates = generateRouteCoordinates(ordered);
      const totalMeters = coordinates.reduce((acc, cur, idx, arr)=> idx? acc + haversineMeters(arr[idx-1], cur): acc, 0);
      const totalKm = (totalMeters/1000).toFixed(1);
      const totalMinutes = Math.round((totalMeters/1000)/0.4);
      const route: Route = { id:'shortest_path', name:'Shortest Path', distance:`${totalKm} km`, duration:`${totalMinutes} min`, stops: ordered, coordinates, isOptimal:true };
      setAvailableRoutes([route]); setSelectedRoute(route);
    }, [currentLocation, haversineMeters]);

  const fetchDeliveries = useCallback(async () => {
    if (!currentLocation) return; // wait for location
    setFetchingDeliveries(true);
    try {
      const currentRes = await riderAPI.getCurrentDeliveries().catch(()=>({ success:false, data: [] }));
      const raw: Delivery[] = (currentRes.data || []) as any;
      const mapped = mapApiDeliveries(raw);
      // Decorate deliveries with location + computed distance/time
      const enriched: DeliveryLocation[] = mapped.map((d, idx) => {
  // Prefer dropoff coordinates, fallback to pickup, else synthesized
  const hasDrop = typeof d.dropoffLat === 'number' && typeof d.dropoffLng === 'number';
  const hasPickup = typeof d.pickupLat === 'number' && typeof d.pickupLng === 'number';
  const baseCoord = hasDrop ? { latitude: d.dropoffLat as number, longitude: d.dropoffLng as number }
           : hasPickup ? { latitude: d.pickupLat as number, longitude: d.pickupLng as number }
           : (synthesizeCoordinate(idx+1));
  const coord = baseCoord;
        const distanceM = haversineMeters(currentLocation, coord);
        const distanceKm = distanceM/1000;
        const estMinutes = Math.max(2, Math.round((distanceKm / 0.4))); // assume 24km/h ~0.4km/min
        return {
          id: d.id,
          customerName: d.customerName || 'Customer',
          customerPhone: d.customerPhone,
          address: d.address || d.customerAddress || 'Unknown address',
          lat: coord.latitude,
          lng: coord.longitude,
          status: (d.status as any) || 'pending',
          distance: `${distanceKm.toFixed(1)} km`,
          estimatedTime: `${estMinutes} min`,
          restaurant: d.restaurant || d.restaurantName || 'Restaurant',
          payment: d.payment || d.paymentAmount != null ? `$${d.paymentAmount}` : '$0.00',
        } as DeliveryLocation;
      });
      setDeliveries(enriched);
      generateRoutes(enriched);
    } catch (e) {
      console.warn('Fetch deliveries (map) failed', e);
    } finally {
      setFetchingDeliveries(false);
    }
  }, [currentLocation, haversineMeters, synthesizeCoordinate, generateRoutes]);

  // Refresh deliveries whenever screen gains focus
  useEffect(() => {
    if (currentLocation) fetchDeliveries();
  }, [currentLocation, fetchDeliveries]);

  // Live polling for location & deliveries (every 30s) - lightweight
  useEffect(() => {
    let locInterval: any; let delInterval: any;
    if (currentLocation) {
      locInterval = setInterval(async () => {
        try {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setCurrentLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        } catch {}
      }, 30000);
      delInterval = setInterval(fetchDeliveries, 30000);
    }
    return () => { locInterval && clearInterval(locInterval); delInterval && clearInterval(delInterval); };
  }, [currentLocation, fetchDeliveries]);

  // removed old generateRoutes (replaced by useCallback version above)

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
    // Keep selectedDelivery set so the info panel shows the right delivery
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
    // Don't clear selectedDelivery - keep it selected for reference
    
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
    // Always set the selected delivery to show the pin and info
    setSelectedDelivery(delivery);
    
    // Focus map on the selected delivery
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: delivery.lat,
        longitude: delivery.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
    
    if (!isDrivingMode) {
      // Show delivery options with calculate route option
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
        <Text style={styles.loadingText}>{t('loadingMap')}</Text>
        {locationError && (
          <Text style={styles.errorText}>{locationError}</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
  {/* Map content (overlay removed to enable full interaction) */}
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {isDrivingMode ? t('drivingMode') : t('map')}
        </Text>
        <View style={styles.headerActions}>
          {isDrivingMode && (
            <TouchableOpacity
              style={[styles.exitButton, { backgroundColor: theme.colors.error + '20' }]}
              onPress={exitDrivingMode}
            >
              <Ionicons name="close" size={20} color={theme.colors.error} />
              <Text style={[styles.exitButtonText, { color: theme.colors.error }]}>{t('exit')}</Text>
            </TouchableOpacity>
          )}
          {!isDrivingMode && (
            <TouchableOpacity
              style={styles.routeButton}
              onPress={() => setShowRouteModal(true)}
            >
              <Ionicons name="list-outline" size={20} color={theme.colors.primary} />
              <Text style={[styles.routeButtonText, { color: theme.colors.primary }]}>{t('deliveries')}</Text>
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
        showsMyLocationButton={false}
        showsTraffic={isDrivingMode}
        showsBuildings={true}
        showsIndoors={true}
        mapType={theme.isDark ? 'standard' : 'standard'}
        userInterfaceStyle={theme.isDark ? 'dark' : 'light'}
        minZoomLevel={4}
        maxZoomLevel={20}
        rotateEnabled={true}
        pitchEnabled={true}
        moveOnMarkerPress={true}
        loadingEnabled={true}
        loadingIndicatorColor={theme.colors.primary}
        loadingBackgroundColor={theme.colors.surface}
        onMapReady={() => {
          console.log('Map is ready');
        }}
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
            pinColor={selectedDelivery?.id === delivery.id ? "#FF6B6B" : getMarkerColor(delivery.status)}
            onPress={() => handleDeliveryPress(delivery)}
          >
            {selectedDelivery?.id === delivery.id && (
              <View style={styles.selectedMarker}>
                <Ionicons name="location" size={30} color="#FF6B6B" />
              </View>
            )}
          </Marker>
        ))}

        {/* Show route polyline when directions are active */}
        {activeDirections && routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={theme.colors.primary}
            strokeWidth={5}
            lineDashPattern={[1]}
            geodesic={true}
          />
        )}

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
          <Text style={styles.routeButtonText}>{t('routes')}</Text>
        </TouchableOpacity>
      </View>

      {/* Selected Delivery Info */}
      {(selectedDelivery || activeDelivery) && (
        <View style={[styles.deliveryInfo, { backgroundColor: theme.colors.card }]}>
          <View style={styles.deliveryHeader}>
            <View>
              <Text style={[styles.deliveryName, { color: theme.colors.text }]}>
                {(selectedDelivery || activeDelivery)?.customerName}
              </Text>
              <Text style={[styles.deliveryAddress, { color: theme.colors.text }]}>
                {(selectedDelivery || activeDelivery)?.address}
              </Text>
              <Text style={[styles.deliveryDetails, { color: theme.colors.textSecondary }]}>
                {(selectedDelivery || activeDelivery)?.restaurant} • {(selectedDelivery || activeDelivery)?.distance} • {(selectedDelivery || activeDelivery)?.estimatedTime}
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
                style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => calculateRouteToClient(selectedDelivery!)}
                disabled={isCalculatingRoute}
              >
                {isCalculatingRoute ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="map" size={20} color="#FFFFFF" />
                )}
                <Text style={styles.actionButtonText}>
                  {isCalculatingRoute ? t('calculating') : t('calculateRoute')}
                </Text>
              </TouchableOpacity>
            )}
            
            {(activeDirections || isDrivingMode) && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "#10B981" }]}
                onPress={() => startNavigation(selectedDelivery || activeDelivery!)}
              >
                <Ionicons name="navigate" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>{t('startNavigation')}</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.actionButton, styles.callButton]}
              onPress={() => handleCall(
                (selectedDelivery || activeDelivery)?.customerName || '', 
                (selectedDelivery || activeDelivery)?.customerPhone
              )}
            >
              <Ionicons name="call" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>{t('call')}</Text>
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
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{t('availableDeliveries')}</Text>
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
  selectedMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Removed comingSoonOverlay styles
});