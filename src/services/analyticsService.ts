import apiClient from './apiClient';
import { ApiResponse } from '../types/api';

/**
 * Analytics Service
 * Handles all analytics-related API calls
 */
export const analyticsService = {
  /**
   * Rider earnings summary (Africa/Douala)
   * GET /api/v1/analytics/riders/my/summary
   */
  getRiderSummary: async (): Promise<{
    todayEarnings: number;
    completedDeliveries: number;
    rating: number;
    completionRate: number;
    totalEarnings: number;
    weeklyEarnings: number;
    monthlyEarnings: number;
  }> => {
    const response = await apiClient.get<ApiResponse<{
      todayEarnings: number;
      completedDeliveries: number;
      rating: number;
      completionRate: number;
      totalEarnings: number;
      weeklyEarnings: number;
      monthlyEarnings: number;
    }>>('/analytics/riders/my/summary');
    return response.data.data!;
  },

  /**
   * Rider earnings buckets (daily/weekly/monthly) - Africa/Douala
   * GET /api/v1/analytics/riders/my/earnings/bucketed
   */
  getRiderEarningsBucketed: async (params?: {
    period?: 'daily' | 'weekly' | 'monthly';
    startDate?: string;
    endDate?: string;
  }): Promise<{
    buckets: Array<{
      period: string;
      earnings: number;
      deliveries: number;
      date: string;
    }>;
    total: number;
    currency: string;
  }> => {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const url = `/analytics/riders/my/earnings/bucketed${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<ApiResponse<{
      buckets: Array<{
        period: string;
        earnings: number;
        deliveries: number;
        date: string;
      }>;
      total: number;
      currency: string;
    }>>(url);
    return response.data.data!;
  },

  /**
   * Rider balance (ledger credits - debits), in XAF
   * GET /api/v1/analytics/riders/my/balance
   */
  getRiderBalance: async (): Promise<{
    balance: number;
    currency: string;
    credits: number;
    debits: number;
    pendingEarnings: number;
    availableForWithdrawal: number;
  }> => {
    const response = await apiClient.get<ApiResponse<{
      balance: number;
      currency: string;
      credits: number;
      debits: number;
      pendingEarnings: number;
      availableForWithdrawal: number;
    }>>('/analytics/riders/my/balance');
    return response.data.data!;
  },
};