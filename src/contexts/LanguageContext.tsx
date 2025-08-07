import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';

type Language = 'en' | 'fr';

interface LanguageContextType {
  currentLanguage: Language;
  changeLanguage: (language: Language) => Promise<void>;
  t: (key: string) => string;
  availableLanguages: { code: Language; name: string; nativeName: string }[];
}

const translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    deliveries: 'My Deliveries',
    messages: 'Messages',
    map: 'Map',
    profile: 'Profile',
    settings: 'Settings',
    
    // Dashboard
    welcomeBack: 'Welcome back',
    readyToDeliver: 'Ready to deliver today?',
    todaysEarnings: "Today's Earnings",
    completed: 'Completed',
    rating: 'Rating',
    availableDeliveries: 'Available Deliveries',
    searchDeliveries: 'Search deliveries...',
    all: 'All',
    pending: 'Pending',
    accepted: 'Accepted',
    checkBackLater: 'Check back later',
    acceptDelivery: 'Accept Delivery',
    acceptDeliveryConfirmation: 'Are you sure you want to accept this delivery?',
    deliveryAccepted: 'Delivery accepted successfully!',
    acceptedReady: 'Accepted - Ready',
    
    // Deliveries
    activeDeliveries: 'Active Deliveries',
    completedToday: 'Completed Today',
    noDeliveries: 'No deliveries yet',
    deliveriesSubtext: 'Your accepted deliveries will appear here',
    markPickedUp: 'Mark Picked Up',
    startDelivery: 'Start Delivery',
    markDelivered: 'Mark Delivered',
    call: 'Call',
    voiceCall: 'Voice Call',
    videoCall: 'Video Call',
    phoneCall: 'Phone Call',
    
    // Messages
    searchConversations: 'Search conversations...',
    noConversationsFound: 'No conversations found',
    tryDifferentTerm: 'Try searching with a different term',
    noMessagesYet: 'No messages yet',
    messagesSubtext: 'Customer messages will appear here when you have active deliveries',
    typeMessage: 'Type a message...',
    online: 'Online',
    contactInfo: 'Contact Info',
    mute: 'Mute',
    searchInChat: 'Search in chat',
    camera: 'Camera',
    gallery: 'Gallery',
    files: 'Files',
    audio: 'Audio',
    
    // Profile
    availableForDeliveries: 'Available for deliveries',
    totalDeliveries: 'Total Deliveries',
    thisMonth: 'This Month',
    completionRate: 'Completion Rate',
    language: 'Language',
    selectLanguage: 'Select Language',
    
    // Common
    refresh: 'Refresh',
    markAllRead: 'Mark all read',
    clearSearch: 'Clear search',
    archive: 'Archive',
    delete: 'Delete',
    cancel: 'Cancel',
    save: 'Save',
    success: 'Success',
    error: 'Error',
    loading: 'Loading...',
    accept: 'Accept',
    decline: 'Decline',
    
    // Loading Screen
    deliveryDriver: 'Delivery Driver',
    loadingText: 'Loading...',
    
    // Delivery Details
    deliveryDetails: 'Delivery Details',
    loadingDeliveryDetails: 'Loading delivery details...',
    deliveryNotFound: 'Delivery not found',
    customerInformation: 'Customer Information',
    restaurantInformation: 'Restaurant Information',
    orderDetails: 'Order Details',
    deliveryInformation: 'Delivery Information',
    specialInstructions: 'Special Instructions:',
    subtotal: 'Subtotal',
    deliveryFee: 'Delivery Fee',
    tip: 'Tip',
    yourEarnings: 'Your Earnings',
    distance: 'Distance',
    estTime: 'Est. Time',
    earnings: 'Earnings',
    acceptDeliveryAction: 'Accept Delivery',
    startNavigation: 'Start Navigation',
    markAsPickedUp: 'Mark as Picked Up',
    markAsDelivered: 'Mark as Delivered',
    confirmAction: 'Confirm Action',
    areYouSure: 'Are you sure you want to mark this delivery as ',
    confirm: 'Confirm',
    successStatus: 'Success',
    deliveryMarkedAs: 'Delivery marked as ',
    statusPending: 'Pending',
    statusAccepted: 'Accepted',
    statusPickedUp: 'Picked Up',
    statusDelivered: 'Delivered',
    
    // Map Screen
    drivingMode: 'Driving Mode',
    exit: 'Exit',
    routes: 'Routes',
    loadingMap: 'Loading map...',
    locationError: 'Location Error',
    locationErrorMessage: 'Unable to get your current location. Using default location (New York City).\n\nTip: Make sure location services are enabled and try restarting the app.',
    locationServicesDisabled: 'Location services are disabled. Please enable location services in your device settings.',
    locationPermissionDenied: 'Location permission denied. Please grant location permission to use the map.',
    acceptDeliveryQuestion: 'Accept Delivery',
    acceptDeliveryConfirm: 'Accept delivery to',
    address: 'Address',
    navigate: 'Navigate',
    routeCalculated: 'Route Calculated',
    startNavigationConfirm: 'This will open your device\'s navigation app',
    openMaps: 'Open Maps',
    
    // Additional Messages/Chat
    lastSeen: 'Last seen',
    delivered: 'Delivered',
    read: 'Read',
    
    // Additional Profile Options
    notifications: 'Notifications',
    pushNotifications: 'Push Notifications',
    emailNotifications: 'Email Notifications',
    smsNotifications: 'SMS Notifications',
    theme: 'Theme',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    systemDefault: 'System Default',
    account: 'Account',
    editProfile: 'Edit Profile',
    changePassword: 'Change Password',
    support: 'Support',
    helpCenter: 'Help Center',
    contactSupport: 'Contact Support',
    reportIssue: 'Report an Issue',
    termsOfService: 'Terms of Service',
    privacyPolicy: 'Privacy Policy',
    about: 'About',
    appVersion: 'App Version',
    logout: 'Logout',
    yes: 'Yes',
    no: 'No',
    
    // Additional Profile Screen Keys
    logoutConfirmation: 'Are you sure you want to logout?',
    editProfileComingSoon: 'Edit profile feature coming soon!',
    supportMessage: 'Contact support at support@foodrush.com or call 1-800-DELIVERY',
    privacyPolicyDetails: 'Privacy Policy: We protect your data according to GDPR standards...',
    termsService: 'Terms of Service',
    termsServiceDetails: 'Terms of Service: By using this app, you agree to our terms...',
    
    // Additional missing keys
    vehicleInformation: 'Vehicle Information',
    phoneNumber: 'Phone Number',
    notSet: 'Not Set',
    helpSupport: 'Help & Support',
    
    // Map and Navigation (new keys)
    calculateRoute: 'Calculate Route',
    calculating: 'Calculating...',
  },
  fr: {
    // Navigation
    dashboard: 'Tableau de Bord',
    deliveries: 'Mes Livraisons',
    messages: 'Messages',
    map: 'Carte',
    profile: 'Profil',
    settings: 'Paramètres',
    
    // Dashboard
    welcomeBack: 'Content de vous revoir',
    readyToDeliver: 'Prêt à livrer aujourd\'hui?',
    todaysEarnings: 'Gains d\'Aujourd\'hui',
    completed: 'Terminé',
    rating: 'Note',
    availableDeliveries: 'Livraisons Disponibles',
    searchDeliveries: 'Rechercher des livraisons...',
    all: 'Tout',
    pending: 'En attente',
    accepted: 'Accepté',
    checkBackLater: 'Revenez plus tard',
    acceptDelivery: 'Accepter la Livraison',
    acceptDeliveryConfirmation: 'Êtes-vous sûr de vouloir accepter cette livraison?',
    deliveryAccepted: 'Livraison acceptée avec succès!',
    acceptedReady: 'Accepté - Prêt',
    
    // Deliveries
    activeDeliveries: 'Livraisons Actives',
    completedToday: 'Terminées Aujourd\'hui',
    noDeliveries: 'Pas encore de livraisons',
    deliveriesSubtext: 'Vos livraisons acceptées apparaîtront ici',
    markPickedUp: 'Marquer Récupéré',
    startDelivery: 'Commencer Livraison',
    markDelivered: 'Marquer Livré',
    call: 'Appeler',
    voiceCall: 'Appel Vocal',
    videoCall: 'Appel Vidéo',
    phoneCall: 'Appel Téléphonique',
    
    // Messages
    searchConversations: 'Rechercher des conversations...',
    noConversationsFound: 'Aucune conversation trouvée',
    tryDifferentTerm: 'Essayez de chercher avec un terme différent',
    noMessagesYet: 'Pas encore de messages',
    messagesSubtext: 'Les messages des clients apparaîtront ici lorsque vous aurez des livraisons actives',
    typeMessage: 'Tapez un message...',
    online: 'En ligne',
    contactInfo: 'Infos Contact',
    mute: 'Muet',
    searchInChat: 'Rechercher dans le chat',
    camera: 'Caméra',
    gallery: 'Galerie',
    files: 'Fichiers',
    audio: 'Audio',
    
    // Profile
    availableForDeliveries: 'Disponible pour les livraisons',
    totalDeliveries: 'Total des Livraisons',
    thisMonth: 'Ce Mois',
    completionRate: 'Taux de Réussite',
    language: 'Langue',
    selectLanguage: 'Sélectionner la Langue',
    
    // Common
    refresh: 'Actualiser',
    markAllRead: 'Marquer tout comme lu',
    clearSearch: 'Effacer recherche',
    archive: 'Archiver',
    delete: 'Supprimer',
    cancel: 'Annuler',
    save: 'Sauvegarder',
    success: 'Succès',
    error: 'Erreur',
    loading: 'Chargement...',
    accept: 'Accepter',
    decline: 'Refuser',
    
    // Loading Screen
    deliveryDriver: 'Chauffeur-Livreur',
    loadingText: 'Chargement...',
    
    // Delivery Details
    deliveryDetails: 'Détails de Livraison',
    loadingDeliveryDetails: 'Chargement des détails de livraison...',
    deliveryNotFound: 'Livraison non trouvée',
    customerInformation: 'Informations Client',
    restaurantInformation: 'Informations Restaurant',
    orderDetails: 'Détails de Commande',
    deliveryInformation: 'Informations de Livraison',
    specialInstructions: 'Instructions Spéciales:',
    subtotal: 'Sous-total',
    deliveryFee: 'Frais de Livraison',
    tip: 'Pourboire',
    yourEarnings: 'Vos Gains',
    distance: 'Distance',
    estTime: 'Temps Est.',
    earnings: 'Gains',
    acceptDeliveryAction: 'Accepter la Livraison',
    startNavigation: 'Démarrer Navigation',
    markAsPickedUp: 'Marquer comme Récupéré',
    markAsDelivered: 'Marquer comme Livré',
    confirmAction: 'Confirmer l\'Action',
    areYouSure: 'Êtes-vous sûr de vouloir marquer cette livraison comme ',
    confirm: 'Confirmer',
    successStatus: 'Succès',
    deliveryMarkedAs: 'Livraison marquée comme ',
    statusPending: 'En Attente',
    statusAccepted: 'Accepté',
    statusPickedUp: 'Récupéré',
    statusDelivered: 'Livré',
    
    // Map Screen
    drivingMode: 'Mode Conduite',
    exit: 'Sortir',
    routes: 'Itinéraires',
    loadingMap: 'Chargement de la carte...',
    locationError: 'Erreur de Localisation',
    locationErrorMessage: 'Impossible d\'obtenir votre position actuelle. Utilisation de la position par défaut (New York City).\n\nAstuce: Assurez-vous que les services de localisation sont activés et redémarrez l\'application.',
    locationServicesDisabled: 'Les services de localisation sont désactivés. Veuillez activer les services de localisation dans les paramètres de votre appareil.',
    locationPermissionDenied: 'Permission de localisation refusée. Veuillez accorder la permission de localisation pour utiliser la carte.',
    acceptDeliveryQuestion: 'Accepter la Livraison',
    acceptDeliveryConfirm: 'Accepter la livraison à',
    address: 'Adresse',
    navigate: 'Naviguer',
    routeCalculated: 'Itinéraire Calculé',
    startNavigationConfirm: 'Ceci ouvrira l\'application de navigation de votre appareil',
    openMaps: 'Ouvrir Cartes',
    
    // Additional Messages/Chat
    lastSeen: 'Vu pour la dernière fois',
    delivered: 'Livré',
    read: 'Lu',
    
    // Additional Profile Options
    notifications: 'Notifications',
    pushNotifications: 'Notifications Push',
    emailNotifications: 'Notifications Email',
    smsNotifications: 'Notifications SMS',
    theme: 'Thème',
    darkMode: 'Mode Sombre',
    lightMode: 'Mode Clair',
    systemDefault: 'Par Défaut Système',
    account: 'Compte',
    editProfile: 'Modifier le Profil',
    changePassword: 'Changer le Mot de Passe',
    support: 'Support',
    helpCenter: 'Centre d\'Aide',
    contactSupport: 'Contacter le Support',
    reportIssue: 'Signaler un Problème',
    termsOfService: 'Conditions d\'Utilisation',
    privacyPolicy: 'Politique de Confidentialité',
    about: 'À Propos',
    appVersion: 'Version de l\'App',
    logout: 'Déconnexion',
    logoutConfirm: 'Êtes-vous sûr de vouloir vous déconnecter?',
    yes: 'Oui',
    no: 'Non',
    
    // Additional Profile Screen Keys
    logoutConfirmation: 'Êtes-vous sûr de vouloir vous déconnecter?',
    editProfileComingSoon: 'Fonction de modification du profil bientôt disponible!',
    supportMessage: 'Contactez le support à support@foodrush.com ou appelez le 1-800-DELIVERY',
    privacyPolicyDetails: 'Politique de Confidentialité: Nous protégeons vos données selon les normes RGPD...',
    termsService: 'Conditions d\'Utilisation',
    termsServiceDetails: 'Conditions d\'Utilisation: En utilisant cette application, vous acceptez nos conditions...',
    
    // Additional missing keys
    vehicleInformation: 'Informations Véhicule',
    phoneNumber: 'Numéro de Téléphone',
    notSet: 'Non Défini',
    helpSupport: 'Aide & Support',
    
    // Map and Navigation (new keys)
    calculateRoute: 'Calculer l\'Itinéraire',
    calculating: 'Calcul en cours...',
  },
};

