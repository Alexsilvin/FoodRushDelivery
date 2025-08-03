import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  Image,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

interface Delivery {
  id: string;
  customerName: string;
  address: string;
  distance: string;
  payment: string;
  restaurant: string;
  status: 'pending' | 'accepted' | 'picked_up' | 'delivered';
  estimatedTime: string;
}

export default function DashboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState<Delivery[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'accepted'>('all');
  const [stats, setStats] = useState({
    todayEarnings: 125.50,
    completedDeliveries: 8,
    rating: 4.8,
    activeDeliveries: 2,
  });

  useEffect(() => {
    loadDeliveries();
  }, []);

  const filterDeliveries = useCallback(() => {
    let filtered = deliveries;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(delivery => delivery.status === filterStatus);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(delivery =>
        delivery.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        delivery.restaurant.toLowerCase().includes(searchQuery.toLowerCase()) ||
        delivery.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredDeliveries(filtered);
  }, [deliveries, searchQuery, filterStatus]);

  useEffect(() => {
    filterDeliveries();
  }, [deliveries, searchQuery, filterStatus]);

  const loadDeliveries = () => {
    // Mock delivery data
    const mockDeliveries: Delivery[] = [
      {
        id: '1',
        customerName: 'Sarah Johnson',
        address: '123 Oak Street, Downtown',
        distance: '2.5 km',
        payment: '$12.50',
        restaurant: 'Pizza Palace',
        status: 'pending',
        estimatedTime: '25 min',
      },
      {
        id: '2',
        customerName: 'Mike Chen',
        address: '456 Elm Avenue, Midtown',
        distance: '1.8 km',
        payment: '$18.75',
        restaurant: 'Burger Barn',
        status: 'pending',
        estimatedTime: '20 min',
      },
      {
        id: '3',
        customerName: 'Emma Davis',
        address: '789 Pine Road, Uptown',
        distance: '3.2 km',
        payment: '$15.25',
        restaurant: 'Sushi Spot',
        status: 'accepted',
        estimatedTime: '30 min',
      },
    ];
    setDeliveries(mockDeliveries);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDeliveries();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleAcceptDelivery = (deliveryId: string) => {
    Alert.alert(
      'Accept Delivery',
      'Are you sure you want to accept this delivery?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: () => {
            setDeliveries(prev =>
              prev.map(delivery =>
                delivery.id === deliveryId
                  ? { ...delivery, status: 'accepted' }
                  : delivery
              )
            );
            Alert.alert('Success', 'Delivery accepted! Navigate to pickup location.');
          },
        },
      ]
    );
  };

  const handleDeclineDelivery = (deliveryId: string) => {
    setDeliveries(prev => prev.filter(delivery => delivery.id !== deliveryId));
  };

  const handleViewDeliveryDetails = (deliveryId: string) => {
    navigation.navigate('DeliveryDetails', { deliveryId });
  };

  const renderDeliveryCard = (delivery: Delivery) => (
    <TouchableOpacity 
      key={delivery.id} 
      style={styles.deliveryCard}
      onPress={() => handleViewDeliveryDetails(delivery.id)}
    >
      <View style={styles.deliveryHeader}>
        <Text style={styles.customerName}>{delivery.customerName}</Text>
        <Text style={styles.payment}>{delivery.payment}</Text>
      </View>
      
      <View style={styles.deliveryInfo}>
        <View style={styles.infoRow}>
          <Ionicons name="restaurant-outline" size={16} color="#6B7280" />
          <Text style={styles.infoText}>{delivery.restaurant}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color="#6B7280" />
          <Text style={styles.infoText}>{delivery.address}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="car-outline" size={16} color="#6B7280" />
          <Text style={styles.infoText}>{delivery.distance} • {delivery.estimatedTime}</Text>
        </View>
      </View>

      {delivery.status === 'pending' && (
        <View style={styles.deliveryActions}>
          <TouchableOpacity
            style={styles.declineButton}
            onPress={() => handleDeclineDelivery(delivery.id)}
          >
            <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleAcceptDelivery(delivery.id)}
          >
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
        </View>
      )}

      {delivery.status === 'accepted' && (
        <View style={styles.statusContainer}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Accepted - Ready for Pickup</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.wrapper}>
      {/* Background image */}
      <Image 
        source={require('../../../assets/dashbackground.png')} 
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <LinearGradient colors={['#1E40AF', '#3B82F6']} style={styles.header}>
        <Text style={styles.greeting}>Welcome back, {user?.name?.split(' ')[0]}!</Text>
        <Text style={styles.subGreeting}>Ready to deliver today?</Text>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>${stats.todayEarnings}</Text>
            <Text style={styles.statLabel}>Today&apos;s Earnings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.completedDeliveries}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.rating}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available Deliveries</Text>
          <TouchableOpacity onPress={onRefresh}>
            <Ionicons name="refresh-outline" size={24} color="#1E40AF" />
          </TouchableOpacity>
        </View>

        {/* Search and Filter Section */}
        <View style={styles.searchFilterContainer}>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search deliveries..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[styles.filterButton, filterStatus === 'all' && styles.filterButtonActive]}
              onPress={() => setFilterStatus('all')}
            >
              <Text style={[styles.filterButtonText, filterStatus === 'all' && styles.filterButtonTextActive]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterStatus === 'pending' && styles.filterButtonActive]}
              onPress={() => setFilterStatus('pending')}
            >
              <Text style={[styles.filterButtonText, filterStatus === 'pending' && styles.filterButtonTextActive]}>Pending</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterStatus === 'accepted' && styles.filterButtonActive]}
              onPress={() => setFilterStatus('accepted')}
            >
              <Text style={[styles.filterButtonText, filterStatus === 'accepted' && styles.filterButtonTextActive]}>Accepted</Text>
            </TouchableOpacity>
          </View>
        </View>

        {filteredDeliveries.length > 0 ? (
          filteredDeliveries.map(renderDeliveryCard)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="car-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No deliveries available</Text>
            <Text style={styles.emptySubtitle}>Check back in a few minutes for new orders</Text>
          </View>
        )}
      </View>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 16,
    color: '#DBEAFE',
    marginBottom: 30,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#DBEAFE',
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  searchFilterContainer: {
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#111827',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#1E40AF',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
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
    alignItems: 'center',
    marginBottom: 16,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  payment: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  deliveryInfo: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
  deliveryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  declineButton: {
    backgroundColor: '#FEF2F2',
    borderColor: '#F87171',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flex: 1,
    marginRight: 8,
  },
  declineButtonText: {
    color: '#DC2626',
    fontWeight: '600',
    textAlign: 'center',
  },
  acceptButton: {
    backgroundColor: '#1E40AF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flex: 1,
    marginLeft: 8,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusBadge: {
    backgroundColor: '#DBEAFE',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  statusText: {
    color: '#1E40AF',
    fontWeight: '600',
    fontSize: 14,
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
