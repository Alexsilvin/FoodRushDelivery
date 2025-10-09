import apiClient from './apiClient';
import { ApiResponse, Delivery } from '../types/api';

/**
 * Delivery Service
 * Handles all delivery-related API calls
 */
export const deliveryService = {
  /**
   * List deliveries for the authenticated rider
   * GET /api/v1/deliveries/my
   */
  getMyDeliveries: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<Delivery[]> => {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.append('page', params.page.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);

    const url = `/deliveries/my${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<ApiResponse<Delivery[]>>(url);
    return response.data.data!;
  },

  /**
   * Rider accepts/claims the delivery
   * POST /api/v1/deliveries/{id}/accept
   */
  acceptDelivery: async (deliveryId: string): Promise<Delivery> => {
    const response = await apiClient.post<ApiResponse<Delivery>>(`/deliveries/${deliveryId}/accept`);
    return response.data.data!;
  },

  /**
   * Mark delivery as picked up
   * POST /api/v1/deliveries/{id}/pickup
   */
  markPickedUp: async (deliveryId: string): Promise<Delivery> => {
    const response = await apiClient.post<ApiResponse<Delivery>>(`/deliveries/${deliveryId}/pickup`);
    return response.data.data!;
  },

  /**
   * Mark delivery as out for delivery
   * POST /api/v1/deliveries/{id}/out-for-delivery
   */
  markOutForDelivery: async (deliveryId: string): Promise<Delivery> => {
    const response = await apiClient.post<ApiResponse<Delivery>>(`/deliveries/${deliveryId}/out-for-delivery`);
    return response.data.data!;
  },

  /**
   * Mark delivery as delivered
   * POST /api/v1/deliveries/{id}/deliver
   */
  markDelivered: async (deliveryId: string): Promise<Delivery> => {
    const response = await apiClient.post<ApiResponse<Delivery>>(`/deliveries/${deliveryId}/deliver`);
    return response.data.data!;
  },

  /**
   * Get delivery by id
   * GET /api/v1/deliveries/{id}
   */
  getDeliveryById: async (deliveryId: string): Promise<Delivery> => {
    const response = await apiClient.get<ApiResponse<Delivery>>(`/deliveries/${deliveryId}`);
    return response.data.data!;
  },

  /**
   * Get delivery by order id
   * GET /api/v1/deliveries/by-order/{orderId}
   */
  getDeliveryByOrderId: async (orderId: string): Promise<Delivery> => {
    const response = await apiClient.get<ApiResponse<Delivery>>(`/deliveries/by-order/${orderId}`);
    return response.data.data!;
  },
};