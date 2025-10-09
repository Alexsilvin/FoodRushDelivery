import apiClient from './apiClient';
import { Restaurant, ApiResponse } from '../types/api';

/**
 * Restaurant API Service
 * Handles restaurant-related API calls
 */
export const restaurantApi = {
  /**
   * Get nearby restaurants
   * GET /api/v1/restaurants/nearby
   */
  getNearbyRestaurants: async (params: {
    nearLat: number;
    nearLng: number;
    radiusKm?: number;
    limit?: number;
    offset?: number;
    isOpen?: boolean;
    verificationStatus?: string;
  }): Promise<Restaurant[]> => {
    const queryParams = new URLSearchParams();
    
    queryParams.append('nearLat', params.nearLat.toString());
    queryParams.append('nearLng', params.nearLng.toString());
    
    if (params.radiusKm !== undefined) {
      queryParams.append('radiusKm', params.radiusKm.toString());
    }
    if (params.limit !== undefined) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params.offset !== undefined) {
      queryParams.append('offset', params.offset.toString());
    }
    if (params.isOpen !== undefined) {
      queryParams.append('isOpen', params.isOpen.toString());
    }
    if (params.verificationStatus) {
      queryParams.append('verificationStatus', params.verificationStatus);
    }

    const url = `/restaurants/nearby?${queryParams.toString()}`;
    
    try {
      const response = await apiClient.get<ApiResponse<Restaurant[]>>(url);
      
      // Normalize coordinates to numbers
      const restaurants = (response.data.data || []).map(restaurant => ({
        ...restaurant,
        latitude: typeof restaurant.latitude === 'string' 
          ? parseFloat(restaurant.latitude) 
          : restaurant.latitude,
        longitude: typeof restaurant.longitude === 'string' 
          ? parseFloat(restaurant.longitude) 
          : restaurant.longitude,
      }));
      
      return restaurants;
    } catch (error) {
      console.error('❌ Failed to fetch nearby restaurants:', error);
      return [];
    }
  },

  /**
   * Get restaurant details
   * GET /api/v1/restaurants/{id}
   */
  getRestaurantDetails: async (restaurantId: string): Promise<Restaurant> => {
    const response = await apiClient.get<ApiResponse<Restaurant>>(`/restaurants/${restaurantId}`);
    return response.data.data!;
  },
};