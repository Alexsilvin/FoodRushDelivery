import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/authService';
import { User } from '../types/api';

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
    queryFn: authService.getProfile,
    staleTime: 10 * 60 * 1000, // 10 minutes
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
    queryFn: authService.getStoredToken,
    staleTime: Infinity, // Token doesn't become stale
    gcTime: Infinity,    // Keep token in cache
  });
};

/**
 * Hook to sign in with Google
 */
export const useGoogleSignIn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (idToken: string) => authService.googleSignIn(idToken),
    
    onSuccess: (data) => {
      // Update auth cache
      queryClient.setQueryData(authKeys.profile(), data.user);
      queryClient.setQueryData(authKeys.token(), data.accessToken);
      
      // Invalidate all queries to refetch with new auth
      queryClient.invalidateQueries();
    },
  });
};

/**
 * Hook to refresh token
 */
export const useRefreshToken = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.refreshToken,
    
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.token(), data.accessToken);
    },
  });
};

/**
 * Hook to update profile
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: Partial<User>) => authService.updateProfile(userData),
    
    onSuccess: (updatedUser) => {
      // Update profile cache immediately
      queryClient.setQueryData(authKeys.profile(), updatedUser);
    },
  });
};

/**
 * Hook to request password reset
 */
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (email: string) => authService.forgotPassword(email),
  });
};

/**
 * Hook to reset password
 */
export const useResetPassword = () => {
  return useMutation({
    mutationFn: ({ token, newPassword }: { token: string; newPassword: string }) =>
      authService.resetPassword(token, newPassword),
  });
};

/**
 * Hook to logout
 */
export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.logout,
    
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
    },
  });
};