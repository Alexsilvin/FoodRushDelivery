// Central API Type Definitions
// These interfaces are conservative (fields optional) to avoid runtime crashes

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  [key: string]: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: ApiMeta;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phoneNumber?: string;
  role: string;
  state?: string;  // Account state: active, pending, rejected, etc.
  status?: string; // Alternative field name for state
  isVerified?: boolean;
  vehicles?: Vehicle[];
  phoneNumbers?: PhoneNumber[];
  [key: string]: any;
}

export interface PhoneNumber {
  id: string;
  number: string;
  isPrimary: boolean;
}

export interface Vehicle {
  id?: string;
  name?: string;
  type?: string;
  default?: boolean;
  [key: string]: any;
}

export type DeliveryStatus = 'pending' | 'accepted' | 'picked_up' | 'delivering' | 'completed' | 'delivered' | string;

export interface Delivery {
  id: string;
  code?: string; // order code / reference
  customerName?: string;
  restaurantName?: string;
  restaurant?: string; // UI fallback
  address?: string;
  customerAddress?: string; // backend variant
  status: DeliveryStatus;
  distanceKm?: number;
  distance?: string; // UI string fallback
  paymentAmount?: number;
  payment?: string; // UI formatted fallback
  estimatedTime?: string;
  orderItems?: string[];
  customerPhone?: string;
  pickupTime?: string;
  deliveryTime?: string;
  // Coordinates (optional; fallback synthesized if absent)
  pickupLat?: number;
  pickupLng?: number;
  dropoffLat?: number;
  dropoffLng?: number;
  [key: string]: any;
}

export interface RiderStatus {
  status: 'online' | 'offline';
  activeDeliveries?: number;
  completedToday?: number;
  rating?: number;
  todayEarnings?: number;
  [key: string]: any;
}

export interface EarningsSummary {
  period: 'day' | 'week' | 'month' | 'all';
  total: number;
  currency?: string;
  breakdown?: any;
}

export interface Restaurant {
  id: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  isOpen?: boolean;
  verificationStatus?: 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED';
  menuMode?: 'FIXED' | 'DAILY';
  createdAt?: string;
  distanceKm?: number;
  deliveryPrice?: number;
  estimatedDeliveryTime?: string;
  rating?: number | null;
  ratingCount?: number;
  pictureUrl?: string | null;
  [key: string]: any;
}
