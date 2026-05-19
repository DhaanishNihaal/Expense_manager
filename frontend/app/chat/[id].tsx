import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    ActivityIndicator,
    Animated,
    Modal,
    Alert,
    ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useWebSocket } from "../../src/contexts/WebSocketContext";
import { useMessages } from "../../src/contexts/MessageContext";
import { API_BASE_URL } from "../../src/config/config";
import { getToken } from "../../src/utils/storage";
import chatApi from "../../src/api/chatApi";
import { fetchGroupMembers } from "../../src/api/groupsApi";
import { paySettlement, fetchPrivateSettlements, fetchGroupSettlements, Settlement } from "../../src/api/settlementApi";
import { User } from "../../src/types/user";

// Instagram-style animated typing dots component
const AnimatedTypingDots = () => {
    const dot1Anim = React.useRef(new Animated.Value(0)).current;
    const dot2Anim = React.useRef(new Animated.Value(0)).current;
    const dot3Anim = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        // Create individual animations for each dot
        const dot1Animation = Animated.loop(
            Animated.sequence([
                Animated.timing(dot1Anim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(dot1Anim, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                })
            ])
        );

        const dot2Animation = Animated.loop(
            Animated.sequence([
                Animated.delay(200),
                Animated.timing(dot2Anim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(dot2Anim, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                })
            ])
        );

        const dot3Animation = Animated.loop(
            Animated.sequence([
                Animated.delay(400),
                Animated.timing(dot3Anim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(dot3Anim, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                })
            ])
        );

        // Start all animations
        dot1Animation.start();
        dot2Animation.start();
        dot3Animation.start();

        // Cleanup function
        return () => {
            dot1Animation.stop();
            dot2Animation.stop();
            dot3Animation.stop();
        };
    }, []);

    const dotScale = (anim: Animated.Value) => anim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.5],
    });

    const dotOpacity = (anim: Animated.Value) => anim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.3, 1, 0.3],
    });

    return (
        <View style={chatStyles.typingDotsContainer}>
            <Animated.View
                style={[
                    chatStyles.typingDot,
                    {
                        transform: [{ scale: dotScale(dot1Anim) }],
                        opacity: dotOpacity(dot1Anim),
                    },
                ]}
            />
            <Animated.View
                style={[
                    chatStyles.typingDot,
                    {
                        transform: [{ scale: dotScale(dot2Anim) }],
                        opacity: dotOpacity(dot2Anim),
                    },
                ]}
            />
            <Animated.View
                style={[
                    chatStyles.typingDot,
                    {
                        transform: [{ scale: dotScale(dot3Anim) }],
                        opacity: dotOpacity(dot3Anim),
                    },
                ]}
            />
        </View>
    );
};

interface Message {
    id: string;
    content: string;
    sender: {
        id: number;
        name: string;
    };
    timestamp: string;
    type?: string;
}

