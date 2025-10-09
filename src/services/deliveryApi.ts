import apiClient from './apiClient';
import { DeliveriesResponse, DeliveryFilters, DeliveryItem } from '../types/deliveries';
import { ApiResponse } from '../types/api';

/**
 * Delivery API Service
 * Handles all delivery-related API calls with proper typing
 */
export const deliveryApi = {
  /**
   * Get deliveries for authenticated rider
   * GET /api/v1/deliveries/my
   */
  getMyDeliveries: async (filters?: DeliveryFilters): Promise<DeliveryItem[]> => {
    const params = new URLSearchParams();
    
    if (filters?.status) {
      params.append('status', filters.status);
    }
    if (filters?.limit) {
      params.append('limit', filters.limit.toString());
    }
    if (filters?.offset) {
      params.append('offset', filters.offset.toString());
    }
    

    
    const response = await apiClient.get<DeliveriesResponse>('/deliveries/my');
    return response.data.data || [];
  },

  /**
   * Accept a delivery
   * POST /api/v1/deliveries/{id}/accept
   */
  acceptDelivery: async (deliveryId: string): Promise<DeliveryItem> => {
    const response = await apiClient.post<ApiResponse<DeliveryItem>>(`/deliveries/${deliveryId}/accept`);
    return response.data.data!;
  },

  /**
   * Mark delivery as picked up
   * POST /api/v1/deliveries/{id}/pickup
   */
  pickupDelivery: async (deliveryId: string): Promise<void> => {
    await apiClient.post(`/deliveries/${deliveryId}/pickup`);
  },

  /**
   * Mark delivery as out for delivery
   * POST /api/v1/deliveries/{id}/out-for-delivery
   */
  markOutForDelivery: async (deliveryId: string): Promise<void> => {
    await apiClient.post(`/deliveries/${deliveryId}/out-for-delivery`);
  },

  /**
   * Start delivery (mark as picked up) - Legacy method
   * POST /api/v1/deliveries/{id}/start
   */
  startDelivery: async (deliveryId: string): Promise<DeliveryItem> => {
    const response = await apiClient.post<ApiResponse<DeliveryItem>>(`/deliveries/${deliveryId}/start`);
    return response.data.data!;
  },

  /**
   * Complete delivery
   * POST /api/v1/deliveries/{id}/complete
   */
  completeDelivery: async (deliveryId: string): Promise<DeliveryItem> => {
    const response = await apiClient.post<ApiResponse<DeliveryItem>>(`/deliveries/${deliveryId}/complete`);
    return response.data.data!;
  },

  /**
   * Get delivery details
   * GET /api/v1/deliveries/{id}
   */
  getDeliveryDetails: async (deliveryId: string): Promise<DeliveryItem> => {
    const response = await apiClient.get<ApiResponse<DeliveryItem>>(`/deliveries/${deliveryId}`);
    return response.data.data!;
  },

  /**
   * Update delivery status
   * PATCH /api/v1/deliveries/{id}/status
   */
  updateDeliveryStatus: async (deliveryId: string, status: string): Promise<DeliveryItem> => {
    const response = await apiClient.patch<ApiResponse<DeliveryItem>>(`/deliveries/${deliveryId}/status`, {
      status,
    });
    return response.data.data!;
  },
};
