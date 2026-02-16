import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, Platform } from "react-native";
import { use, useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { fetchExpensesByGroup, addExpense, deleteExpense } from "../../src/api/expenseApi";
import { fetchGroupSettlements, Settlement } from "../../src/api/settlementApi";
import { Expense } from "../../src/types/expense";
import { router } from "expo-router";
import api from "../../src/api/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Member = {
  id: number;
  name: string;
  role: string;
};


type GroupDetail = {
  id: number;
  name: string;
  description: string;
  members: Member[];
};

export default function GroupDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loadingSettlements, setLoadingSettlements] = useState(true);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [isGroupAdmin, setIsGroupAdmin] = useState(false);
  const [newDescription, setNewDescription] = useState("");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  useEffect(() => {
    getCurrentUser();
    fetchExpensesByGroup(Number(id)).then(setExpenses).finally(() => setLoadingExpenses(false));
    loadSettlements();
  }, [id]);
  useEffect(() => {
    if (id && currentUserId) {
      fetchGroup();
    }
  }, [id,currentUserId]);

  const getCurrentUser = async () => {
    try {
      const userDataStr = await AsyncStorage.getItem("user");
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        setCurrentUserId(Number(userData.id));
        setCurrentUsername(userData.name || userData.username);
        console.log("Current user:", userData);
      }
    } catch (err) {
      console.error("Failed to get current user", err);
    }
  };
  
  

  const loadSettlements = async () => {
    try {
      const res = await fetchGroupSettlements(Number(id));
      setSettlements(res.data);
    } catch (err) {
      console.error("Failed to fetch settlements", err);
    } finally {
      setLoadingSettlements(false);
    }
  };

  const fetchGroup = async () => {
  try {
    const res = await api.get(`/api/groups/${id}`);
    setGroup(res.data);
    console.log("Group data:", res.data);
    if (currentUserId !== null && res.data.members?.length) {
      const currentMember = res.data.members.find(
        (m: Member) => m.id === currentUserId
      );

      const isAdmin = currentMember?.role === "ADMIN";
      setIsGroupAdmin(isAdmin);

      console.log("Current user role:", currentMember?.role);
      console.log("Is admin:", isAdmin);
    }

  } catch (err) {
    console.log("Failed to load group", err);
  } finally {
    setLoading(false);
  }
};

  if (loading) {
    return <Text>Loading...</Text>;
  }

  if (!group) {
    return <Text>Group not found</Text>;
  }

  const handleAddExpense = async () => {
    if (!newTitle.trim()) {
      Alert.alert("Error", "Please enter a title");
      return;
    }

    try {
      await addExpense(Number(id), {
        title: newTitle,
        description: newDescription || undefined,
        totalAmount: 0,
      });
      setShowAddExpenseModal(false);
      setNewTitle("");
      setNewDescription("");
      fetchExpensesByGroup(Number(id)).then(setExpenses);
      Alert.alert("Success", "Expense added");
    } catch (err) {
      console.error("Failed to add expense", err);
      Alert.alert("Error", "Failed to add expense");
    }
  };

  const handleDeleteExpense = async (expenseId: number) => {
    try {
      await deleteExpense(Number(id), expenseId);
      Alert.alert("Success", "Expense deleted");
      fetchExpensesByGroup(Number(id)).then(setExpenses);
      loadSettlements();
    } catch (err) {
      console.error("Delete failed", err);
      Alert.alert("Error", "Failed to delete expense");
    }
  };

  const isExpenseCreator = (expenseCreatorId: number) => {
    console.log("Current username:", currentUsername,expenseCreatorId);
    return currentUserId === expenseCreatorId;

  };

  const canDeleteExpense = (expense: Expense) => {
    console.log(expense.createdById);
    return isGroupAdmin || isExpenseCreator(expense.createdById);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{group.name}</Text>
      <Text style={styles.subtitle}>{group.members.length} members</Text>

      <Text style={styles.section}>Members</Text>
      {group.members.map((m) => {
          
          return (
            <Text key={m.id} style={styles.member}>
              • {m.name}
              {isGroupAdmin && <Text> (Admin)</Text>}
            </Text>
          );
        })}


      {/* Settlement Section */}
      {settlements.length > 0 && (
        <View style={{ marginTop: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#E5E5EA" }}>
          <Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 8 }}>
            Settlements
          </Text>
          {settlements.map((settlement, idx) => (
            <View key={idx} style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
              <Text style={{ fontSize: 14, color: "#333" }}>
                • {settlement.fromname} owes {settlement.toname}{" "}
              </Text>
              <Text style={{ fontSize: 14, color: "#34C759", fontWeight: "600" }}>
                ₹{settlement.amount.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>Expenses</Text>

      {expenses.map(exp => (
        <View key={exp.id} style={{ position: "relative", marginBottom: 10 }}>
          <TouchableOpacity
            style={styles.expenseCard}
            onPress={() => {
              router.push(`/groups/expenses/${exp.id}?groupId=${id}`);
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.expenseTitle}>{exp.title}</Text>

                {exp.description && (
                  <Text style={styles.expenseDescription}>
                    {exp.description}
                  </Text>
                )}

                <Text>Paid by {exp.createdByUserName}</Text>
              </View>

              {canDeleteExpense(exp) && (
                <View style={{ position: "relative" }}>
                  <TouchableOpacity
                    onPress={() => setOpenMenuId(openMenuId === exp.id ? null : exp.id)}
                    style={{ padding: 8, marginRight: -8 }}
                  >
                    <Text style={{ fontSize: 18 }}>⋯</Text>
                  </TouchableOpacity>

                  {openMenuId === exp.id && (
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
                            const ok = window.confirm("Delete this expense?");
                            if (ok) handleDeleteExpense(exp.id);
                          } else {
                            Alert.alert("Delete expense?", "This action cannot be undone", [
                              { text: "Cancel", style: "cancel" },
                              {
                                text: "Delete",
                                style: "destructive",
                                onPress: () => {
                                  handleDeleteExpense(exp.id);
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
          </TouchableOpacity>
        </View>
      ))}

      {/* Add Expense Button */}
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => setShowAddExpenseModal(true)}
      >
        <Text style={styles.createButtonText}>+ Add Expense</Text>
      </TouchableOpacity>

      {/* Add Expense Modal */}
      <Modal
        visible={showAddExpenseModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowAddExpenseModal(false);
          setNewTitle("");
          setNewDescription("");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 16 }}>
              Add Expense
            </Text>

            <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
              Title
            </Text>
            <TextInput
              placeholder="Enter title"
              style={styles.input}
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
              Description (Optional)
            </Text>
            <TextInput
              placeholder="Enter description"
              style={styles.input}
              value={newDescription}
              onChangeText={setNewDescription}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#007AFF" }]}
                onPress={handleAddExpense}
              >
                <Text style={styles.modalButtonText}>Add</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#777" }]}
                onPress={() => {
                  setShowAddExpenseModal(false);
                  setNewTitle("");
                  setNewDescription("");
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
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
    padding: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
  },
  subtitle: {
    color: "#666",
    marginBottom: 16,
  },
  section: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  member: {
    fontSize: 16,
    marginTop: 6,
  },
  expenseCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  expenseTitle: {
    fontWeight: "600",
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  expenseDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  createButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
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
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 14,
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
  adminBadge: {
    color: "#007AFF",
    fontWeight: "600",
    fontSize: 12,
  },
});