import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";

import { fetchExpenseTransactions } from "@/src/api/transactionApi";
import { ExpenseTransaction } from "@/src/types/transaction";

export default function ExpenseTransactionsScreen() {
    const {id} = useLocalSearchParams();

    const [transactions, setTransactions] = useState<ExpenseTransaction[]>([]);
    const [loading, setLoading] = useState(true);

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
        <ScrollView style={{ padding: 16 }}>
            <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 12 }}>
                Transactions
            </Text>

            {transactions.map((t) => (
                <View
                    key={t.id}
                    style={{
                        padding: 14,
                        marginBottom: 10,
                        backgroundColor: "#f2f2f2",
                        borderRadius: 8,
                    }}
                >
                    <Text style={{ fontSize: 16 }}>
                        {t.payerName} → {t.receiverName}
                    </Text>
                    <Text style={{ fontWeight: "bold", marginTop: 4 }}>
                        ₹ {t.amount}
                    </Text>
                </View>
            ))}

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
    );
}