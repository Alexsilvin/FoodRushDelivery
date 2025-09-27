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
import { riderAPI } from '../../services/api';
import { Delivery, RiderStatus } from '../../types/api';
import { mapApiDeliveries } from '../../utils/mappers';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import axios from 'axios';
const driverImg = require('../../../assets/driver.png');

// Local UI fallback formatting helpers
const formatCurrency = (amount?: number) => {
  if (amount == null) return '$0.00';
  try { return `$${amount.toFixed(2)}`; } catch { return `$${amount}`; }
};

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
    todayEarnings: 0,
    completedDeliveries: 0,
    rating: 0,
    activeDeliveries: 0,
    balance: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // Fetch analytics summary and balance
      const [summaryRes, balanceRes] = await Promise.all([
        axios.get('/api/v1/analytics/riders/my/summary').catch(() => ({ data: {} })),
        axios.get('/api/v1/analytics/riders/my/balance').catch(() => ({ data: {} })),
      ]);
      const summary = summaryRes?.data || {};
      const balance = balanceRes?.data?.balance ?? 0;
      setStats({
        todayEarnings: summary.todayEarnings ?? 0,
        completedDeliveries: summary.completedDeliveries ?? 0,
        rating: summary.rating ?? 0,
        activeDeliveries: summary.activeDeliveries ?? 0,
        balance,
      });
      // Fetch deliveries separately if needed
      const currentRes = await riderAPI.getCurrentDeliveries().catch(() => ({ success: false, data: [] }));
      if (currentRes?.data) {
        setDeliveries(mapApiDeliveries(currentRes.data));
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
    
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
  }, [fadeAnim, slideAnim, scaleAnim, fetchData]);

  const filterDeliveries = useCallback(() => {
    let filtered = deliveries;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(delivery => delivery.status === filterStatus);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(delivery => {
        const q = searchQuery.toLowerCase();
        return (
          (delivery.customerName?.toLowerCase().includes(q)) ||
          (delivery.restaurant?.toLowerCase().includes(q)) ||
          (delivery.address?.toLowerCase().includes(q))
        );
      });
    }

    setFilteredDeliveries(filtered);
  }, [deliveries, searchQuery, filterStatus]);

  useEffect(() => {
    filterDeliveries();
  }, [filterDeliveries]);


  const onRefresh = () => {
    setRefreshing(true);
    fetchData().finally(() => setRefreshing(false));
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
            riderAPI.acceptDelivery(deliveryId)
              .then(res => {
                setDeliveries(prev => prev.map(d => d.id === deliveryId ? { ...d, status: res.data?.status || 'accepted' } : d));
                Alert.alert(t('success'), t('deliveryAccepted'));
              })
              .catch(err => {
                console.error('Accept failed', err);
                Alert.alert(t('error'), err?.response?.data?.message || 'Failed to accept delivery');
              });
          },
        },
      ]
    );
  };

  const handleDeclineDelivery = (deliveryId: string) => {
    // If backend supports decline endpoint integrate here; for now just remove locally
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
          <Text style={styles.greeting}>{t('welcomeBack') || 'Welcome back'}, {user?.firstName || 'User'}!</Text>
          <Text style={styles.subGreeting}>{t('readyToDeliver')}</Text>

          {/* Driver image with reduced opacity */}
          <View style={styles.driverImageContainer}>
            <Image source={driverImg} style={styles.driverImage} resizeMode="contain" alt="" />
          </View>

          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}> 
              <Text style={[styles.statValue, { color: theme.colors.text }]}>XAF {stats.todayEarnings}</Text>
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
            <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>XAF {stats.balance ?? 0}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{t('balance')}</Text>
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
            <TouchableOpacity onPress={fetchData} style={{ marginTop: 12 }}>
              <Text style={{ color: theme.colors.primary }}>{t('retry') || 'Retry'}</Text>
            </TouchableOpacity>
          </View>
        )}
        {!loading && !error && (filteredDeliveries.length > 0 ? (
          filteredDeliveries.map(renderDeliveryCard)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="car-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>{t('noDeliveries')}</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>{t('checkBackLater')}</Text>
          </View>
        ))}
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
  driverImageContainer: {
    alignItems: 'center',
    marginBottom: 5,
    marginTop: 1,
  },
  driverImage: {
    width: 450,
    height: 450,
    opacity: 0.3,
    margin: -200,
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
