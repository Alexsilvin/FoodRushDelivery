import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../services/authApi';
import { User } from '../types/api';
import { cacheConfig } from '../lib/queryClient';

// Query Keys
export const authKeys = {
  all: ['auth'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
  token: () => [...authKeys.all, 'token'] as const,
};

/**
 * Hook to get user profile
 */
export const useUserProfile = () => {
  return useQuery({
    queryKey: authKeys.profile(),
    queryFn: () => authApi.getProfile(),
    ...cacheConfig.userData, // 10 minute stale time
    retry: (failureCount, error: any) => {
      // Don't retry on 401 (unauthorized)
      if (error?.response?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

/**
 * Hook to check if user has valid token
 */
export const useAuthToken = () => {
  return useQuery({
    queryKey: authKeys.token(),
    queryFn: () => authApi.getStoredToken(),
    staleTime: Infinity, // Token doesn't become stale
    gcTime: Infinity,    // Keep token in cache
  });
};

/**
 * Hook to login
 */
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    
    onSuccess: (data) => {
      // Update auth cache
      queryClient.setQueryData(authKeys.profile(), data.user);
      queryClient.setQueryData(authKeys.token(), data.token);
      
      // Invalidate all queries to refetch with new auth
      queryClient.invalidateQueries();
    },
  });
};

/**
 * Hook to register
 */
export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: {
      fullName: string;
      email: string;
      password: string;
      phoneNumber: string;
    }) => authApi.register(userData),
    
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.profile(), data.user);
      queryClient.setQueryData(authKeys.token(), data.token);
      queryClient.invalidateQueries();
    },
  });
};

/**
 * Hook to register and apply
 */
export const useRegisterAndApply = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => authApi.registerAndApply(formData),
    
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.profile(), data.user);
      queryClient.setQueryData(authKeys.token(), data.token);
      queryClient.invalidateQueries();
    },
  });
};

/**
 * Hook to update profile
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: Partial<User>) => authApi.updateProfile(userData),
    
    onSuccess: (updatedUser) => {
      // Update profile cache immediately
      queryClient.setQueryData(authKeys.profile(), updatedUser);
    },
  });
};

/**
 * Hook to logout
 */
export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
    },
  });
};