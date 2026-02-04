import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { fetchExpensesByGroup } from "../../src/api/expenseApi";
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

  return (
    <View  style={styles.container}>
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
            router.push(`/groups/expenses/${exp.id}`);
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
});