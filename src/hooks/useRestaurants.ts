import { useQuery } from '@tanstack/react-query';
import { restaurantApi } from '../services/restaurantApi';
import { Restaurant } from '../types/api';

// Query Keys
export const restaurantKeys = {
  all: ['restaurants'] as const,
  nearby: (params?: any) => [...restaurantKeys.all, 'nearby', params] as const,
  details: (id: string) => [...restaurantKeys.all, 'details', id] as const,
};

/**
 * Hook to get nearby restaurants
 */
export const useNearbyRestaurants = (params: {
  nearLat: number;
  nearLng: number;
  radiusKm?: number;
  limit?: number;
  offset?: number;
  isOpen?: boolean;
  verificationStatus?: 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED';
}) => {
  return useQuery({
    queryKey: restaurantKeys.nearby(params),
    queryFn: () => restaurantApi.getNearbyRestaurants(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!(params.nearLat && params.nearLng), // Only run if coordinates are provided
  });
};

/**
 * Hook to get restaurant details
 */
export const useRestaurantDetails = (restaurantId: string) => {
  return useQuery({
    queryKey: restaurantKeys.details(restaurantId),
    queryFn: () => restaurantApi.getRestaurantDetails(restaurantId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!restaurantId,
  });
};