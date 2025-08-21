import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCall } from '../../contexts/CallContext';
import { useNavigation, useRoute } from '@react-navigation/native';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  deliveryInstructions?: string;
  rating?: number;
  totalDeliveries: number;
  preferredPayment?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export default function CustomerProfileScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { startCall } = useCall();
  const navigation = useNavigation();
  const route = useRoute();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Get customer data from route params or use default
  const customer: Customer = (route.params as any)?.customer || {
    id: '1',
    name: 'Emma Davis',
    phone: '+1 (555) 123-4567',
    email: 'emma.davis@example.com',
    address: '123 Main Street, Apt 4B, New York, NY 10001',
    deliveryInstructions: 'Ring doorbell twice. Leave at door if no answer.',
    rating: 4.8,
    totalDeliveries: 23,
    preferredPayment: 'Credit Card',
    location: {
      latitude: 40.7128,
      longitude: -74.0060,
    },
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleCall = (type: 'voice' | 'video') => {
    startCall(customer.name, type);
  };

  const handleLocationPress = () => {
    if (customer.location) {
      (navigation as any).navigate('Map', {
        targetLocation: customer.location,
        customerName: customer.name,
        address: customer.address,
      });
    } else {
      Alert.alert('Location unavailable', 'Location information is not available for this customer.');
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={i} name="star" size={16} color="#FFD700" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={16} color="#FFD700" />
      );
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <Ionicons key={`empty-${i}`} name="star-outline" size={16} color="#FFD700" />
      );
    }

    return stars;
  };

  return (
    <>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
        translucent={false}
      />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <BlurView
          intensity={20}
          tint={theme.isDark ? 'dark' : 'light'}
          style={[styles.header, { borderBottomColor: theme.colors.border }]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Customer Profile
          </Text>
          <View style={styles.headerRight} />
        </BlurView>

        <Animated.ScrollView
          style={[styles.content]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.profileSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Profile Avatar */}
            <View style={styles.avatarContainer}>
              <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.avatarText}>
                  {customer.name.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>
              <View style={styles.onlineIndicator} />
            </View>

            {/* Customer Info */}
            <View style={styles.customerInfo}>
              <Text style={[styles.customerName, { color: theme.colors.text }]}>
                {customer.name}
              </Text>
              {customer.rating && (
                <View style={styles.ratingContainer}>
                  <View style={styles.starsContainer}>
                    {renderStars(customer.rating)}
                  </View>
                  <Text style={[styles.ratingText, { color: theme.colors.textSecondary }]}>
                    {customer.rating.toFixed(1)} ({customer.totalDeliveries} deliveries)
                  </Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => handleCall('voice')}
              >
                <Ionicons name="call" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => handleCall('video')}
              >
                <Ionicons name="videocam" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Contact Information */}
          <Animated.View
            style={[
              styles.section,
              { 
                backgroundColor: theme.colors.card,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Contact Information
            </Text>

            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color={theme.colors.primary} />
              <Text style={[styles.infoText, { color: theme.colors.text }]}>
                {customer.phone}
              </Text>
            </View>

            {customer.email && (
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={20} color={theme.colors.primary} />
                <Text style={[styles.infoText, { color: theme.colors.text }]}>
                  {customer.email}
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Address Information */}
          <Animated.View
            style={[
              styles.section,
              { 
                backgroundColor: theme.colors.card,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Delivery Address
            </Text>

            <TouchableOpacity style={styles.addressRow} onPress={handleLocationPress}>
              <View style={styles.addressInfo}>
                <Ionicons name="location-outline" size={20} color={theme.colors.primary} />
                <Text style={[styles.addressText, { color: theme.colors.text }]}>
                  {customer.address}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            {customer.deliveryInstructions && (
              <View style={styles.instructionsContainer}>
                <Ionicons name="information-circle-outline" size={20} color={theme.colors.primary} />
                <View style={styles.instructionsTextContainer}>
                  <Text style={[styles.instructionsTitle, { color: theme.colors.text }]}>
                    Delivery Instructions
                  </Text>
                  <Text style={[styles.instructionsText, { color: theme.colors.textSecondary }]}>
                    {customer.deliveryInstructions}
                  </Text>
                </View>
              </View>
            )}
          </Animated.View>

          {/* Preferences */}
          <Animated.View
            style={[
              styles.section,
              { 
                backgroundColor: theme.colors.card,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Preferences
            </Text>

            {customer.preferredPayment && (
              <View style={styles.infoRow}>
                <Ionicons name="card-outline" size={20} color={theme.colors.primary} />
                <View>
                  <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                    Preferred Payment
                  </Text>
                  <Text style={[styles.infoText, { color: theme.colors.text }]}>
                    {customer.preferredPayment}
                  </Text>
                </View>
              </View>
            )}
          </Animated.View>
        </Animated.ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  customerInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  customerName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  ratingContainer: {
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    marginLeft: 16,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginLeft: 16,
    marginBottom: 2,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  addressInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  addressText: {
    fontSize: 16,
    marginLeft: 16,
    flex: 1,
    lineHeight: 22,
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  instructionsTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
