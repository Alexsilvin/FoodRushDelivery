import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { riderService } from '../services/riderService';
import { User, RiderStatus, Delivery } from '../types/api';

// Query Keys
export const riderKeys = {
  all: ['rider'] as const,
  account: () => [...riderKeys.all, 'account'] as const,
  status: () => [...riderKeys.all, 'status'] as const,
  deliveries: () => [...riderKeys.all, 'deliveries'] as const,
  currentDeliveries: () => [...riderKeys.deliveries(), 'current'] as const,
  deliveryHistory: (params?: any) => [...riderKeys.deliveries(), 'history', params] as const,
  earnings: (params?: any) => [...riderKeys.all, 'earnings', params] as const,
  riders: (params?: any) => [...riderKeys.all, 'list', params] as const,
};

// ====================== AUTHENTICATION HOOKS ======================

/**
 * Hook to register and apply as rider
 */
export const useRegisterAndApply = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => riderService.registerAndApply(formData),
    
    onSuccess: (data) => {
      queryClient.setQueryData(riderKeys.account(), data.user);
      queryClient.invalidateQueries();
    },
  });
};

/**
 * Hook to login as rider
 */
export const useRiderLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      riderService.login(email, password),
    
    onSuccess: (data) => {
      queryClient.setQueryData(riderKeys.account(), data.user);
      queryClient.invalidateQueries();
    },
  });
};

/**
 * Hook to register as rider
 */
export const useRiderRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: {
      fullName: string;
      email: string;
      password: string;
      phoneNumber: string;
    }) => riderService.register(userData),
    
    onSuccess: (data) => {
      queryClient.setQueryData(riderKeys.account(), data.user);
      queryClient.invalidateQueries();
    },
  });
};

/**
 * Hook to apply to become a rider
 */
export const useApplyToRider = () => {
  return useMutation({
    mutationFn: (applicationData?: any) => riderService.apply(applicationData),
  });
};

// ====================== ACCOUNT MANAGEMENT HOOKS ======================

/**
 * Hook to get rider account
 */
export const useRiderAccount = () => {
  return useQuery({
    queryKey: riderKeys.account(),
    queryFn: riderService.getMyAccount,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to update availability
 */
export const useUpdateAvailability = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (availability: { available: boolean; schedule?: any }) =>
      riderService.updateAvailability(availability),
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: riderKeys.account() });
      queryClient.invalidateQueries({ queryKey: riderKeys.status() });
    },
  });
};

/**
 * Hook to update location
 */
export const useUpdateLocation = () => {
  return useMutation({
    mutationFn: ({ latitude, longitude }: { latitude: number; longitude: number }) =>
      riderService.updateMyLocation(latitude, longitude),
  });
};

/**
 * Hook to update location (alias)
 */
export const useUpdateLocationAlias = () => {
  return useMutation({
    mutationFn: ({ latitude, longitude }: { latitude: number; longitude: number }) =>
      riderService.updateLocation(latitude, longitude),
  });
};

/**
 * Hook to update vehicle
 */
export const useUpdateVehicle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vehicleData: any) => riderService.updateVehicle(vehicleData),
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: riderKeys.account() });
    },
  });
};

// ====================== STATUS HOOKS ======================

/**
 * Hook to get rider status
 */
export const useRiderStatus = () => {
  return useQuery({
    queryKey: riderKeys.status(),
    queryFn: riderService.getStatus,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};

/**
 * Hook to update rider status
 */
export const useUpdateRiderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (isOnline: boolean) => riderService.updateStatus(isOnline),
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: riderKeys.status() });
    },
  });
};

// ====================== DELIVERY HOOKS ======================

/**
 * Hook to get current deliveries
 */
export const useCurrentDeliveries = () => {
  return useQuery({
    queryKey: riderKeys.currentDeliveries(),
    queryFn: riderService.getCurrentDeliveries,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};

/**
 * Hook to get delivery history
 */
export const useDeliveryHistory = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: riderKeys.deliveryHistory(params),
    queryFn: () => riderService.getDeliveryHistory(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to accept delivery
 */
export const useAcceptDelivery = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deliveryId: string) => riderService.acceptDelivery(deliveryId),
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: riderKeys.currentDeliveries() });
      queryClient.invalidateQueries({ queryKey: riderKeys.deliveryHistory() });
    },
  });
};

/**
 * Hook to start delivery
 */
export const useStartDelivery = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deliveryId: string) => riderService.startDelivery(deliveryId),
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: riderKeys.currentDeliveries() });
    },
  });
};

/**
 * Hook to complete delivery
 */
export const useCompleteDelivery = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deliveryId: string) => riderService.completeDelivery(deliveryId),
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: riderKeys.currentDeliveries() });
      queryClient.invalidateQueries({ queryKey: riderKeys.deliveryHistory() });
      queryClient.invalidateQueries({ queryKey: riderKeys.earnings() });
    },
  });
};

// ====================== EARNINGS HOOKS ======================

/**
 * Hook to get earnings
 */
export const useRiderEarnings = (params?: {
  period?: 'today' | 'week' | 'month';
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: riderKeys.earnings(params),
    queryFn: () => riderService.getEarnings(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// ====================== RIDER LIST HOOKS ======================

/**
 * Hook to get riders list
 */
export const useRidersList = (params?: {
  available?: boolean;
  latitude?: number;
  longitude?: number;
  radius?: number;
}) => {
  return useQuery({
    queryKey: riderKeys.riders(params),
    queryFn: () => riderService.listRiders(params),
    staleTime: 60 * 1000, // 1 minute
    enabled: !!params, // Only run if params are provided
  });
};