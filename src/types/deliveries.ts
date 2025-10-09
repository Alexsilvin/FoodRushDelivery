// New Delivery API Types (from /api/v1/deliveries/my)

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
  isAvailable: boolean;
  pictureUrl: string | null;
  category: string;
  startAt: string;
  endAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  unitPrice: string;
  specialInstructions?: string;
}

export interface DeliveryFeeBreakdown {
  base: number;
  capped: boolean;
  freeApplied: boolean;
  perKmComponent: number;
  surgeMultiplier: number;
}

export interface OrderDetails {
  id: string;
  restaurant: {
    id: string;
    name: string;
    address: string;
    phone: string;
    isOpen: boolean;
    latitude: string | null;
    longitude: string | null;
    verificationStatus: string;
    documentUrl: string;
    pictureUrl: string | null;
    rating: number | null;
    ratingCount: number;
    ownerId: string;
    menuMode: string;
    timezone: string;
    deliveryBaseFee: number | null;
    deliveryPerKmRate: number | null;
    deliveryMinFee: number | null;
    deliveryMaxFee: number | null;
    deliveryFreeThreshold: number | null;
    deliverySurgeMultiplier: number | null;
    createdAt: string;
    updatedAt: string;
  };
  items: OrderItem[];
  subtotal: string;
  deliveryFee: string;
  deliveryDistanceKm: string;
  deliveryFeeBreakdown: DeliveryFeeBreakdown;
  deliveryEtaMinutes: number | null;
  deliveryFeeLocked: boolean;
  deliveryFeeLockedAt: string;
  total: string;
  paymentMethod: string;
  deliveryAddress: string;
  deliveryLatitude: string;
  deliveryLongitude: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready_for_pickup' | 'out_for_delivery' | 'delivered' | 'cancelled';
  rejectionReason: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RiderProfile {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
}

export interface DeliveryItem {
  id: string;
  order: OrderDetails;
  rider: RiderProfile;
  status: 'assigned' | 'accepted' | 'picked_up' | 'out_for_delivery' | 'delivered' | 'cancelled';
  deliveredAt: string | null;
  customerConfirmed: boolean;
  customerConfirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveriesResponse {
  status_code: number;
  message: string;
  data: DeliveryItem[];
}

export interface DeliveryFilters {
  status?: string;
  limit?: number;
  offset?: number;
}

// Utility type for converting new API format to legacy format
export interface LegacyDelivery {
  id: string;
  customerName: string;
  customerPhone?: string;
  restaurant: string;
  address: string;
  lat: number;
  lng: number;
  dropoffLat: number;
  dropoffLng: number;
  pickupLat?: number;
  pickupLng?: number;
  restaurantLat?: number;
  restaurantLng?: number;
  status: string;
  distance: string;
  estimatedTime: string;
  payment: string;
  restaurant_active: boolean;
  verificationStatus: string;
}