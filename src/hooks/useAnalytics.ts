import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../services/analyticsService';

// Query Keys
export const analyticsKeys = {
  all: ['analytics'] as const,
  rider: () => [...analyticsKeys.all, 'rider'] as const,
  summary: () => [...analyticsKeys.rider(), 'summary'] as const,
  earnings: (params?: any) => [...analyticsKeys.rider(), 'earnings', params] as const,
  balance: () => [...analyticsKeys.rider(), 'balance'] as const,
};

/**
 * Hook to get rider summary
 */
export const useRiderSummary = () => {
  return useQuery({
    queryKey: analyticsKeys.summary(),
    queryFn: analyticsService.getRiderSummary,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 401 or 403
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
    // Provide fallback data on error
    placeholderData: {
      todayEarnings: 0,
      completedDeliveries: 0,
      rating: 0,
      completionRate: 0,
      totalEarnings: 0,
      weeklyEarnings: 0,
      monthlyEarnings: 0,
    },
  });
};

/**
 * Hook to get rider earnings bucketed
 */
export const useRiderEarningsBucketed = (params?: {
  period?: 'daily' | 'weekly' | 'monthly';
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: analyticsKeys.earnings(params),
    queryFn: () => analyticsService.getRiderEarningsBucketed(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 401 or 403
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
    // Provide fallback data on error
    placeholderData: {
      buckets: [],
      total: 0,
      currency: 'XAF',
    },
  });
};

/**
 * Hook to get rider balance
 */
export const useRiderBalance = () => {
  return useQuery({
    queryKey: analyticsKeys.balance(),
    queryFn: analyticsService.getRiderBalance,
    staleTime: 60 * 1000, // 1 minute
    retry: (failureCount, error: any) => {
      // Don't retry on 401 or 403
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
    // Provide fallback data on error
    placeholderData: {
      balance: 0,
      currency: 'XAF',
      credits: 0,
      debits: 0,
      pendingEarnings: 0,
      availableForWithdrawal: 0,
    },
  });
};