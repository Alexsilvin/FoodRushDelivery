import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  Image,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Animated,
  ListRenderItem,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import * as Location from 'expo-location';
import NotificationBadge from '../../components/NotificationBadge';

// React Query hooks
import { 
  useMyDeliveries, 
  useAcceptDelivery, 
  useMarkPickedUp, 
  useMarkOutForDelivery,
  useMarkDelivered,
  useEstimateDeliveryFee
} from '../../hooks/useDeliveries';
import { useRiderSummary, useRiderBalance } from '../../hooks/useAnalytics';
import { useCompleteDelivery } from '../../hooks/useRider';

// Utils
import { mapDeliveryItemsToLegacy, mapLegacyToDelivery } from '../../utils/deliveryMappers';
import { Delivery } from '../../types/api';
import CommonView from '../../components/CommonView';
import { useFloatingTabBarHeight } from '../../hooks/useFloatingTabBarHeight';
const driverImg = require('../../../assets/driver.png');

// Local UI fallback formatting helpers
const formatCurrency = (amount?: number) => {
  if (amount == null) return 'FCFA 0';
  try { return `FCFA ${Math.round(amount)}`; } catch { return `FCFA ${Math.round(amount)}`; }
};

import { TabScreenProps } from '../../types/navigation.types';
const DeliveryFeeDisplay = ({ delivery }: { delivery: Delivery }) => {
  const { theme } = useTheme();
  
  const { data: feeEstimate } = useEstimateDeliveryFee(
    delivery.order ? {
      restaurantId: delivery.order.restaurant?.id || '',
      lat: delivery.order.deliveryLatitude ? Number(delivery.order.deliveryLatitude) : 0,
      lng: delivery.order.deliveryLongitude ? Number(delivery.order.deliveryLongitude) : 0,
      orderTotal: delivery.order.subtotal ? Number(delivery.order.subtotal) : 0,
    } : {
      restaurantId: '',
      lat: 0,
      lng: 0,
      orderTotal: 0,
    }
  );

  const totalEarnings = (() => {
    if (!delivery.order) return delivery.payment;
    
    const orderTotal = delivery.order.subtotal ? Number(delivery.order.subtotal) : 0;
    const deliveryFee = feeEstimate ? feeEstimate.deliveryFee : (delivery.order.deliveryFee ? Number(delivery.order.deliveryFee) : 0);
    return `FCFA ${Math.round(orderTotal + deliveryFee).toLocaleString()}`;
  })();

  return (
    <Text style={[styles.payment, { color: theme.colors.success }]}>
      {totalEarnings}
    </Text>
  );
};

type Props = TabScreenProps<'Dashboard'>;

