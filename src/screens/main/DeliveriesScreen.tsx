import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCall } from '../../contexts/CallContext';
import { useNavigation } from '@react-navigation/native';
import { riderAPI } from '../../services/api';
import { Delivery } from '../../types/api';
import { mapApiDeliveries } from '../../utils/mappers';

// Helper to format currency fallback
const formatCurrency = (amount?: number) => {
  if (amount == null) return '$0.00';
  try { return `$${amount.toFixed(2)}`; } catch { return `$${amount}`; }
};

export default function DeliveriesScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { startCall } = useCall();
  const navigation = useNavigation();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizeDeliveries = (raw: any[]): Delivery[] => mapApiDeliveries(raw);

  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const current = await riderAPI.getCurrentDeliveries().catch(e => { console.warn('Current deliveries failed', e?.response?.status); return { success: false, data: [] }; });
      const history = await riderAPI.getDeliveryHistory(1, 50).catch(e => { console.warn('History deliveries failed', e?.response?.status); return { success: false, data: [] }; });
      const merged = [
        ...(current.data || []),
        ...(history.data || [])
      ];
      setDeliveries(normalizeDeliveries(merged));
    } catch (e: any) {
      console.error('Fetch deliveries error', e);
      setError(e?.response?.data?.message || e.message || 'Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDeliveries(); }, [fetchDeliveries]);

  const updateDeliveryStatusLocal = (deliveryId: string, newStatus: Delivery['status']) => {
    setDeliveries(prev => prev.map(d => d.id === deliveryId ? {
      ...d,
      status: newStatus,
      ...(newStatus === 'picked_up' && { pickupTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }),
      ...(newStatus === 'delivered' && { deliveryTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }),
    } : d));
  };

  const handleStatusUpdate = (delivery: Delivery) => {
    if (delivery.status === 'delivered') {
      Alert.alert(t('completed') || 'Completed', t('alreadyCompleted') || 'This delivery has already been completed.');
      return;
    }

    let action: 'accept' | 'start' | 'complete';
    let nextStatus: Delivery['status'];
    if (delivery.status === 'accepted') {
      action = 'start';
      nextStatus = 'picked_up';
    } else if (delivery.status === 'picked_up' || delivery.status === 'delivering') {
      action = 'complete';
      nextStatus = 'delivered';
    } else {
      // pending or other
      action = 'accept';
      nextStatus = 'accepted';
    }

    const actionLabel = (
      action === 'accept' ? (t('acceptDelivery') || 'Accept Delivery') :
      action === 'start' ? (t('startDelivery') || 'Start Delivery') :
      (t('markDelivered') || 'Complete Delivery')
    );

    Alert.alert(
      t('updateStatus') || 'Update Status',
      `${actionLabel} ?`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: actionLabel,
          onPress: async () => {
            try {
              if (action === 'accept') {
                const res = await riderAPI.acceptDelivery(delivery.id);
                updateDeliveryStatusLocal(delivery.id, (res.data?.status as any) || nextStatus);
              } else if (action === 'start') {
                const res = await riderAPI.startDelivery(delivery.id);
                updateDeliveryStatusLocal(delivery.id, (res.data?.status as any) || nextStatus);
              } else if (action === 'complete') {
                const res = await riderAPI.completeDelivery(delivery.id);
                updateDeliveryStatusLocal(delivery.id, (res.data?.status as any) || nextStatus);
              }
              Alert.alert(t('success'), t('statusUpdated') || 'Status updated');
            } catch (e: any) {
              console.error('Status update failed', e);
              Alert.alert(t('error'), e?.response?.data?.message || e.message || 'Failed to update status');
            }
          }
        }
      ]
    );
  };

  const callCustomer = (phone: string, name: string) => {
    Alert.alert(
      t('callCustomer'),
      `${t('call')} ${name} at ${phone}?`,
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: 'Voice Call', 
          onPress: () => startCall(name, 'voice')
        },
        { 
          text: 'Video Call', 
          onPress: () => startCall(name, 'video')
        },
      ]
    );
  };

  const handleCustomerNamePress = (delivery: Delivery) => {
    (navigation as any).navigate('CustomerProfile', {
      customer: {
        id: delivery.id,
        name: delivery.customerName,
        phone: delivery.customerPhone,
        email: 'customer@example.com',
        address: delivery.address,
        deliveryInstructions: 'Ring doorbell twice. Leave at door if no answer.',
        rating: 4.8,
        totalDeliveries: 23,
        preferredPayment: 'Credit Card',
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
      },
    });
  };

  const handleAddressPress = (delivery: Delivery) => {
    (navigation as any).navigate('Map', {
      targetLocation: {
        latitude: 40.7128,
        longitude: -74.0060,
      },
      customerName: delivery.customerName,
      address: delivery.address,
    });
  };

  const getStatusColor = (status: Delivery['status']) => {
    switch (status) {
      case 'accepted': return '#3B82F6';
      case 'picked_up': return '#F59E0B';
      case 'delivering': return '#8B5CF6';
      case 'delivered': return '#059669';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: Delivery['status']) => {
    switch (status) {
      case 'accepted': return 'Ready for Pickup';
      case 'picked_up': return 'Picked Up';
      case 'delivering': return 'Delivering';
      case 'delivered': return 'Delivered';
      default: return 'Unknown';
    }
  };

  const renderDeliveryCard = (delivery: Delivery) => (
    <View key={delivery.id} style={[styles.deliveryCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <View style={styles.deliveryHeader}>
        <View>
          <TouchableOpacity onPress={() => handleCustomerNamePress(delivery)}>
            <Text style={[styles.customerName, { color: theme.colors.text }]}>{delivery.customerName}</Text>
          </TouchableOpacity>
          <Text style={[styles.restaurant, { color: theme.colors.textSecondary }]}>{delivery.restaurant}</Text>
        </View>
        <View style={styles.paymentContainer}>
          <Text style={[styles.payment, { color: theme.colors.success }]}>{delivery.payment}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(delivery.status) }]}>
            <Text style={styles.statusText}>{getStatusText(delivery.status)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.deliveryInfo}>
        <TouchableOpacity style={styles.infoRow} onPress={() => handleAddressPress(delivery)}>
          <Ionicons name="location-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>{delivery.address}</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
        </TouchableOpacity>
        
        <View style={styles.orderItems}>
          <Text style={[styles.itemsTitle, { color: theme.colors.text }]}>Order Items:</Text>
          {(delivery.orderItems || []).map((item, index) => (
            <Text key={index} style={[styles.orderItem, { color: theme.colors.textSecondary }]}>• {item}</Text>
          ))}
        </View>

        {delivery.pickupTime && (
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>Picked up at {delivery.pickupTime}</Text>
          </View>
        )}

        {delivery.deliveryTime && (
          <View style={styles.timeRow}>
            <Ionicons name="checkmark-circle-outline" size={16} color={theme.colors.success} />
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>Delivered at {delivery.deliveryTime}</Text>
          </View>
        )}
      </View>

      <View style={styles.deliveryActions}>
        <TouchableOpacity
          style={[styles.callButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.primary }]}
          onPress={() => callCustomer(delivery.customerPhone || '+0000000000', delivery.customerName || 'Customer')}
        >
          <Ionicons name="call-outline" size={20} color={theme.colors.primary} />
          <Text style={[styles.callButtonText, { color: theme.colors.primary }]}>{t('call')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.statusButton,
            { backgroundColor: theme.colors.primary },
            delivery.status === 'delivered' && { backgroundColor: theme.colors.success }
          ]}
          onPress={() => handleStatusUpdate(delivery)}
          disabled={delivery.status === 'delivered'}
        >
          <Text style={[
            styles.statusButtonText,
            delivery.status === 'delivered' && styles.completedButtonText,
          ]}>
            {delivery.status === 'delivered' ? t('completed') : 
             delivery.status === 'accepted' ? t('markPickedUp') :
             delivery.status === 'picked_up' ? t('startDelivery') :
             t('markDelivered')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const activeDeliveries = deliveries.filter(d => d.status !== 'delivered');
  const completedDeliveries = deliveries.filter(d => d.status === 'delivered');

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: 60 }]}>
      <View style={styles.content}>
        {loading && (
          <View style={styles.emptyState}>
            <Ionicons name="refresh" size={48} color={theme.colors.textSecondary} />
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>{t('loading') || 'Loading...'}</Text>
          </View>
        )}
        {!!error && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="warning-outline" size={48} color={theme.colors.error} />
            <Text style={[styles.emptyTitle, { color: theme.colors.error }]}>{t('error')}</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>{error}</Text>
            <TouchableOpacity onPress={fetchDeliveries} style={{ marginTop: 12 }}>
              <Text style={{ color: theme.colors.primary }}>{t('retry') || 'Retry'}</Text>
            </TouchableOpacity>
          </View>
        )}
        {!loading && !error && activeDeliveries.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('activeDeliveries')}</Text>
            {activeDeliveries.map(renderDeliveryCard)}
          </>
        )}

        {completedDeliveries.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 30, color: theme.colors.text }]}>{t('completedToday')}</Text>
            {completedDeliveries.map(renderDeliveryCard)}
          </>
        )}

  {!loading && !error && deliveries.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="car-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>{t('noDeliveries')}</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>{t('deliveriesSubtext')}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  deliveryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  restaurant: {
    fontSize: 14,
    color: '#6B7280',
  },
  paymentContainer: {
    alignItems: 'flex-end',
  },
  payment: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 8,
  },
  statusBadge: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  deliveryInfo: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
  orderItems: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  orderItem: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  deliveryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  callButton: {
    backgroundColor: '#EBF8FF',
    borderColor: '#3B82F6',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  callButtonText: {
    color: '#1E40AF',
    fontWeight: '600',
    marginLeft: 8,
  },
  statusButton: {
    backgroundColor: '#1E40AF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 2,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  completedButton: {
    backgroundColor: '#E5E7EB',
  },
  completedButtonText: {
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
