import { useQuery } from '@tanstack/react-query';
import { restaurantApi } from '../services/restaurantApi';
import { Restaurant } from '../types/api';
import { cacheConfig } from '../lib/queryClient';

// Query Keys
export const restaurantKeys = {
  all: ['restaurants'] as const,
  nearby: (lat: number, lng: number, params?: any) => 
    [...restaurantKeys.all, 'nearby', { lat, lng, ...params }] as const,
  detail: (id: string) => [...restaurantKeys.all, 'detail', id] as const,
};

/**
 * Hook to get nearby restaurants
 */
export const useNearbyRestaurants = (
  latitude: number,
  longitude: number,
  options?: {
    radiusKm?: number;
    limit?: number;
    offset?: number;
    isOpen?: boolean;
    verificationStatus?: string;
  }
) => {
  const params = {
    radiusKm: 10,
    limit: 50,
    offset: 0,
    isOpen: true,
    verificationStatus: 'APPROVED',
    ...options,
  };

  return useQuery({
    queryKey: restaurantKeys.nearby(latitude, longitude, params),
    queryFn: () => restaurantApi.getNearbyRestaurants({
      nearLat: latitude,
      nearLng: longitude,
      ...params,
    }),
    enabled: !!(latitude && longitude), // Only run when location is available
    ...cacheConfig.staticData, // 30 minute stale time
  });
};

/**
 * Hook to get restaurant details
 */
export const useRestaurantDetails = (restaurantId: string) => {
  return useQuery({
    queryKey: restaurantKeys.detail(restaurantId),
    queryFn: () => restaurantApi.getRestaurantDetails(restaurantId),
    enabled: !!restaurantId,
    ...cacheConfig.staticData,
  });
};