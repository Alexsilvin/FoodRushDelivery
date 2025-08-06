import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  StatusBar,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

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
  const { theme } = useTheme();
  const { t } = useLanguage();
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

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    loadDeliveries();
    
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, scaleAnim]);

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
  }, [filterDeliveries]);

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
      t('acceptDelivery'),
      t('acceptDeliveryConfirmation'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('accept'),
          onPress: () => {
            setDeliveries(prev =>
              prev.map(delivery =>
                delivery.id === deliveryId
                  ? { ...delivery, status: 'accepted' }
                  : delivery
              )
            );
            Alert.alert(t('success'), t('deliveryAccepted'));
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
      style={[styles.deliveryCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
      onPress={() => handleViewDeliveryDetails(delivery.id)}
    >
      <View style={styles.deliveryHeader}>
        <Text style={[styles.customerName, { color: theme.colors.text }]}>{delivery.customerName}</Text>
        <Text style={[styles.payment, { color: theme.colors.success }]}>{delivery.payment}</Text>
      </View>
      
      <View style={styles.deliveryInfo}>
        <View style={styles.infoRow}>
          <Ionicons name="restaurant-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>{delivery.restaurant}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>{delivery.address}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="car-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>{delivery.distance} • {delivery.estimatedTime}</Text>
        </View>
      </View>

      {delivery.status === 'pending' && (
        <View style={styles.deliveryActions}>
          <TouchableOpacity
            style={[styles.declineButton, { borderColor: theme.colors.error }]}
            onPress={() => handleDeclineDelivery(delivery.id)}
          >
            <Text style={[styles.declineButtonText, { color: theme.colors.error }]}>{t('decline')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.acceptButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => handleAcceptDelivery(delivery.id)}
          >
            <Text style={styles.acceptButtonText}>{t('accept')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {delivery.status === 'accepted' && (
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: theme.colors.success + '20' }]}>
            <Text style={[styles.statusText, { color: theme.colors.success }]}>{t('acceptedReady')}</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />
      {/* Conditional background - image for light mode, dark color for dark mode */}
      {!theme.isDark ? (
        <Image 
          source={require('../../../assets/dashbackground.png')} 
          style={styles.backgroundImage}
          resizeMode="cover"
          alt=""
        />
      ) : (
        <View style={[styles.darkBackground, { backgroundColor: theme.colors.background }]} />
      )}
      
      <ScrollView
        style={[styles.container, { backgroundColor: 'transparent' }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <LinearGradient 
          colors={theme.isDark 
            ? [theme.colors.primary, theme.colors.secondary] 
            : ['#1E40AF', '#3B82F6']} 
          style={[styles.header, { paddingTop: 60 }]}
        >
        <Text style={styles.greeting}>{t('welcomeBack')}, {user?.name?.split(' ')[0]}!</Text>
        <Text style={styles.subGreeting}>{t('readyToDeliver')}</Text>

        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>${stats.todayEarnings}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{t('todayEarnings')}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{stats.completedDeliveries}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{t('completed')}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{stats.rating}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{t('rating')}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={[styles.content, { backgroundColor: 'transparent' }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('availableDeliveries')}</Text>
          <TouchableOpacity onPress={onRefresh}>
            <Ionicons name="refresh-outline" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Search and Filter Section */}
        <View style={styles.searchFilterContainer}>
          <View style={[styles.searchContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Ionicons name="search-outline" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder={t('searchDeliveries')}
              placeholderTextColor={theme.colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[
                styles.filterButton, 
                { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                filterStatus === 'all' && { backgroundColor: theme.colors.primary }
              ]}
              onPress={() => setFilterStatus('all')}
            >
              <Text style={[
                styles.filterButtonText, 
                { color: filterStatus === 'all' ? '#FFFFFF' : theme.colors.text }
              ]}>{t('all')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton, 
                { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                filterStatus === 'pending' && { backgroundColor: theme.colors.primary }
              ]}
              onPress={() => setFilterStatus('pending')}
            >
              <Text style={[
                styles.filterButtonText, 
                { color: filterStatus === 'pending' ? '#FFFFFF' : theme.colors.text }
              ]}>{t('pending')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton, 
                { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                filterStatus === 'accepted' && { backgroundColor: theme.colors.primary }
              ]}
              onPress={() => setFilterStatus('accepted')}
            >
              <Text style={[
                styles.filterButtonText, 
                { color: filterStatus === 'accepted' ? '#FFFFFF' : theme.colors.text }
              ]}>{t('accepted')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {filteredDeliveries.length > 0 ? (
          filteredDeliveries.map(renderDeliveryCard)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="car-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>{t('noDeliveries')}</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>{t('checkBackLater')}</Text>
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
  darkBackground: {
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
