import React, { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
} from "react-native";
import { acceptInvite, rejectInvite, sendInvite } from "../api/invitesApi";
import api from "../api/api";

interface InvitationCardProps {
    groupName: string;
    invitedBy: string;
    invitedUsername?: string;
    status: string;
    inviteId: number;
    groupId?: number; // For resend functionality
    isInChat?: boolean;
    onStatusUpdate?: (inviteId: number, newStatus: string) => void;
    isCurrentUser?: boolean; // For chat context - is this user the one being invited
}

export default function InvitationCard({
    groupName,
    invitedBy,
    invitedUsername,
    status,
    inviteId,
    groupId,
    isInChat = false,
    onStatusUpdate,
    isCurrentUser = false,
}: InvitationCardProps) {
    const [acting, setActing] = React.useState(false);
    const [resending, setResending] = useState(false);

    const handleAccept = async () => {
        setActing(true);
        try {
            await acceptInvite(inviteId);
            onStatusUpdate?.(inviteId, "ACCEPTED");
        } catch (error) {
            console.error("Failed to accept invite:", error);
        } finally {
            setActing(false);
        }
    };

    const handleReject = async () => {
        setActing(true);
        try {
            await rejectInvite(inviteId);
            onStatusUpdate?.(inviteId, "REJECTED");
        } catch (error) {
            console.error("Failed to reject invite:", error);
        } finally {
            setActing(false);
        }
    };

    // "Send Again" for REJECTED sent invites - EXACT same logic as invitations page
    const handleResend = async () => {
        if (!invitedUsername) return;
        
        setResending(true);
        try {
            // Get groupId from the invite using inviteId, then use exact same logic as invitations page
            const response = await api.get(`/api/invites/${inviteId}`);
            const inviteData = response.data;
            await sendInvite(inviteData.groupId, invitedUsername);
            onStatusUpdate?.(inviteId, "PENDING");
        } catch (error) {
            console.error("Failed to resend invite:", error);
        } finally {
            setResending(false);
        }
    };

    const isPending = status === "PENDING";
    const isAccepted = status === "ACCEPTED";
    const isRejected = status === "REJECTED";

    return (
        <View style={[styles.card, isInChat && styles.chatCard]}>
            <View style={styles.cardInfo}>
                <Text style={[styles.groupName, isInChat && styles.chatGroupName]}>
                    {groupName}
                </Text>
                <Text style={[styles.subText, isInChat && styles.chatSubText]}>
                    {isCurrentUser ? `from ${invitedBy}` : `to ${invitedUsername}`}
                </Text>
            </View>

            {/* Show status or action buttons */}
            {isAccepted ? (
                <View style={styles.statusContainer}>
                    <Text style={styles.acceptedText}>Accepted</Text>
                </View>
            ) : isRejected ? (
                // Show "Send Again" button for the inviter in chat context
                isInChat && !isCurrentUser && invitedUsername ? (
                    resending ? (
                        <ActivityIndicator size="small" color="#007AFF" style={{ marginLeft: 12 }} />
                    ) : (
                        <TouchableOpacity 
                            style={styles.resendBtn} 
                            onPress={handleResend}
                        >
                            <Text style={styles.resendText}>Send Again</Text>
                        </TouchableOpacity>
                    )
                ) : (
                    <View style={styles.statusContainer}>
                        <Text style={styles.rejectedText}>Rejected</Text>
                    </View>
                )
            ) : isPending && isCurrentUser && !isInChat ? (
                // In invitations page, show action buttons for current user
                acting ? (
                    <ActivityIndicator size="small" color="#007AFF" style={{ marginLeft: 12 }} />
                ) : (
                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept}>
                            <Text style={styles.acceptIcon}>✓</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.rejectBtn} onPress={handleReject}>
                            <Text style={styles.rejectIcon}>✕</Text>
                        </TouchableOpacity>
                    </View>
                )
            ) : isPending && isInChat ? (
                // In chat, show action buttons if this is the current user being invited
                isCurrentUser ? (
                    acting ? (
                        <ActivityIndicator size="small" color="#007AFF" style={{ marginLeft: 12 }} />
                    ) : (
                        <View style={styles.actions}>
                            <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept}>
                                <Text style={styles.acceptIcon}>✓</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.rejectBtn} onPress={handleReject}>
                                <Text style={styles.rejectIcon}>✕</Text>
                            </TouchableOpacity>
                        </View>
                    )
                ) : (
                    // In chat, if not the current user, just show pending status
                    <View style={styles.statusContainer}>
                        <Text style={styles.pendingText}>Pending</Text>
                    </View>
                )
            ) : (
                // Default pending status for other contexts
                <View style={styles.statusContainer}>
                    <Text style={styles.pendingText}>Pending</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    chatCard: {
        backgroundColor: "#F0F8FF",
        borderLeftWidth: 3,
        borderLeftColor: "#007AFF",
        marginBottom: 8,
        shadowOpacity: 0.05,
    },
    cardInfo: {
        flex: 1,
    },
    groupName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#000",
        marginBottom: 4,
    },
    chatGroupName: {
        fontSize: 14,
        fontWeight: "600",
        color: "#007AFF",
    },
    subText: {
        fontSize: 14,
        color: "#666",
    },
    chatSubText: {
        fontSize: 12,
        color: "#666",
    },
    actions: {
        flexDirection: "row",
        gap: 8,
    },
    acceptBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#34C759",
        alignItems: "center",
        justifyContent: "center",
    },
    acceptIcon: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    rejectBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#FF3B30",
        alignItems: "center",
        justifyContent: "center",
    },
    rejectIcon: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    statusContainer: {
        alignItems: "center",
    },
    acceptedText: {
        color: "#34C759",
        fontWeight: "600",
        fontSize: 14,
    },
    pendingText: {
        color: "#007AFF",
        fontWeight: "600",
        fontSize: 14,
    },
    rejectedText: {
        color: "#FF3B30",
        fontWeight: "600",
        fontSize: 14,
    },
    resendBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: "#007AFF",
        alignItems: "center",
        justifyContent: "center",
    },
    resendText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "600",
    },
});
