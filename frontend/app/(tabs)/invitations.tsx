import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Alert,
} from "react-native";
import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
    getMyInvites,
    getMySents,
    acceptInvite,
    rejectInvite,
    sendInvite,
    withdrawInvite,
    Invite,
} from "../../src/api/invitesApi";

type Tab = "received" | "sent";

export default function InvitationsScreen() {
    const [activeTab, setActiveTab] = useState<Tab>("received");

    // ── Received ────────────────────────────────────────────────
    const [received, setReceived] = useState<Invite[]>([]);
    const [loadingReceived, setLoadingReceived] = useState(false);
    const [actingId, setActingId] = useState<number | null>(null);

    const loadReceived = async () => {
        setLoadingReceived(true);
        try {
            setReceived(await getMyInvites());
        } catch {
            Alert.alert("Error", "Failed to load invites");
        } finally {
            setLoadingReceived(false);
        }
    };

    // ── Sent ─────────────────────────────────────────────────────
    const [sent, setSent] = useState<Invite[]>([]);
    const [loadingSent, setLoadingSent] = useState(false);
    const [resendingId, setResendingId] = useState<number | null>(null);
    const [withdrawingId, setWithdrawingId] = useState<number | null>(null);

    const loadSent = async () => {
        setLoadingSent(true);
        try {
            setSent(await getMySents());
        } catch {
            Alert.alert("Error", "Failed to load sent invites");
        } finally {
            setLoadingSent(false);
        }
    };

    // Refresh on tab focus ────────────────────────────────────────
    useFocusEffect(
        useCallback(() => {
            if (activeTab === "received") loadReceived();
            else loadSent();
        }, [activeTab])
    );

    // ── Actions ──────────────────────────────────────────────────
    const handleAccept = async (inviteId: number) => {
        setActingId(inviteId);
        try {
            await acceptInvite(inviteId);
            setReceived((prev) => prev.filter((i) => i.inviteId !== inviteId));
        } catch {
            Alert.alert("Error", "Failed to accept invite");
        } finally {
            setActingId(null);
        }
    };

    const handleReject = async (inviteId: number) => {
        setActingId(inviteId);
        try {
            await rejectInvite(inviteId);
            setReceived((prev) => prev.filter((i) => i.inviteId !== inviteId));
        } catch {
            Alert.alert("Error", "Failed to reject invite");
        } finally {
            setActingId(null);
        }
    };

    // "Send Again" for REJECTED sent invites
    const handleResend = async (invite: Invite) => {
        setResendingId(invite.inviteId);
        try {
            // We need the username of the invited person — backend needs it via groupId
            await sendInvite(invite.groupId, invite.invitedUsername);
            // Optimistically mark as PENDING in local state
            setSent((prev) =>
                prev.map((i) =>
                    i.inviteId === invite.inviteId ? { ...i, status: "PENDING" } : i
                )
            );
        } catch (e: any) {
            Alert.alert("Error", e?.response?.data?.message || "Failed to resend invite");
        } finally {
            setResendingId(null);
        }
    };

    const handleWithdraw = async (invite: Invite) => {
        setWithdrawingId(invite.inviteId);
        try {
            await withdrawInvite(invite.inviteId);
            // Remove from list immediately
            setSent((prev) => prev.filter((i) => i.inviteId !== invite.inviteId));
        } catch {
            Alert.alert("Error", "Failed to withdraw invite");
        } finally {
            setWithdrawingId(null);
        }
    };

    // ── Received item ─────────────────────────────────────────────
    const renderReceived = ({ item }: { item: Invite }) => {
        const isActing = actingId === item.inviteId;
        return (
            <View style={styles.card}>
                <View style={styles.cardInfo}>
                    <Text style={styles.groupName}>{item.groupName}</Text>
                    <Text style={styles.subText}>from {item.invitedBy}</Text>
                </View>
                {isActing ? (
                    <ActivityIndicator size="small" color="#007AFF" style={{ marginLeft: 12 }} />
                ) : (
                    <View style={styles.actions}>
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
                    </View>
                )}
            </View>
        );
    };

    // ── Sent item ─────────────────────────────────────────────────
    const renderSent = ({ item }: { item: Invite }) => {
        const isResending = resendingId === item.inviteId;
        const isWithdrawing = withdrawingId === item.inviteId;
        const isPending = item.status === "PENDING";
        const isRejected = item.status === "REJECTED";

        return (
            <View style={styles.card}>
                <View style={styles.cardInfo}>
                    <Text style={styles.groupName}>{item.groupName}</Text>
                    <Text style={styles.subText}>to user {item.invitedUsername}</Text>
                </View>

                <View style={styles.sentRight}>
                    {isPending ? (
                        <View style={{ alignItems: "flex-end", gap: 6 }}>
                            <View style={styles.pendingBadge}>
                                <Text style={styles.pendingText}>Pending</Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.withdrawBtn, isWithdrawing && { opacity: 0.6 }]}
                                disabled={isWithdrawing}
                                onPress={() => handleWithdraw(item)}
                            >
                                {isWithdrawing ? (
                                    <ActivityIndicator size="small" color="#FF3B30" />
                                ) : (
                                    <Text style={styles.withdrawText}>Withdraw</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    ) : isRejected ? (
                        <View style={{ alignItems: "flex-end", gap: 4 }}>
                            <Text style={styles.rejectedText}>Declined</Text>
                            <TouchableOpacity
                                style={[styles.resendBtn, isResending && { opacity: 0.6 }]}
                                disabled={isResending}
                                onPress={() => handleResend(item)}
                            >
                                {isResending ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.resendText}>Send Again</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    ) : null}
                </View>
            </View>
        );
    };

    const pendingCount = received.length;

    return (
        <View style={styles.container}>
            {/* Header */}
            <Text style={styles.header}>Invitations</Text>

            {/* Tab toggle */}
            <View style={styles.tabRow}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === "received" && styles.tabActive]}
                    onPress={() => {
                        setActiveTab("received");
                        loadReceived();
                    }}
                >
                    <Text style={[styles.tabText, activeTab === "received" && styles.tabTextActive]}>
                        Received{pendingCount > 0 ? ` (${pendingCount})` : ""}
                    </Text>
                    {activeTab === "received" && <View style={styles.tabUnderline} />}
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === "sent" && styles.tabActive]}
                    onPress={() => {
                        setActiveTab("sent");
                        loadSent();
                    }}
                >
                    <Text style={[styles.tabText, activeTab === "sent" && styles.tabTextActive]}>
                        Sent
                    </Text>
                    {activeTab === "sent" && <View style={styles.tabUnderline} />}
                </TouchableOpacity>
            </View>

            {/* Content */}
            {activeTab === "received" ? (
                loadingReceived ? (
                    <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
                ) : received.length === 0 ? (
                    <View style={styles.empty}>
                        <Text style={styles.emptyEmoji}>✉️</Text>
                        <Text style={styles.emptyTitle}>No pending invitations</Text>
                        <Text style={styles.emptySubtitle}>
                            You're all caught up!
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={received}
                        keyExtractor={(item) => String(item.inviteId)}
                        renderItem={renderReceived}
                        contentContainerStyle={{ paddingBottom: 20 }}
                    />
                )
            ) : loadingSent ? (
                <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
            ) : sent.length === 0 ? (
                <View style={styles.empty}>
                    <Text style={styles.emptyEmoji}>📤</Text>
                    <Text style={styles.emptyTitle}>No sent invitations</Text>
                    <Text style={styles.emptySubtitle}>
                        Invite people to your groups from the group detail page.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={sent}
                    keyExtractor={(item) => String(item.inviteId)}
                    renderItem={renderSent}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F2F2F7",
        padding: 16,
        paddingTop: 56,
    },
    header: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#1A1A1A",
        marginBottom: 20,
    },

    // ── Tabs (LinkedIn-style underline) ─────────────────────────
    tabRow: {
        flexDirection: "row",
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#E0E0E0",
        marginBottom: 16,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: "center",
        position: "relative",
    },
    tabActive: {},
    tabUnderline: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: "#0A66C2",
        borderRadius: 2,
    },
    tabText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#666666",
    },
    tabTextActive: {
        color: "#0A66C2",
    },

    // ── Card ─────────────────────────────────────────────────────
    card: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        flexDirection: "row",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    cardInfo: {
        flex: 1,
    },
    groupName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1A1A1A",
        marginBottom: 2,
    },
    subText: {
        fontSize: 13,
        color: "#8E8E93",
    },

    // ── Received actions ─────────────────────────────────────────
    actions: {
        flexDirection: "row",
        gap: 8,
        marginLeft: 10,
    },
    acceptBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#34C759",
        justifyContent: "center",
        alignItems: "center",
    },
    acceptIcon: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
    },
    rejectBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#FF3B30",
        justifyContent: "center",
        alignItems: "center",
    },
    rejectIcon: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },

    // ── Sent status ───────────────────────────────────────────────
    sentRight: {
        marginLeft: 10,
        alignItems: "flex-end",
    },
    pendingBadge: {
        backgroundColor: "#FFF3CC",
        paddingVertical: 5,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    pendingText: {
        color: "#996600",
        fontSize: 13,
        fontWeight: "600",
    },
    rejectedText: {
        color: "#FF3B30",
        fontSize: 13,
        fontWeight: "600",
    },
    resendBtn: {
        backgroundColor: "#007AFF",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignItems: "center",
        minWidth: 90,
    },
    resendText: {
        color: "#fff",
        fontSize: 13,
        fontWeight: "600",
    },
    withdrawBtn: {
        borderWidth: 1.5,
        borderColor: "#FF3B30",
        paddingVertical: 5,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignItems: "center",
        minWidth: 90,
    },
    withdrawText: {
        color: "#FF3B30",
        fontSize: 13,
        fontWeight: "600",
    },

    // ── Empty ─────────────────────────────────────────────────────
    empty: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingBottom: 80,
    },
    emptyEmoji: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#1A1A1A",
        marginBottom: 6,
    },
    emptySubtitle: {
        fontSize: 14,
        color: "#8E8E93",
        textAlign: "center",
        paddingHorizontal: 32,
    },
});
