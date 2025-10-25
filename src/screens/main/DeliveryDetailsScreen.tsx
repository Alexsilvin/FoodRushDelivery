import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useDeliveryById } from '../../hooks/useDeliveries';
import { useCall } from '../../contexts/CallContext';
import * as Location from 'expo-location';

interface DeliveryDetails {
  id: string;
  customerName: string;
  customerPhone: string;
  address: string;
  distance: string;
  payment: string;
  restaurant: string;
  restaurantPhone: string;
  restaurantAddress: string;
  status: 'pending' | 'accepted' | 'picked_up' | 'delivered';
  estimatedTime: string;
  orderItems: OrderItem[];
  specialInstructions?: string;
  deliveryInstructions?: string;
  orderTotal: string;
  deliveryFee: string;
  tip: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

import { OrderLine } from '../../types/api';

interface OrderItem extends OrderLine {
  // Backward compatibility alias; keeps local naming while using normalized fields
  price: number; // Ensure numeric in this screen
}

export default function DeliveryDetailsScreen({ route, navigation }: any) {
  const { theme } = useTheme();
  const { deliveryId } = route.params;
  const { data: apiDelivery, isLoading, error } = useDeliveryById(deliveryId);

  // Map API delivery to local interface
  const delivery = apiDelivery ? {
    id: apiDelivery.id ?? '',
    customerName: apiDelivery.customerName ?? '',
    customerPhone: apiDelivery.customerPhone ?? '',
    address: apiDelivery.address ?? '',
    distance: apiDelivery.distance ?? '',
    payment: apiDelivery.payment ?? '',
    restaurant: apiDelivery.restaurant ?? '',
    restaurantPhone: apiDelivery.restaurantPhone ?? '',
    restaurantAddress: apiDelivery.restaurantAddress ?? '',
    status: (apiDelivery.status as 'pending' | 'accepted' | 'picked_up' | 'delivered'),
    estimatedTime: apiDelivery.estimatedTime ?? '',
    orderTotal: apiDelivery.orderTotal ?? '',
    deliveryFee: apiDelivery.deliveryFee ?? '',
    tip: apiDelivery.tip ?? '',
    specialInstructions: apiDelivery.specialInstructions ?? '',
    deliveryInstructions: apiDelivery.deliveryInstructions ?? '',
    coordinates: {
      lat: apiDelivery.dropoffLat ?? apiDelivery.lat ?? 0,
      lng: apiDelivery.dropoffLng ?? apiDelivery.lng ?? 0,
    },
    orderItems: Array.isArray(apiDelivery.orderItems) ? (apiDelivery.orderItems as any as OrderItem[]).map(i => ({ ...i, price: Number(i.price || 0) })) : [],
  } : null;

  // Phone call UI removed. If needed, use Linking.openURL in a separate action button.

  const handleCustomerNamePress = () => {
    if (delivery) {
      navigation.navigate('CustomerProfile', {
        customer: {
          id: delivery.id,
          name: delivery.customerName,
          phone: delivery.customerPhone,
          email: 'customer@example.com',
          address: delivery.address,
          deliveryInstructions: delivery.deliveryInstructions,
          rating: 4.8,
          totalDeliveries: 23,
          preferredPayment: 'Credit Card',
          location: {
            latitude: delivery.coordinates.lat,
            longitude: delivery.coordinates.lng,
          },
        },
      });
    }
  };

  const handleAddressPress = () => {
    if (delivery) {
      navigation.navigate('Map', {
        deliveryId: delivery.id,
      } as import('../../types/navigation.types').MapScreenParams);
    }
  };

  const handleAcceptDelivery = () => {
    if (delivery) {
      Alert.alert(
        'Accept Delivery',
        'Are you sure you want to accept this delivery?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Accept',
            onPress: () => {
              // TODO: Use accept delivery mutation hook
              Alert.alert('Success', 'Delivery accepted! You can now start navigation.');
            },
          },
        ]
      );
    }
  };

  const handleStartNavigation = async () => {
    if (delivery) {
      try {
        // Request location permissions and get the current location
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required to start navigation.');
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const driverLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        // Mock restaurant coordinates (in real app, this would come from API)
        const restaurantCoords = {
          latitude: 40.7505, // Restaurant location (different from customer)
          longitude: -73.9934,
        };

        // Navigate to the MapScreen with proper restaurant and customer locations
        navigation.navigate('Map', {
          driverLocation,
          restaurantLocation: restaurantCoords,
          customerLocation: {
            latitude: delivery.coordinates.lat,
            longitude: delivery.coordinates.lng,
          },
          deliveryId: delivery.id,
          deliveryStatus: delivery.status,
          navigationMode: 'toRestaurant',
          customerName: delivery.customerName,
          restaurantName: delivery.restaurant,
        } as import('../../types/navigation.types').MapScreenParams);
      } catch (error) {
        console.error('Error fetching location:', error);
        Alert.alert('Error', 'Unable to fetch your current location. Please try again.');
      }
    }
  };

  const handleUpdateStatus = async (newStatus: 'picked_up' | 'delivered') => {
    if (delivery) {
      const statusText = newStatus === 'picked_up' ? 'Picked Up' : 'Delivered';
      Alert.alert(
        `Mark as ${statusText}`,
        `Are you sure you want to mark this delivery as ${statusText.toLowerCase()}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            onPress: async () => {
              // TODO: Use appropriate mutation hook based on status
              
              if (newStatus === 'picked_up') {
                // Navigate to customer location after pickup
                try {
                  const { status } = await Location.requestForegroundPermissionsAsync();
                  if (status === 'granted') {
                    const location = await Location.getCurrentPositionAsync({
                      accuracy: Location.Accuracy.High,
                    });

                    const driverLocation = {
                      latitude: location.coords.latitude,
                      longitude: location.coords.longitude,
                    };

                    // Navigate to customer location
                    navigation.navigate('Map', {
                      driverLocation,
                      customerLocation: {
                        latitude: delivery.coordinates.lat,
                        longitude: delivery.coordinates.lng,
                      },
                      deliveryId: delivery.id,
                      deliveryStatus: 'picked_up',
                      navigationMode: 'toCustomer',
                      customerName: delivery.customerName,
                      restaurantName: delivery.restaurant,
                    } as import('../../types/navigation.types').MapScreenParams);
                  }
                } catch (error) {
                  console.error('Error getting location for customer navigation:', error);
                  Alert.alert('Success', `Delivery marked as ${statusText.toLowerCase()}!`);
                }
              } else {
                Alert.alert('Success', `Delivery marked as ${statusText.toLowerCase()}!`);
                if (newStatus === 'delivered') {
                  setTimeout(() => navigation.goBack(), 1500);
                }
              }
            },
          },
        ]
      );
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <Ionicons name="bicycle" size={48} color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading delivery details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text style={[styles.errorText, { color: theme.colors.text }]}>Failed to load delivery details</Text>
        <Text style={[styles.errorText, { color: theme.colors.textSecondary, fontSize: 14, marginTop: 8 }]}>
          {error.message || 'Please try again later'}
        </Text>
      </View>
    );
  }

  if (!delivery) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text style={[styles.errorText, { color: theme.colors.text }]}>Delivery not found</Text>
      </View>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'accepted': return '#3B82F6';
      case 'picked_up': return '#8B5CF6';
      case 'delivered': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'accepted': return 'Accepted';
      case 'picked_up': return 'Picked Up';
      case 'delivered': return 'Delivered';
      default: return status;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Back Button and Status at top of content */}
        <View style={styles.topSection}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(delivery.status) }]}>
            <Text style={styles.statusText}>{getStatusText(delivery.status)}</Text>
          </View>
        </View>
        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Customer Information</Text>
          <View style={[styles.customerCard, { backgroundColor: theme.colors.card }]}>
            <View style={styles.customerHeader}>
              <TouchableOpacity onPress={handleCustomerNamePress}>
                <Text style={[styles.customerName, { color: theme.colors.text }]}>{delivery.customerName}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.callButton}
                // Phone call UI removed. If needed, use Linking.openURL in a separate action button.
              >
                <Ionicons name="call" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.customerPhone, { color: theme.colors.textSecondary }]}>{delivery.customerPhone}</Text>
            <TouchableOpacity style={styles.addressContainer} onPress={handleAddressPress}>
              <Ionicons name="location" size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.address, { color: theme.colors.textSecondary }]}>{delivery.address}</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            {delivery.deliveryInstructions && (
              <View style={styles.instructionsContainer}>
                <Ionicons name="information-circle" size={16} color="#F59E0B" />
                <Text style={[styles.instructions, { color: theme.colors.text }]}>{delivery.deliveryInstructions}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Restaurant Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restaurant Information</Text>
          <View style={styles.restaurantCard}>
            <View style={styles.restaurantHeader}>
              <Text style={styles.restaurantName}>{delivery.restaurant}</Text>
              <TouchableOpacity
                style={styles.callButton}
                // Phone call UI removed. If needed, use Linking.openURL in a separate action button.
              >
                <Ionicons name="call" size={20} color="#1E40AF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.restaurantAddress}>{delivery.restaurantAddress}</Text>
          </View>
        </View>

        {/* Order Details */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Order Details</Text>
          <View style={[styles.orderCard, { backgroundColor: theme.colors.card }]}>
            {Array.isArray(delivery.orderItems) && delivery.orderItems.length > 0 && (
              delivery.orderItems.map((item) => (
                <View key={item.id} style={styles.orderItem}>
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, { color: theme.colors.text }]}>{item.quantity}x {item.name}</Text>
                    {item.notes && (
                      <Text style={[styles.itemNotes, { color: theme.colors.textSecondary }]}>{item.notes}</Text>
                    )}
                  </View>
                  <Text style={[styles.itemPrice, { color: theme.colors.text }]}>${item.price.toFixed(2)}</Text>
                </View>
              ))
            )}
            
            {delivery.specialInstructions && (
              <View style={styles.specialInstructions}>
                <Text style={[styles.specialInstructionsTitle, { color: theme.colors.text }]}>Special Instructions:</Text>
                <Text style={[styles.specialInstructionsText, { color: theme.colors.textSecondary }]}>{delivery.specialInstructions}</Text>
              </View>
            )}

            <View style={styles.orderSummary}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Subtotal</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{delivery.orderTotal}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Delivery Fee</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{delivery.deliveryFee}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Tip</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{delivery.tip}</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={[styles.totalLabel, { color: theme.colors.text }]}>Your Earnings</Text>
                <Text style={[styles.totalValue, { color: theme.colors.primary }]}>{delivery.payment}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Delivery Stats */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Delivery Information</Text>
          <View style={[styles.statsContainer, { backgroundColor: theme.colors.card }]}>
            <View style={styles.statItem}>
              <Ionicons name="car" size={24} color={theme.colors.primary} />
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{delivery.distance}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Distance</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="time" size={24} color={theme.colors.primary} />
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{delivery.estimatedTime}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Est. Time</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="cash" size={24} color="#059669" />
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{delivery.payment}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Earnings</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons - Positioned absolutely at bottom */}
      <View style={[styles.actionButtonsContainer, { backgroundColor: theme.colors.surface }]}>
        {delivery.status === 'pending' && (
          <TouchableOpacity
            style={[styles.acceptButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleAcceptDelivery}
          >
            <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
            <Text style={styles.acceptButtonText}>Accept Delivery</Text>
          </TouchableOpacity>
        )}

        {delivery.status === 'accepted' && (
          <>
            <TouchableOpacity
              style={[styles.navigationButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleStartNavigation}
            >
              <Ionicons name="navigate" size={24} color="#FFFFFF" />
              <Text style={styles.navigationButtonText}>Start Navigation</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.pickupButton}
              onPress={() => handleUpdateStatus('picked_up')}
            >
              <Ionicons name="bag-check" size={24} color="#FFFFFF" />
              <Text style={styles.pickupButtonText}>Mark as Picked Up</Text>
            </TouchableOpacity>
          </>
        )}

        {delivery.status === 'picked_up' && (
          <TouchableOpacity
            style={styles.deliveredButton}
            onPress={() => handleUpdateStatus('delivered')}
          >
            <Ionicons name="checkmark-done" size={24} color="#FFFFFF" />
            <Text style={styles.deliveredButtonText}>Mark as Delivered</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  scrollContent: {
    paddingBottom: 120, // Extra padding for absolutely positioned action buttons
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  customerCard: {
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  customerPhone: {
    fontSize: 16,
    marginBottom: 12,
  },
  callButton: {
    padding: 8,
    backgroundColor: '#EBF4FF',
    borderRadius: 8,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  address: {
    fontSize: 16,
    marginLeft: 8,
    flex: 1,
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
  },
  instructions: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  restaurantCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  restaurantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  restaurantAddress: {
    fontSize: 16,
    color: '#6B7280',
  },
  orderCard: {
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemNotes: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  specialInstructions: {
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  specialInstructionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  specialInstructionsText: {
    fontSize: 14,
  },
  orderSummary: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
  },
  summaryValue: {
    fontSize: 16,
  },
  totalRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  actionButtons: {
    padding: 20,
    borderTopWidth: 1,
  },
  acceptButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  acceptButtonText: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  navigationButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  navigationButtonText: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  pickupButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 12,
  },
  pickupButtonText: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  deliveredButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
  },
  deliveredButtonText: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loadingText: {
    fontSize: 18,
    marginTop: 16,
  },
  errorText: {
    fontSize: 18,
    marginTop: 16,
  },
  actionButtonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16, // Account for home indicator on iOS
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
});
