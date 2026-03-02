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
} from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Client } from "@stomp/stompjs";
import { API_BASE_URL } from "../../src/config/config";
import { getToken } from "../../src/utils/storage";
import chatApi from "../../src/api/chatApi";

interface Message {
    id: string;
    content: string;
    sender: {
        id: number;
        name: string;
    };
    timestamp: string;
}

export default function ChatScreen() {
    const { id: chatIdParam } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const [loading, setLoading] = useState(true);
    const [currentChatId, setCurrentChatId] = useState<string | null>(
        chatIdParam && !chatIdParam.startsWith("new_") && chatIdParam !== "undefined" ? chatIdParam : null
    );
    const [otherUserId, setOtherUserId] = useState<number | null>(
        chatIdParam?.startsWith("new_") ? parseInt(chatIdParam.replace("new_", "")) : null
    );
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [stompClient, setStompClient] = useState<Client | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setupChat();
        return () => {
            if (stompClient) {
                stompClient.deactivate();
                console.log("Disconnected from WebSocket");
            }
        };
    }, []);

    useFocusEffect(
        useCallback(() => {
            if (currentChatId && currentChatId !== "undefined") {
                chatApi.markAsRead(currentChatId).catch(console.error);
                fetchMessages(currentChatId);
            }
        }, [currentChatId])
    );

    useEffect(() => {
        if (!stompClient || !currentChatId || currentChatId === "undefined") return;

        console.log("Subscribing to chat:", currentChatId);

        const subscription = stompClient.subscribe(
            `/topic/chat/${currentChatId}`,
            (message) => {
                console.log("WS Received message:", message.body);
                const newMessage = JSON.parse(message.body);
                setMessages(prev => {
                    // Check if message already exists by ID
                    if (prev.some(m => m.id === newMessage.id)) {
                        console.log("WS: Duplicate message by ID, skipping");
                        return prev;
                    }
                    // Check if it's the server confirmation of an optimistic message
                    // (Matching content, senderId, and approximate time)
                    const optimisticIndex = prev.findIndex(m => 
                        m.id.startsWith("temp-") && 
                        m.content === newMessage.content && 
                        m.sender?.id === newMessage.sender?.id
                    );

                    if (optimisticIndex !== -1) {
                        console.log("WS: Matching optimistic message found, updating with server data");
                        const newArr = [...prev];
                        newArr[optimisticIndex] = newMessage;
                        return newArr;
                    }

                    console.log("WS: Adding new message to list");
                    return [...prev, newMessage];
                });
                setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
            }
        );

        const typingSubscription = stompClient.subscribe(
            `/topic/chat/${currentChatId}/typing`,
            (message) => {
                const typingUserId = Number(message.body);
                if (typingUserId !== currentUserId) {
                    setIsTyping(true);
                    // Reset typing indicator after 3 seconds of inactivity
                    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                    typingTimeoutRef.current = setTimeout(() => {
                        setIsTyping(false);
                    }, 3000);
                }
            }
        );

        const presenceSubscription = stompClient.subscribe(
            `/topic/presence`,
            (message) => {
                const presenceData = JSON.parse(message.body);
                if (otherUserId && presenceData.userId === otherUserId) {
                    setIsOtherUserOnline(presenceData.status === "ONLINE");
                    console.log(`Presence: User ${presenceData.userId} is ${presenceData.status}`);
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
    }, [stompClient, currentChatId, currentUserId, otherUserId]);

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
            
            await connectWebSocket(token);
        } catch (error) {
            console.error("Error setting up chat:", error);
        } finally {
            setLoading(false);
        }
    };

    const connectWebSocket = async (token: string) => {
        const baseUrl = API_BASE_URL.endsWith("/") ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
        const brokerURL = baseUrl.replace(/^http/, "ws") + "/ws";
        console.log("Connecting to WebSocket:", brokerURL);

        const client = new Client({
            brokerURL,
            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },
            reconnectDelay: 5000,
            debug: (msg) => console.log("STOMP:", msg),
        });

        client.onConnect = (frame) => {
            console.log("SUCCESS: Connected to WebSocket Native", frame);
            setStompClient(client);
        };

        client.onStompError = (frame) => {
            console.error("STOMP error", frame.headers['message']);
            console.error("Details", frame.body);
        };

        client.activate();
    };

    const sendTypingEvent = () => {
        if (!stompClient || !currentChatId) return;

        // Debounce to avoid flooding the server
        // We use a separate local ref for the "last sent" timestamp to avoid complexity
    };

    const lastTypingSentRef = useRef<number>(0);

    const handleTyping = (text: string) => {
        setInputText(text);
        
        if (!stompClient || !currentChatId) return;

        const now = Date.now();
        if (now - lastTypingSentRef.current > 2000) {
            console.log("Sending typing event...");
            stompClient.publish({
                destination: "/app/chat.typing",
                body: JSON.stringify({ chatId: currentChatId })
            });
            lastTypingSentRef.current = now;
        }
    };

    const fetchMessages = async (chatId: string) => {
        try {
            console.log("Fetching message history for:", chatId);
            const response = await chatApi.getChatMessages(chatId);
            setMessages(response.data);
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
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#007AFF" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>Chat</Text>
                    {isOtherUserOnline && <Text style={styles.onlineStatus}>Online</Text>}
                </View>
                <View style={{ width: 40 }} />
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
                    <Text style={styles.typingText}>Typing...</Text>
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
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
    },
    headerInfo: {
        alignItems: "center",
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
        paddingHorizontal: 20,
        paddingBottom: 4,
    },
    typingText: {
        fontSize: 12,
        color: "#8E8E93",
        fontStyle: "italic",
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
