import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert } from "react-native";
import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { fetchExpensesByGroup, addExpense } from "../../src/api/expenseApi";
import { Expense } from "../../src/types/expense";
import { router } from "expo-router";
import api from "../../src/api/api";

type Member = {
  id: number;
  name: string;
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
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  useEffect(() => {
    fetchGroup();
    fetchExpensesByGroup(Number(id)).then(setExpenses).finally(() => setLoadingExpenses(false));
  }, [id]);

  const fetchGroup = async () => {
    try {
      const res = await api.get(`/api/groups/${id}`);
      setGroup(res.data);
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{group.name}</Text>
      <Text style={styles.subtitle}>{group.members.length} members</Text>

      <Text style={styles.section}>Members</Text>
      {group.members.map((m) => (
        <Text key={m.id} style={styles.member}>
          • {m.name}
        </Text>
      ))}
      <Text style={styles.sectionTitle}>Expenses</Text>

      {expenses.map(exp => (
        <TouchableOpacity
          key={exp.id}
          style={styles.expenseCard}
          onPress={() => {
            router.push(`/groups/expenses/${exp.id}?groupId=${id}`);
          }}
        >
          <Text style={styles.expenseTitle}>{exp.title}</Text>

          {exp.description && (
            <Text style={styles.expenseDescription}>
              {exp.description}
            </Text>
          )}

          <Text>Paid by {exp.createdBy}</Text>
        </TouchableOpacity>
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
});