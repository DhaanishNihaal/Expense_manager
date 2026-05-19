import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Modal,
    TextInput,
    Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchMySettlements, paySettlement, Settlement } from "../../src/api/settlementApi";
import { useFocusEffect } from "expo-router";

export default function SettlementsScreen() {
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [settlements, setSettlements] = useState<Settlement[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<"pay" | "receive">("receive");
    
    // Quick payment modal states
    const [isPayModalVisible, setIsPayModalVisible] = useState(false);
    const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
    const [payAmount, setPayAmount] = useState("");
    const [paying, setPaying] = useState(false);

    // Load current user profile from storage
    useEffect(() => {
        const loadCurrentUser = async () => {
            try {
                const userJson = await AsyncStorage.getItem("user");
                if (userJson) {
                    setCurrentUser(JSON.parse(userJson));
                }
            } catch (error) {
                console.error("Failed to load user info:", error);
            }
        };
        loadCurrentUser();
    }, []);

    // Load overall user settlements
    const loadSettlements = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const res = await fetchMySettlements();
            setSettlements(res.data || []);
        } catch (error) {
            console.error("Failed to fetch settlements:", error);
            Alert.alert("Error", "Could not load settlements");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Reload data when the screen is focused
    useFocusEffect(
        useCallback(() => {
            loadSettlements(true);
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadSettlements(false);
    };

    // Separate settlements into toPay and toReceive
    const toPay = settlements.filter(
        (s) => s.fromUserId === currentUser?.id || s.fromname === currentUser?.username
    );
    const toReceive = settlements.filter(
        (s) => s.toUserId === currentUser?.id || s.toname === currentUser?.username
    );

    // Calculations for totals
    const totalToPay = toPay.reduce((acc, curr) => acc + curr.amount, 0);
    const totalToReceive = toReceive.reduce((acc, curr) => acc + curr.amount, 0);
    const netBalance = totalToReceive - totalToPay;

    // Trigger quick payment flow
    const handleOpenPayModal = (settlement: Settlement) => {
        setSelectedSettlement(settlement);
        setPayAmount(settlement.amount.toFixed(2));
        setIsPayModalVisible(true);
    };

    const handleConfirmPayment = async () => {
        if (!selectedSettlement) return;
        const amountNum = parseFloat(payAmount);
        if (isNaN(amountNum) || amountNum <= 0) {
            Alert.alert("Invalid Amount", "Please enter a valid amount");
            return;
        }

        if (amountNum > selectedSettlement.amount) {
            Alert.alert(
                "Excess Amount",
                `The maximum you owe is ₹${selectedSettlement.amount.toFixed(2)}`
            );
            return;
        }

        try {
            setPaying(true);
            await paySettlement(selectedSettlement.toUserId, amountNum);
            Alert.alert("Success", `Payment of ₹${amountNum.toFixed(2)} registered successfully!`);
            setIsPayModalVisible(false);
            setSelectedSettlement(null);
            loadSettlements(true); // reload list
        } catch (error) {
            console.error("Failed to register settlement:", error);
            Alert.alert("Payment Failed", "Could not record your payment.");
        } finally {
            setPaying(false);
        }
    };

    const renderSettlementItem = ({ item }: { item: Settlement }) => {
        const isPaying = activeTab === "pay";

        return (
            <View style={styles.card}>
                <View style={styles.cardLeft}>
                    <View style={[styles.iconContainer, isPaying ? styles.payIconBg : styles.receiveIconBg]}>
                        <Ionicons
                            name={isPaying ? "arrow-up" : "arrow-down"}
                            size={20}
                            color={isPaying ? "#FF3B30" : "#34C759"}
                        />
                    </View>
                    <View style={styles.cardTextContainer}>
                        <Text style={styles.cardTitle}>
                            {isPaying ? `Pay ${item.toname}` : `Receive from ${item.fromname}`}
                        </Text>
                        <Text style={styles.cardSubtitle}>
                            {isPaying ? "You owe money" : "Owes you money"}
                        </Text>
                    </View>
                </View>
                <View style={styles.cardRight}>
                    <Text style={[styles.cardAmount, isPaying ? styles.payText : styles.receiveText]}>
                        ₹{item.amount.toFixed(2)}
                    </Text>
                    {isPaying && (
                        <TouchableOpacity
                            style={styles.quickPayButton}
                            onPress={() => handleOpenPayModal(item)}
                        >
                            <Text style={styles.quickPayText}>Pay</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Top Summaries Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Overall Balances</Text>
                
                {/* Net Balance Card */}
                <View style={[
                    styles.netCard,
                    netBalance > 0 ? styles.netPositive : netBalance < 0 ? styles.netNegative : styles.netNeutral
                ]}>
                    <Text style={styles.netLabel}>NET BALANCE</Text>
                    <Text style={styles.netAmount}>
                        {netBalance >= 0 ? "+" : "-"}₹{Math.abs(netBalance).toFixed(2)}
                    </Text>
                    <Text style={styles.netSubtext}>
                        {netBalance > 0 
                            ? "Overall, people owe you money" 
                            : netBalance < 0 
                            ? "Overall, you owe money to others" 
                            : "You are fully settled up!"
                        }
                    </Text>
                </View>

                {/* Sub-summaries Row */}
                <View style={styles.summaryRow}>
                    <View style={styles.summaryBox}>
                        <Text style={styles.summaryLabel}>TO PAY</Text>
                        <Text style={[styles.summaryValue, styles.payText]}>₹{totalToPay.toFixed(2)}</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryBox}>
                        <Text style={styles.summaryLabel}>TO RECEIVE</Text>
                        <Text style={[styles.summaryValue, styles.receiveText]}>₹{totalToReceive.toFixed(2)}</Text>
                    </View>
                </View>
            </View>

            {/* Custom Premium Tab Switcher */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === "receive" && styles.activeTabReceive]}
                    onPress={() => setActiveTab("receive")}
                >
                    <Text style={[
                        styles.tabText,
                        activeTab === "receive" && styles.activeTabTextReceive
                    ]}>
                        To Receive ({toReceive.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === "pay" && styles.activeTabPay]}
                    onPress={() => setActiveTab("pay")}
                >
                    <Text style={[
                        styles.tabText,
                        activeTab === "pay" && styles.activeTabTextPay
                    ]}>
                        To Pay ({toPay.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Settlement Lists */}
            {loading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            ) : (
                <FlatList
                    data={activeTab === "pay" ? toPay : toReceive}
                    renderItem={renderSettlementItem}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#007AFF"]} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconBg}>
                                <Ionicons
                                    name={activeTab === "pay" ? "ribbon-outline" : "cash-outline"}
                                    size={48}
                                    color="#8E8E93"
                                />
                            </View>
                            <Text style={styles.emptyTitle}>All Clear!</Text>
                            <Text style={styles.emptySubtitle}>
                                {activeTab === "pay"
                                    ? "You don't owe any money right now."
                                    : "No one owes you any money right now."}
                            </Text>
                        </View>
                    }
                />
            )}

            {/* Quick Settle Payment Modal */}
            <Modal visible={isPayModalVisible} animationType="fade" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Record Payment</Text>
                            <TouchableOpacity onPress={() => setIsPayModalVisible(false)} disabled={paying}>
                                <Ionicons name="close" size={24} color="#8E8E93" />
                            </TouchableOpacity>
                        </View>

                        {selectedSettlement && (
                            <View style={styles.modalBody}>
                                <Text style={styles.modalSub}>
                                    Registering your cash/bank payment to <Text style={styles.boldText}>{selectedSettlement.toname}</Text>
                                </Text>
                                
                                <Text style={styles.modalLabel}>Payment Amount (₹):</Text>
                                <View style={styles.modalInputContainer}>
                                    <Text style={styles.modalInputPrefix}>₹</Text>
                                    <TextInput
                                        style={styles.modalInput}
                                        keyboardType="numeric"
                                        placeholder="0.00"
                                        placeholderTextColor="#8E8E93"
                                        value={payAmount}
                                        onChangeText={setPayAmount}
                                        editable={!paying}
                                    />
                                </View>
                            </View>
                        )}

                        <View style={styles.modalActions}>
                            <TouchableOpacity 
                                style={styles.modalCancelBtn} 
                                onPress={() => setIsPayModalVisible(false)}
                                disabled={paying}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalSettleBtn, paying && styles.modalSettleBtnDisabled]} 
                                onPress={handleConfirmPayment}
                                disabled={paying}
                            >
                                {paying ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.modalSettleText}>Record Pay</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F2F2F7",
    },
    header: {
        backgroundColor: "#FFFFFF",
        paddingTop: Platform.OS === "ios" ? 60 : 50,
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5EA",
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#1C1C1E",
        marginBottom: 15,
    },
    netCard: {
        borderRadius: 16,
        padding: 20,
        alignItems: "center",
        marginBottom: 20,
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    netPositive: {
        backgroundColor: "#E6F4EA", // soft green
        borderWidth: 1,
        borderColor: "#A3E2AB",
    },
    netNegative: {
        backgroundColor: "#FCE8E6", // soft red
        borderWidth: 1,
        borderColor: "#F5B4B0",
    },
    netNeutral: {
        backgroundColor: "#F2F2F7", // soft grey
        borderWidth: 1,
        borderColor: "#E5E5EA",
    },
    netLabel: {
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 1.5,
        color: "#8E8E93",
        marginBottom: 6,
    },
    netAmount: {
        fontSize: 32,
        fontWeight: "900",
        color: "#1C1C1E",
        marginBottom: 6,
    },
    netSubtext: {
        fontSize: 13,
        color: "#3A3A3C",
        fontWeight: "500",
    },
    summaryRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    summaryBox: {
        flex: 1,
        alignItems: "center",
    },
    summaryDivider: {
        width: 1,
        height: 30,
        backgroundColor: "#E5E5EA",
    },
    summaryLabel: {
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 1,
        color: "#8E8E93",
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: "bold",
    },
    payText: {
        color: "#FF3B30",
    },
    receiveText: {
        color: "#34C759",
    },
    tabContainer: {
        flexDirection: "row",
        backgroundColor: "#E5E5EA",
        padding: 3,
        borderRadius: 9,
        marginHorizontal: 20,
        marginVertical: 15,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: "center",
        borderRadius: 7,
    },
    activeTabReceive: {
        backgroundColor: "#FFFFFF",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    activeTabPay: {
        backgroundColor: "#FFFFFF",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    tabText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#8E8E93",
    },
    activeTabTextReceive: {
        color: "#34C759",
    },
    activeTabTextPay: {
        color: "#FF3B30",
    },
    loaderContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    card: {
        flexDirection: "row",
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 15,
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 10,
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    cardLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    payIconBg: {
        backgroundColor: "#FFE5E5",
    },
    receiveIconBg: {
        backgroundColor: "#E5F9EB",
    },
    cardTextContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1C1C1E",
    },
    cardSubtitle: {
        fontSize: 12,
        color: "#8E8E93",
        marginTop: 2,
    },
    cardRight: {
        alignItems: "flex-end",
        justifyContent: "center",
    },
    cardAmount: {
        fontSize: 18,
        fontWeight: "bold",
    },
    quickPayButton: {
        backgroundColor: "#007AFF",
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 6,
        marginTop: 6,
    },
    quickPayText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "bold",
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 80,
    },
    emptyIconBg: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#FFFFFF",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 15,
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 5,
        elevation: 1,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1C1C1E",
        marginBottom: 6,
    },
    emptySubtitle: {
        fontSize: 14,
        color: "#8E8E93",
        textAlign: "center",
        paddingHorizontal: 40,
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
        minHeight: 280,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 15,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#1C1C1E",
    },
    modalBody: {
        marginBottom: 20,
    },
    modalSub: {
        fontSize: 14,
        color: "#8E8E93",
        lineHeight: 20,
        marginBottom: 15,
    },
    boldText: {
        fontWeight: "bold",
        color: "#1C1C1E",
    },
    modalLabel: {
        fontSize: 15,
        fontWeight: "600",
        color: "#8E8E93",
        marginBottom: 8,
    },
    modalInputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F2F2F7",
        borderRadius: 10,
        paddingHorizontal: 15,
    },
    modalInputPrefix: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#1C1C1E",
        marginRight: 8,
    },
    modalInput: {
        flex: 1,
        paddingVertical: 15,
        fontSize: 24,
        fontWeight: "bold",
        color: "#1C1C1E",
    },
    modalActions: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 10,
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
        justifyContent: "center",
    },
    modalSettleBtnDisabled: {
        opacity: 0.6,
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
});
