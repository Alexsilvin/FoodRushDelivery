// Centralized hooks exports
// Production-ready React Query hooks

// ====================== AUTH HOOKS ======================
export {
  useUserProfile,
  useAuthToken,
  useGoogleSignIn,
  useRefreshToken,
  useUpdateProfile,
  useForgotPassword,
  useResetPassword,
  useLogout,
  authKeys,
} from './useAuth';

// ====================== RIDER HOOKS ======================
export {
  useRegisterAndApply,
  useRiderLogin,
  useRiderRegister,
  useApplyToRider,
  useRiderAccount,
  useUpdateAvailability,
  useUpdateLocation,
  useUpdateLocationAlias,
  useUpdateVehicle,
  useRiderStatus,
  useUpdateRiderStatus,
  useCurrentDeliveries,
  useDeliveryHistory,
  useAcceptDelivery,
  useStartDelivery,
  useCompleteDelivery,
  useRiderEarnings,
  useRidersList,
  riderKeys,
} from './useRider';

// ====================== DELIVERY HOOKS ======================
export {
  useMyDeliveries,
  useDeliveryById,
  useDeliveryByOrderId,
  useAcceptDelivery as useAcceptDeliveryDirect,
  useMarkPickedUp,
  useMarkOutForDelivery,
  useMarkDelivered,
  deliveryKeys,
} from './useDeliveries';

// ====================== ANALYTICS HOOKS ======================
export {
  useRiderSummary,
  useRiderEarningsBucketed,
  useRiderBalance,
  analyticsKeys,
} from './useAnalytics';

// ====================== NOTIFICATION HOOKS ======================
export {
  useNotifications,
  useUnreadCount,
  useNotificationDevices,
  useRegisterDevice,
  useUnregisterDevice,
  useMarkAsRead,
  useMarkAllAsRead,
  notificationKeys,
} from './useNotifications';

// ====================== RESTAURANT HOOKS ======================
export {
  useNearbyRestaurants,
  useRestaurantDetails,
  restaurantKeys,
} from './useRestaurants';

// ====================== UTILITY HOOKS ======================
export { useCountUp } from './useCountUp';
export { useFloatingTabBarHeight } from './useFloatingTabBarHeight';
export { useStaggeredFadeIn } from './useStaggeredFadeIn';