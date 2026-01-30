import { View, Text, StyleSheet } from "react-native";
import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
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

  useEffect(() => {
    fetchGroup();
  }, []);

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
    <View style={styles.container}>
      <Text style={styles.title}>{group.name}</Text>
      <Text style={styles.subtitle}>{group.members.length} members</Text>

      <Text style={styles.section}>Members</Text>
      {group.members.map((m) => (
        <Text key={m.id} style={styles.member}>
          • {m.name}
        </Text>
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
});