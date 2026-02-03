import { useMemo, useCallback } from 'react';

/**
 * Haversine formula to calculate distance between two coordinates
 * Returns distance in meters
 */
export const calculateDistance = (
  coord1: { latitude: number; longitude: number },
  coord2: { latitude: number; longitude: number }
): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const dLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;
  const lat1 = (coord1.latitude * Math.PI) / 180;
  const lat2 = (coord2.latitude * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Custom hook for distance calculations with memoization
 */
export const useDistanceCalculation = (
  currentLocation: { latitude: number; longitude: number } | null
) => {
  const calculateDistanceToPoint = useCallback(
    (targetLocation: { latitude: number; longitude: number }): number => {
      if (!currentLocation) return 0;
      return calculateDistance(currentLocation, targetLocation);
    },
    [currentLocation]
  );

  const formatDistance = useCallback((meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  }, []);

  return { calculateDistanceToPoint, formatDistance };
};

/**
 * Hook for sorting deliveries by distance
 */
export const useSortedDeliveries = <T extends { lat: number; lng: number }>(
  deliveries: T[],
  currentLocation: { latitude: number; longitude: number } | null
) => {
  return useMemo(() => {
    if (!currentLocation || !deliveries.length) return deliveries;

    return [...deliveries].sort((a, b) => {
      const distA = calculateDistance(currentLocation, { latitude: a.lat, longitude: a.lng });
      const distB = calculateDistance(currentLocation, { latitude: b.lat, longitude: b.lng });
      return distA - distB;
    });
  }, [deliveries, currentLocation]);
};
