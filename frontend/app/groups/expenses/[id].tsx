import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, StyleSheet, Modal, TextInput } from "react-native";
import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";

import { fetchExpenseTransactions } from "@/src/api/transactionApi";
import { ExpenseTransaction } from "@/src/types/transaction";
import { addExpenseTransaction } from "@/src/api/transactionApi";
import { deleteExpenseTransaction } from "@/src/api/transactionApi";
import { Alert,Platform} from "react-native";
export default function ExpenseTransactionsScreen() {
    const {id} = useLocalSearchParams();
    
    const [transactions, setTransactions] = useState<ExpenseTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [sowAddModal,setShowAddModal]=useState(false);
    const [payerId, setPayerId] = useState("");
    const [receiverIds, setReceiverIds] = useState("");
    const [amount, setAmount] = useState("");

    useEffect(() => {
        loadTransactions();
    }, []);

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
    const handleAddTransaction = async () => {
  await addExpenseTransaction(Number(id), {
    receiverIds: receiverIds.split(",").map((s) => s.trim()),
    totalAmount: Number(amount),
  });
  

  setShowAddModal(false);
  loadTransactions(); // refetch list
};
    const handleDeleteTransaction = async (transactionId: number) => {
  try {
    await deleteExpenseTransaction(Number(id), transactionId);
    loadTransactions(); // refresh list
  } catch (err) {
    console.error("Failed to delete transaction", err);
    alert("Failed to delete transaction");
  }
};

    const totalAmount = transactions.reduce(
        (sum, t) => sum + t.amount,
        0
    );

    

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

            {transactions.map((t) => (
  <View
    key={t.transactionId}
    style={{
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 14,
      marginBottom: 10,
      backgroundColor: "#f2f2f2",
      borderRadius: 8,
    }}
  >
    {/* LEFT SIDE */}
    <View>
      <Text style={{ fontSize: 16 }}>
        {t.payerName} → {t.receiverName}
      </Text>
      <Text style={{ fontWeight: "bold", marginTop: 4 }}>
        ₹ {t.amount.toFixed(2)}
      </Text>
    </View>

    {/* RIGHT SIDE DELETE */}
    <TouchableOpacity
      onPress={() => {
  if (Platform.OS === "web") {
    const ok = window.confirm("Delete this transaction?");
    if (ok) handleDeleteTransaction(t.transactionId);
  } else {
    Alert.alert(
      "Delete transaction?",
      "This action cannot be undone",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            handleDeleteTransaction(t.transactionId);
            console.log(t.transactionId);}
        },
      ]
    );
  }
}}
    >
      <Text style={{ fontSize: 18, color: "red" }}>🗑️</Text>
    </TouchableOpacity>
  </View>
))}
            
            {/* Floating Add Transaction Button */}
            <TouchableOpacity
                style={styles.createButton}
                onPress={() => setShowAddModal(true)}
            >
                <Text style={styles.createButtonText}>+ Add Transaction</Text>
            </TouchableOpacity>

            <View 
                style={{
                    marginTop: 20,
                    paddingTop: 12,
                    borderTopWidth: 1,
                }}
            >
                <Text style={{ fontSize: 18, fontWeight: "bold" }}>
                    Total: ₹ {totalAmount}
                </Text>
            </View>
            </ScrollView>

            <Modal
                visible={sowAddModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowAddModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 8 }}>Add Transaction</Text>
                        
                        <TextInput
                            placeholder="receiverIds (comma separated)"
                            style={styles.input}
                            value={receiverIds}
                            onChangeText={setReceiverIds}
                        />
                        <TextInput
                            placeholder="Total amount"
                            style={styles.input}
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="numeric"
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalButton, { backgroundColor: "#007AFF" }]} onPress={handleAddTransaction}>
                                <Text style={styles.modalButtonText}>Add</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, { backgroundColor: "#777" }]} onPress={() => { setShowAddModal(false); setPayerId(""); setReceiverIds(""); setAmount(""); }}>
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
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 12,
    },
    input: {
        borderWidth: 1,
        borderColor: "#E5E5E5",
        padding: 10,
        borderRadius: 8,
        marginBottom: 10,
    },
    modalButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 8,
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
    },
});