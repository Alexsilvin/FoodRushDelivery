import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deliveryService } from '../services/deliveryService';
import { Delivery } from '../types/api';

// Query Keys
export const deliveryKeys = {
  all: ['deliveries'] as const,
  my: (params?: any) => [...deliveryKeys.all, 'my', params] as const,
  byId: (id: string) => [...deliveryKeys.all, 'byId', id] as const,
};

/**
 * Hook to get my deliveries
 */
export const useMyDeliveries = (params?: {
  page?: number;
  limit?: number;
  status?: string;
}) => {
  return useQuery({
    queryKey: deliveryKeys.my(params),
    queryFn: () => deliveryService.getMyDeliveries(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
    retry: 2,
  });
};

/**
 * Hook to get delivery by ID
 */
export const useDeliveryById = (deliveryId: string) => {
  return useQuery({
    queryKey: deliveryKeys.byId(deliveryId),
    queryFn: () => deliveryService.getDeliveryById(deliveryId),
    staleTime: 3 * 60 * 1000, // 3 minutes (increased from 1 minute)
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    enabled: !!deliveryId,
  });
};

/**
 * Hook to accept delivery
 */
export const useAcceptDelivery = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deliveryId: string) => deliveryService.acceptDelivery(deliveryId),
    
    onSuccess: (updatedDelivery) => {
      // Update the specific delivery in cache
      queryClient.setQueryData(
        deliveryKeys.byId(updatedDelivery.id),
        updatedDelivery
      );
      
      // Invalidate my deliveries list
      queryClient.invalidateQueries({ queryKey: deliveryKeys.my() });
    },
  });
};

/**
 * Hook to mark delivery as picked up
 */
export const useMarkPickedUp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deliveryId: string) => deliveryService.markPickedUp(deliveryId),
    
    onSuccess: (updatedDelivery) => {
      // Update the specific delivery in cache
      queryClient.setQueryData(
        deliveryKeys.byId(updatedDelivery.id),
        updatedDelivery
      );
      
      // Invalidate my deliveries list
      queryClient.invalidateQueries({ queryKey: deliveryKeys.my() });
    },
  });
};

/**
 * Hook to mark delivery as out for delivery
 */
export const useMarkOutForDelivery = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deliveryId: string) => deliveryService.markOutForDelivery(deliveryId),
    
    onSuccess: (updatedDelivery) => {
      // Update the specific delivery in cache
      queryClient.setQueryData(
        deliveryKeys.byId(updatedDelivery.id),
        updatedDelivery
      );
      
      // Invalidate my deliveries list
      queryClient.invalidateQueries({ queryKey: deliveryKeys.my() });
    },
  });
};

/**
 * Hook to mark delivery as delivered
 */
export const useMarkDelivered = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deliveryId: string) => deliveryService.markDelivered(deliveryId),
    
    onSuccess: (updatedDelivery) => {
      // Update the specific delivery in cache
      queryClient.setQueryData(
        deliveryKeys.byId(updatedDelivery.id),
        updatedDelivery
      );
      
      // Invalidate my deliveries list and earnings
      queryClient.invalidateQueries({ queryKey: deliveryKeys.my() });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
};

/**
 * Hook to estimate delivery fee
 */
export const useEstimateDeliveryFee = (params: {
  restaurantId: string;
  lat: number;
  lng: number;
  orderTotal: number;
}) => {
  return useQuery({
    queryKey: [...deliveryKeys.all, 'estimate', params],
    queryFn: () => deliveryService.estimateDeliveryFee(params),
    staleTime: 5 * 60 * 1000, // 5 minutes - delivery fees don't change often
    enabled: !!(params.restaurantId && params.lat && params.lng && params.orderTotal),
  });
};