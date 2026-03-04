import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWebSocket } from './WebSocketContext';

interface Message {
  id: string;
  content: string;
  sender: {
    id: number;
    name: string;
  };
  timestamp: string;
  type?: string;
  chatId?: string;
}

interface MessageContextType {
  messages: Record<string, Message[]>;
  addMessage: (chatId: string, message: Message) => void;
  getMessages: (chatId: string) => Message[];
  setMessages: (chatId: string, messages: Message[]) => void;
  unreadCounts: Record<string, number>;
  incrementUnread: (chatId: string) => void;
  markAsRead: (chatId: string) => void;
  typingUsers: Record<string, number>; // chatId -> userId
  onlineUsers: Set<number>; // Set of online user IDs
  setTyping: (chatId: string, userId: number) => void;
  clearTyping: (chatId: string) => void;
  setOnlineStatus: (userId: number, isOnline: boolean) => void;
}

const MessageContext = createContext<MessageContextType>({
  messages: {},
  addMessage: () => {},
  getMessages: () => [],
  setMessages: () => {},
  unreadCounts: {},
  incrementUnread: () => {},
  markAsRead: () => {},
  typingUsers: {},
  onlineUsers: new Set(),
  setTyping: () => {},
  clearTyping: () => {},
  setOnlineStatus: () => {},
});

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
};

interface MessageProviderProps {
  children: ReactNode;
}

export const MessageProvider: React.FC<MessageProviderProps> = ({ children }) => {
  const { stompClient } = useWebSocket();
  const [messages, setMessagesState] = useState<Record<string, Message[]>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, number>>({});
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Define all the handler functions first
  const addMessage = useCallback((chatId: string, message: Message) => {
    setMessagesState(prev => {
      const existingMessages = prev[chatId] || [];
      // Check if message already exists to prevent duplicates
      const messageExists = existingMessages.some(msg => msg.id === message.id);
      
      if (messageExists) {
        console.log('Message already exists, skipping:', message.id);
        return prev;
      }
      
      console.log('Adding new message to chat:', chatId, message);
      return {
        ...prev,
        [chatId]: [...existingMessages, message]
      };
    });
  }, []);

  const getMessages = useCallback((chatId: string): Message[] => {
    return messages[chatId] || [];
  }, [messages]);

  const setMessages = useCallback((chatId: string, newMessages: Message[]) => {
    setMessagesState(prev => ({
      ...prev,
      [chatId]: newMessages
    }));
  }, []);

  const incrementUnread = useCallback((chatId: string) => {
    setUnreadCounts(prev => ({
      ...prev,
      [chatId]: (prev[chatId] || 0) + 1
    }));
  }, []);

  const markAsRead = useCallback((chatId: string) => {
    setUnreadCounts(prev => ({
      ...prev,
      [chatId]: 0
    }));
  }, []);

  const setTyping = useCallback((chatId: string, userId: number) => {
    setTypingUsers(prev => ({
      ...prev,
      [chatId]: userId
    }));
  }, []);

  const clearTyping = useCallback((chatId: string) => {
    setTypingUsers(prev => {
      const newTyping = { ...prev };
      delete newTyping[chatId];
      return newTyping;
    });
  }, []);

  const setOnlineStatus = useCallback((userId: number, isOnline: boolean) => {
    setOnlineUsers(prev => {
      const newOnline = new Set(prev);
      if (isOnline) {
        newOnline.add(userId);
      } else {
        newOnline.delete(userId);
      }
      return newOnline;
    });
  }, []);

  // Get current user ID from storage
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const userJson = await AsyncStorage.getItem('user');
        if (userJson) {
          const user = JSON.parse(userJson);
          setCurrentUserId(user.id);
          
          // Send presence event when user is loaded
          if (stompClient && stompClient.connected) {
            const presenceData = {
              userId: user.id,
              status: "ONLINE"
            };
            
            console.log('Sending presence event on user load:', presenceData);
            
            stompClient.publish({
              destination: "/app/chat.presence",
              body: JSON.stringify(presenceData)
            });
          }
        }
      } catch (error) {
        console.error('Error getting current user:', error);
      }
    };
    
    getCurrentUser();
  }, [stompClient]);

  // Global message subscriptions - now with proper dependencies
  useEffect(() => {
    if (!stompClient || !currentUserId) return;

    // Subscribe to all chat messages
    const subscriptions: any[] = [];

    // Listen for global message broadcasts
    const globalMessageSubscription = stompClient.subscribe('/topic/messages', (message) => {
      try {
        const newMessage = JSON.parse(message.body);
        const chatId = newMessage.chatId;
        
        console.log('Global message received:', newMessage); // Debug log
        
        if (chatId) {
          addMessage(chatId, newMessage);
          
          // Only increment unread if message is not from current user
          if (newMessage.sender?.id !== currentUserId) {
            incrementUnread(chatId);
          }
        }
      } catch (error) {
        console.error('Error parsing global message:', error);
      }
    });

    // Listen for typing indicators
    const typingSubscription = stompClient.subscribe('/topic/typing', (message) => {
      try {
        const typingData = JSON.parse(message.body);
        const { chatId, userId } = typingData;
        
        console.log('Typing received:', typingData); // Debug log
        
        if (userId !== currentUserId) {
          setTyping(chatId, userId);
          
          // Clear typing after 3 seconds
          setTimeout(() => {
            clearTyping(chatId);
          }, 3000);
        }
      } catch (error) {
        console.error('Error parsing typing message:', error);
      }
    });

    // Listen for presence updates
    const presenceSubscription = stompClient.subscribe('/topic/presence', (message) => {
      try {
        const presenceData = JSON.parse(message.body);
        const { userId, status } = presenceData;
        
        console.log('Presence received:', presenceData, 'Current user:', currentUserId);
        
        setOnlineStatus(userId, status === 'ONLINE');
      } catch (error) {
        console.error('Error parsing presence message:', error);
      }
    });

    subscriptions.push(globalMessageSubscription, typingSubscription, presenceSubscription);

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [stompClient, currentUserId, addMessage, incrementUnread, setTyping, clearTyping, setOnlineStatus]);

  const value: MessageContextType = {
    messages,
    addMessage,
    getMessages,
    setMessages,
    unreadCounts,
    incrementUnread,
    markAsRead,
    typingUsers,
    onlineUsers,
    setTyping,
    clearTyping,
    setOnlineStatus,
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};
