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
} from "react-native";
import { useRouter } from "expo-router";
import userApi, { UserSearchResponse } from "../../src/api/userApi";
import chatApi, { ChatSummary } from "../../src/api/chatApi";
import { debounce } from "lodash";
import { useFocusEffect } from "expo-router";

export default function MessagesScreen() {
    const router = useRouter();
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

    const fetchMyChats = async () => {
        try {
            setLoading(true);
            const response = await chatApi.getMyChats();
            setMyChats(response.data);
        } catch (error) {
            console.error("Error fetching chats:", error);
        } finally {
            setLoading(false);
        }
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

    const openChat = (chatId: string) => {
        router.push(`/chat/${chatId}`);
    };

    const renderChatItem = ({ item }: { item: ChatSummary }) => (
        <TouchableOpacity style={styles.chatItem} onPress={() => openChat(item.chatId)}>
            <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{item.displayName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.chatInfo}>
                <Text style={styles.chatName}>{item.displayName}</Text>
                <Text style={styles.lastMessage} numberOfLines={1}>
                    {item.lastMessage || "No messages yet"}
                </Text>
            </View>
            {item.lastMessageTime ? (
                <Text style={styles.chatTime}>
                    {new Date(item.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            ) : null}
            {item.unreadCount > 0 ? (
                <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{item.unreadCount}</Text>
                </View>
            ) : null}
        </TouchableOpacity>
    );

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
    },
    title: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#000000",
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
    avatarPlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#E5E5EA",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 15,
    },
    avatarText: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#8E8E93",
    },
    chatInfo: {
        flex: 1,
    },
    chatName: {
        fontSize: 17,
        fontWeight: "600",
        color: "#000000",
        marginBottom: 4,
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
