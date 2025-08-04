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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const searchAnimation = useRef(new Animated.Value(0)).current;

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
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.chatHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedChat(null)}
          >
            <Ionicons name="arrow-back" size={24} color="#1E40AF" />
          </TouchableOpacity>
          <Text style={styles.chatTitle}>{currentThread?.customerName}</Text>
          <TouchableOpacity style={styles.callButton}>
            <Ionicons name="call-outline" size={24} color="#1E40AF" />
          </TouchableOpacity>
        </View>

        <View style={styles.messagesWrapper}>
          <Image 
            source={require('../../../assets/pattern1.png')} 
            style={styles.messagesBackgroundImage}
            resizeMode="cover"
            alt=""
          />
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
          {chatMessages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.sender === 'driver' ? styles.driverMessage : styles.customerMessage,
              ]}
            >
              <Text style={[
                styles.messageText,
                message.sender === 'driver' ? styles.driverMessageText : styles.customerMessageText,
              ]}>
                {message.text}
              </Text>
              <Text style={[
                styles.messageTime,
                message.sender === 'driver' ? styles.driverMessageTime : styles.customerMessageTime,
              ]}>
                {formatTime(message.timestamp)}
              </Text>
            </View>
          ))}
        </ScrollView>
        </View>

        <View style={styles.inputWrapper}>
          <Image 
            source={require('../../../assets/pattern1.png')} 
            style={styles.inputBackgroundImage}
            resizeMode="cover"
            alt=""
          />
          <View style={styles.inputContainer}>
          <TextInput
            style={styles.messageInput}
            placeholder="Type a message..."
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!messageText.trim()}
          >
            <Ionicons
              name="send"
              size={20}
              color={messageText.trim() ? '#FFFFFF' : '#9CA3AF'}
            />
          </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Messages</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={toggleSearch} style={styles.searchToggle}>
            <Ionicons 
              name={isSearchVisible ? "close" : "search-outline"} 
              size={24} 
              color="#1E40AF" 
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-vertical" size={24} color="#1E40AF" />
          </TouchableOpacity>
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
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
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
            style={styles.threadItemContainer}
          >
            <TouchableOpacity
              style={styles.threadItem}
              onPress={() => setSelectedChat(thread.id)}
              activeOpacity={0.7}
            >
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {thread.customerName.split(' ').map(n => n[0]).join('')}
                  </Text>
                </View>
                {thread.unreadCount > 0 && <View style={styles.onlineIndicator} />}
              </View>
              
              <View style={styles.threadContent}>
                <View style={styles.threadHeader}>
                  <Text style={styles.threadName}>{thread.customerName}</Text>
                  <Text style={styles.threadTime}>{formatLastMessageTime(thread.timestamp)}</Text>
                </View>
                <View style={styles.threadFooter}>
                  <Text style={styles.threadMessage} numberOfLines={1}>
                    {thread.lastMessage}
                  </Text>
                  {thread.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
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
            <Ionicons name="search-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No conversations found</Text>
            <Text style={styles.emptySubtitle}>
              Try searching with a different term
            </Text>
          </View>
        )}

        {chatThreads.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySubtitle}>
              Customer messages will appear here when you have active deliveries
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
  searchBarContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 25,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 40,
    marginLeft: 12,
    fontSize: 16,
    color: '#111827',
  },
  threadsContainer: {
    flex: 1,
  },
  threadItemContainer: {
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#1E40AF',
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
    color: '#111827',
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
    color: '#111827',
  },
  threadTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  threadFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  threadMessage: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
    marginRight: 12,
  },
  unreadBadge: {
    backgroundColor: '#1E40AF',
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  callButton: {
    padding: 4,
  },
  messagesWrapper: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#F3F4F6',
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
    backgroundColor: '#1E40AF',
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  customerMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
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
    color: '#111827',
  },
  messageTime: {
    fontSize: 12,
  },
  driverMessageTime: {
    color: '#DBEAFE',
    textAlign: 'right',
  },
  customerMessageTime: {
    color: '#6B7280',
  },
  inputWrapper: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
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
    backgroundColor: 'transparent',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  sendButton: {
    backgroundColor: '#1E40AF',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
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
    lineHeight: 20,
  },
});
