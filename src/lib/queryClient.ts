import { QueryClient } from '@tanstack/react-query';

/**
 * Mobile-optimized QueryClient configuration
 * 
 * React Query handles caching automatically in memory.
 * No need for AsyncStorage persistence for API data - it's designed to be fresh on app restart.
 * 
 * AsyncStorage should only be used for:
 * - Authentication tokens
 * - User preferences (theme, language)
 * - Settings that need to persist across app restarts
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      
      // Keep unused data in cache for 10 minutes before garbage collection
      gcTime: 10 * 60 * 1000,
      
      // Smart retry logic for mobile
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors like 401, 404)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Retry up to 3 times for network/server errors
        return failureCount < 3;
      },
      
      // Exponential backoff for retries
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Mobile-optimized refetch behavior
      refetchOnWindowFocus: false, // Disable for mobile apps
      refetchOnReconnect: true,    // Refetch when network reconnects
      refetchOnMount: true,        // Refetch when component mounts
      
      // Only make requests when online
      networkMode: 'online',
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      retryDelay: 1000,
      networkMode: 'online',
    },
  },
});

/**
 * Data-specific cache configurations
 */
export const cacheConfig = {
  // Real-time data (deliveries, rider status)
  realTime: {
    staleTime: 30 * 1000,        // 30 seconds
    gcTime: 2 * 60 * 1000,       // 2 minutes
    refetchInterval: 60 * 1000,   // Refetch every minute when active
  },
  
  // User data (profile, settings)
  userData: {
    staleTime: 10 * 60 * 1000,   // 10 minutes
    gcTime: 30 * 60 * 1000,      // 30 minutes
  },
  
  // Static data (restaurants, menus)
  staticData: {
    staleTime: 30 * 60 * 1000,   // 30 minutes
    gcTime: 60 * 60 * 1000,      // 1 hour
  },
  
  // Analytics and stats
  analytics: {
    staleTime: 5 * 60 * 1000,    // 5 minutes
    gcTime: 15 * 60 * 1000,      // 15 minutes
  },
};