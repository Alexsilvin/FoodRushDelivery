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
    accountCreated: 'Account created successfully!',
    accountCreatedPleaseLogin: 'Account created successfully! Please check your email and verify your account before logging in.',
    goToLogin: 'Go to Login',
    registrationFailed: 'Failed to create account. Please try again.',
    accountExists: 'Account Exists',
    tryAgain: 'Try Again',
    
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
    
    // Settings Screen
    appearance: 'Appearance',
    changeAppLanguage: 'Change app language',
    notifications: 'Notifications',
    configureNotifications: 'Configure notification preferences',
    pushNotifications: 'Push Notifications',
    emailNotifications: 'Email Notifications',
    smsNotifications: 'SMS Notifications',
    theme: 'Theme',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    systemDefault: 'System Default',
    account: 'Account',
    manageAccountInfo: 'Manage your account information',
    privacy: 'Privacy',
    managePrivacy: 'Manage privacy settings',
    editProfile: 'Edit Profile',
    changePassword: 'Change Password',
    support: 'Support',
    helpSupport: 'Help & Support',
    getHelp: 'Get help or contact support',
    contactSupport: 'Contact Support',
    reportIssue: 'Report an Issue',
    termsService: 'Terms of Service',
    viewTerms: 'View terms and conditions',
    termsServiceDetails: 'Terms of Service: By using this app, you agree to our terms...',
    privacyPolicy: 'Privacy Policy',
    appInfo: 'App Information',
    signOutDescription: 'Sign out of your account',
    
    // Settings - Theme
    followSystem: 'Follow system theme',
    alwaysUseLight: 'Always use light mode',
    alwaysUseDark: 'Always use dark mode',
    
    // Settings - Delivery
    delivery: 'Delivery',
    updateVehicleDetails: 'Update your delivery vehicle details',
    workingHours: 'Working Hours',
    setAvailability: 'Set your availability schedule',
    setSchedule: 'Set Schedule',
    scheduleDescription: 'Select your preferred working hours for the week',
    setWeeklyHours: 'Set Weekly Hours',
    viewPaymentHistory: 'View payment and earnings history',
    currentBalance: 'Current Balance',
    pendingTransfers: 'Pending Transfers',
    lastWeekEarnings: 'Last Week',
    thisMonthEarnings: 'This Month',
    viewAllTransactions: 'View All Transactions',
    
    // Buttons and Common
    done: 'Done',
    featureAvailableSoon: 'This feature will be available soon',
    privacyPolicyDetails: 'Privacy Policy: We protect your data according to GDPR standards...',
    
    // Additional missing keys
    phoneNumber: 'Phone Number',
    notSet: 'Not Set',
    
    // Profile Edit
    nameRequired: 'Name is required',
    emailRequired: 'Email is required',
    fullName: 'Full Name',
    enterName: 'Enter your name',
    enterEmail: 'Enter your email',
    profileUpdated: 'Profile successfully updated',
    updateFailed: 'Update failed',
    somethingWentWrong: 'Something went wrong',
    invalidEmail: 'Please enter a valid email',
    
    // Vehicle Information
    yourVehicles: 'Your Vehicles',
    addVehicle: 'Add Vehicle',
    addNewVehicle: 'Add New Vehicle',
    vehicleName: 'Vehicle Name',
    vehicleType: 'Vehicle Type',
    enterVehicleName: 'Enter vehicle name',
    car: 'Car',
    motorcycle: 'Motorcycle',
    other: 'Other',
    add: 'Add',
    default: 'Default',
    setDefault: 'Set as Default',
    vehiclesUpdated: 'Vehicles successfully updated',
    cannotRemoveLastVehicle: 'Cannot remove your last vehicle',
    vehicleNameRequired: 'Vehicle name is required',
    noVehiclesAdded: 'No vehicles added yet',
    
    // Phone Numbers
    phoneNumbers: 'Phone Numbers',
    yourPhoneNumbers: 'Your Phone Numbers',
    addPhoneNumber: 'Add Phone Number',
    addNewPhoneNumber: 'Add New Phone Number',
    enterPhoneNumber: 'Enter phone number',
    primary: 'Primary',
    setPrimary: 'Set as Primary',
    phoneNumbersUpdated: 'Phone numbers successfully updated',
    cannotRemoveLastNumber: 'Cannot remove your last phone number',
    phoneNumberRequired: 'Phone number is required',
    invalidPhoneNumber: 'Please enter a valid phone number',
    phoneNumberAlreadyExists: 'This phone number already exists',
    noPhoneNumbersAdded: 'No phone numbers added yet',
    atLeastOnePhone: 'You must have at least one phone number',
    
    // Map and Navigation (new keys)
    calculateRoute: 'Calculate Route',
    calculating: 'Calculating...',
    // Coming Soon Overlay
    comingSoon: 'Coming Soon',
    mapComingSoonMessage: 'The map experience is being improved. Check back soon!',
    // Chat enhancements
    typing: 'typing...',
    quickReplies: 'Quick Replies',
    allFilter: 'All',
    unreadFilter: 'Unread',
    recentFilter: 'Recent',
    starredFilter: 'Starred',
    messageCopied: 'Message copied',
    deleteMessage: 'Delete Message',
    confirmDeleteMessage: 'Are you sure you want to delete this message?',
    messageDeleted: 'Message deleted',
    starChat: 'Star Chat',
    unstarChat: 'Unstar Chat',
    pinChat: 'Pin Chat',
    unpinChat: 'Unpin Chat',
    markResolved: 'Mark Resolved',
    resolved: 'Resolved',
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
    accountCreated: 'Compte créé avec succès!',
    accountCreatedPleaseLogin: 'Compte créé avec succès! Veuillez vérifier votre email et confirmer votre compte avant de vous connecter.',
    goToLogin: 'Aller à la Connexion',
    registrationFailed: 'Échec de la création du compte. Veuillez réessayer.',
    accountExists: 'Compte Existant',
    tryAgain: 'Réessayer',
    
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
    
    // Profile Edit
    nameRequired: 'Le nom est requis',
    emailRequired: 'L\'email est requis',
    fullName: 'Nom Complet',
    enterName: 'Entrez votre nom',
    enterEmail: 'Entrez votre email',
    profileUpdated: 'Profil mis à jour avec succès',
    updateFailed: 'La mise à jour a échoué',
    somethingWentWrong: 'Une erreur s\'est produite',
    invalidEmail: 'Veuillez entrer un email valide',
    
    // Vehicle Information
    yourVehicles: 'Vos Véhicules',
    addVehicle: 'Ajouter un Véhicule',
    addNewVehicle: 'Ajouter un Nouveau Véhicule',
    vehicleName: 'Nom du Véhicule',
    vehicleType: 'Type de Véhicule',
    enterVehicleName: 'Entrez le nom du véhicule',
    car: 'Voiture',
    motorcycle: 'Moto',
    other: 'Autre',
    add: 'Ajouter',
    default: 'Par Défaut',
    setDefault: 'Définir par Défaut',
    vehiclesUpdated: 'Véhicules mis à jour avec succès',
    cannotRemoveLastVehicle: 'Impossible de supprimer votre dernier véhicule',
    vehicleNameRequired: 'Le nom du véhicule est requis',
    noVehiclesAdded: 'Aucun véhicule ajouté',
    
    // Phone Numbers
    phoneNumbers: 'Numéros de Téléphone',
    yourPhoneNumbers: 'Vos Numéros de Téléphone',
    addPhoneNumber: 'Ajouter un Numéro',
    addNewPhoneNumber: 'Ajouter un Nouveau Numéro',
    enterPhoneNumber: 'Entrez le numéro de téléphone',
    primary: 'Principal',
    setPrimary: 'Définir comme Principal',
    phoneNumbersUpdated: 'Numéros de téléphone mis à jour avec succès',
    cannotRemoveLastNumber: 'Impossible de supprimer votre dernier numéro',
    phoneNumberRequired: 'Le numéro de téléphone est requis',
    invalidPhoneNumber: 'Veuillez entrer un numéro valide',
    phoneNumberAlreadyExists: 'Ce numéro existe déjà',
    noPhoneNumbersAdded: 'Aucun numéro de téléphone ajouté',
    atLeastOnePhone: 'Vous devez avoir au moins un numéro de téléphone',
    
    // Map and Navigation (new keys)
    calculateRoute: 'Calculer l\'Itinéraire',
    calculating: 'Calcul en cours...',
    // Coming Soon Overlay
    comingSoon: 'Bientôt Disponible',
    mapComingSoonMessage: "L'expérience de la carte est en amélioration. Revenez bientôt !",
    // Chat enhancements
    typing: 'écrit...',
    quickReplies: 'Réponses Rapides',
    allFilter: 'Tout',
    unreadFilter: 'Non lus',
    recentFilter: 'Récents',
    starredFilter: 'Favoris',
    messageCopied: 'Message copié',
    deleteMessage: 'Supprimer le message',
    confirmDeleteMessage: 'Êtes-vous sûr de vouloir supprimer ce message ?',
    messageDeleted: 'Message supprimé',
    starChat: 'Mettre en favori',
    unstarChat: 'Retirer des favoris',
    pinChat: 'Épingler',
    unpinChat: 'Désépingler',
    markResolved: 'Marquer résolu',
    resolved: 'Résolu',
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
