import apiClient from './apiClient';
import { Restaurant, ApiResponse } from '../types/api';

/**
 * Restaurant API Service
 * Handles restaurant-related API calls
 */
export const restaurantApi = {
  /**
   * Browse nearby restaurants with distance computation and filtering
   * GET /api/v1/restaurants/browse
   */
  getNearbyRestaurants: async (params: {
    nearLat: number;
    nearLng: number;
    minDistanceKm?: number;
    maxDistanceKm?: number;
    radiusKm?: number;
    sortBy?: 'distance' | 'rating' | 'name' | 'createdAt';
    sortDir?: 'ASC' | 'DESC';
    limit?: number;
    offset?: number;
    isOpen?: boolean;
    verificationStatus?: 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED';
    menuMode?: 'FIXED' | 'DAILY';
  }): Promise<Restaurant[]> => {
    const queryParams = new URLSearchParams();
    
    queryParams.append('nearLat', params.nearLat.toString());
    queryParams.append('nearLng', params.nearLng.toString());
    
    if (params.minDistanceKm !== undefined) {
      queryParams.append('minDistanceKm', params.minDistanceKm.toString());
    }
    if (params.maxDistanceKm !== undefined) {
      queryParams.append('maxDistanceKm', params.maxDistanceKm.toString());
    }
    if (params.radiusKm !== undefined) {
      queryParams.append('radiusKm', params.radiusKm.toString());
    }
    if (params.sortBy) {
      queryParams.append('sortBy', params.sortBy);
    }
    if (params.sortDir) {
      queryParams.append('sortDir', params.sortDir);
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
    if (params.menuMode) {
      queryParams.append('menuMode', params.menuMode);
    }

    const url = `/restaurants/browse?${queryParams.toString()}`;
    
    try {
      const response = await apiClient.get<ApiResponse<Restaurant[]>>(url);
      
      // Normalize coordinates to numbers and ensure all required fields
      const restaurants = (response.data.data || []).map(restaurant => ({
        ...restaurant,
        latitude: typeof restaurant.latitude === 'string' 
          ? parseFloat(restaurant.latitude) 
          : restaurant.latitude,
        longitude: typeof restaurant.longitude === 'string' 
          ? parseFloat(restaurant.longitude) 
          : restaurant.longitude,
        // Ensure distanceKm is available from the browse endpoint
        distanceKm: restaurant.distanceKm || 0,
        deliveryPrice: restaurant.deliveryPrice || 0,
        estimatedDeliveryTime: restaurant.estimatedDeliveryTime || 'N/A',
        rating: restaurant.rating || null,
        ratingCount: restaurant.ratingCount || 0,
      }));
      
      return restaurants;
    } catch (error) {
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

  /**
   * Browse restaurants with advanced filtering (alias for getNearbyRestaurants)
   * GET /api/v1/restaurants/browse
   */
  browseRestaurants: async (params: {
    nearLat: number;
    nearLng: number;
    minDistanceKm?: number;
    maxDistanceKm?: number;
    radiusKm?: number;
    sortBy?: 'distance' | 'rating' | 'name' | 'createdAt';
    sortDir?: 'ASC' | 'DESC';
    limit?: number;
    offset?: number;
    isOpen?: boolean;
    verificationStatus?: 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED';
    menuMode?: 'FIXED' | 'DAILY';
  }): Promise<Restaurant[]> => {
    return restaurantApi.getNearbyRestaurants(params);
  },
};