const availableLanguages = [
  { code: 'en' as Language, name: 'English', nativeName: 'English' },
  { code: 'fr' as Language, name: 'French', nativeName: 'Français' },
];

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = '@app_language';

// Function to get device language
const getDeviceLanguage = (): string => {
  try {
    let locale = 'en'; // Default fallback
    
    if (Platform.OS === 'ios') {
      // Try to get iOS locale safely
      if (NativeModules.SettingsManager && NativeModules.SettingsManager.settings) {
        locale = NativeModules.SettingsManager.settings.AppleLocale || 
                 (NativeModules.SettingsManager.settings.AppleLanguages && 
                  NativeModules.SettingsManager.settings.AppleLanguages[0]) ||
                 'en';
      }
    } else {
      // Try to get Android locale safely
      if (NativeModules.I18nManager && NativeModules.I18nManager.localeIdentifier) {
        locale = NativeModules.I18nManager.localeIdentifier;
      }
    }
    
    // Extract language code (first 2 characters)
    const languageCode = locale ? locale.substring(0, 2).toLowerCase() : 'en';
    
    // Map supported languages, default to English if not supported
    const supportedLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt'];
    return supportedLanguages.includes(languageCode) ? languageCode : 'en';
  } catch (error) {
    console.log('Error getting device language:', error);
    return 'en'; // Fallback to English on any error
  }
};

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedLanguage && availableLanguages.some(lang => lang.code === savedLanguage)) {
        setCurrentLanguage(savedLanguage as Language);
      } else {
        // Use device language as default
        const deviceLanguage = getDeviceLanguage() as Language;
        setCurrentLanguage(deviceLanguage);
        await AsyncStorage.setItem(STORAGE_KEY, deviceLanguage);
      }
    } catch (error) {
      console.log('Error loading language:', error);
      setCurrentLanguage('en'); // Fallback to English
    }
  };

  const changeLanguage = async (language: Language) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, language);
      setCurrentLanguage(language);
    } catch (error) {
      console.log('Error saving language:', error);
      throw error;
    }
  };

  const t = (key: string): string => {
    return translations[currentLanguage]?.[key as keyof typeof translations[typeof currentLanguage]] || key;
  };

  const value: LanguageContextType = {
    currentLanguage,
    changeLanguage,
    t,
    availableLanguages,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
