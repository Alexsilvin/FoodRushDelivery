import apiClient from './apiClient';
import { ApiResponse, RiderStatus } from '../types/api';

/**
 * Rider API Service
 * Handles all rider-specific API calls
 */
export const riderApi = {
  /**
   * Get rider status
   * GET /api/v1/riders/status
   */
  getStatus: async (): Promise<RiderStatus> => {
    const response = await apiClient.get<ApiResponse<RiderStatus>>('/riders/status');
    return response.data.data!;
  },

  /**
   * Update rider online/offline status
   * PATCH /api/v1/riders/status
   */
  updateStatus: async (isOnline: boolean): Promise<RiderStatus> => {
    const response = await apiClient.patch<ApiResponse<RiderStatus>>('/riders/status', {
      isOnline
    });
    return response.data.data!;
  },

  /**
   * Update rider location
   * PATCH /api/v1/riders/my/location
   */
  updateLocation: async (latitude: number, longitude: number): Promise<void> => {
    await apiClient.patch('/riders/my/location', {
      latitude,
      longitude
    });
  },

  /**
   * Update rider availability (legacy method)
   * PATCH /api/v1/riders/my/availability
   */
  updateAvailability: async (available: boolean): Promise<void> => {
    await apiClient.patch('/riders/my/availability', {
      available
    });
  },

  /**
   * Update vehicle information
   * PATCH /api/v1/riders/vehicle
   */
  updateVehicle: async (vehicleData: any): Promise<void> => {
    await apiClient.patch('/riders/vehicle', vehicleData);
  },

  /**
   * Get rider earnings
   * GET /api/v1/riders/earnings
   */
  getEarnings: async (period: 'today' | 'week' | 'month' = 'today') => {
    const response = await apiClient.get(`/riders/earnings?period=${period}`);
    return response.data;
  },
};