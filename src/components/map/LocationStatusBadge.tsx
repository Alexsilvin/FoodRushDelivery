import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LocationStatusBadgeProps {
  isInitializing: boolean;
  isLocationTracking: boolean;
  formatLastUpdate: () => string;
  updateFrequency: number;
}

const LocationStatusBadge = React.memo<LocationStatusBadgeProps>(({
  isInitializing,
  isLocationTracking,
  formatLastUpdate,
  updateFrequency,
}) => {
  if (isInitializing) {
    return (
      <View style={[styles.statusBadge, styles.statusBadgeInitializing]}>
        <ActivityIndicator size="small" color="#3B82F6" />
        <Text style={styles.statusBadgeText}>Initializing...</Text>
      </View>
    );
  }

  if (!isLocationTracking) {
    return (
      <View style={[styles.statusBadge, styles.statusBadgeInactive]}>
        <Ionicons name="radio-button-off" size={12} color="#FFFFFF" />
        <Text style={styles.statusBadgeText}>Inactive</Text>
      </View>
    );
  }

  return (
    <View style={[styles.statusBadge, styles.statusBadgeActive]}>
      <Ionicons name="radio-button-on" size={12} color="#FFFFFF" />
      <Text style={styles.statusBadgeText}>
        Tracking • {formatLastUpdate()} • {updateFrequency}/min
      </Text>
    </View>
  );
});

LocationStatusBadge.displayName = 'LocationStatusBadge';

const styles = StyleSheet.create({
  statusBadge: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  statusBadgeActive: {
    backgroundColor: '#10B981',
  },
  statusBadgeInactive: {
    backgroundColor: '#6B7280',
  },
  statusBadgeInitializing: {
    backgroundColor: '#3B82F6',
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default LocationStatusBadge;
