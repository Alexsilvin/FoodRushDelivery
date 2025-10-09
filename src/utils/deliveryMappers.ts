import { DeliveryItem, LegacyDelivery } from '../types/deliveries';
import { Delivery } from '../types/api';

/**
 * Convert new API delivery format to legacy format for backward compatibility
 * This allows existing components to work while we gradually migrate to the new format
 */
export const mapDeliveryItemToLegacy = (item: DeliveryItem): LegacyDelivery => {
  const { order } = item;
  
  // Extract customer name from delivery address or use fallback
  const customerName = 'Customer'; // API doesn't provide customer name in this endpoint
  
  // Calculate total items description
  const itemsDescription = order.items
    .map(item => `${item.quantity}x ${item.menuItem.name}`)
    .join(', ');
  
  // Parse coordinates
  const lat = parseFloat(order.deliveryLatitude) || 0;
  const lng = parseFloat(order.deliveryLongitude) || 0;
  const restaurantLat = order.restaurant.latitude ? parseFloat(order.restaurant.latitude) : undefined;
  const restaurantLng = order.restaurant.longitude ? parseFloat(order.restaurant.longitude) : undefined;
  
  return {
    id: item.id,
    customerName,
    customerPhone: undefined, // Not provided in this endpoint
    restaurant: order.restaurant.name,
    address: order.deliveryAddress,
    lat,
    lng,
    dropoffLat: lat,
    dropoffLng: lng,
    pickupLat: restaurantLat,
    pickupLng: restaurantLng,
    restaurantLat,
    restaurantLng,
    status: mapDeliveryStatus(item.status),
    distance: `${parseFloat(order.deliveryDistanceKm).toFixed(1)} km`,
    estimatedTime: order.deliveryEtaMinutes ? `${order.deliveryEtaMinutes} min` : 'N/A',
    payment: `XAF ${parseFloat(order.total).toFixed(0)}`,
    restaurant_active: order.restaurant.isOpen,
    verificationStatus: order.restaurant.verificationStatus,
  };
};

/**
 * Map delivery status from new API to legacy format
 */
const mapDeliveryStatus = (status: DeliveryItem['status']): string => {
  const statusMap: Record<DeliveryItem['status'], string> = {
    assigned: 'pending',
    accepted: 'accepted',
    picked_up: 'picked_up',
    out_for_delivery: 'delivering',
    delivered: 'delivered',
    cancelled: 'cancelled',
  };
  
  return statusMap[status] || status;
};

/**
 * Convert array of new delivery items to legacy format
 */
export const mapDeliveryItemsToLegacy = (items: DeliveryItem[]): LegacyDelivery[] => {
  return items.map(mapDeliveryItemToLegacy);
};

/**
 * Convert legacy delivery to the expected Delivery interface
 */
export const mapLegacyToDelivery = (legacy: LegacyDelivery): Delivery => {
  return {
    id: legacy.id,
    customerName: legacy.customerName,
    customerPhone: legacy.customerPhone,
    restaurant: legacy.restaurant,
    address: legacy.address,
    lat: legacy.lat,
    lng: legacy.lng,
    dropoffLat: legacy.dropoffLat,
    dropoffLng: legacy.dropoffLng,
    pickupLat: legacy.pickupLat,
    pickupLng: legacy.pickupLng,
    restaurantLat: legacy.restaurantLat,
    restaurantLng: legacy.restaurantLng,
    status: legacy.status,
    distance: legacy.distance,
    estimatedTime: legacy.estimatedTime,
    payment: legacy.payment,
    restaurant_active: legacy.restaurant_active,
    verificationStatus: legacy.verificationStatus,
  };
};

/**
 * Get delivery summary statistics from delivery items
 */
export const getDeliveryStats = (items: DeliveryItem[]) => {
  const stats = {
    total: items.length,
    assigned: 0,
    accepted: 0,
    picked_up: 0,
    out_for_delivery: 0,
    delivered: 0,
    cancelled: 0,
    totalEarnings: 0,
  };
  
  items.forEach(item => {
    if (item.status in stats) {
      (stats as any)[item.status] = ((stats as any)[item.status] || 0) + 1;
    }
    
    if (item.status === 'delivered') {
      stats.totalEarnings += parseFloat(item.order.total);
    }
  });
  
  return stats;
};