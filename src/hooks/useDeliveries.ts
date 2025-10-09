import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deliveryApi } from '../services/deliveryApi';
import { DeliveryItem, DeliveryFilters } from '../types/deliveries';
import { cacheConfig } from '../lib/queryClient';

// Query Keys
export const deliveryKeys = {
  all: ['deliveries'] as const,
  my: (filters?: DeliveryFilters) => [...deliveryKeys.all, 'my', filters] as const,
  detail: (id: string) => [...deliveryKeys.all, 'detail', id] as const,
};

/**
 * Hook to fetch rider's deliveries
 * Uses the new /api/v1/deliveries/my endpoint
 */
export const useMyDeliveries = (filters?: DeliveryFilters) => {
  return useQuery({
    queryKey: deliveryKeys.my(filters),
    queryFn: () => deliveryApi.getMyDeliveries(filters),
    ...cacheConfig.realTime, // 30 second stale time, refetch every minute
    enabled: true, // Always enabled for authenticated users
  });
};

/**
 * Hook to fetch delivery details
 */
export const useDeliveryDetails = (deliveryId: string) => {
  return useQuery({
    queryKey: deliveryKeys.detail(deliveryId),
    queryFn: () => deliveryApi.getDeliveryDetails(deliveryId),
    ...cacheConfig.realTime,
    enabled: !!deliveryId,
  });
};

/**
 * Hook to accept a delivery with optimistic updates
 */
export const useAcceptDelivery = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deliveryId: string) => deliveryApi.acceptDelivery(deliveryId),
    
    // Optimistic update
    onMutate: async (deliveryId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: deliveryKeys.all });

      // Snapshot the previous value
      const previousDeliveries = queryClient.getQueryData<DeliveryItem[]>(deliveryKeys.my());

      // Optimistically update the cache
      queryClient.setQueryData<DeliveryItem[]>(deliveryKeys.my(), (old = []) => {
        return old.map(delivery =>
          delivery.id === deliveryId
            ? { ...delivery, status: 'accepted' as const }
            : delivery
        );
      });

      return { previousDeliveries };
    },
    
    onError: (err, deliveryId, context) => {
      // Rollback on error
      if (context?.previousDeliveries) {
        queryClient.setQueryData(deliveryKeys.my(), context.previousDeliveries);
      }
    },
    
    onSettled: () => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: deliveryKeys.all });
    },
  });
};

/**
 * Hook to mark delivery as picked up
 * Uses the new /api/v1/deliveries/{id}/pickup endpoint
 */
export const usePickupDelivery = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deliveryId: string) => deliveryApi.pickupDelivery(deliveryId),
    
    onMutate: async (deliveryId) => {
      await queryClient.cancelQueries({ queryKey: deliveryKeys.all });

      const previousDeliveries = queryClient.getQueryData<DeliveryItem[]>(deliveryKeys.my());

      queryClient.setQueryData<DeliveryItem[]>(deliveryKeys.my(), (old = []) => {
        return old.map(delivery =>
          delivery.id === deliveryId
            ? { ...delivery, status: 'picked_up' as const }
            : delivery
        );
      });

      return { previousDeliveries };
    },
    
    onError: (err, deliveryId, context) => {
      if (context?.previousDeliveries) {
        queryClient.setQueryData(deliveryKeys.my(), context.previousDeliveries);
      }
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: deliveryKeys.all });
    },
  });
};

/**
 * Hook to mark delivery as out for delivery
 * Uses the new /api/v1/deliveries/{id}/out-for-delivery endpoint
 */
export const useMarkOutForDelivery = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deliveryId: string) => deliveryApi.markOutForDelivery(deliveryId),
    
    onMutate: async (deliveryId) => {
      await queryClient.cancelQueries({ queryKey: deliveryKeys.all });

      const previousDeliveries = queryClient.getQueryData<DeliveryItem[]>(deliveryKeys.my());

      queryClient.setQueryData<DeliveryItem[]>(deliveryKeys.my(), (old = []) => {
        return old.map(delivery =>
          delivery.id === deliveryId
            ? { ...delivery, status: 'out_for_delivery' as const }
            : delivery
        );
      });

      return { previousDeliveries };
    },
    
    onError: (err, deliveryId, context) => {
      if (context?.previousDeliveries) {
        queryClient.setQueryData(deliveryKeys.my(), context.previousDeliveries);
      }
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: deliveryKeys.all });
    },
  });
};

/**
 * Hook to start a delivery (mark as picked up) - Legacy method
 */
export const useStartDelivery = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deliveryId: string) => deliveryApi.startDelivery(deliveryId),
    
    onMutate: async (deliveryId) => {
      await queryClient.cancelQueries({ queryKey: deliveryKeys.all });

      const previousDeliveries = queryClient.getQueryData<DeliveryItem[]>(deliveryKeys.my());

      queryClient.setQueryData<DeliveryItem[]>(deliveryKeys.my(), (old = []) => {
        return old.map(delivery =>
          delivery.id === deliveryId
            ? { ...delivery, status: 'picked_up' as const }
            : delivery
        );
      });

      return { previousDeliveries };
    },
    
    onError: (err, deliveryId, context) => {
      if (context?.previousDeliveries) {
        queryClient.setQueryData(deliveryKeys.my(), context.previousDeliveries);
      }
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: deliveryKeys.all });
    },
  });
};

/**
 * Hook to complete a delivery
 */
export const useCompleteDelivery = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deliveryId: string) => deliveryApi.completeDelivery(deliveryId),
    
    onMutate: async (deliveryId) => {
      await queryClient.cancelQueries({ queryKey: deliveryKeys.all });

      const previousDeliveries = queryClient.getQueryData<DeliveryItem[]>(deliveryKeys.my());

      queryClient.setQueryData<DeliveryItem[]>(deliveryKeys.my(), (old = []) => {
        return old.map(delivery =>
          delivery.id === deliveryId
            ? { ...delivery, status: 'delivered' as const }
            : delivery
        );
      });

      return { previousDeliveries };
    },
    
    onError: (err, deliveryId, context) => {
      if (context?.previousDeliveries) {
        queryClient.setQueryData(deliveryKeys.my(), context.previousDeliveries);
      }
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: deliveryKeys.all });
    },
  });
};

/**
 * Hook to update delivery status
 */
export const useUpdateDeliveryStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ deliveryId, status }: { deliveryId: string; status: string }) => 
      deliveryApi.updateDeliveryStatus(deliveryId, status),
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deliveryKeys.all });
    },
  });
};

/**
 * Utility hook to invalidate all delivery queries
 */
export const useInvalidateDeliveries = () => {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: deliveryKeys.all });
  };
};