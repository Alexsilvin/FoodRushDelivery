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
import { useTheme } from '../../contexts/ThemeContext';
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

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: string;
  notes?: string;
}

export default function DeliveryDetailsScreen({ route, navigation }: any) {
  const { theme } = useTheme();
  const { startCall } = useCall();
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
      `How would you like to call ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Voice Call',
          onPress: () => startCall(name, 'voice'),
        },
        {
          text: 'Video Call',
          onPress: () => startCall(name, 'video'),
        },
        {
          text: 'Phone Call',
          onPress: () => Linking.openURL(`tel:${phoneNumber}`),
        },
      ]
    );
  };

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
        targetLocation: {
          latitude: delivery.coordinates.lat,
          longitude: delivery.coordinates.lng,
        },
        customerName: delivery.customerName,
        address: delivery.address,
      });
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
              setDelivery({ ...delivery, status: 'accepted' });
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

        // Navigate to the MapScreen with the required parameters
        navigation.navigate('Map', {
          driverLocation,
          restaurantLocation: {
            latitude: delivery.coordinates.lat,
            longitude: delivery.coordinates.lng,
          },
          customerLocation: {
            latitude: delivery.coordinates.lat,
            longitude: delivery.coordinates.lng,
          },
        });
      } catch (error) {
        console.error('Error fetching location:', error);
        Alert.alert('Error', 'Unable to fetch your current location. Please try again.');
      }
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
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <Ionicons name="bicycle" size={48} color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading delivery details...</Text>
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
      <ScrollView style={styles.content}>
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
                onPress={() => handleCall(delivery.customerPhone, delivery.customerName)}
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
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Order Details</Text>
          <View style={[styles.orderCard, { backgroundColor: theme.colors.card }]}>
            {delivery.orderItems.map((item) => (
              <View key={item.id} style={styles.orderItem}>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { color: theme.colors.text }]}>{item.quantity}x {item.name}</Text>
                  {item.notes && (
                    <Text style={[styles.itemNotes, { color: theme.colors.textSecondary }]}>{item.notes}</Text>
                  )}
                </View>
                <Text style={[styles.itemPrice, { color: theme.colors.text }]}>{item.price}</Text>
              </View>
            ))}
            
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

      {/* Action Buttons */}
      <View style={[styles.actionButtons, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
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
});