export default function DashboardScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const tabBarHeight = useFloatingTabBarHeight();
  
  // Local state for UI
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'accepted'>('all');
  
  // Animation for collapsible header
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight = 400; // Height of the header section

  // React Query hooks for data fetching with error handling
  const {
    data: deliveryItems = [],
    isLoading: deliveriesLoading,
    error: deliveriesError,
    refetch: refetchDeliveries,
  } = useMyDeliveries({ limit: 50, page: 1 });

  const {
    data: analytics,
    isLoading: analyticsLoading,
    error: analyticsError,
  } = useRiderSummary();

  const {
    data: balanceData,
    isLoading: balanceLoading,
    error: balanceError,
  } = useRiderBalance();

  const balance = balanceData?.balance || 0;

  // Log any errors for debugging
  React.useEffect(() => {
    if (deliveriesError) {
      console.error('Deliveries error:', deliveriesError);
    }
    if (analyticsError) {
      console.error('Analytics error:', analyticsError);
    }
    if (balanceError) {
      console.error('Balance error:', balanceError);
    }
  }, [deliveriesError, analyticsError, balanceError]);

  // Mutations for delivery actions
  const acceptDeliveryMutation = useAcceptDelivery();
  const pickupDeliveryMutation = useMarkPickedUp();
  const markOutForDeliveryMutation = useMarkOutForDelivery();
  const completeDeliveryMutation = useCompleteDelivery();

  // Convert new API format to legacy format for existing UI
  const deliveries = useMemo(() => {
    if (!deliveryItems || !Array.isArray(deliveryItems) || deliveryItems.length === 0) {
      return [];
    }
    
    try {
      // Check if it's DeliveryItem format (has 'order' property) vs Delivery format
      const firstItem = deliveryItems[0];
      if (firstItem && typeof firstItem === 'object' && 'order' in firstItem) {
        // This is DeliveryItem[] format - needs mapping
        const legacyDeliveries = mapDeliveryItemsToLegacy(deliveryItems as any);
        return legacyDeliveries.map(mapLegacyToDelivery);
      } else {
        // This is already Delivery[] format (from mock data)
        return deliveryItems as Delivery[];
      }
    } catch (error) {
      console.error('Error processing deliveries:', error);
      // If mapping fails, assume it's already Delivery format
      return deliveryItems as Delivery[];
    }
  }, [deliveryItems]);

  // Combine stats from analytics and balance
  const stats = useMemo(() => ({
    todayEarnings: analytics?.todayEarnings || 0,
    completedDeliveries: analytics?.completedDeliveries || 0,
    rating: analytics?.rating || 0,
    balance,
  }), [analytics, balance]);

  // Loading and error states
  const loading = deliveriesLoading || analyticsLoading || balanceLoading;
  const error = deliveriesError || analyticsError || balanceError;

  // Filter deliveries based on search and status
  const filteredDeliveries = useMemo(() => {
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

    return filtered;
  }, [deliveries, searchQuery, filterStatus]);


  // Refresh function using React Query
  const onRefresh = useCallback(async () => {
    await Promise.all([
      refetchDeliveries(),
      // Analytics and balance will be refetched automatically due to React Query
    ]);
  }, [refetchDeliveries]);

  const handleAcceptDelivery = useCallback((deliveryId: string) => {
    Alert.alert(
      t('acceptDelivery'),
      t('acceptDeliveryConfirmation'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('accept'),
          onPress: () => {
            acceptDeliveryMutation.mutate(deliveryId, {
              onSuccess: () => {
                Alert.alert(t('success'), t('deliveryAccepted'));
              },
              onError: (error: any) => {
                console.error('Accept failed', error);
                Alert.alert(t('error'), error?.response?.data?.message || 'Failed to accept delivery');
              },
            });
          },
        },
      ]
    );
  }, [t, acceptDeliveryMutation]);

  const handleDeclineDelivery = useCallback((deliveryId: string) => {
    // For now, just show a message since decline endpoint might not be available
    Alert.alert(
      'Decline Delivery',
      'This feature will be available soon.',
      [{ text: 'OK' }]
    );
  }, []);

  const handleViewDeliveryDetails = (deliveryId: string) => {
    navigation.navigate('DeliveryDetails', { deliveryId });
  };

  const handleNavigateToLocation = async (delivery: Delivery) => {
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

      // Mock customer coordinates (in real app, this would come from delivery data)
      const customerCoords = {
        latitude: delivery.dropoffLat || delivery.lat || 40.7589,
        longitude: delivery.dropoffLng || delivery.lng || -73.9851,
      };

  // Navigate to the MapScreen and pass deliveryId
  navigation.navigate('Map', { deliveryId: delivery.id } as import('../../types/navigation.types').MapScreenParams);
    } catch (error) {
      console.error('Error fetching location:', error);
      Alert.alert('Error', 'Unable to fetch your current location. Please try again.');
    }
  };

  const handleMarkAsPickedUp = useCallback(async (delivery: Delivery) => {
    Alert.alert(
      'Mark as Picked Up',
      'Are you sure you want to mark this delivery as picked up?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            pickupDeliveryMutation.mutate(delivery.id, {
              onSuccess: () => {
                Alert.alert('Success', 'Delivery marked as picked up!');
                
                // Navigate to customer location after pickup
                handleNavigateToCustomer(delivery);
              },
              onError: (error: any) => {
                console.error('Pickup delivery failed', error);
                Alert.alert('Error', error?.response?.data?.message || 'Failed to mark as picked up');
              },
            });
          },
        },
      ]
    );
  }, [pickupDeliveryMutation]);

  const handleNavigateToCustomer = useCallback(async (delivery: Delivery) => {
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

        const customerCoords = {
          latitude: delivery.dropoffLat || delivery.lat || 40.7589,
          longitude: delivery.dropoffLng || delivery.lng || -73.9851,
        };

  navigation.navigate('Map', { deliveryId: delivery.id } as import('../../types/navigation.types').MapScreenParams);
      }
    } catch (error) {
      console.error('Error getting location for customer navigation:', error);
    }
  }, [navigation]);

  const handleMarkOutForDelivery = useCallback(async (delivery: Delivery) => {
    Alert.alert(
      'Mark as Out for Delivery',
      'Are you sure you want to mark this delivery as out for delivery?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            markOutForDeliveryMutation.mutate(delivery.id, {
              onSuccess: () => {
                Alert.alert('Success', 'Delivery marked as out for delivery!');
              },
              onError: (error: any) => {
                console.error('Mark out for delivery failed', error);
                Alert.alert('Error', error?.response?.data?.message || 'Failed to mark as out for delivery');
              },
            });
          },
        },
      ]
    );
  }, [markOutForDeliveryMutation]);

  const handleCompleteDelivery = useCallback(async (delivery: Delivery) => {
    Alert.alert(
      'Complete Delivery',
      'Are you sure you want to mark this delivery as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            completeDeliveryMutation.mutate(delivery.id, {
              onSuccess: () => {
                Alert.alert('Success', 'Delivery completed successfully!');
              },
              onError: (error: any) => {
                console.error('Complete delivery failed', error);
                Alert.alert('Error', error?.response?.data?.message || 'Failed to complete delivery');
              },
            });
          },
        },
      ]
    );
  }, [completeDeliveryMutation]);

  // Header component for FlatList
  const renderHeader = () => (
    <Animated.View
      style={[
        styles.headerContainer,
        {
          transform: [
            {
              translateY: scrollY.interpolate({
                inputRange: [0, headerHeight],
                outputRange: [0, -headerHeight / 2],
                extrapolate: 'clamp',
              }),
            },
          ],
          opacity: scrollY.interpolate({
            inputRange: [0, headerHeight / 2, headerHeight],
            outputRange: [1, 0.8, 0.3],
            extrapolate: 'clamp',
          }),
        },
      ]}
    >
      <LinearGradient 
        colors={['#0F172A', '#1E3A8A', '#0F172A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: 60 }]}
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileLeft}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{user?.firstName?.charAt(0) || 'D'}</Text>
            </View>
            <View style={styles.profileText}>
              <Text style={styles.greeting}>Hi, {user?.firstName || 'User'}!</Text>
              <View style={styles.balanceBadge}>
                <Text style={styles.balanceLabel}>Total Balance</Text>
              </View>
            </View>
          </View>
          <NotificationBadge size="medium" navigation={navigation} />
        </View>

        {/* Balance Display */}
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceValue}>FCFA {stats.balance ? Math.round(stats.balance).toLocaleString() : '0'}</Text>
          <Text style={styles.balanceChange}>↑ 10.88 %</Text>
        </View>

        {/* Quick Action Icons */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="wallet-outline" size={20} color="#FFFFFF" />
            <Text style={styles.actionLabel}>Withdraw</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="document-outline" size={20} color="#FFFFFF" />
            <Text style={styles.actionLabel}>Document</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="calculator-outline" size={20} color="#FFFFFF" />
            <Text style={styles.actionLabel}>Calculator</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="ellipsis-horizontal" size={20} color="#FFFFFF" />
            <Text style={styles.actionLabel}>More</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { borderColor: 'rgba(96, 165, 250, 0.2)' }]}> 
            <Text style={styles.statValue}>{stats.todayEarnings}</Text>
            <Text style={styles.statLabel}>{t('todayEarnings')}</Text>
          </View>
          <View style={[styles.statCard, { borderColor: 'rgba(96, 165, 250, 0.2)' }]}>
            <Text style={styles.statValue}>{stats.completedDeliveries}</Text>
            <Text style={styles.statLabel}>{t('completed')}</Text>
          </View>
          <View style={[styles.statCard, { borderColor: 'rgba(96, 165, 250, 0.2)' }]}>
            <Text style={styles.statValue}>{stats.rating}</Text>
            <Text style={styles.statLabel}>{t('rating')}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Search and Filter Section */}
      <View style={[styles.content, { backgroundColor: 'transparent', paddingBottom: 0 }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('availableDeliveries')}</Text>
          <TouchableOpacity onPress={onRefresh}>
            <Ionicons name="refresh-outline" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

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
      </View>
    </Animated.View>
  );

  const renderDeliveryCard: ListRenderItem<Delivery> = ({ item: delivery }) => (
    <TouchableOpacity 
      key={delivery.id} 
      style={[styles.deliveryCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
      onPress={() => handleViewDeliveryDetails(delivery.id)}
    >
      <View style={styles.deliveryHeader}>
        <Text style={[styles.customerName, { color: theme.colors.text }]}>{delivery.customerName}</Text>
        <DeliveryFeeDisplay delivery={delivery} />
      </View>
      
      <View style={styles.deliveryInfo}>
        <View style={styles.infoRow}>
          <Ionicons name="restaurant-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>{delivery.restaurant}</Text>
        </View>
        <TouchableOpacity 
          style={styles.infoRow}
          onPress={() => handleNavigateToLocation(delivery)}
        >
          <Ionicons name="location-outline" size={16} color={theme.colors.primary} />
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>{delivery.address}</Text>
          <Ionicons name="navigate-outline" size={16} color={theme.colors.primary} />
        </TouchableOpacity>
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
        <View style={styles.deliveryActions}>
          <TouchableOpacity
            style={[styles.navigateButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => handleNavigateToLocation(delivery)}
          >
            <Ionicons name="navigate" size={16} color="#FFFFFF" />
            <Text style={styles.navigateButtonText}>{t('navigate') || 'Navigate'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pickupButton, { backgroundColor: '#8B5CF6' }]}
            onPress={() => handleMarkAsPickedUp(delivery)}
          >
            <Ionicons name="bag-check" size={16} color="#FFFFFF" />
            <Text style={styles.pickupButtonText}>{t('markPickedUp') || 'Mark as Picked Up'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {delivery.status === 'picked_up' && (
        <View style={styles.deliveryActions}>
          <TouchableOpacity
            style={[styles.outForDeliveryButton, { backgroundColor: '#F59E0B' }]}
            onPress={() => handleMarkOutForDelivery(delivery)}
          >
            <Ionicons name="car" size={16} color="#FFFFFF" />
            <Text style={styles.outForDeliveryButtonText}>{t('markOutForDelivery') || 'Out for Delivery'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {delivery.status === 'delivering' && (
        <View style={styles.deliveryActions}>
          <TouchableOpacity
            style={[styles.completeButton, { backgroundColor: '#10B981' }]}
            onPress={() => handleCompleteDelivery(delivery)}
          >
            <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
            <Text style={styles.completeButtonText}>{t('completeDelivery') || 'Complete Delivery'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {(delivery.status === 'delivered' || delivery.status === 'completed') && (
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: '#10B981' + '20' }]}>
            <Text style={[styles.statusText, { color: '#10B981' }]}>{t('deliveryCompleted') || 'Delivery Completed'}</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  // Empty state component
  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary, marginTop: 16 }]}>
            {t('loading') || 'Loading...'}
          </Text>
        </View>
      );
    }
    
    if (error) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="warning-outline" size={48} color={theme.colors.error} />
          <Text style={[styles.emptyTitle, { color: theme.colors.error }]}>{t('error')}</Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
            {error?.message || 'Failed to load data'}
          </Text>
          <TouchableOpacity onPress={onRefresh} style={{ marginTop: 12 }}>
            <Text style={{ color: theme.colors.primary }}>{t('retry') || 'Retry'}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyState}>
        <Ionicons name="car-outline" size={64} color={theme.colors.textSecondary} />
        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>{t('noDeliveries')}</Text>
        <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>{t('checkBackLater')}</Text>
      </View>
    );
  };

  return (
    <CommonView showStatusBar={true} paddingHorizontal={0}>
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
      
      <FlatList
        data={filteredDeliveries}
        renderItem={renderDeliveryCard}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        style={[styles.container, { backgroundColor: 'transparent' }]}
        contentContainerStyle={{
          flexGrow: 1,

          paddingBottom: tabBarHeight, // Use calculated tab bar height
        }}
        refreshControl={
          <RefreshControl 
            refreshing={deliveriesLoading || analyticsLoading || balanceLoading} 
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      />
    </CommonView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerContainer: {
    zIndex: 1,
    marginBottom: 10,
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
    pointerEvents: 'none',
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
    paddingBottom: 25,
  },
  profileSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(96, 165, 250, 0.3)',
    marginRight: 12,
  },
  avatarInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileText: {
    flex: 1,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  balanceBadge: {
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  balanceLabel: {
    fontSize: 11,
    color: '#93C5FD',
    fontWeight: '500',
  },
  balanceContainer: {
    marginBottom: 24,
  },
  balanceValue: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  balanceChange: {
    fontSize: 14,
    color: '#86EFAC',
    fontWeight: '500',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    backgroundColor: 'rgba(30, 58, 138, 0.25)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.25)',
    overflow: 'hidden',
    shadowColor: 'rgba(59, 130, 246, 0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    marginTop: 4,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statCard: {
    backgroundColor: 'rgba(30, 58, 138, 0.25)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    minWidth: 70,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.25)',
    overflow: 'hidden',
    shadowColor: 'rgba(59, 130, 246, 0.2)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#93C5FD',
    textAlign: 'center',
    lineHeight: 14,
    fontWeight: '500',
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
    backgroundColor: 'rgba(30, 58, 138, 0.25)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.25)',
    overflow: 'hidden',
    shadowColor: 'rgba(59, 130, 246, 0.2)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  payment: {
    fontSize: 16,
    fontWeight: '700',
    color: '#86EFAC',
  },
  deliveryInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#93C5FD',
    marginLeft: 8,
    flex: 1,
  },
  deliveryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  declineButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButtonText: {
    color: '#FCA5A5',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 14,
  },
  acceptButton: {
    backgroundColor: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 14,
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusBadge: {
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  statusText: {
    color: '#93C5FD',
    fontWeight: '600',
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#93C5FD',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  navigateButton: {
    backgroundColor: '#1E40AF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  navigateButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  pickupButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  pickupButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  outForDeliveryButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  outForDeliveryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  completeButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
});
