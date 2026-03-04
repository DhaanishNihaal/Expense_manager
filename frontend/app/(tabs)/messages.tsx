import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    Animated,
} from "react-native";
import { useRouter } from "expo-router";
import userApi, { UserSearchResponse } from "../../src/api/userApi";
import chatApi, { ChatSummary } from "../../src/api/chatApi";
import { useMessages } from "../../src/contexts/MessageContext";
import { useWebSocket } from "../../src/contexts/WebSocketContext";
import { debounce } from "lodash";
import { useFocusEffect } from "expo-router";

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
        <View style={styles.typingDotsContainer}>
            <Animated.View
                style={[
                    styles.typingDot,
                    {
                        transform: [{ scale: dotScale(dot1Anim) }],
                        opacity: dotOpacity(dot1Anim),
                    },
                ]}
            />
            <Animated.View
                style={[
                    styles.typingDot,
                    {
                        transform: [{ scale: dotScale(dot2Anim) }],
                        opacity: dotOpacity(dot2Anim),
                    },
                ]}
            />
            <Animated.View
                style={[
                    styles.typingDot,
                    {
                        transform: [{ scale: dotScale(dot3Anim) }],
                        opacity: dotOpacity(dot3Anim),
                    },
                ]}
            />
        </View>
    );
};

