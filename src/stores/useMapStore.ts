import { create } from 'zustand';
import { deliveryService } from '../services/deliveryService';
import { restaurantService } from '../services';
import { Delivery, Restaurant } from '../types/api';

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

interface DirectionsRoute {
  distance: string;
  duration: string;
  coordinates: Array<{ latitude: number; longitude: number }>;
  steps: Array<{
    instruction: string;
    distance: string;
    duration: string;
    maneuver: string;
  }>;
  summary: string;
}

interface MapState {
  // Deliveries
  deliveries: DeliveryLocation[];
  selectedDelivery: DeliveryLocation | null;
  fetchingDeliveries: boolean;
  
  // Restaurants
  restaurants: Restaurant[];
  selectedRestaurant: Restaurant | null;
  fetchingRestaurants: boolean;
  
  // Routing
  activeDirections: DirectionsRoute | null;
  routeCoordinates: Array<{ latitude: number; longitude: number }>;
  showDirections: boolean;
  isDrivingMode: boolean;
  isCalculatingRoute: boolean;
  
  // Driver position
  driverPosition: { latitude: number; longitude: number } | null;
  isAnimating: boolean;
  
  // Actions
  setDeliveries: (deliveries: DeliveryLocation[]) => void;
  setSelectedDelivery: (delivery: DeliveryLocation | null) => void;
  fetchDeliveries: () => Promise<void>;
  
  setRestaurants: (restaurants: Restaurant[]) => void;
  setSelectedRestaurant: (restaurant: Restaurant | null) => void;
  fetchRestaurants: () => Promise<void>;
  
  setActiveDirections: (directions: DirectionsRoute | null) => void;
  setRouteCoordinates: (coords: Array<{ latitude: number; longitude: number }>) => void;
  setShowDirections: (show: boolean) => void;
  setIsDrivingMode: (mode: boolean) => void;
  setIsCalculatingRoute: (calculating: boolean) => void;
  
  setDriverPosition: (position: { latitude: number; longitude: number } | null) => void;
  setIsAnimating: (animating: boolean) => void;
  
  resetMapState: () => void;
}

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

export const useMapStore = create<MapState>((set, get) => ({
  // Initial state
  deliveries: [],
  selectedDelivery: null,
  fetchingDeliveries: false,
  
  restaurants: [],
  selectedRestaurant: null,
  fetchingRestaurants: false,
  
  activeDirections: null,
  routeCoordinates: [],
  showDirections: false,
  isDrivingMode: false,
  isCalculatingRoute: false,
  
  driverPosition: null,
  isAnimating: false,
  
  // Delivery actions
  setDeliveries: (deliveries) => set({ deliveries }),
  setSelectedDelivery: (delivery) => set({ selectedDelivery: delivery }),
  
  fetchDeliveries: async () => {
    set({ fetchingDeliveries: true });
    try {
      const data = await deliveryService.getMyDeliveries();
      const deliveryLocations = convertToDeliveryLocations(data);
      set({ deliveries: deliveryLocations, fetchingDeliveries: false });
    } catch (error) {
      console.error('Failed to fetch deliveries:', error);
      set({ fetchingDeliveries: false });
    }
  },
  
  // Restaurant actions
  setRestaurants: (restaurants) => set({ restaurants }),
  setSelectedRestaurant: (restaurant) => set({ selectedRestaurant: restaurant }),
  
  fetchRestaurants: async () => {
    set({ fetchingRestaurants: true });
    try {
      const data = await restaurantService.getAllRestaurants({ limit: 100 });
      set({ restaurants: data, fetchingRestaurants: false });
    } catch (error) {
      console.error('Failed to fetch restaurants:', error);
      set({ fetchingRestaurants: false });
    }
  },
  
  // Routing actions
  setActiveDirections: (directions) => set({ activeDirections: directions }),
  setRouteCoordinates: (coords) => set({ routeCoordinates: coords }),
  setShowDirections: (show) => set({ showDirections: show }),
  setIsDrivingMode: (mode) => set({ isDrivingMode: mode }),
  setIsCalculatingRoute: (calculating) => set({ isCalculatingRoute: calculating }),
  
  // Driver position actions
  setDriverPosition: (position) => set({ driverPosition: position }),
  setIsAnimating: (animating) => set({ isAnimating: animating }),
  
  // Reset state
  resetMapState: () => set({
    selectedDelivery: null,
    selectedRestaurant: null,
    activeDirections: null,
    routeCoordinates: [],
    showDirections: false,
    isDrivingMode: false,
    isCalculatingRoute: false,
    driverPosition: null,
    isAnimating: false,
  }),
}));