export default function ChatScreen() {
    const { id: chatIdParam } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { stompClient, connectionStatus } = useWebSocket();
    const { getMessages, setMessages, markAsRead, addMessage, setTyping, clearTyping, setOnlineStatus, onlineUsers } = useMessages();
    const [inputText, setInputText] = useState("");
    const [loading, setLoading] = useState(true);
    const [currentChatId, setCurrentChatId] = useState<string | null>(
        chatIdParam && !chatIdParam.startsWith("new_") && chatIdParam !== "undefined" ? chatIdParam : null
    );
    const [otherUserId, setOtherUserId] = useState<number | null>(
        chatIdParam?.startsWith("new_") ? parseInt(chatIdParam.replace("new_", "")) : null
    );
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const [typingUser, setTypingUser] = useState<string | null>(null);
    const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
    const [otherUserName, setOtherUserName] = useState<string | null>(null);
    const [otherUserUsername, setOtherUserUsername] = useState<string | null>(null);
    const [isGroupChat, setIsGroupChat] = useState(false);
    const [groupName, setGroupName] = useState<string | null>(null);
    const [currentGroupId, setCurrentGroupId] = useState<number | null>(null);
    const [isMember, setIsMember] = useState(true);
    
    // Settlement Feature State
    const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
    const [groupMembers, setGroupMembers] = useState<User[]>([]);
    
    const [isSettlementsModalVisible, setIsSettlementsModalVisible] = useState(false);
    const [settlementsList, setSettlementsList] = useState<Settlement[]>([]);
    
    const flatListRef = useRef<FlatList>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    // Check online status when otherUserId is set
    useEffect(() => {
        if (otherUserId && onlineUsers.has(otherUserId)) {
            setIsOtherUserOnline(true);
            console.log('Set other user online from global context:', otherUserId);
        } else if (otherUserId) {
            setIsOtherUserOnline(false);
            console.log('Set other user offline from global context:', otherUserId);
        }
    }, [otherUserId, onlineUsers]);

    // Get other user info from multiple sources
    useEffect(() => {
        if (!otherUserId && currentChatId && currentUserId) {
            const getChatInfo = async () => {
                try {
                    console.log('=== GETTING CHAT INFO ===');
                    console.log('Chat ID:', currentChatId);
                    console.log('Current User ID:', currentUserId);
                    
                    // Get chat info to determine if it's a group chat
                    const chatInfoResponse = await chatApi.getChatInfo(currentChatId);
                    console.log('Chat info response:', chatInfoResponse.data);
                    
                    if (chatInfoResponse.data.type === 'GROUP') {
                        setIsGroupChat(true);
                        setGroupName(chatInfoResponse.data.groupName);
                        setCurrentGroupId(chatInfoResponse.data.groupId);
                        console.log('✅ Detected group chat:', chatInfoResponse.data.groupName, 'with ID:', chatInfoResponse.data.groupId);
                        return; // Don't try to get other user info for group chats
                    }
                    
                    // For private chats, get other user info
                    try {
                        const participantsResponse = await chatApi.getChatParticipants(currentChatId);
                        console.log('Participants API response:', participantsResponse.data);
                        
                        if (participantsResponse.data && participantsResponse.data.length > 0) {
                            const participant = participantsResponse.data[0];
                            console.log('Participant from API:', participant);
                            
                            // Make sure this is not the current user
                            if (participant.id !== currentUserId) {
                                setOtherUserId(participant.id);
                                setOtherUserName(participant.name);
                                setOtherUserUsername(participant.username);
                                console.log('✅ Set other user from participants API:', participant.id, participant.name);
                                return;
                            }
                        }
                    } catch (apiError) {
                        console.log('Participants API failed, trying messages...');
                    }
                    
                    // Method 2: Try message history
                    const messagesResponse = await chatApi.getChatMessages(currentChatId);
                    console.log('Messages response count:', messagesResponse.data.length);
                    
                    if (messagesResponse.data.length > 0) {
                        // Find a message from someone other than current user
                        const otherUserMessage = messagesResponse.data.find(
                            msg => msg.sender && msg.sender.id !== currentUserId
                        );
                        
                        if (otherUserMessage && otherUserMessage.sender) {
                            setOtherUserId(otherUserMessage.sender.id);
                            setOtherUserName(otherUserMessage.sender.name);
                            setOtherUserUsername(otherUserMessage.sender.username);
                            console.log('✅ Set other user from messages:', otherUserMessage.sender.id, otherUserMessage.sender.name);
                            return;
                        }
                    }
                    
                    // Method 3: Try global messages context
                    const globalMessages = getMessages(currentChatId);
                    if (globalMessages.length > 0) {
                        const globalOtherUserMessage = globalMessages.find(
                            msg => msg.sender && msg.sender.id !== currentUserId
                        );
                        
                        if (globalOtherUserMessage && globalOtherUserMessage.sender) {
                            setOtherUserId(globalOtherUserMessage.sender.id);
                            setOtherUserName(globalOtherUserMessage.sender.name);
                            setOtherUserUsername(globalOtherUserMessage.sender.username);
                            console.log('✅ Set other user from global messages:', globalOtherUserMessage.sender.id, globalOtherUserMessage.sender.name);
                            return;
                        }
                    }
                    
                    console.log('❌ Could not find other user info');
                    
                } catch (error) {
                    console.error('Error getting chat info:', error);
                }
            };
            
            getChatInfo();
        }
    }, [currentChatId, currentUserId]);

    // Get messages from global context
    const messages = currentChatId ? getMessages(currentChatId) : [];

    useEffect(() => {
        setupChat();
    }, []);

    useFocusEffect(
        useCallback(() => {
            if (currentChatId && currentChatId !== "undefined") {
                // Check membership before allowing interactions
                chatApi.checkChatMembership(currentChatId).then(res => {
                    setIsMember(res.data.isMember);
                }).catch(() => setIsMember(false));

                chatApi.markAsRead(currentChatId).catch(console.error);
                fetchMessages(currentChatId);
                // Mark as read in global context
                markAsRead(currentChatId);
                
                // Send presence event to ensure status is current
                if (currentUserId && stompClient && stompClient.connected) {
                    const presenceData = {
                        userId: currentUserId,
                        status: "ONLINE"
                    };
                    
                    console.log('Sending presence on chat focus:', presenceData);
                    
                    stompClient.publish({
                        destination: "/app/chat.presence",
                        body: JSON.stringify(presenceData)
                    });
                }
            }
        }, [currentChatId, currentUserId, stompClient])
    );

    useEffect(() => {
        if (!stompClient || !currentChatId || currentChatId === "undefined" || connectionStatus !== 'connected') return;

        console.log("Subscribing to chat:", currentChatId);

        const subscription = stompClient.subscribe(
            `/topic/chat/${currentChatId}`,
            (message) => {
                console.log("WS Received message:", message.body);
                const newMessage = JSON.parse(message.body);
                
                // Add message to global context
                addMessage(currentChatId, newMessage);
                
                // Scroll to bottom when new message arrives
                setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
            }
        );

        const typingSubscription = stompClient.subscribe(
            `/topic/chat/${currentChatId}/typing`,
            async (message) => {
                const typingUserId = parseInt(message.body);
                console.log("Typing received in chat:", typingUserId);
                
                // Don't show typing indicator for current user
                if (typingUserId === currentUserId) return;
                
                // For private chats, just show typing indicator
                if (!isGroupChat) {
                    setIsTyping(true);
                    setTypingUser(otherUserName);
                    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                    typingTimeoutRef.current = setTimeout(() => {
                        setIsTyping(false);
                        setTypingUser(null);
                        clearTyping(currentChatId);
                    }, 3000) as unknown as NodeJS.Timeout;
                    return;
                }
                
                // For group chats, get the username of the typing user
                try {
                    const userResponse = await chatApi.getUserInfo(typingUserId);
                    const userName = userResponse.data.name;
                    setIsTyping(true);
                    setTypingUser(userName);
                    
                    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                    typingTimeoutRef.current = setTimeout(() => {
                        setIsTyping(false);
                        setTypingUser(null);
                        clearTyping(currentChatId);
                    }, 3000) as unknown as NodeJS.Timeout;
                } catch (error) {
                    console.error('Error getting typing user info:', error);
                    // Fallback to generic typing indicator
                    setIsTyping(true);
                    setTypingUser("Someone");
                    
                    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                    typingTimeoutRef.current = setTimeout(() => {
                        setIsTyping(false);
                        setTypingUser(null);
                        clearTyping(currentChatId);
                    }, 3000) as unknown as NodeJS.Timeout;
                }
            }
        );

        const presenceSubscription = stompClient.subscribe(
            `/topic/presence`,
            (message) => {
                const presenceData = JSON.parse(message.body);
                console.log('Chat screen presence received:', presenceData, 'otherUserId:', otherUserId);
                
                if (otherUserId && presenceData.userId === otherUserId) {
                    const isOnline = presenceData.status === "ONLINE";
                    setOnlineStatus(presenceData.userId, isOnline);
                    setIsOtherUserOnline(isOnline);
                    console.log(`Chat screen: User ${presenceData.userId} is ${presenceData.status}`);
                }
            }
        );

        return () => {
            console.log("Unsubscribing from chat:", currentChatId);
            subscription.unsubscribe();
            typingSubscription.unsubscribe();
            presenceSubscription.unsubscribe();
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, [stompClient, currentChatId, currentUserId, otherUserId, connectionStatus, addMessage, setTyping, clearTyping, setOnlineStatus]);

    const setupChat = async () => {
        try {
            setLoading(true);
            const token = await getToken();
            if (!token) {
                router.replace("/(auth)/login");
                return;
            }

            const userJson = await AsyncStorage.getItem("user");
            if (userJson) {
                const user = JSON.parse(userJson);
                setCurrentUserId(user.id);
                console.log("Current user set:", user.id);
            }

            // Check membership for existing chats
            if (currentChatId && currentChatId !== "undefined") {
                try {
                    const memberRes = await chatApi.checkChatMembership(currentChatId);
                    setIsMember(memberRes.data.isMember);
                    console.log("Membership check:", memberRes.data.isMember);
                } catch {
                    setIsMember(false);
                }
            }

            // Fetch other user's name if we have the ID
            if (otherUserId) {
                try {
                    const response = await chatApi.getUserInfo(otherUserId);
                    setOtherUserName(response.data.name);
                    setOtherUserUsername(response.data.username);
                    console.log("Other user name set:", response.data.name);
                } catch (error) {
                    console.error("Error fetching other user info:", error);
                    setOtherUserName("Unknown User");
                }
            }
        } catch (error) {
            console.error("Error setting up chat:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenPaymentModal = async () => {
        setIsPaymentModalVisible(true);
        if (isGroupChat && currentGroupId) {
            try {
                const members = await fetchGroupMembers(currentGroupId);
                // Filter out current user
                const otherMembers = members.filter(m => m.id !== currentUserId);
                setGroupMembers(otherMembers);
                if (otherMembers.length > 0) {
                    setSelectedMemberId(otherMembers[0].id);
                }
            } catch (error) {
                console.error("Failed to fetch group members:", error);
            }
        } else {
            setSelectedMemberId(otherUserId);
        }
    };

    const handleSettlePayment = async () => {
        if (!paymentAmount || isNaN(Number(paymentAmount))) {
            Alert.alert("Invalid Amount", "Please enter a valid numeric amount");
            return;
        }
        
        const amount = parseFloat(paymentAmount);
        const receiverId = selectedMemberId;
        
        if (!receiverId) {
            Alert.alert("Error", "No recipient selected");
            return;
        }
        
        try {
            await paySettlement(receiverId, amount, currentGroupId || undefined);
            
            // Send STOMP message for optimistic display
            if (stompClient && stompClient.connected && currentChatId) {
                const receiverName = groupMembers.find(m => m.id === receiverId)?.name || otherUserName || "Unknown User";
                
                const messageData = {
                    chatId: currentChatId,
                    senderId: currentUserId,
                    content: `paid ${receiverName} ₹${amount.toFixed(2)}`,
                    type: "SETTLEMENT",
                    settlementAmount: amount
                };
                
                stompClient.publish({
                    destination: "/app/chat.send",
                    body: JSON.stringify(messageData)
                });
            } else {
                console.warn("Could not send payment STOMP message: WebSocket is disconnected");
                // Refresh messages from API to show the payment
                fetchMessages(currentChatId);
            }
            
            setIsPaymentModalVisible(false);
            setPaymentAmount("");
        } catch (error) {
            console.error("Failed to make payment:", error);
            Alert.alert("Error", "Failed to process payment");
        }
    };

    const handleOpenSettlementsModal = async () => {
        setIsSettlementsModalVisible(true);
        try {
            if (isGroupChat && currentGroupId) {
                const res = await fetchGroupSettlements(currentGroupId);
                setSettlementsList(res.data);
            } else if (!isGroupChat && otherUserUsername) {
                const res = await fetchPrivateSettlements(otherUserUsername);
                setSettlementsList(res.data);
            }
        } catch (error) {
            console.error("Failed to fetch settlements:", error);
            Alert.alert("Error", "Failed to load settlements");
        }
    };

    const sendTypingEvent = () => {
        if (!stompClient || !currentChatId) return;

        // Debounce to avoid flooding the server
        // We use a separate local ref for the "last sent" timestamp to avoid complexity
    };

    const lastTypingSentRef = useRef<number>(0);

    const handleTyping = (text: string) => {
        setInputText(text);
        
        if (!stompClient || !stompClient.connected || !currentChatId || !currentUserId) return;

        const now = Date.now();
        if (now - lastTypingSentRef.current > 2000) {
            console.log("Sending typing event for chat:", currentChatId, "user:", currentUserId);
            
            // Send to global topic for real-time updates
            const typingData = {
                chatId: currentChatId,
                userId: currentUserId
            };
            
            console.log("Typing data being sent:", typingData);
            
            stompClient.publish({
                destination: "/app/chat.typing",
                body: JSON.stringify(typingData)
            });
            
            lastTypingSentRef.current = now;
        }
    };

    const fetchMessages = async (chatId: string) => {
        try {
            console.log("Fetching message history for:", chatId);
            const response = await chatApi.getChatMessages(chatId);
            setMessages(chatId, response.data);
            
            // Extract other user ID from messages if not already set
            if (!otherUserId && response.data.length > 0) {
                const firstMessage = response.data[0];
                if (firstMessage.sender && firstMessage.sender.id !== currentUserId) {
                    setOtherUserId(firstMessage.sender.id);
                    setOtherUserName(firstMessage.sender.name);
                    console.log('Set other user from messages:', firstMessage.sender.id, firstMessage.sender.name);
                }
            }
            
            setTimeout(() => flatListRef.current?.scrollToEnd(), 200);
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    };

    const sendMessage = async () => {
        if (!inputText.trim() || !stompClient || !stompClient.connected || !isMember) {
            console.warn(`Cannot send message. Text empty: ${!inputText.trim()}, stompClient null: ${!stompClient}, not connected: ${stompClient && !stompClient.connected}, not member: ${!isMember}`);
            return;
        }

        let chatId = currentChatId;

        // If it's a new chat, create it on the first message
        if (!chatId && otherUserId) {
            try {
                console.log("Creating new private chat with user:", otherUserId);
                const response = await chatApi.createPrivateChat(otherUserId);
                chatId = response.data;
                console.log("Chat created successfully:", chatId);
                setCurrentChatId(chatId);
                // The useEffect will handle subscription
            } catch (error) {
                console.error("Error creating chat:", error);
                return;
            }
        }

        if (chatId) {
            const trimmedText = inputText.trim();
            const messageData = {
                chatId: chatId,
                senderId: currentUserId,
                content: trimmedText,
                type: "TEXT"
            };

            // Optimistic update
            const tempMessage: Message = {
                id: `temp-${Date.now()}`,
                content: trimmedText,
                sender: {
                    id: currentUserId || 0,
                    name: "Me" // Fallback name
                },
                timestamp: new Date().toISOString()
            };
            
            console.log("Optimistic update: adding temp message");
            setMessages(prev => [...prev, tempMessage]);
            setTimeout(() => flatListRef.current?.scrollToEnd(), 100);

            console.log("Sending message via WS:", messageData);
            stompClient.publish({
                destination: "/app/chat.send",
                body: JSON.stringify(messageData)
            });
            setInputText("");
        }
    };

    const renderMessage = ({ item }: { item: Message }) => {
        if (item.type === "SYSTEM") {
            return (
                <View key={item.id} style={styles.systemMessageContainer}>
                    <Text style={styles.systemMessageText}>{item.content}</Text>
                </View>
            );
        }

        const isMe = item.sender.id === currentUserId;

        if (item.type === "SETTLEMENT") {
            return (
                <View key={item.id} style={[styles.messageContainer, isMe ? styles.myMessage : styles.otherMessage, styles.settlementMessage]}>
                    <View style={styles.settlementHeader}>
                        <Ionicons name="checkmark-circle" size={16} color={isMe ? "#FFFFFF" : "#34C759"} />
                        <Text style={[styles.settlementHeaderText, isMe ? styles.myMessageText : styles.otherMessageText]}>
                            Payment Sent
                        </Text>
                    </View>
                    <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.otherMessageText, styles.settlementAmountDisplay]}>
                        {item.content}
                    </Text>
                    <Text style={[styles.messageTime, isMe ? styles.myMessageTime : styles.otherMessageTime]}>
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            );
        }

        if (item.type === "INVITATION") {
            // Don't show invitation messages in chat - they're only in invitations page
            return null;
        }

        const isMine = item.sender?.id === currentUserId;
        return (
            <View key={item.id} style={[styles.messageContainer, isMine ? styles.myMessage : styles.otherMessage]}>
                <Text style={[styles.messageText, isMine ? styles.myMessageText : styles.otherMessageText]}>
                    {item.content}
                </Text>
                <Text style={styles.messageTime}>
                    {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                </Text>
            </View>
        );
    };
    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color="#007AFF" />
                </TouchableOpacity>
                <View style={styles.headerUserInfo}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>
                                {isGroupChat ? 
                                    groupName ? groupName.charAt(0).toUpperCase() : "G" :
                                    otherUserName ? otherUserName.charAt(0).toUpperCase() : "?"
                                }
                            </Text>
                            {!isGroupChat && isOtherUserOnline && (
                                <View style={styles.onlineDot} />
                            )}
                        </View>
                    </View>
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.headerTitle}>
                            {isGroupChat ? groupName : (otherUserName || "Unknown User")}
                        </Text>
                        {!isGroupChat && (
                            <Text style={styles.headerStatus}>
                                {isOtherUserOnline ? "Online" : "Offline"}
                            </Text>
                        )}
                        {isGroupChat && (
                            <Text style={styles.headerStatus}>
                                Group Chat
                            </Text>
                        )}
                    </View>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <TouchableOpacity onPress={handleOpenSettlementsModal} style={{ marginRight: 15 }}>
                        <Ionicons name="scale-outline" size={24} color="#007AFF" />
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <Ionicons name="ellipsis-vertical" size={24} color="#007AFF" />
                    </TouchableOpacity>
                </View>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id}
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.messagesList}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                />
            )}

            {isTyping && (
                <View style={styles.typingIndicator}>
                    <Text style={styles.typingText}>
                        {typingUser ? `${typingUser} is ` : ""}typing
                    </Text>
                    <AnimatedTypingDots />
                </View>
            )}

            {isMember ? (
                <View style={styles.inputContainer}>
                    <TouchableOpacity onPress={handleOpenPaymentModal} style={{ marginRight: 10 }}>
                        <Ionicons name="card" size={28} color="#007AFF" />
                    </TouchableOpacity>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        placeholderTextColor="#8E8E93"
                        value={inputText}
                        onChangeText={handleTyping}
                        multiline
                    />
                    <TouchableOpacity 
                        style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} 
                        onPress={sendMessage}
                        disabled={!inputText.trim()}
                    >
                        <Ionicons name="send" size={24} color={inputText.trim() ? "#007AFF" : "#8E8E93"} />
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.notMemberBar}>
                    <Text style={styles.notMemberText}>You are no longer a member of this group</Text>
                </View>
            )}

            {/* Payment Modal */}
            <Modal visible={isPaymentModalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Settle Payment</Text>
                        
                        {isGroupChat && (
                            <View style={styles.pickerContainer}>
                                <Text style={styles.inputLabel}>Pay to:</Text>
                                <Picker
                                    selectedValue={selectedMemberId}
                                    onValueChange={(itemValue) => setSelectedMemberId(itemValue)}
                                >
                                    {groupMembers.map(member => (
                                        <Picker.Item key={member.id} label={member.name} value={member.id} />
                                    ))}
                                </Picker>
                            </View>
                        )}
                        
                        <Text style={styles.inputLabel}>Amount (₹):</Text>
                        <View style={styles.paymentInputContainer}>
                            <Text style={styles.paymentRupeeSymbol}>₹</Text>
                            <TextInput
                                style={styles.paymentTextInput}
                                keyboardType="numeric"
                                placeholder="0.00"
                                placeholderTextColor="#8E8E93"
                                value={paymentAmount}
                                onChangeText={setPaymentAmount}
                            />
                        </View>
                        
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsPaymentModalVisible(false)}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalSettleBtn} onPress={handleSettlePayment}>
                                <Text style={styles.modalSettleText}>Pay</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Settlements Modal */}
            <Modal visible={isSettlementsModalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Settlements</Text>
                            <TouchableOpacity onPress={() => setIsSettlementsModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#8E8E93" />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView style={styles.settlementsList}>
                            {settlementsList.length === 0 ? (
                                <Text style={styles.emptyText}>No settlements needed.</Text>
                            ) : (
                                settlementsList.map((settlement, index) => (
                                    <View key={index} style={styles.settlementItem}>
                                        <View style={styles.settlementRow}>
                                            <Text style={styles.settlementUser} numberOfLines={1} ellipsizeMode="tail">
                                                {settlement.fromname}
                                            </Text>
                                            <Ionicons name="arrow-forward" size={16} color="#8E8E93" style={{ marginHorizontal: 8, flexShrink: 0 }} />
                                            <Text style={styles.settlementUser} numberOfLines={1} ellipsizeMode="tail">
                                                {settlement.toname}
                                            </Text>
                                        </View>
                                        <Text style={styles.settlementItemAmount}>
                                            ₹{settlement.amount.toFixed(2)}
                                        </Text>
                                    </View>
                                ))
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const chatStyles = StyleSheet.create({
    typingDotsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 4,
    },
    typingDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: "#8E8E93",
        marginHorizontal: 1,
    },
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F2F2F7",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 60,
        paddingBottom: 10,
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: "#E5E5EA",
    },
    headerUserInfo: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        marginLeft: 12,
    },
    avatarContainer: {
        marginRight: 12,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#E5E5EA",
        justifyContent: "center",
        alignItems: "center",
        position: 'relative',
    },
    avatarText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#8E8E93",
    },
    onlineDot: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: "#4CD964",
        borderWidth: 2,
        borderColor: "#FFFFFF",
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#000000",
    },
    headerStatus: {
        fontSize: 12,
        color: "#8E8E93",
        marginTop: 2,
    },
    headerInfo: {
        alignItems: "center",
    },
    statusContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 4,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusOnline: {
        backgroundColor: "#4CD964",
    },
    statusConnecting: {
        backgroundColor: "#FF9500",
    },
    statusOffline: {
        backgroundColor: "#FF3B30",
    },
    statusText: {
        fontSize: 12,
        color: "#8E8E93",
        fontWeight: "500",
    },
    onlineStatus: {
        fontSize: 12,
        color: "#4CD964",
        fontWeight: "600",
    },
    messagesList: {
        padding: 15,
        paddingBottom: 30,
    },
    messageContainer: {
        maxWidth: "80%",
        padding: 12,
        borderRadius: 20,
        marginBottom: 10,
    },
    myMessage: {
        alignSelf: "flex-end",
        backgroundColor: "#007AFF",
        borderBottomRightRadius: 2,
    },
    otherMessage: {
        alignSelf: "flex-start",
        backgroundColor: "#FFFFFF",
        borderBottomLeftRadius: 2,
    },
    messageText: {
        fontSize: 16,
    },
    myMessageText: {
        color: "#FFFFFF",
    },
    otherMessageText: {
        color: "#000000",
    },
    messageTime: {
        fontSize: 10,
        color: "#8E8E93",
        marginTop: 4,
        alignSelf: "flex-end",
    },
    typingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 0.5,
        borderTopColor: '#E5E5EA',
    },
    typingText: {
        fontSize: 14,
        color: '#8E8E93',
        fontStyle: 'italic',
        marginRight: 4,
    },
    systemMessageContainer: {
        alignSelf: "center",
        backgroundColor: "#E5E5EA",
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 12,
        marginVertical: 10,
    },
    systemMessageText: {
        fontSize: 12,
        color: "#8E8E93",
        fontWeight: "600",
    },
    invitationMessageContainer: {
        alignSelf: "center",
        backgroundColor: "#F0F8FF",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 12,
        marginVertical: 8,
        borderLeftWidth: 3,
        borderLeftColor: "#007AFF",
    },
    invitationMessageText: {
        fontSize: 13,
        color: "#007AFF",
        fontWeight: "600",
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        backgroundColor: "#FFFFFF",
        borderTopWidth: 0.5,
        borderTopColor: "#E5E5EA",
        paddingBottom: Platform.OS === "ios" ? 30 : 10,
    },
    input: {
        flex: 1,
        backgroundColor: "#F2F2F7",
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 8,
        marginRight: 10,
        fontSize: 16,
        maxHeight: 100,
    },
    sendButton: {
        padding: 5,
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    notMemberBar: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: "#FFF3CD",
        borderTopWidth: 0.5,
        borderTopColor: "#E5E5EA",
        alignItems: "center",
        paddingBottom: Platform.OS === "ios" ? 30 : 16,
    },
    notMemberText: {
        fontSize: 14,
        color: "#856404",
        fontWeight: "600",
        textAlign: "center",
    },
    settlementMessage: {
        borderWidth: 1,
        borderColor: "#E5E5EA",
        minWidth: 160,
    },
    settlementHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.1)",
        paddingBottom: 4,
    },
    settlementHeaderText: {
        fontSize: 12,
        fontWeight: "bold",
        marginLeft: 6,
    },
    settlementAmountDisplay: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        marginVertical: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        minHeight: 300,
        maxHeight: "80%",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 20,
    },
    pickerContainer: {
        marginBottom: 20,
        backgroundColor: "#F2F2F7",
        borderRadius: 10,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 8,
        color: "#8E8E93",
    },
    paymentInputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F2F2F7",
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 30,
    },
    paymentRupeeSymbol: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#000000",
        marginRight: 8,
    },
    paymentTextInput: {
        flex: 1,
        paddingVertical: 15,
        fontSize: 24,
        fontWeight: "bold",
        color: "#000000",
    },
    modalActions: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    modalCancelBtn: {
        flex: 1,
        padding: 15,
        backgroundColor: "#F2F2F7",
        borderRadius: 10,
        marginRight: 10,
        alignItems: "center",
    },
    modalSettleBtn: {
        flex: 1,
        padding: 15,
        backgroundColor: "#34C759",
        borderRadius: 10,
        marginLeft: 10,
        alignItems: "center",
    },
    modalCancelText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#FF3B30",
    },
    modalSettleText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#FFFFFF",
    },
    settlementsList: {
        flex: 1,
    },
    emptyText: {
        textAlign: "center",
        color: "#8E8E93",
        fontSize: 16,
        marginTop: 40,
    },
    settlementItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 15,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "#E5E5EA",
    },
    settlementRow: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        marginRight: 10,
    },
    settlementUser: {
        fontSize: 15,
        fontWeight: "500",
        flexShrink: 1,
    },
    settlementItemAmount: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1A1A1A",
    },
});