export default function MessagesScreen() {
    const router = useRouter();
    const { stompClient, connectionStatus } = useWebSocket();
    const { unreadCounts, typingUsers, onlineUsers } = useMessages();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<UserSearchResponse[]>([]);
    const [myChats, setMyChats] = useState<ChatSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    useFocusEffect(
        useCallback(() => {
            fetchMyChats();
        }, [])
    );

    const fetchMyChats = useCallback(async () => {
        try {
            setLoading(true);
            const response = await chatApi.getMyChats();
            setMyChats(response.data);
        } catch (error) {
            console.error("Error fetching chats:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Listen for live messages and update chat list
    useEffect(() => {
        if (!stompClient || connectionStatus !== 'connected') return;

        const subscription = stompClient.subscribe('/topic/messages', (message) => {
            try {
                const newMessage = JSON.parse(message.body);
                console.log('New message received in messages screen:', newMessage);
                
                // Refresh chat list to show latest message and update unread count
                fetchMyChats();
            } catch (error) {
                console.error('Error parsing message in messages screen:', error);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [stompClient, connectionStatus, fetchMyChats]);

    const getOtherUserId = (chatSummary: ChatSummary): number | null => {
        return chatSummary.otherUserId || null;
    };

    const openChat = (chatId: string) => {
        router.push(`/chat/${chatId}`);
    };

    const handleSearch = useCallback(
        debounce(async (query: string) => {
            if (!query.trim()) {
                setSearchResults([]);
                setIsSearching(false);
                return;
            }

            try {
                setIsSearching(true);
                const response = await userApi.searchUsers(query, 0); // Using 0 as we want to search all users, not limited to a group
                setSearchResults(response.data);
            } catch (error) {
                console.error("Error searching users:", error);
            } finally {
                setIsSearching(false);
            }
        }, 500),
        []
    );

    const onSearchChange = (text: string) => {
        setSearchQuery(text);
        handleSearch(text);
    };

    const startChat = async (userId: number) => {
        try {
            // We navigate to the chat page with the user ID. 
            // The chat page will handle creating the chat if it doesn't exist on the first message.
            router.push({
                pathname: "/chat/[id]",
                params: { id: `new_${userId}` }
            });
        } catch (error) {
            console.error("Error starting chat:", error);
        }
    };

    const renderChatItem = ({ item }: { item: ChatSummary }) => {
        const isTyping = typingUsers[item.chatId] ? true : false;
        const isUserOnline = getOtherUserId(item) ? onlineUsers.has(getOtherUserId(item)!) : false;
        
        return (
            <TouchableOpacity style={styles.chatItem} onPress={() => openChat(item.chatId)}>
                <View style={styles.avatarContainer}>
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>{item.displayName.charAt(0).toUpperCase()}</Text>
                        {isUserOnline && (
                            <View style={styles.onlineDot} />
                        )}
                    </View>
                    <View style={styles.typingContainer}>
                        {isTyping && (
                            <View style={styles.typingIndicator}>
                                <AnimatedTypingDots />
                            </View>
                        )}
                    </View>
                </View>
                <View style={styles.chatInfo}>
                    <View style={styles.chatNameContainer}>
                        <Text style={styles.chatName}>{item.displayName}</Text>
                        {isUserOnline && (
                            <View style={styles.onlineStatusContainer}>
                                <View style={styles.onlineStatusDot} />
                                <Text style={styles.onlineStatusText}>Online</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.lastMessage} numberOfLines={1}>
                        {isTyping ? (
                            <View style={styles.typingTextContainer}>
                                <Text style={styles.typingText}>typing</Text>
                                <AnimatedTypingDots />
                            </View>
                        ) : (item.lastMessage || "No messages yet")}
                    </Text>
                </View>
                <View style={styles.rightContainer}>
                    {item.lastMessageTime ? (
                        <Text style={styles.chatTime}>
                            {new Date(item.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    ) : null}
                    {/* Use global unread count if available, otherwise use API count */}
                    {(unreadCounts[item.chatId] || item.unreadCount) > 0 ? (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadText}>
                                {unreadCounts[item.chatId] || item.unreadCount}
                            </Text>
                        </View>
                    ) : null}
                </View>
            </TouchableOpacity>
        );
    };

    const renderSearchResult = ({ item }: { item: UserSearchResponse }) => (
        <TouchableOpacity style={styles.searchResultItem} onPress={() => startChat(item.id)}>
            <View style={styles.avatarPlaceholderSmall}>
                <Text style={styles.avatarTextSmall}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View>
                <Text style={styles.searchResultName}>{item.name}</Text>
                <Text style={styles.searchResultUsername}>@{item.username}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Messages</Text>
                <View style={styles.statusContainer}>
                    <View style={[
                        styles.statusDot, 
                        connectionStatus === 'connected' ? styles.statusOnline : 
                        connectionStatus === 'connecting' ? styles.statusConnecting : styles.statusOffline
                    ]} />
                    <Text style={styles.statusText}>
                        {connectionStatus === 'connected' ? '' : 
                         connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'}
                    </Text>
                </View>
            </View>

            <View style={styles.searchBarContainer}>
                <TextInput
                    style={styles.searchBar}
                    placeholder="Search users..."
                    value={searchQuery}
                    onChangeText={onSearchChange}
                    placeholderTextColor="#8E8E93"
                />
                {isSearching && <ActivityIndicator size="small" color="#007AFF" style={styles.searchIndicator} />}
            </View>

            {searchQuery.length > 0 ? (
                <FlatList
                    data={searchResults}
                    renderItem={renderSearchResult}
                    keyExtractor={(item) => item.id.toString()}
                    ListEmptyComponent={
                        !isSearching ? (
                            <Text style={styles.emptyText}>No users found</Text>
                        ) : null
                    }
                    contentContainerStyle={styles.listContainer}
                />
            ) : (
                <FlatList
                    data={myChats}
                    renderItem={renderChatItem}
                    keyExtractor={(item) => item.chatId}
                    refreshing={loading}
                    onRefresh={fetchMyChats}
                    ListEmptyComponent={
                        !loading ? (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyEmoji}>💬</Text>
                                <Text style={styles.emptyTitle}>No messages yet</Text>
                                <Text style={styles.emptySubtitle}>Search for a user to start a conversation</Text>
                            </View>
                        ) : null
                    }
                    contentContainerStyle={styles.listContainer}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#000000",
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
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
    searchBarContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F2F2F7",
        borderRadius: 10,
        marginHorizontal: 20,
        marginBottom: 15,
        paddingHorizontal: 12,
        height: 40,
    },
    searchBar: {
        flex: 1,
        fontSize: 16,
        color: "#000000",
    },
    searchIndicator: {
        marginLeft: 8,
    },
    listContainer: {
        paddingBottom: 20,
    },
    chatItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: "#E5E5EA",
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 15,
    },
    avatarPlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#E5E5EA",
        justifyContent: "center",
        alignItems: "center",
    },
    onlineDot: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: "#4CD964",
        borderWidth: 2,
        borderColor: "#FFFFFF",
    },
    typingContainer: {
        position: 'absolute',
        bottom: -8,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    typingIndicator: {
        backgroundColor: "#F2F2F7",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#E5E5EA",
        flexDirection: 'row',
        alignItems: 'center',
    },
    typingText: {
        fontSize: 10,
        color: "#8E8E93",
        fontStyle: 'italic',
    },
    typingTextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
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
    avatarText: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#8E8E93",
    },
    chatInfo: {
        flex: 1,
    },
    chatNameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    chatName: {
        fontSize: 17,
        fontWeight: "600",
        color: "#000000",
        flex: 1,
    },
    onlineStatusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E8',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
    },
    onlineStatusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#4CD964",
        marginRight: 4,
    },
    onlineStatusText: {
        fontSize: 10,
        color: "#4CD964",
        fontWeight: "500",
    },
    rightContainer: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        minWidth: 50,
    },
    lastMessage: {
        fontSize: 14,
        color: "#8E8E93",
    },
    chatTime: {
        fontSize: 12,
        color: "#8E8E93",
    },
    unreadBadge: {
        backgroundColor: "#007AFF",
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 10,
        paddingHorizontal: 6,
    },
    unreadText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "bold",
    },
    searchResultItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    avatarPlaceholderSmall: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#F2F2F7",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    avatarTextSmall: {
        fontSize: 18,
        fontWeight: "600",
        color: "#8E8E93",
    },
    searchResultName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#000000",
    },
    searchResultUsername: {
        fontSize: 14,
        color: "#8E8E93",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 100,
        paddingHorizontal: 40,
    },
    emptyEmoji: {
        fontSize: 64,
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#000000",
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 16,
        color: "#8E8E93",
        textAlign: "center",
    },
    emptyText: {
        textAlign: "center",
        marginTop: 30,
        color: "#8E8E93",
        fontSize: 16,
    },
});
