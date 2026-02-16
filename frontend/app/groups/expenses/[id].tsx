import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";

import { fetchExpenseTransactions, addExpenseTransaction ,deletePayment} from "@/src/api/transactionApi";
import { fetchExpenseSettlements, Settlement } from "@/src/api/settlementApi";
import { fetchGroupMembers } from "@/src/api/groupsApi";
import { ExpenseTransaction } from "@/src/types/transaction";
import { User } from "@/src/types/user";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ExpenseTransactionsScreen() {
  const { id, groupId } = useLocalSearchParams();

  // Transaction state
  const [transactions, setTransactions] = useState<ExpenseTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPayers, setExpandedPayers] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);

  // Members & form state
  const [members, setMembers] = useState<User[]>([]);
  const [selectedReceivers, setSelectedReceivers] = useState<(number | "")[]>([""]); // Start with one empty dropdown
  const [excludeMe, setExcludeMe] = useState(false);
  const [amount, setAmount] = useState("");
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [settlements, setSettlements] = useState<Settlement[]>([]);

  useEffect(() => {
    getCurrentUserId();
    loadTransactions();
    loadSettlements();
  }, []);

  const getCurrentUserId = async () => {
    try {
      const userDataStr = await AsyncStorage.getItem("user");
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        const userId = Number(userData.id); // Ensure it's a number
        console.log("Current User ID:", userId);
        setCurrentUserId(userId);
      } else {
        console.log("No user data found in AsyncStorage");
      }
    } catch (err) {
      console.error("Failed to get current user ID", err);
    }
  };

  const loadTransactions = async () => {
    try {
      const res = await fetchExpenseTransactions(Number(id));
      setTransactions(res.data);
    } catch (err) {
      console.error("Failed to fetch transactions", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load settlements from backend
   */
  const loadSettlements = async () => {
    try {
      const res = await fetchExpenseSettlements(Number(id));
      setSettlements(res.data);
    } catch (err) {
      console.error("Failed to fetch settlements", err);
    }
  };

  /**
   * Load group members when modal opens
   */
  const loadGroupMembers = async () => {
    if (!groupId) {
      console.error("Group ID not available");
      Alert.alert("Error", "Could not determine group");
      return;
    }
    
    setLoadingMembers(true);
    try {
      const data = await fetchGroupMembers(Number(groupId));
      setMembers(data);
    } catch (err) {
      console.error("Failed to fetch group members", err);
      Alert.alert("Error", "Could not load group members");
    } finally {
      setLoadingMembers(false);
    }
  };

  /**
   * Get available users for a specific dropdown
   * Rules:
   * - Remove already selected users (except current dropdown)
   * - Remove logged-in user if "Doesn't include you" is checked
   * - Always include the currently selected user in its own dropdown
   */
  const getAvailableUsersForDropdown = (dropdownIndex: number): User[] => {
    let available = [...members];

    // Rule 1: Remove logged-in user if excludeMe is checked
    if (excludeMe) {
      // TODO: Get current user ID from auth context
      // For now, we'll assume the logged-in user is excluded from the list
    }

    // Rule 2: Remove already selected users from other dropdowns
    const selectedUserIds = selectedReceivers.filter(
      (id, idx) => id !== "" && idx !== dropdownIndex
    ) as number[];

    available = available.filter((user) => !selectedUserIds.includes(user.id));

    return available;
  };

  /**
   * Handle receiver selection change
   */
  const handleReceiverChange = (value: string, index: number) => {
    const newReceivers = [...selectedReceivers];
    newReceivers[index] = value === "" ? "" : parseInt(value, 10);
    setSelectedReceivers(newReceivers);

    // Auto-add new dropdown if user selected someone in the last dropdown
    if (
      value !== "" &&
      index === selectedReceivers.length - 1 &&
      selectedReceivers.length < members.length
    ) {
      setSelectedReceivers([...newReceivers, ""]);
    }
  };

  /**
   * Handle "Doesn't include you" checkbox
   */
  const handleExcludeMeChange = () => {
    const newExcludeMe = !excludeMe;
    setExcludeMe(newExcludeMe);

    // If unchecking and user was removed, we don't need to do anything special
    // If checking, we need to remove current user from any dropdowns and reset
    if (newExcludeMe) {
      // TODO: Remove logged-in user ID from selectedReceivers
    }
  };

  /**
   * Select all available members as receivers
   */
  const handleSelectAll = () => {
    const allMemberIds = members.map((member) => member.id);
    
    // If "Doesn't include you" is checked, filter out current user
    // For now, we'll select all members
    // The current user filtering will be handled when fetching members
    
    setSelectedReceivers(allMemberIds);
  };

  /**
   * Validate and submit transaction
   */
  const handleAddTransaction = async () => {
    // Filter out empty selections
    const validReceiverIds = selectedReceivers.filter((id) => id !== "") as number[];

    // Validation
    if (validReceiverIds.length === 0) {
      Alert.alert("Error", "Please select at least one receiver");
      return;
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    try {
      await addExpenseTransaction(Number(id), {
        receiverIds: validReceiverIds,
        totalAmount: Number(amount),
      });

      // Reset form
      setShowAddModal(false);
      setSelectedReceivers([""]);
      setAmount("");
      setExcludeMe(false);

      // Refresh transactions
      loadTransactions();
      loadSettlements();
      Alert.alert("Success", "Transaction added");
    } catch (err) {
      console.error("Failed to add transaction", err);
      Alert.alert("Error", "Failed to add transaction");
    }
  };



  /**
   * Toggle payer expansion
   */
  const toggle = (paymentGroupId: string) => {
    const newExpanded = new Set(expandedPayers);
    if (newExpanded.has(paymentGroupId)) {
      newExpanded.delete(paymentGroupId);
    } else {
      newExpanded.add(paymentGroupId);
    }
    setExpandedPayers(newExpanded);
  };

  /**
   * Group transactions by payer
   */
  const groupedByPaymentId = transactions.reduce((acc, tx) => {
    const key = tx.paymentGroupId;

    if (!acc[key]) {
      acc[key] = {
        paymentGroupId: key,
        payerId: tx.payerId,
        payerName: tx.payerName,
        total: 0,
        splits: []
      };
    }

    acc[key].total += tx.amount;
    acc[key].splits.push(tx);

    return acc;
  }, {} as Record<string, any>);

  const handleDeletePayment = async (paymentGroupId: string) => {
    try{
      await deletePayment(Number(id), paymentGroupId);
      Alert.alert("Success", "Payment deleted");
      loadTransactions();
      loadSettlements();
    }
    catch(err){
      console.log("delete failed",err);
    }
  };
  const payerSummaries = Object.values(groupedByPaymentId);

  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

  

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={{ padding: 16 }} contentContainerStyle={{ paddingBottom: 140 }}>
        <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 12 }}>
          Transactions
        </Text>

        {/* Payer Summary List */}
        {payerSummaries.map((payer) => (
          <View key={payer.paymentGroupId} style={{ marginBottom: 12 }}>
            {/* Summary Row - Tap to expand */}
            <View style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 14,
              backgroundColor: "#fff",
              borderRadius: 8,
              borderWidth: 1,
              borderColor: "#E5E5EA",
            }}>
              <TouchableOpacity 
                onPress={() => toggle(payer.paymentGroupId)}
                style={{ flex: 1, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
              >
                <Text style={{ fontSize: 16, fontWeight: "600", color: "#333" }}>
                  {payer.payerName} paid
                </Text>
                <View style={{ alignItems: "flex-end", marginRight: 8 }}>
                  <Text style={{ fontSize: 18, fontWeight: "bold", color: "#333" }}>
                    ₹{payer.total.toFixed(2)}
                  </Text>
                  <Text style={{ fontSize: 12, color: "#666" }}>
                    {expandedPayers.has(payer.paymentGroupId) ? "▼" : "▶"}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Three-dot menu on payer summary - only show if current user is payer */}
              {currentUserId==payer.payerId && (
                <View style={{ position: "relative" }}>
                  <TouchableOpacity
                    onPress={() => setOpenMenuId(openMenuId === payer.paymentGroupId ? null : payer.paymentGroupId)}
                    style={{ padding: 8, marginRight: -8 }}
                  >
                    <Text style={{ fontSize: 18 }}>⋯</Text>
                  </TouchableOpacity>

                  {/* Delete Menu Option */}
                  {openMenuId === payer.paymentGroupId && (
                    <View
                      style={{
                        position: "absolute",
                        right: 0,
                        top: 30,
                        backgroundColor: "#fff",
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: "#E5E5EA",
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 3,
                        zIndex: 100,
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => {
                          setOpenMenuId(null);
                          if (Platform.OS === "web") {
                            const ok = window.confirm("Delete this transaction?");
                            if (ok) handleDeletePayment(payer.paymentGroupId);
                          } else {
                            Alert.alert("Delete transaction?", "This action cannot be undone", [
                              { text: "Cancel", style: "cancel" },
                              {
                                text: "Delete",
                                style: "destructive",
                                onPress: () => {
                                  handleDeletePayment(payer.paymentGroupId);
                                },
                              },
                            ]);
                          }
                        }}
                        style={{ paddingVertical: 10, paddingHorizontal: 16 }}
                      >
                        <Text style={{ color: "red", fontSize: 14, fontWeight: "500" }}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Expanded Splits */}
            {expandedPayers.has(payer.paymentGroupId) && (
              <View style={{ backgroundColor: "#f2f2f2", borderRadius: 8, borderTopLeftRadius: 0, borderTopRightRadius: 0, paddingVertical: 8 }}>
                {payer.splits.map((split: ExpenseTransaction) => (
                  <View 
                    key={split.transactionId} 
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderBottomWidth: 1,
                      borderBottomColor: "#E5E5EA",
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, color: "#333" }}>
                        {payer.payerName} → {split.receiverName}
                      </Text>
                      <Text style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                        ₹{split.amount.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* Total */}
        <View
          style={{
            marginTop: 20,
            paddingTop: 12,
            borderTopWidth: 1,
            paddingBottom: 16,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 12 }}>
            Total: ₹ {totalAmount.toFixed(2)}
          </Text>

          {/* Settlement Section */}
          {settlements.length > 0 && (
            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#E5E5EA" }}>
              <Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 8 }}>
                Settlement
              </Text>
              {settlements.map((settlement, idx) => (
                <View key={idx} style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                  <Text style={{ fontSize: 14, color: "#333" }}>
                    • {settlement.fromUsername} owes {settlement.toUsername}{" "}
                  </Text>
                  <Text style={{ fontSize: 14, color: "#34C759", fontWeight: "600" }}>
                    ₹{settlement.amount.toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Add Transaction Button */}
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => {
          setShowAddModal(true);
          loadGroupMembers();
        }}
      >
        <Text style={styles.createButtonText}>+ Add Transaction</Text>
      </TouchableOpacity>

      {/* Add Transaction Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowAddModal(false);
          setSelectedReceivers([""]);
          setAmount("");
          setExcludeMe(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 16 }}>
              Add Transaction
            </Text>

            {loadingMembers ? (
              <ActivityIndicator size="large" color="#007AFF" />
            ) : (
              <>
                {/* Receiver Dropdowns Section */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600" }}>
                    Receivers
                  </Text>
                  <TouchableOpacity 
                    style={styles.selectAllButton}
                    onPress={handleSelectAll}
                  >
                    <Text style={styles.selectAllText}>Select All</Text>
                  </TouchableOpacity>
                </View>

                {/* Multiple Receiver Dropdowns */}
                {selectedReceivers.map((selectedId, index) => (
                  <View key={index} style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                      Receiver {index + 1}
                    </Text>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={selectedId === "" ? "" : String(selectedId)}
                        onValueChange={(value) => handleReceiverChange(value, index)}
                        style={styles.picker}
                      >
                        <Picker.Item label="Select user" value="" />
                        {getAvailableUsersForDropdown(index).map((user) => (
                          <Picker.Item key={user.id} label={user.name} value={String(user.id)} />
                        ))}
                      </Picker>
                    </View>
                  </View>
                ))}

                {/* "Doesn't include you" Checkbox */}
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={handleExcludeMeChange}
                >
                  <View style={[styles.checkbox, excludeMe && styles.checkboxChecked]}>
                    {excludeMe && <Text style={styles.checkboxCheck}>✓</Text>}
                  </View>
                  <Text style={{ marginLeft: 10, fontSize: 14 }}>Doesn't include you</Text>
                </TouchableOpacity>

                {/* Amount Input */}
                <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 8, marginTop: 16 }}>
                  Total Amount
                </Text>
                <TextInput
                  placeholder="Enter amount"
                  style={styles.input}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                />

                {/* Action Buttons */}
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: "#007AFF" }]}
                    onPress={handleAddTransaction}
                  >
                    <Text style={styles.modalButtonText}>Add</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: "#777" }]}
                    onPress={() => {
                      setShowAddModal(false);
                      setSelectedReceivers([""]);
                      setAmount("");
                      setExcludeMe(false);
                    }}
                  >
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  createButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    left: 20,
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginVertical: "auto",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 14,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 12,
  },
  picker: {
    height: 50,
    width: "100%",
  },
  selectAllButton: {
    backgroundColor: "#34C759",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  selectAllText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#007AFF",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#007AFF",
  },
  checkboxCheck: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});