import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    FlatList,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Animated,
} from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useWebSocket } from "../../src/contexts/WebSocketContext";
import { useMessages } from "../../src/contexts/MessageContext";
import { API_BASE_URL } from "../../src/config/config";
import { getToken } from "../../src/utils/storage";
import chatApi from "../../src/api/chatApi";

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
    const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
    const [otherUserName, setOtherUserName] = useState<string | null>(null);
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
            const getOtherUserInfo = async () => {
                try {
                    console.log('=== GETTING OTHER USER INFO ===');
                    console.log('Chat ID:', currentChatId);
                    console.log('Current User ID:', currentUserId);
                    
                    // Method 1: Try participants API first
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
                            console.log('✅ Set other user from global messages:', globalOtherUserMessage.sender.id, globalOtherUserMessage.sender.name);
                            return;
                        }
                    }
                    
                    console.log('❌ Could not find other user info');
                    
                } catch (error) {
                    console.error('Error getting other user info:', error);
                }
            };
            
            getOtherUserInfo();
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
            (message) => {
                const typingUserId = Number(message.body);
                if (typingUserId !== currentUserId) {
                    setTyping(currentChatId, typingUserId);
                    setIsTyping(true);
                    // Reset typing indicator after 3 seconds of inactivity
                    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                    typingTimeoutRef.current = setTimeout(() => {
                        setIsTyping(false);
                        clearTyping(currentChatId);
                    }, 3000);
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

            // Fetch other user's name if we have the ID
            if (otherUserId) {
                try {
                    const response = await chatApi.getUserInfo(otherUserId);
                    setOtherUserName(response.data.name);
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

    const sendTypingEvent = () => {
        if (!stompClient || !currentChatId) return;

        // Debounce to avoid flooding the server
        // We use a separate local ref for the "last sent" timestamp to avoid complexity
    };

    const lastTypingSentRef = useRef<number>(0);

    const handleTyping = (text: string) => {
        setInputText(text);
        
        if (!stompClient || !currentChatId || !currentUserId) return;

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
        if (!inputText.trim() || !stompClient) {
            console.warn("Cannot send message: no text or no connection");
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
            behavior={Platform.OS === "ios" ? "padding" : undefined}
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
                                {otherUserName ? otherUserName.charAt(0).toUpperCase() : "?"}
                            </Text>
                            {isOtherUserOnline && (
                                <View style={styles.onlineDot} />
                            )}
                        </View>
                    </View>
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.headerTitle}>
                            {otherUserName || "Unknown User"}
                        </Text>
                        <Text style={styles.headerStatus}>
                            {isOtherUserOnline ? "Online" : "Offline"}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity>
                    <Ionicons name="ellipsis-vertical" size={24} color="#007AFF" />
                </TouchableOpacity>
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
                    contentContainerStyle={styles.messagesList}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                />
            )}

            {isTyping && (
                <View style={styles.typingIndicator}>
                    <Text style={styles.typingText}>typing</Text>
                    <AnimatedTypingDots />
                </View>
            )}

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Type a message..."
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
});
