import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';

type Language = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt';

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
    
    // Deliveries
    activeDeliveries: 'Active Deliveries',
    completedToday: 'Completed Today',
    noDeliveries: 'No deliveries yet',
    deliveriesSubtext: 'Your accepted deliveries will appear here',
    markPickedUp: 'Mark Picked Up',
    startDelivery: 'Start Delivery',
    markDelivered: 'Mark Delivered',
    call: 'Call',
    
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
  },
  es: {
    // Navigation
    dashboard: 'Panel',
    deliveries: 'Mis Entregas',
    messages: 'Mensajes',
    map: 'Mapa',
    profile: 'Perfil',
    settings: 'Configuración',
    
    // Dashboard
    welcomeBack: 'Bienvenido de vuelta',
    readyToDeliver: '¿Listo para entregar hoy?',
    todaysEarnings: 'Ganancias de Hoy',
    completed: 'Completado',
    rating: 'Calificación',
    availableDeliveries: 'Entregas Disponibles',
    
    // Deliveries
    activeDeliveries: 'Entregas Activas',
    completedToday: 'Completadas Hoy',
    noDeliveries: 'Aún no hay entregas',
    deliveriesSubtext: 'Tus entregas aceptadas aparecerán aquí',
    markPickedUp: 'Marcar Recogido',
    startDelivery: 'Iniciar Entrega',
    markDelivered: 'Marcar Entregado',
    call: 'Llamar',
    
    // Messages
    searchConversations: 'Buscar conversaciones...',
    noConversationsFound: 'No se encontraron conversaciones',
    tryDifferentTerm: 'Intenta buscar con un término diferente',
    noMessagesYet: 'Aún no hay mensajes',
    messagesSubtext: 'Los mensajes de clientes aparecerán aquí cuando tengas entregas activas',
    typeMessage: 'Escribe un mensaje...',
    online: 'En línea',
    contactInfo: 'Información de Contacto',
    mute: 'Silenciar',
    searchInChat: 'Buscar en chat',
    camera: 'Cámara',
    gallery: 'Galería',
    files: 'Archivos',
    audio: 'Audio',
    
    // Profile
    availableForDeliveries: 'Disponible para entregas',
    totalDeliveries: 'Total de Entregas',
    thisMonth: 'Este Mes',
    completionRate: 'Tasa de Finalización',
    language: 'Idioma',
    selectLanguage: 'Seleccionar Idioma',
    
    // Common
    refresh: 'Actualizar',
    markAllRead: 'Marcar todo como leído',
    clearSearch: 'Limpiar búsqueda',
    archive: 'Archivar',
    delete: 'Eliminar',
    cancel: 'Cancelar',
    save: 'Guardar',
    success: 'Éxito',
    error: 'Error',
    loading: 'Cargando...',
    accept: 'Aceptar',
    decline: 'Rechazar',
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
    
    // Deliveries
    activeDeliveries: 'Livraisons Actives',
    completedToday: 'Terminées Aujourd\'hui',
    noDeliveries: 'Pas encore de livraisons',
    deliveriesSubtext: 'Vos livraisons acceptées apparaîtront ici',
    markPickedUp: 'Marquer Récupéré',
    startDelivery: 'Commencer Livraison',
    markDelivered: 'Marquer Livré',
    call: 'Appeler',
    
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
  },
  de: {
    // Navigation
    dashboard: 'Dashboard',
    deliveries: 'Meine Lieferungen',
    messages: 'Nachrichten',
    map: 'Karte',
    profile: 'Profil',
    settings: 'Einstellungen',
    
    // Dashboard
    welcomeBack: 'Willkommen zurück',
    readyToDeliver: 'Bereit zum Liefern heute?',
    todaysEarnings: 'Heutige Einnahmen',
    completed: 'Abgeschlossen',
    rating: 'Bewertung',
    availableDeliveries: 'Verfügbare Lieferungen',
    
    // Deliveries
    activeDeliveries: 'Aktive Lieferungen',
    completedToday: 'Heute Abgeschlossen',
    noDeliveries: 'Noch keine Lieferungen',
    deliveriesSubtext: 'Ihre angenommenen Lieferungen werden hier angezeigt',
    markPickedUp: 'Als Abgeholt Markieren',
    startDelivery: 'Lieferung Starten',
    markDelivered: 'Als Geliefert Markieren',
    call: 'Anrufen',
    
    // Messages
    searchConversations: 'Gespräche durchsuchen...',
    noConversationsFound: 'Keine Gespräche gefunden',
    tryDifferentTerm: 'Versuchen Sie es mit einem anderen Begriff',
    noMessagesYet: 'Noch keine Nachrichten',
    messagesSubtext: 'Kundennachrichten erscheinen hier, wenn Sie aktive Lieferungen haben',
    typeMessage: 'Nachricht eingeben...',
    online: 'Online',
    contactInfo: 'Kontaktinfo',
    mute: 'Stumm',
    searchInChat: 'Im Chat suchen',
    camera: 'Kamera',
    gallery: 'Galerie',
    files: 'Dateien',
    audio: 'Audio',
    
    // Profile
    availableForDeliveries: 'Verfügbar für Lieferungen',
    totalDeliveries: 'Gesamte Lieferungen',
    thisMonth: 'Diesen Monat',
    completionRate: 'Abschlussrate',
    language: 'Sprache',
    selectLanguage: 'Sprache Auswählen',
    
    // Common
    refresh: 'Aktualisieren',
    markAllRead: 'Alle als gelesen markieren',
    clearSearch: 'Suche löschen',
    archive: 'Archivieren',
    delete: 'Löschen',
    cancel: 'Abbrechen',
    save: 'Speichern',
    success: 'Erfolg',
    error: 'Fehler',
    loading: 'Lädt...',
    accept: 'Akzeptieren',
    decline: 'Ablehnen',
  },
  it: {
    // Navigation
    dashboard: 'Dashboard',
    deliveries: 'Le Mie Consegne',
    messages: 'Messaggi',
    map: 'Mappa',
    profile: 'Profilo',
    settings: 'Impostazioni',
    
    // Dashboard
    welcomeBack: 'Bentornato',
    readyToDeliver: 'Pronto per consegnare oggi?',
    todaysEarnings: 'Guadagni di Oggi',
    completed: 'Completato',
    rating: 'Valutazione',
    availableDeliveries: 'Consegne Disponibili',
    
    // Deliveries
    activeDeliveries: 'Consegne Attive',
    completedToday: 'Completate Oggi',
    noDeliveries: 'Nessuna consegna ancora',
    deliveriesSubtext: 'Le tue consegne accettate appariranno qui',
    markPickedUp: 'Segna Ritirato',
    startDelivery: 'Inizia Consegna',
    markDelivered: 'Segna Consegnato',
    call: 'Chiama',
    
    // Messages
    searchConversations: 'Cerca conversazioni...',
    noConversationsFound: 'Nessuna conversazione trovata',
    tryDifferentTerm: 'Prova a cercare con un termine diverso',
    noMessagesYet: 'Nessun messaggio ancora',
    messagesSubtext: 'I messaggi dei clienti appariranno qui quando avrai consegne attive',
    typeMessage: 'Scrivi un messaggio...',
    online: 'Online',
    contactInfo: 'Info Contatto',
    mute: 'Muto',
    searchInChat: 'Cerca nella chat',
    camera: 'Fotocamera',
    gallery: 'Galleria',
    files: 'File',
    audio: 'Audio',
    
    // Profile
    availableForDeliveries: 'Disponibile per consegne',
    totalDeliveries: 'Consegne Totali',
    thisMonth: 'Questo Mese',
    completionRate: 'Tasso di Completamento',
    language: 'Lingua',
    selectLanguage: 'Seleziona Lingua',
    
    // Common
    refresh: 'Aggiorna',
    markAllRead: 'Segna tutto come letto',
    clearSearch: 'Cancella ricerca',
    archive: 'Archivia',
    delete: 'Elimina',
    cancel: 'Annulla',
    save: 'Salva',
    success: 'Successo',
    error: 'Errore',
    loading: 'Caricamento...',
    accept: 'Accetta',
    decline: 'Rifiuta',
  },
  pt: {
    // Navigation
    dashboard: 'Painel',
    deliveries: 'Minhas Entregas',
    messages: 'Mensagens',
    map: 'Mapa',
    profile: 'Perfil',
    settings: 'Configurações',
    
    // Dashboard
    welcomeBack: 'Bem-vindo de volta',
    readyToDeliver: 'Pronto para entregar hoje?',
    todaysEarnings: 'Ganhos de Hoje',
    completed: 'Concluído',
    rating: 'Avaliação',
    availableDeliveries: 'Entregas Disponíveis',
    
    // Deliveries
    activeDeliveries: 'Entregas Ativas',
    completedToday: 'Concluídas Hoje',
    noDeliveries: 'Ainda não há entregas',
    deliveriesSubtext: 'Suas entregas aceitas aparecerão aqui',
    markPickedUp: 'Marcar Coletado',
    startDelivery: 'Iniciar Entrega',
    markDelivered: 'Marcar Entregue',
    call: 'Ligar',
    
    // Messages
    searchConversations: 'Pesquisar conversas...',
    noConversationsFound: 'Nenhuma conversa encontrada',
    tryDifferentTerm: 'Tente pesquisar com um termo diferente',
    noMessagesYet: 'Ainda não há mensagens',
    messagesSubtext: 'Mensagens de clientes aparecerão aqui quando você tiver entregas ativas',
    typeMessage: 'Digite uma mensagem...',
    online: 'Online',
    contactInfo: 'Info de Contato',
    mute: 'Silenciar',
    searchInChat: 'Pesquisar no chat',
    camera: 'Câmera',
    gallery: 'Galeria',
    files: 'Arquivos',
    audio: 'Áudio',
    
    // Profile
    availableForDeliveries: 'Disponível para entregas',
    totalDeliveries: 'Total de Entregas',
    thisMonth: 'Este Mês',
    completionRate: 'Taxa de Conclusão',
    language: 'Idioma',
    selectLanguage: 'Selecionar Idioma',
    
    // Common
    refresh: 'Atualizar',
    markAllRead: 'Marcar tudo como lido',
    clearSearch: 'Limpar pesquisa',
    archive: 'Arquivar',
    delete: 'Excluir',
    cancel: 'Cancelar',
    save: 'Salvar',
    success: 'Sucesso',
    error: 'Erro',
    loading: 'Carregando...',
    accept: 'Aceitar',
    decline: 'Recusar',
  },
};

const availableLanguages = [
  { code: 'en' as Language, name: 'English', nativeName: 'English' },
  { code: 'es' as Language, name: 'Spanish', nativeName: 'Español' },
  { code: 'fr' as Language, name: 'French', nativeName: 'Français' },
  { code: 'de' as Language, name: 'German', nativeName: 'Deutsch' },
  { code: 'it' as Language, name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt' as Language, name: 'Portuguese', nativeName: 'Português' },
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
