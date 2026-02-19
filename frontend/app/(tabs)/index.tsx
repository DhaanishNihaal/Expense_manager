import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import { logout } from "../../src/auth/authService";
import AuthGuard from "../../src/auth/authGuard";
import { fetchGroups } from "../../src/api/groupsApi";
import { useEffect, useState, useCallback } from "react";

interface Group {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  memberCount?: number;
}

export default function GroupsScreen() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  const loadGroups = async () => {
    try {
      const data = await fetchGroups();
      setGroups(data);
    } catch (err) {
      console.log("Failed to fetch groups", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadGroups();
  };

  useFocusEffect(
    useCallback(() => {
      loadGroups();
    }, [])
  );

  const renderGroupCard = ({ item }: { item: Group }) => (
    <TouchableOpacity
      style={styles.groupCard}
      onPress={() => router.push(`/groups/${item.id}`)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.groupName}>{item.name}</Text>
        <View style={styles.memberBadge}>
          <Text style={styles.memberCount}>👥 {item.memberCount || 0}</Text>
        </View>
      </View>

      {item.description && (
        <Text style={styles.groupDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={styles.cardFooter}>
        <Text style={styles.dateText}>
          Created: {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        <Text style={styles.viewDetails}>View Details →</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>📋</Text>
      <Text style={styles.emptyTitle}>No Groups Yet</Text>
      <Text style={styles.emptySubtitle}>
        Create your first group to start managing expenses together
      </Text>
    </View>
  );

  if (loading) {
    return (
      <AuthGuard>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading groups...</Text>
        </View>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>My Groups</Text>
            <Text style={styles.headerSubtitle}>
              {groups.length} {groups.length === 1 ? "group" : "groups"}
            </Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Groups List */}
        <FlatList
          data={groups}
          renderItem={renderGroupCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />

        {/* Floating Create Button */}
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push("/groups/create")}
        >
          <Text style={styles.createButtonText}>+ Create Group</Text>
        </TouchableOpacity>
      </View>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  logoutBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FF3B30",
    borderRadius: 8,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  groupCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  groupName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
    flex: 1,
  },
  memberBadge: {
    backgroundColor: "#E8F4FD",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  memberCount: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "600",
  },
  groupDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  dateText: {
    fontSize: 12,
    color: "#999",
  },
  viewDetails: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
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
});
