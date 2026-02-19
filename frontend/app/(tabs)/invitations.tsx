import { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    FlatList,
    ActivityIndicator,
    Alert,
} from "react-native";
import { getMyInvites, acceptInvite, rejectInvite, Invite } from "../../src/api/invitesApi";

type Tab = "received" | "sent";

export default function InvitationsScreen() {
    const [activeTab, setActiveTab] = useState<Tab>("received");
    const [invites, setInvites] = useState<Invite[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    const loadInvites = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getMyInvites();
            setInvites(data);
        } catch (err) {
            console.error("Failed to fetch invites", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            if (activeTab === "received") {
                loadInvites();
            }
        }, [activeTab])
    );

    const handleAccept = async (inviteId: number) => {
        setActionLoading(inviteId);
        try {
            await acceptInvite(inviteId);
            setInvites((prev) => prev.filter((inv) => inv.inviteId !== inviteId));
        } catch (err) {
            Alert.alert("Error", "Failed to accept invite");
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (inviteId: number) => {
        setActionLoading(inviteId);
        try {
            await rejectInvite(inviteId);
            setInvites((prev) => prev.filter((inv) => inv.inviteId !== inviteId));
        } catch (err) {
            Alert.alert("Error", "Failed to reject invite");
        } finally {
            setActionLoading(null);
        }
    };

    const renderInviteCard = ({ item }: { item: Invite }) => {
        const isActing = actionLoading === item.inviteId;
        return (
            <View style={styles.card}>
                {/* Avatar */}
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {item.invitedBy.charAt(0).toUpperCase()}
                    </Text>
                </View>

                {/* Text */}
                <View style={styles.cardBody}>
                    <Text style={styles.cardText}>
                        <Text style={styles.cardName}>{item.invitedBy}</Text>
                        {" invited you to "}
                        <Text style={styles.cardGroup}>{item.groupName}</Text>
                    </Text>
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                    {isActing ? (
                        <ActivityIndicator size="small" color="#007AFF" />
                    ) : (
                        <>
                            <TouchableOpacity
                                style={styles.acceptBtn}
                                onPress={() => handleAccept(item.inviteId)}
                            >
                                <Text style={styles.acceptIcon}>✓</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.rejectBtn}
                                onPress={() => handleReject(item.inviteId)}
                            >
                                <Text style={styles.rejectIcon}>✕</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Invitations</Text>
            </View>

            {/* Toggle Bar */}
            <View style={styles.toggleContainer}>
                <TouchableOpacity
                    style={[styles.toggleBtn, activeTab === "received" && styles.toggleBtnActive]}
                    onPress={() => setActiveTab("received")}
                >
                    <Text style={[styles.toggleText, activeTab === "received" && styles.toggleTextActive]}>
                        Received
                        {invites.length > 0 && activeTab === "received" && (
                            <Text style={styles.badge}> {invites.length}</Text>
                        )}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.toggleBtn, activeTab === "sent" && styles.toggleBtnActive]}
                    onPress={() => setActiveTab("sent")}
                >
                    <Text style={[styles.toggleText, activeTab === "sent" && styles.toggleTextActive]}>
                        Sent
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            {activeTab === "received" ? (
                loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color="#007AFF" />
                    </View>
                ) : (
                    <FlatList
                        data={invites}
                        keyExtractor={(item) => item.inviteId.toString()}
                        renderItem={renderInviteCard}
                        contentContainerStyle={
                            invites.length === 0 ? styles.centered : styles.list
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyEmoji}>📬</Text>
                                <Text style={styles.emptyTitle}>No invitations received</Text>
                                <Text style={styles.emptySubtitle}>
                                    When someone invites you to a group, it will appear here.
                                </Text>
                            </View>
                        }
                    />
                )
            ) : (
                <View style={[styles.centered, { flex: 1 }]}>
                    <Text style={styles.emptyEmoji}>📤</Text>
                    <Text style={styles.emptyTitle}>No invitations sent</Text>
                    <Text style={styles.emptySubtitle}>
                        Invitations you send to others will appear here.
                    </Text>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F5F7FA" },
    header: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5E5",
    },
    headerTitle: { fontSize: 26, fontWeight: "bold", color: "#1A1A1A" },
    toggleContainer: {
        flexDirection: "row",
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5E5",
        paddingHorizontal: 16,
    },
    toggleBtn: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderBottomWidth: 2,
        borderBottomColor: "transparent",
    },
    toggleBtnActive: { borderBottomColor: "#007AFF" },
    toggleText: { fontSize: 15, fontWeight: "600", color: "#8E8E93" },
    toggleTextActive: { color: "#007AFF" },
    badge: { color: "#007AFF", fontWeight: "700" },
    list: { padding: 12 },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
    },

    /* Invite Card */
    card: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.07,
        shadowRadius: 4,
        elevation: 2,
    },
    avatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: "#007AFF",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    avatarText: { color: "#fff", fontSize: 18, fontWeight: "700" },
    cardBody: { flex: 1, marginRight: 8 },
    cardText: { fontSize: 14, color: "#444", lineHeight: 20 },
    cardName: { fontWeight: "700", color: "#1A1A1A" },
    cardGroup: { fontWeight: "600", color: "#007AFF" },
    actions: { flexDirection: "row", gap: 8, alignItems: "center" },
    acceptBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#34C759",
        justifyContent: "center",
        alignItems: "center",
    },
    acceptIcon: { color: "#fff", fontSize: 18, fontWeight: "700" },
    rejectBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#FF3B30",
        justifyContent: "center",
        alignItems: "center",
    },
    rejectIcon: { color: "#fff", fontSize: 16, fontWeight: "700" },

    /* Empty */
    emptyContainer: { alignItems: "center", padding: 40 },
    emptyEmoji: { fontSize: 56, marginBottom: 16 },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1A1A1A",
        marginBottom: 8,
        textAlign: "center",
    },
    emptySubtitle: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
        lineHeight: 22,
    },
});
