import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: string;
  notes?: string;
}

export default function DeliveryDetailsScreen({ route, navigation }: any) {
  const { deliveryId } = route.params;
  const [delivery, setDelivery] = useState<DeliveryDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDeliveryDetails = () => {
      // Mock delivery details - in real app, fetch from API
      const mockDelivery: DeliveryDetails = {
        id: deliveryId,
        customerName: 'Sarah Johnson',
        customerPhone: '+1 (555) 123-4567',
        address: '123 Oak Street, Apt 4B, Downtown, NY 10001',
        distance: '2.5 km',
        payment: '$12.50',
        restaurant: 'Pizza Palace',
        restaurantPhone: '+1 (555) 987-6543',
        restaurantAddress: '456 Main Street, Downtown, NY 10001',
        status: 'pending',
        estimatedTime: '25 min',
        orderTotal: '$28.50',
        deliveryFee: '$3.99',
        tip: '$5.00',
        specialInstructions: 'Extra cheese, no onions',
        deliveryInstructions: 'Ring doorbell twice. Apartment is on the 4th floor.',
        coordinates: {
          lat: 40.7589,
          lng: -73.9851,
        },
        orderItems: [
          {
            id: '1',
            name: 'Large Pepperoni Pizza',
            quantity: 1,
            price: '$18.99',
            notes: 'Extra cheese, no onions',
          },
          {
            id: '2',
            name: 'Caesar Salad',
            quantity: 1,
            price: '$8.99',
          },
          {
            id: '3',
            name: 'Coca Cola (500ml)',
            quantity: 2,
            price: '$3.99',
          },
        ],
      };

      setTimeout(() => {
        setDelivery(mockDelivery);
        setLoading(false);
      }, 500);
    };

    loadDeliveryDetails();
  }, [deliveryId]);

  const handleCall = (phoneNumber: string, name: string) => {
    Alert.alert(
      `Call ${name}`,
      `Do you want to call ${phoneNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => Linking.openURL(`tel:${phoneNumber}`),
        },
      ]
    );
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
              setDelivery({ ...delivery, status: 'accepted' });
              Alert.alert('Success', 'Delivery accepted! You can now start navigation.');
            },
          },
        ]
      );
    }
  };

  const handleStartNavigation = () => {
    if (delivery) {
      const url = `https://maps.google.com/maps?daddr=${delivery.coordinates.lat},${delivery.coordinates.lng}`;
      Linking.openURL(url);
    }
  };

  const handleUpdateStatus = (newStatus: 'picked_up' | 'delivered') => {
    if (delivery) {
      const statusText = newStatus === 'picked_up' ? 'Picked Up' : 'Delivered';
      Alert.alert(
        `Mark as ${statusText}`,
        `Are you sure you want to mark this delivery as ${statusText.toLowerCase()}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            onPress: () => {
              setDelivery({ ...delivery, status: newStatus });
              Alert.alert('Success', `Delivery marked as ${statusText.toLowerCase()}!`);
              if (newStatus === 'delivered') {
                setTimeout(() => navigation.goBack(), 1500);
              }
            },
          },
        ]
      );
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="bicycle" size={48} color="#1E40AF" />
        <Text style={styles.loadingText}>Loading delivery details...</Text>
      </View>
    );
  }

  if (!delivery) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Delivery not found</Text>
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1E40AF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Details</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(delivery.status) }]}>
          <Text style={styles.statusText}>{getStatusText(delivery.status)}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.customerCard}>
            <View style={styles.customerHeader}>
              <Text style={styles.customerName}>{delivery.customerName}</Text>
              <TouchableOpacity
                style={styles.callButton}
                onPress={() => handleCall(delivery.customerPhone, delivery.customerName)}
              >
                <Ionicons name="call" size={20} color="#1E40AF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.customerPhone}>{delivery.customerPhone}</Text>
            <View style={styles.addressContainer}>
              <Ionicons name="location" size={16} color="#6B7280" />
              <Text style={styles.address}>{delivery.address}</Text>
            </View>
            {delivery.deliveryInstructions && (
              <View style={styles.instructionsContainer}>
                <Ionicons name="information-circle" size={16} color="#F59E0B" />
                <Text style={styles.instructions}>{delivery.deliveryInstructions}</Text>
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
                onPress={() => handleCall(delivery.restaurantPhone, delivery.restaurant)}
              >
                <Ionicons name="call" size={20} color="#1E40AF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.restaurantAddress}>{delivery.restaurantAddress}</Text>
          </View>
        </View>

        {/* Order Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Details</Text>
          <View style={styles.orderCard}>
            {delivery.orderItems.map((item) => (
              <View key={item.id} style={styles.orderItem}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.quantity}x {item.name}</Text>
                  {item.notes && (
                    <Text style={styles.itemNotes}>{item.notes}</Text>
                  )}
                </View>
                <Text style={styles.itemPrice}>{item.price}</Text>
              </View>
            ))}
            
            {delivery.specialInstructions && (
              <View style={styles.specialInstructions}>
                <Text style={styles.specialInstructionsTitle}>Special Instructions:</Text>
                <Text style={styles.specialInstructionsText}>{delivery.specialInstructions}</Text>
              </View>
            )}

            <View style={styles.orderSummary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>{delivery.orderTotal}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery Fee</Text>
                <Text style={styles.summaryValue}>{delivery.deliveryFee}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tip</Text>
                <Text style={styles.summaryValue}>{delivery.tip}</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Your Earnings</Text>
                <Text style={styles.totalValue}>{delivery.payment}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Delivery Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Information</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="car" size={24} color="#1E40AF" />
              <Text style={styles.statValue}>{delivery.distance}</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="time" size={24} color="#1E40AF" />
              <Text style={styles.statValue}>{delivery.estimatedTime}</Text>
              <Text style={styles.statLabel}>Est. Time</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="cash" size={24} color="#059669" />
              <Text style={styles.statValue}>{delivery.payment}</Text>
              <Text style={styles.statLabel}>Earnings</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {delivery.status === 'pending' && (
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={handleAcceptDelivery}
          >
            <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
            <Text style={styles.acceptButtonText}>Accept Delivery</Text>
          </TouchableOpacity>
        )}

        {delivery.status === 'accepted' && (
          <>
            <TouchableOpacity
              style={styles.navigationButton}
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
    backgroundColor: '#F9FAFB',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  customerCard: {
    backgroundColor: '#FFFFFF',
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
    color: '#111827',
  },
  customerPhone: {
    fontSize: 16,
    color: '#6B7280',
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
    color: '#111827',
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
    color: '#92400E',
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
    backgroundColor: '#FFFFFF',
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
    color: '#111827',
    marginBottom: 4,
  },
  itemNotes: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
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
    color: '#1E40AF',
    marginBottom: 4,
  },
  specialInstructionsText: {
    fontSize: 14,
    color: '#1E40AF',
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
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 16,
    color: '#111827',
  },
  totalRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
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
    color: '#6B7280',
    textAlign: 'center',
  },
  actionButtons: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  acceptButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#059669',
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
    backgroundColor: '#1E40AF',
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
    color: '#6B7280',
    marginTop: 16,
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    marginTop: 16,
  },
});
