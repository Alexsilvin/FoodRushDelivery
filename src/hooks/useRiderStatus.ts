import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { riderApi } from '../services';
import { RiderStatus } from '../types/api';

/**
 * React Query hooks for rider status management
 */

// Query keys
const QUERY_KEYS = {
  status: ['rider', 'status'] as const,
};

/**
 * Get rider status
 */
export const useRiderStatus = () => {
  return useQuery({
    queryKey: QUERY_KEYS.status,
    queryFn: riderApi.getStatus,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};

/**
 * Update rider online/offline status
 */
export const useUpdateRiderStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (isOnline: boolean) => riderApi.updateStatus(isOnline),
    onSuccess: () => {
      // Invalidate and refetch status after successful update
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.status });
    },
  });
};

/**
 * Update rider availability (legacy)
 */
export const useUpdateRiderAvailability = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (available: boolean) => riderApi.updateAvailability(available),
    onSuccess: () => {
      // Invalidate and refetch status
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.status });
    },
  });
};