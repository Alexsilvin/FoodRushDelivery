import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  FlatList,
  Animated,
  Alert,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCall } from '../../contexts/CallContext';
import { useNavigation } from '@react-navigation/native';

interface Message {
  id: string;
  text: string;
  sender: 'driver' | 'customer';
  timestamp: Date;
  customerName?: string;
}

interface ChatThread {
  id: string;
  customerName: string;
  lastMessage: string;
  timestamp: Date;
  unreadCount: number;
  deliveryId: string;
}

export default function ChatScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { startCall } = useCall();
  const navigation = useNavigation();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isOptionsVisible, setIsOptionsVisible] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedThreads, setSelectedThreads] = useState<Set<string>>(new Set());
  const [isChatOptionsVisible, setIsChatOptionsVisible] = useState(false);
  const [attachmentType, setAttachmentType] = useState<'camera' | 'gallery' | 'file' | 'audio' | null>(null);
  const [isMediaMenuVisible, setIsMediaMenuVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const searchAnimation = useRef(new Animated.Value(0)).current;
  const optionsAnimation = useRef(new Animated.Value(0)).current;
  const chatOptionsAnimation = useRef(new Animated.Value(0)).current;
  const mediaMenuAnimation = useRef(new Animated.Value(0)).current;

  const [chatThreads] = useState<ChatThread[]>([
    {
      id: '1',
      customerName: 'Emma Davis',
      lastMessage: 'Thank you! I&apos;ll be waiting outside.',
      timestamp: new Date(Date.now() - 5 * 60000),
      unreadCount: 1,
      deliveryId: '3',
    },
    {
      id: '2',
      customerName: 'John Smith',
      lastMessage: 'Apartment 4B, second floor',
      timestamp: new Date(Date.now() - 15 * 60000),
      unreadCount: 0,
      deliveryId: '4',
    },
    {
      id: '3',
      customerName: 'Mike Chen',
      lastMessage: 'Great, thanks for the update!',
      timestamp: new Date(Date.now() - 2 * 60 * 60000),
      unreadCount: 0,
      deliveryId: '2',
    },
    {
      id: '4',
      customerName: 'Sarah Johnson',
      lastMessage: 'Could you please ring the doorbell?',
      timestamp: new Date(Date.now() - 3 * 60 * 60000),
      unreadCount: 2,
      deliveryId: '5',
    },
    {
      id: '5',
      customerName: 'David Wilson',
      lastMessage: 'Perfect timing! Thank you so much.',
      timestamp: new Date(Date.now() - 4 * 60 * 60000),
      unreadCount: 0,
      deliveryId: '6',
    },
    {
      id: '6',
      customerName: 'Lisa Rodriguez',
      lastMessage: 'I&apos;m in the lobby waiting',
      timestamp: new Date(Date.now() - 6 * 60 * 60000),
      unreadCount: 3,
      deliveryId: '7',
    },
    {
      id: '7',
      customerName: 'Alex Thompson',
      lastMessage: 'Can you leave it at the door? Thanks!',
      timestamp: new Date(Date.now() - 8 * 60 * 60000),
      unreadCount: 0,
      deliveryId: '8',
    },
    {
      id: '8',
      customerName: 'Maria Garcia',
      lastMessage: 'How long until delivery?',
      timestamp: new Date(Date.now() - 12 * 60 * 60000),
      unreadCount: 1,
      deliveryId: '9',
    },
    {
      id: '9',
      customerName: 'Robert Brown',
      lastMessage: 'Thanks for the quick delivery!',
      timestamp: new Date(Date.now() - 24 * 60 * 60000),
      unreadCount: 0,
      deliveryId: '10',
    },
    {
      id: '10',
      customerName: 'Jennifer Lee',
      lastMessage: 'Please call when you arrive',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60000),
      unreadCount: 0,
      deliveryId: '11',
    },
  ]);

  // Initialize filteredThreads with chatThreads
  const [filteredThreads, setFilteredThreads] = useState<ChatThread[]>(chatThreads);

  const [messages, setMessages] = useState<Record<string, Message[]>>({
    '1': [
      {
        id: '1',
        text: 'Hi! I&apos;m your delivery driver. I&apos;ve picked up your order from Sushi Spot and I&apos;m on my way!',
        sender: 'driver',
        timestamp: new Date(Date.now() - 10 * 60000),
      },
      {
        id: '2',
        text: 'Perfect! How long do you think it will take?',
        sender: 'customer',
        timestamp: new Date(Date.now() - 8 * 60000),
        customerName: 'Emma Davis',
      },
      {
        id: '3',
        text: 'About 10-12 minutes. I&apos;ll send you an update when I&apos;m close.',
        sender: 'driver',
        timestamp: new Date(Date.now() - 7 * 60000),
      },
      {
        id: '4',
        text: 'I&apos;m almost there! I&apos;ll be at your building in 2 minutes.',
        sender: 'driver',
        timestamp: new Date(Date.now() - 6 * 60000),
      },
      {
        id: '5',
        text: 'Thank you! I&apos;ll be waiting outside.',
        sender: 'customer',
        timestamp: new Date(Date.now() - 5 * 60000),
        customerName: 'Emma Davis',
      },
    ],
    '2': [
      {
        id: '1',
        text: 'Hi! I have your order from Taco Bell. I&apos;m heading to your location now.',
        sender: 'driver',
        timestamp: new Date(Date.now() - 20 * 60000),
      },
      {
        id: '2',
        text: 'Great! Just to let you know, I&apos;m in apartment 4B on the second floor.',
        sender: 'customer',
        timestamp: new Date(Date.now() - 18 * 60000),
        customerName: 'John Smith',
      },
      {
        id: '3',
        text: 'Got it! I&apos;ll head up to apartment 4B when I arrive.',
        sender: 'driver',
        timestamp: new Date(Date.now() - 15 * 60000),
      },
    ],
    '3': [
      {
        id: '1',
        text: 'Your order is ready for pickup. I&apos;ll be there in about 15 minutes.',
        sender: 'driver',
        timestamp: new Date(Date.now() - 3 * 60 * 60000),
      },
      {
        id: '2',
        text: 'Sounds good! Thank you for the update.',
        sender: 'customer',
        timestamp: new Date(Date.now() - 2.5 * 60 * 60000),
        customerName: 'Mike Chen',
      },
      {
        id: '3',
        text: 'Order delivered successfully! Enjoy your meal!',
        sender: 'driver',
        timestamp: new Date(Date.now() - 2 * 60 * 60000),
      },
      {
        id: '4',
        text: 'Great, thanks for the update!',
        sender: 'customer',
        timestamp: new Date(Date.now() - 2 * 60 * 60000),
        customerName: 'Mike Chen',
      },
    ],
  });

  // Filter chat threads based on search query
  const filterThreads = useCallback(() => {
    if (!searchQuery.trim()) {
      setFilteredThreads(chatThreads);
    } else {
      const filtered = chatThreads.filter(thread =>
        thread.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        thread.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredThreads(filtered);
    }
  }, [chatThreads, searchQuery]);

  useEffect(() => {
    filterThreads();
  }, [filterThreads]);

  const toggleSearch = () => {
    setIsSearchVisible(!isSearchVisible);
    if (!isSearchVisible) {
      Animated.timing(searchAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(searchAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start(() => {
        setSearchQuery('');
      });
    }
  };

  const handleLongPress = (threadId: string) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedThreads(new Set([threadId]));
    }
  };

  const handleThreadPress = (threadId: string) => {
    if (isSelectionMode) {
      const newSelection = new Set(selectedThreads);
      if (newSelection.has(threadId)) {
        newSelection.delete(threadId);
      } else {
        newSelection.add(threadId);
      }
      setSelectedThreads(newSelection);
      
      // Exit selection mode if no threads are selected
      if (newSelection.size === 0) {
        setIsSelectionMode(false);
      }
    } else {
      setSelectedChat(threadId);
    }
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedThreads(new Set());
  };

  const handleBulkArchive = () => {
    Alert.alert(
      'Archive Conversations',
      `Archive ${selectedThreads.size} selected conversation(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          onPress: () => {
            Alert.alert('Success', `${selectedThreads.size} conversation(s) archived`);
            exitSelectionMode();
          },
        },
      ]
    );
  };

  const handleBulkDelete = () => {
    Alert.alert(
      'Delete Conversations',
      `Delete ${selectedThreads.size} selected conversation(s)? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Success', `${selectedThreads.size} conversation(s) deleted`);
            exitSelectionMode();
          },
        },
      ]
    );
  };

  const handleBulkMarkImportant = () => {
    Alert.alert('Success', `${selectedThreads.size} conversation(s) marked as important`);
    exitSelectionMode();
  };

  const handleSelectAll = () => {
    const allThreadIds = new Set(filteredThreads.map(thread => thread.id));
    setSelectedThreads(allThreadIds);
  };

  const handleVoiceCall = () => {
    setIsChatOptionsVisible(false);
    const currentThread = chatThreads.find(thread => thread.id === selectedChat);
    if (currentThread) {
      startCall(currentThread.customerName, 'voice');
    }
  };

  const handleVideoCall = () => {
    setIsChatOptionsVisible(false);
    const currentThread = chatThreads.find(thread => thread.id === selectedChat);
    if (currentThread) {
      startCall(currentThread.customerName, 'video');
    }
  };

  const handleCustomerNamePress = () => {
    const currentThread = chatThreads.find(thread => thread.id === selectedChat);
    if (currentThread) {
      (navigation as any).navigate('CustomerProfile', {
        customer: {
          id: currentThread.id,
          name: currentThread.customerName,
          phone: '+1 (555) 123-4567',
          email: 'customer@example.com',
          address: '123 Main Street, New York, NY 10001',
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
    }
  };

  const toggleChatOptions = () => {
    setIsChatOptionsVisible(!isChatOptionsVisible);
    if (!isChatOptionsVisible) {
      Animated.timing(chatOptionsAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(chatOptionsAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleAttachment = (type: 'camera' | 'gallery' | 'file' | 'audio') => {
    setAttachmentType(type);
    setIsMediaMenuVisible(false); // Hide menu after selection
    const actions = {
      camera: () => Alert.alert('Camera', 'Opening camera...'),
      gallery: () => Alert.alert('Gallery', 'Opening photo gallery...'),
      file: () => Alert.alert('Files', 'Opening file browser...'),
      audio: () => Alert.alert('Audio', 'Opening audio recorder...'),
    };
    actions[type]();
  };

  const toggleMediaMenu = () => {
    setIsMediaMenuVisible(!isMediaMenuVisible);
    if (!isMediaMenuVisible) {
      Animated.timing(mediaMenuAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(mediaMenuAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const toggleOptions = () => {
    setIsOptionsVisible(!isOptionsVisible);
    if (!isOptionsVisible) {
      Animated.timing(optionsAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(optionsAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleRefresh = () => {
    setIsOptionsVisible(false);
    // Simulate refresh - in real app, this would reload chat threads
    Alert.alert(t('refreshed'), t('chatsRefreshed'));
    // You could add a loading state and refresh logic here
  };

  const handleMarkAllRead = () => {
    setIsOptionsVisible(false);
    // Mark all conversations as read
    Alert.alert(t('done'), t('allMarkedRead'));
    // In real app, this would update the backend and local state
  };

  const handleClearSearch = () => {
    setIsOptionsVisible(false);
    setSearchQuery('');
    if (isSearchVisible) {
      toggleSearch();
    }
    Alert.alert(t('cleared'), t('searchCleared'));
  };

  const handleArchiveAll = () => {
    setIsOptionsVisible(false);
    // Archive completed conversations
    Alert.alert(
      'Archive Conversations',
      'Archive all completed delivery conversations?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Archive', 
          onPress: () => Alert.alert('Success', 'Completed conversations have been archived'),
        },
      ]
    );
  };

  const sendMessage = () => {
    if (!messageText.trim() || !selectedChat) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: messageText.trim(),
      sender: 'driver',
      timestamp: new Date(),
    };

    setMessages(prev => ({
      ...prev,
      [selectedChat]: [...(prev[selectedChat] || []), newMessage],
    }));

    setMessageText('');
    
    // Scroll to bottom after sending message
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatLastMessageTime = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (selectedChat) {
    const currentThread = chatThreads.find(thread => thread.id === selectedChat);
    const chatMessages = messages[selectedChat] || [];

    return (
      <>
        <StatusBar 
          barStyle={theme.isDark ? "light-content" : "dark-content"}
          backgroundColor={theme.colors.background}
          translucent={false}
          hidden={false}
        />
        <TouchableOpacity 
          activeOpacity={1}
          onPress={() => {
            if (isChatOptionsVisible) {
              setIsChatOptionsVisible(false);
            }
            if (isMediaMenuVisible) {
              setIsMediaMenuVisible(false);
            }
          }}
          style={{ flex: 1 }}
        >
          <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: 50 }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
        <View style={[
          styles.chatHeader, 
          { 
            backgroundColor: theme.isDark 
              ? `${theme.colors.primary}20` 
              : `${theme.colors.primary}15`, 
            borderBottomColor: theme.colors.border 
          }
        ]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedChat(null)}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          
          <View style={styles.chatHeaderCenter}>
            <View style={[styles.chatAvatar, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.chatAvatarText}>
                {currentThread?.customerName.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
            <View style={styles.chatHeaderInfo}>
              <TouchableOpacity onPress={handleCustomerNamePress}>
                <Text style={[styles.chatTitle, { color: theme.colors.text }]}>{currentThread?.customerName}</Text>
              </TouchableOpacity>
              <Text style={[styles.chatStatus, { color: theme.colors.textSecondary }]}>Online</Text>
            </View>
          </View>

          <View style={styles.chatHeaderActions}>
            <TouchableOpacity style={styles.headerActionButton} onPress={handleVideoCall}>
              <Ionicons name="videocam-outline" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionButton} onPress={handleVoiceCall}>
              <Ionicons name="call-outline" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionButton} onPress={toggleChatOptions}>
              <Ionicons name="ellipsis-vertical" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Chat Options Dropdown */}
        {isChatOptionsVisible && (
          <Animated.View 
            style={[
              styles.chatOptionsDropdown,
              { 
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                transform: [{
                  scale: chatOptionsAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                }],
                opacity: chatOptionsAnimation,
              }
            ]}
          >
            <TouchableOpacity style={styles.optionItem}>
              <Ionicons name="information-circle-outline" size={18} color={theme.colors.text} />
              <Text style={[styles.optionText, { color: theme.colors.text }]}>Contact Info</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.optionItem}>
              <Ionicons name="volume-mute-outline" size={18} color={theme.colors.text} />
              <Text style={[styles.optionText, { color: theme.colors.text }]}>Mute</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.optionItem}>
              <Ionicons name="search-outline" size={18} color={theme.colors.text} />
              <Text style={[styles.optionText, { color: theme.colors.text }]}>Search in chat</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <View style={styles.messagesWrapper}>
          {/* Background image with original opacity, dark background shows through transparency */}
          <Image 
            source={require('../../../assets/pattern1.png')} 
            style={styles.messagesBackgroundImage}
            resizeMode="cover"
            alt=""
          />
          <ScrollView
            ref={scrollViewRef}
            style={[styles.messagesContainer, { backgroundColor: 'transparent' }]}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
          {chatMessages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.sender === 'driver' 
                  ? [styles.driverMessage, { backgroundColor: theme.colors.primary }]
                  : [styles.customerMessage, { backgroundColor: theme.colors.surface }],
              ]}
            >
              <Text style={[
                styles.messageText,
                message.sender === 'driver' 
                  ? styles.driverMessageText 
                  : [styles.customerMessageText, { color: theme.colors.text }],
              ]}>
                {message.text}
              </Text>
              <Text style={[
                styles.messageTime,
                message.sender === 'driver' 
                  ? styles.driverMessageTime 
                  : [styles.customerMessageTime, { color: theme.colors.textSecondary }],
              ]}>
                {formatTime(message.timestamp)}
              </Text>
            </View>
          ))}
        </ScrollView>
        </View>

        <View style={[styles.inputWrapper, { backgroundColor: theme.colors.surface }]}>
          <Image 
            source={require('../../../assets/pattern1.png')} 
            style={styles.inputBackgroundImage}
            resizeMode="cover"
            alt=""
          />
          <View style={[styles.inputContainer, { backgroundColor: theme.colors.card }]}>
            
            {/* Attachment Button */}
            <TouchableOpacity style={styles.attachmentButton} onPress={toggleMediaMenu}>
              <Ionicons 
                name={isMediaMenuVisible ? "close" : "add"} 
                size={24} 
                color={theme.colors.primary} 
              />
            </TouchableOpacity>

            {/* Expandable Media Menu */}
            {isMediaMenuVisible && (
              <Animated.View 
                style={[
                  styles.mediaMenu,
                  {
                    transform: [{
                      scale: mediaMenuAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    }],
                    opacity: mediaMenuAnimation,
                  }
                ]}
              >
                <TouchableOpacity style={styles.mediaMenuItem} onPress={() => handleAttachment('camera')}>
                  <View style={[styles.mediaIconContainer, { backgroundColor: theme.colors.primary }]}>
                    <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.mediaMenuText, { color: theme.colors.text }]}>{t('camera')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.mediaMenuItem} onPress={() => handleAttachment('gallery')}>
                  <View style={[styles.mediaIconContainer, { backgroundColor: theme.colors.primary }]}>
                    <Ionicons name="image-outline" size={20} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.mediaMenuText, { color: theme.colors.text }]}>{t('gallery')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.mediaMenuItem} onPress={() => handleAttachment('file')}>
                  <View style={[styles.mediaIconContainer, { backgroundColor: theme.colors.primary }]}>
                    <Ionicons name="document-outline" size={20} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.mediaMenuText, { color: theme.colors.text }]}>{t('files')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.mediaMenuItem} onPress={() => handleAttachment('audio')}>
                  <View style={[styles.mediaIconContainer, { backgroundColor: theme.colors.primary }]}>
                    <Ionicons name="mic-outline" size={20} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.mediaMenuText, { color: theme.colors.text }]}>{t('audio')}</Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            <TextInput
              style={[styles.messageInput, { color: theme.colors.text, backgroundColor: theme.colors.background }]}
              placeholder={t('typeMessage')}
              placeholderTextColor={theme.colors.textSecondary}
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={500}
            />

            <TouchableOpacity
              style={[
                styles.sendButton, 
                { backgroundColor: messageText.trim() ? theme.colors.primary : theme.colors.textSecondary }
              ]}
              onPress={sendMessage}
              disabled={!messageText.trim()}
            >
              <Ionicons
                name="send"
                size={20}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        </View>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </>
    );
  }

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: 50 }]}
      activeOpacity={1}
      onPress={() => {
        if (isOptionsVisible) {
          setIsOptionsVisible(false);
        }
      }}
    >
      {/* Big Messages Header */}
      <View style={[styles.messagesHeader, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.messagesTitle, { color: theme.colors.text }]}>{t('messages')}</Text>
      </View>

      {/* Search Bar Actions - Moved to top */}
      <View style={[styles.topActions, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {isSelectionMode ? `Selected: ${selectedThreads.size}` : ''}
        </Text>
        <View style={styles.headerActions}>
          {isSelectionMode && (
            <TouchableOpacity onPress={exitSelectionMode} style={styles.searchToggle}>
              <Ionicons name="close" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
          {!isSelectionMode && (
            <TouchableOpacity onPress={toggleSearch} style={styles.searchToggle}>
              <Ionicons 
                name={isSearchVisible ? "close" : "search-outline"} 
                size={24} 
                color={theme.colors.primary} 
              />
            </TouchableOpacity>
          )}
          <View style={styles.optionsContainer}>
            <TouchableOpacity style={styles.moreButton} onPress={toggleOptions}>
              <Ionicons name="ellipsis-vertical" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
            
            {/* Options Dropdown */}
            {isOptionsVisible && (
              <Animated.View 
                style={[
                  styles.optionsDropdown,
                  { 
                    borderColor: theme.colors.border,
                    transform: [{
                      scale: optionsAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    }],
                    opacity: optionsAnimation,
                  }
                ]}
              >
                <BlurView 
                  intensity={80} 
                  tint={theme.isDark ? "dark" : "light"} 
                  style={styles.blurDropdown}
                >
                {!isSelectionMode ? (
                  <>
                    <TouchableOpacity style={styles.optionItem} onPress={handleRefresh}>
                      <Ionicons name="refresh-outline" size={18} color={theme.colors.text} />
                      <Text style={[styles.optionText, { color: theme.colors.text }]}>{t('refresh')}</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.optionItem} onPress={handleMarkAllRead}>
                      <Ionicons name="checkmark-done-outline" size={18} color={theme.colors.text} />
                      <Text style={[styles.optionText, { color: theme.colors.text }]}>{t('markAllRead')}</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.optionItem} onPress={handleClearSearch}>
                      <Ionicons name="close-circle-outline" size={18} color={theme.colors.text} />
                      <Text style={[styles.optionText, { color: theme.colors.text }]}>{t('clearSearch')}</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.optionItem} onPress={handleArchiveAll}>
                      <Ionicons name="archive-outline" size={18} color={theme.colors.text} />
                      <Text style={[styles.optionText, { color: theme.colors.text }]}>{t('archiveChats')}</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity style={styles.optionItem} onPress={handleSelectAll}>
                      <Ionicons name="checkmark-circle-outline" size={18} color={theme.colors.text} />
                      <Text style={[styles.optionText, { color: theme.colors.text }]}>
                        Select All ({filteredThreads.length})
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.optionItem} onPress={handleBulkMarkImportant}>
                      <Ionicons name="star-outline" size={18} color={theme.colors.text} />
                      <Text style={[styles.optionText, { color: theme.colors.text }]}>
                        Mark Important ({selectedThreads.size})
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.optionItem} onPress={handleBulkArchive}>
                      <Ionicons name="archive-outline" size={18} color={theme.colors.text} />
                      <Text style={[styles.optionText, { color: theme.colors.text }]}>
                        Archive ({selectedThreads.size})
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.optionItem} onPress={handleBulkDelete}>
                      <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
                      <Text style={[styles.optionText, { color: '#FF6B6B' }]}>
                        Delete ({selectedThreads.size})
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
                </BlurView>
              </Animated.View>
            )}
          </View>
        </View>
      </View>

      {/* Animated Search Bar */}
      <Animated.View 
        style={[
          styles.searchBarContainer,
          {
            height: searchAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 60],
            }),
            opacity: searchAnimation,
          }
        ]}
      >
        <View style={[styles.searchBar, { backgroundColor: theme.colors.card }]}>
          <Ionicons name="search-outline" size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder={t('searchConversations')}
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus={isSearchVisible}
          />
        </View>
      </Animated.View>

      <ScrollView style={styles.threadsContainer}>
        {filteredThreads.map((thread) => (
          <View
            key={thread.id}
            style={[
              styles.threadItemContainer,
              isSelectionMode && selectedThreads.has(thread.id) && {
                backgroundColor: theme.colors.primary + '20',
                borderColor: theme.colors.primary,
                borderWidth: 2,
              }
            ]}
          >
            <TouchableOpacity
              style={[styles.threadItem, { backgroundColor: theme.colors.card }]}
              onPress={() => handleThreadPress(thread.id)}
              onLongPress={() => handleLongPress(thread.id)}
              activeOpacity={0.7}
            >
              {isSelectionMode && (
                <View style={styles.selectionContainer}>
                  <View style={[
                    styles.selectionCircle,
                    { borderColor: theme.colors.border },
                    selectedThreads.has(thread.id) && {
                      backgroundColor: theme.colors.primary,
                      borderColor: theme.colors.primary,
                    }
                  ]}>
                    {selectedThreads.has(thread.id) && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </View>
                </View>
              )}
              
              <View style={styles.avatarContainer}>
                <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.avatarText}>
                    {thread.customerName.split(' ').map(n => n[0]).join('')}
                  </Text>
                </View>
                {thread.unreadCount > 0 && <View style={styles.onlineIndicator} />}
              </View>
              
              <View style={styles.threadContent}>
                <View style={styles.threadHeader}>
                  <Text style={[styles.threadName, { color: theme.colors.text }]}>{thread.customerName}</Text>
                  <Text style={[styles.threadTime, { color: theme.colors.textSecondary }]}>
                    {formatLastMessageTime(thread.timestamp)}
                  </Text>
                </View>
                <View style={styles.threadFooter}>
                  <Text style={[styles.threadMessage, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                    {thread.lastMessage}
                  </Text>
                  {thread.unreadCount > 0 && (
                    <View style={[styles.unreadBadge, { backgroundColor: theme.colors.primary }]}>
                      <Text style={styles.unreadCount}>{thread.unreadCount}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          </View>
        ))}

        {filteredThreads.length === 0 && searchQuery.trim() !== '' && (
          <View style={styles.emptySearchState}>
            <Ionicons name="search-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No conversations found</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
              Try searching with a different term
            </Text>
          </View>
        )}

        {chatThreads.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>{t('noMessages')}</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
              {t('customerMessages')}
            </Text>
          </View>
        )}
      </ScrollView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  messagesTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  topActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
    paddingVertical: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchToggle: {
    padding: 8,
    marginRight: 8,
  },
  moreButton: {
    padding: 8,
  },
  optionsContainer: {
    position: 'relative',
  },
  optionsDropdown: {
    position: 'absolute',
    top: 40,
    right: 0,
    minWidth: 160,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  blurDropdown: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionText: {
    fontSize: 14,
    marginLeft: 12,
  },
  searchBarContainer: {
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 40,
    marginLeft: 12,
    fontSize: 16,
  },
  threadsContainer: {
    flex: 1,
  },
  threadItemContainer: {
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  emptySearchState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  threadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  threadContent: {
    flex: 1,
  },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  threadName: {
    fontSize: 16,
    fontWeight: '600',
  },
  threadTime: {
    fontSize: 12,
  },
  threadFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  threadMessage: {
    fontSize: 14,
    flex: 1,
    marginRight: 12,
  },
  unreadBadge: {
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  callButton: {
    padding: 4,
  },
  messagesWrapper: {
    flex: 1,
    position: 'relative',
  },
  messagesBackgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    opacity: 0.8,
    zIndex: 0,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  driverMessage: {
    alignSelf: 'flex-end',
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  customerMessage: {
    alignSelf: 'flex-start',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
  },
  driverMessageText: {
    color: '#FFFFFF',
  },
  customerMessageText: {
    // Color will be applied dynamically
  },
  messageTime: {
    fontSize: 12,
  },
  driverMessageTime: {
    color: '#DBEAFE',
    textAlign: 'right',
  },
  customerMessageTime: {
    // Color will be applied dynamically
  },
  inputWrapper: {
    position: 'relative',
  },
  inputBackgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    opacity: 0.6,
    zIndex: 0,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    zIndex: 1,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#4d4e4eff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  selectionContainer: {
    paddingRight: 12,
    justifyContent: 'center',
  },
  selectionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatHeaderCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  chatHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionButton: {
    padding: 8,
    marginLeft: 4,
  },
  chatOptionsDropdown: {
    position: 'absolute',
    top: 70,
    right: 16,
    minWidth: 160,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  attachmentButton: {
    padding: 8,
    marginRight: 8,
  },
  mediaMenu: {
    position: 'absolute',
    bottom: 70,
    left: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
    minWidth: 120,
  },
  mediaMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  mediaIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mediaMenuText: {
    fontSize: 14,
    fontWeight: '500',
  },
  mediaButtonsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  mediaButton: {
    padding: 6,
    marginHorizontal: 2,
  },
});
