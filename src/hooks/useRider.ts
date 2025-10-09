import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { riderApi } from '../services/riderApi';
import { analyticsAPI } from '../services/api';
import { RiderStatus, EarningsSummary } from '../types/api';
import { cacheConfig } from '../lib/queryClient';

// Query Keys
export const riderKeys = {
  all: ['rider'] as const,
  status: () => [...riderKeys.all, 'status'] as const,
  earnings: (period?: string) => [...riderKeys.all, 'earnings', period] as const,
  analytics: () => [...riderKeys.all, 'analytics'] as const,
  balance: () => [...riderKeys.all, 'balance'] as const,
};

/**
 * Hook to get rider status
 */
export const useRiderStatus = () => {
  return useQuery({
    queryKey: riderKeys.status(),
    queryFn: () => riderApi.getStatus(),
    ...cacheConfig.realTime, // 30 second stale time
  });
};

/**
 * Hook to get rider earnings
 */
export const useRiderEarnings = (period: 'today' | 'week' | 'month' = 'today') => {
  return useQuery({
    queryKey: riderKeys.earnings(period),
    queryFn: () => riderApi.getEarnings(period),
    ...cacheConfig.analytics, // 5 minute stale time
  });
};

/**
 * Hook to get rider analytics summary
 */
export const useRiderAnalytics = () => {
  return useQuery({
    queryKey: riderKeys.analytics(),
    queryFn: () => analyticsAPI.getSummary(),
    ...cacheConfig.analytics,
  });
};

/**
 * Hook to get rider balance
 */
export const useRiderBalance = () => {
  return useQuery({
    queryKey: riderKeys.balance(),
    queryFn: () => analyticsAPI.getBalance(),
    ...cacheConfig.analytics,
  });
};

/**
 * Hook to update rider status
 */
export const useUpdateRiderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (isOnline: boolean) => riderApi.updateStatus(isOnline),
    
    // Optimistic update
    onMutate: async (isOnline) => {
      await queryClient.cancelQueries({ queryKey: riderKeys.status() });
      
      const previousStatus = queryClient.getQueryData<RiderStatus>(riderKeys.status());
      
      queryClient.setQueryData<RiderStatus>(riderKeys.status(), (old) => ({
        ...old!,
        status: isOnline ? 'online' : 'offline',
      }));
      
      return { previousStatus };
    },
    
    onError: (err, isOnline, context) => {
      if (context?.previousStatus) {
        queryClient.setQueryData(riderKeys.status(), context.previousStatus);
      }
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: riderKeys.status() });
    },
  });
};

/**
 * Hook to update rider location
 */
export const useUpdateLocation = () => {
  return useMutation({
    mutationFn: ({ latitude, longitude }: { latitude: number; longitude: number }) =>
      riderApi.updateLocation(latitude, longitude),
    
    // Don't retry location updates aggressively
    retry: 1,
  });
};

/**
 * Hook to update rider availability
 */
export const useUpdateAvailability = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (isAvailable: boolean) => riderApi.updateAvailability(isAvailable),
    
    onSuccess: () => {
      // Invalidate status to refetch updated availability
      queryClient.invalidateQueries({ queryKey: riderKeys.status() });
    },
  });
};