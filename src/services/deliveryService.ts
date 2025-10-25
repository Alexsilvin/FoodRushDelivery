import apiClient from './apiClient';
import { ApiResponse, Delivery } from '../types/api';
import { mapApiDelivery } from '../utils/mappers';

/**
 * Delivery Service
 * Handles all delivery-related API calls
 */
export const deliveryService = {
  /**
   * List deliveries for the authenticated rider
   * GET /api/v1/deliveries/my
   */
  getMyDeliveries: async (): Promise<Delivery[]> => {
    try {
      const response = await apiClient.get<ApiResponse<Delivery[]>>('/deliveries/my');
      return response.data.data!;
    } catch (error: any) {
      if (error.response) {
        console.error('getMyDeliveries error:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
        });
      } else {
        console.error('getMyDeliveries error:', error.message);
      }
      throw error;
    }
  },

  /**
   * Rider accepts/claims the delivery
   * POST /api/v1/deliveries/{id}/accept
   */
  acceptDelivery: async (deliveryId: string): Promise<Delivery> => {
    try {
      const response = await apiClient.post<ApiResponse<Delivery>>(`/deliveries/${deliveryId}/accept`);
      return response.data.data!;
    } catch (error: any) {
      if (error.response) {
        console.error('acceptDelivery error:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
        });
      } else {
        console.error('acceptDelivery error:', error.message);
      }
      throw error;
    }
  },

  /**
   * Mark delivery as picked up
   * POST /api/v1/deliveries/{id}/pickup
   */
  markPickedUp: async (deliveryId: string): Promise<Delivery> => {
    try {
      const response = await apiClient.post<ApiResponse<Delivery>>(`/deliveries/${deliveryId}/pickup`);
      return response.data.data!;
    } catch (error: any) {
      if (error.response) {
        console.error('markPickedUp error:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
        });
      } else {
        console.error('markPickedUp error:', error.message);
      }
      throw error;
    }
  },

  /**
   * Mark delivery as out for delivery
   * POST /api/v1/deliveries/{id}/out-for-delivery
   */
  markOutForDelivery: async (deliveryId: string): Promise<Delivery> => {
    try {
      const response = await apiClient.post<ApiResponse<Delivery>>(`/deliveries/${deliveryId}/out-for-delivery`);
      return response.data.data!;
    } catch (error: any) {
      if (error.response) {
        console.error('markOutForDelivery error:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
        });
      } else {
        console.error('markOutForDelivery error:', error.message);
      }
      throw error;
    }
  },

  /**
   * Mark delivery as delivered
   * POST /api/v1/deliveries/{id}/deliver
   */
  markDelivered: async (deliveryId: string): Promise<Delivery> => {
    try {
      const response = await apiClient.post<ApiResponse<Delivery>>(`/deliveries/${deliveryId}/deliver`);
      return response.data.data!;
    } catch (error: any) {
      if (error.response) {
        console.error('markDelivered error:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
        });
      } else {
        console.error('markDelivered error:', error.message);
      }
      throw error;
    }
  },

  /**
   * Get delivery by id
   * GET /api/v1/deliveries/{id}
   */
  getDeliveryById: async (deliveryId: string): Promise<Delivery> => {
    try {
      const response = await apiClient.get<ApiResponse<any>>(`/deliveries/${deliveryId}`);
      // API returns data as an array, take the first item
      const deliveryData = Array.isArray(response.data.data) ? response.data.data[0] : response.data.data;
      return mapApiDelivery(deliveryData);
    } catch (error: any) {
      if (error.response) {
        console.error('getDeliveryById error:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
        });
      } else {
        console.error('getDeliveryById error:', error.message);
      }
      throw error;
    }
  },

  /**
   * Estimate delivery fee for a location and restaurant
   * GET /api/v1/deliveries/estimate
   */
  estimateDeliveryFee: async (params: {
    restaurantId: string;
    lat: number;
    lng: number;
    orderTotal: number;
  }): Promise<{ deliveryFee: number; estimatedTime?: number }> => {
    try {
      const response = await apiClient.get<ApiResponse<any>>('/deliveries/estimate', {
        params: {
          restaurantId: params.restaurantId,
          lat: params.lat,
          lng: params.lng,
          orderTotal: params.orderTotal,
        },
      });
      return {
        deliveryFee: response.data.data?.deliveryFee || 0,
        estimatedTime: response.data.data?.estimatedTime,
      };
    } catch (error: any) {
      if (error.response) {
        console.error('estimateDeliveryFee error:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
        });
      } else {
        console.error('estimateDeliveryFee error:', error.message);
      }
      throw error;
    }
  },
};