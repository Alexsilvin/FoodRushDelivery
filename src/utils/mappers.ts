// Unified mapping utilities to adapt backend payloads to internal app models
// This allows quick adjustment if the backend field names or shapes differ.

import { User, Delivery, OrderLine } from '../types/api';

// Status normalization map (extend as backend adds values)
const DELIVERY_STATUS_MAP: Record<string, string> = {
  pending: 'pending',
  accepted: 'accepted',
  assigned: 'accepted',
  picked_up: 'picked_up',
  en_route: 'delivering',
  delivering: 'delivering',
  completed: 'delivered',
  delivered: 'delivered'
};

export function normalizeStatus(raw?: string): string {
  if (!raw) return 'pending';
  const key = raw.toLowerCase();
  return DELIVERY_STATUS_MAP[key] || raw;
}

export function mapApiUser(apiUser: any): User {
  if (!apiUser) throw new Error('No user payload');
  const fullName: string | undefined = apiUser.fullName;
  const first = apiUser.firstName || (fullName ? fullName.split(' ')[0] : undefined);
  const last = apiUser.lastName || (fullName ? fullName.split(' ').slice(1).join(' ') : undefined);
  return {
    ...apiUser,
    firstName: first,
    lastName: last,
    role: apiUser.role || 'rider'
  } as User;
}

export function mapApiDelivery(raw: any): Delivery {
  // Handle nested order structure from API
  const order = raw.order || {};
  const restaurant = order.restaurant || {};
  const rider = raw.rider || {};

  // Normalize order items into OrderLine objects
  let orderItems: OrderLine[] | undefined;
  if (Array.isArray(order.items)) {
    orderItems = order.items.map((i: any, idx: number) => ({
      id: String(i.id ?? idx),
      name: i.menuItem?.name || i.name || 'Item',
      quantity: Number(i.quantity ?? 1),
      price: Number(i.unitPrice ?? i.price ?? 0),
      notes: i.specialInstructions || undefined,
    } as OrderLine));
  } else if (Array.isArray(raw.orderItems)) {
    // Fallback for old structure
    orderItems = raw.orderItems.map((i: any, idx: number) => {
      if (typeof i === 'string') {
        return { id: String(idx), name: i, quantity: 1, price: 0 };
      }
      return {
        id: String(i.id ?? idx),
        name: i.name || i.menuItem?.name || 'Item',
        quantity: Number(i.quantity ?? i.qty ?? 1),
        price: Number(i.price ?? i.unitPrice ?? i.amount ?? 0),
        notes: i.notes || i.specialInstructions || undefined,
      } as OrderLine;
    });
  }

  return {
    id: raw.id || raw._id || Math.random().toString(36).slice(2),
    code: order.id || raw.code || raw.reference || raw.refCode,
    customerName: 'Customer', // API doesn't provide customer name
    restaurantName: restaurant.name || raw.restaurantName || raw.restaurant,
    restaurant: restaurant.name || raw.restaurantName || raw.restaurant || 'Restaurant',
    address: order.deliveryAddress || raw.address || raw.customerAddress || raw.dropoffAddress || 'Unknown address',
    customerAddress: order.deliveryAddress || raw.customerAddress || raw.address,
    status: normalizeStatus(raw.status),
    distanceKm: order.deliveryDistanceKm ? Number(order.deliveryDistanceKm) : (raw.distanceKm || raw.distance_km || raw.distance),
    distance: order.deliveryDistanceKm ? `${order.deliveryDistanceKm} km` : (raw.distance ? `${raw.distance} km` : (raw.distanceKm ? `${raw.distanceKm} km` : undefined)),
    paymentAmount: order.total ? Number(order.total) : (raw.paymentAmount ?? raw.amount ?? raw.total),
    payment: order.total ? `$${Number(order.total).toFixed(2)}` : (raw.paymentAmount != null ? `$${Number(raw.paymentAmount).toFixed(2)}` : (raw.payment || undefined)),
    estimatedTime: order.deliveryEtaMinutes ? `${order.deliveryEtaMinutes} min` : (raw.estimatedTime || raw.eta || raw.estimatedMinutes && `${raw.estimatedMinutes} min` || '—'),
    orderItems,
    customerPhone: '', // API doesn't provide customer phone
    pickupTime: raw.acceptedAt || raw.pickupTime || raw.pickedAt,
    deliveryTime: raw.deliveredAt || raw.deliveryTime || raw.deliveredAt,
    pickupLat: restaurant.latitude ? Number(restaurant.latitude) : (raw.pickupLat ?? raw.pickupLatitude ?? raw.pickup_location?.lat ?? raw.pickup?.lat),
    pickupLng: restaurant.longitude ? Number(restaurant.longitude) : (raw.pickupLng ?? raw.pickupLongitude ?? raw.pickup_location?.lng ?? raw.pickup?.lng),
    dropoffLat: order.deliveryLatitude ? Number(order.deliveryLatitude) : (raw.dropoffLat ?? raw.dropoffLatitude ?? raw.dropoff_location?.lat ?? raw.dropoff?.lat),
    dropoffLng: order.deliveryLongitude ? Number(order.deliveryLongitude) : (raw.dropoffLng ?? raw.dropoffLongitude ?? raw.dropoff_location?.lng ?? raw.dropoff?.lng),
    // Additional fields for delivery details screen
    orderTotal: order.subtotal ? `$${Number(order.subtotal).toFixed(2)}` : (raw.orderTotal ?? raw.subtotal ?? raw.orderSubtotal ?? ''),
    deliveryFee: order.deliveryFee ? `$${Number(order.deliveryFee).toFixed(2)}` : (raw.deliveryFee ?? raw.fee ?? ''),
    tip: raw.tip ?? raw.driverTip ?? raw.gratuity ?? '',
    restaurantPhone: restaurant.phone ?? raw.restaurantPhone ?? raw.restaurant?.phone ?? '',
    restaurantAddress: restaurant.address ?? raw.restaurantAddress ?? raw.restaurant?.address ?? '',
    specialInstructions: raw.specialInstructions ?? raw.instructions ?? '',
    deliveryInstructions: raw.deliveryInstructions ?? raw.customerInstructions ?? raw.notes ?? '',
  } as Delivery;
}

export function mapApiDeliveries(list: any[] | undefined | null): Delivery[] {
  if (!Array.isArray(list)) return [];
  return list.map(mapApiDelivery);
}

// Generic safe API response validator (lightweight)
export function ensureSuccess<T extends { success?: boolean }>(resp: T, context: string) {
  if (resp && (resp as any).success === false) {
    console.warn(`API response for ${context} indicated failure`, resp);
  }
  return resp;
}
