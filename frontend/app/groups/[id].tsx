import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, Platform, ActivityIndicator, ScrollView } from "react-native";
import { useEffect, useRef, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { fetchExpensesByGroup, addExpense, deleteExpense } from "../../src/api/expenseApi";
import { fetchGroupSettlements, Settlement } from "../../src/api/settlementApi";
import { Expense } from "../../src/types/expense";
import { router } from "expo-router";
import api from "../../src/api/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Member = { id: number; name: string; role: string };
type GroupDetail = { id: number; name: string; description: string; members: Member[] };
type UserSearch = { id: number; username: string; name: string };

export default function GroupDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [totalSpent, setTotalSpent] = useState<number>(0);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isGroupAdmin, setIsGroupAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearch[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [invites, setInvites] = useState<{ invitedUserId: number; status: string }[]>([]);
  const [sendingInvite, setSendingInvite] = useState<number | null>(null);
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getCurrentUser();
    fetchExpensesByGroup(Number(id)).then(setExpenses);
    loadSettlements();
    loadTotalSpent();
  }, [id]);

  useEffect(() => { if (id && currentUserId) fetchGroup(); }, [id, currentUserId]);

  const getCurrentUser = async () => {
    try {
      const str = await AsyncStorage.getItem("user");
      if (str) { const u = JSON.parse(str); setCurrentUserId(Number(u.id)); }
    } catch (e) { console.error(e); }
  };

  const loadTotalSpent = async () => {
    try { const r = await api.get(`/api/groups/${id}/expenses/total`); setTotalSpent(r.data ?? 0); }
    catch (e) { console.error(e); }
  };

  const loadInvites = async () => {
    try { const r = await api.get(`/api/groups/${id}/invites`); setInvites(r.data); }
    catch (e) { console.error(e); }
  };

  const sendInvite = async (username: string, userId: number) => {
    setSendingInvite(userId);
    try { await api.post(`/api/groups/${id}/invite`, { username }); await loadInvites(); }
    catch { Alert.alert("Error", "Failed to send invite"); }
    finally { setSendingInvite(null); }
  };

  const searchUsers = async (keyword: string, groupId: number) => {
    setSearchLoading(true);
    try { const r = await api.get(`/api/users/search?keyword=${encodeURIComponent(keyword)}&groupId=${groupId}`); setSearchResults(r.data); }
    catch { setSearchResults([]); }
    finally { setSearchLoading(false); }
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!memberSearch.trim()) { setSearchResults([]); setSearchLoading(false); return; }
    setSearchLoading(true);
    debounceRef.current = setTimeout(() => searchUsers(memberSearch, Number(id)), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [memberSearch]);

  const loadSettlements = async () => {
    try { const r = await fetchGroupSettlements(Number(id)); setSettlements(r.data); }
    catch (e) { console.error(e); }
  };

  const fetchGroup = async () => {
    try {
      const r = await api.get(`/api/groups/${id}`);
      setGroup(r.data);
      if (currentUserId !== null && r.data.members?.length) {
        const m = r.data.members.find((m: Member) => m.id === currentUserId);
        setIsGroupAdmin(m?.role === "ADMIN");
      }
    } catch (e) { console.log(e); }
    finally { setLoading(false); }
  };

  const handleAddExpense = async () => {
    if (!newTitle.trim()) { Alert.alert("Error", "Please enter a title"); return; }
    try {
      await addExpense(Number(id), { title: newTitle, description: newDescription || undefined, totalAmount: 0 });
      setShowAddExpenseModal(false); setNewTitle(""); setNewDescription("");
      fetchExpensesByGroup(Number(id)).then(setExpenses);
      loadTotalSpent();
      Alert.alert("Success", "Expense added");
    } catch { Alert.alert("Error", "Failed to add expense"); }
  };

  const handleDeleteExpense = async (expenseId: number) => {
    try {
      await deleteExpense(Number(id), expenseId);
      fetchExpensesByGroup(Number(id)).then(setExpenses);
      loadSettlements();
      loadTotalSpent();
    } catch { Alert.alert("Error", "Failed to delete expense"); }
  };

  const handleLeaveGroup = async () => {
    setLeaving(true);
    try {
      await api.delete(`/api/groups/${id}/leave`);
      setShowLeaveConfirmation(false);
      setShowGroupInfo(false);
      router.replace("/groups");
    } catch (e: any) {
      const msg = e.response?.data || "Failed to leave group";
      Alert.alert("Error", msg);
    } finally {
      setLeaving(false);
    }
  };

  const canDelete = (exp: Expense) => isGroupAdmin || currentUserId === exp.createdById;

  if (loading) return <Text>Loading...</Text>;
  if (!group) return <Text>Group not found</Text>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 48 }}>

      {/* ── Header ── */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowGroupInfo(true)} activeOpacity={0.75}>
          <Text style={styles.title}>{group.name}</Text>
          <Text style={styles.subtitle}>{group.members.length} members · tap for info ›</Text>
        </TouchableOpacity>
      </View>

      {/* ── Expenses ── */}
      <Text style={styles.sectionTitle}>Expenses</Text>
      {expenses.length === 0 && <Text style={styles.emptyText}>No expenses yet.</Text>}
      {expenses.map(exp => (
        <View key={exp.id} style={{ position: "relative", marginBottom: 10 }}>
          <TouchableOpacity style={styles.expenseCard} onPress={() => router.push(`/groups/expenses/${exp.id}?groupId=${id}`)}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.expenseTitle}>{exp.title}</Text>
                {exp.description && <Text style={styles.expenseDescription}>{exp.description}</Text>}
                <Text style={styles.paidBy}>Paid by {exp.createdByUserName}</Text>
              </View>
              {canDelete(exp) && (
                <View>
                  <TouchableOpacity onPress={() => setOpenMenuId(openMenuId === exp.id ? null : exp.id)} style={{ padding: 8, marginRight: -8 }}>
                    <Text style={{ fontSize: 18 }}>⋯</Text>
                  </TouchableOpacity>
                  {openMenuId === exp.id && (
                    <View style={styles.dropdownMenu}>
                      <TouchableOpacity
                        style={{ paddingVertical: 10, paddingHorizontal: 16 }}
                        onPress={() => {
                          setOpenMenuId(null);
                          if (Platform.OS === "web") {
                            if (window.confirm("Delete this expense?")) handleDeleteExpense(exp.id);
                          } else {
                            Alert.alert("Delete expense?", "This cannot be undone", [
                              { text: "Cancel", style: "cancel" },
                              { text: "Delete", style: "destructive", onPress: () => handleDeleteExpense(exp.id) },
                            ]);
                          }
                        }}
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

      <TouchableOpacity style={styles.createButton} onPress={() => setShowAddExpenseModal(true)}>
        <Text style={styles.createButtonText}>+ Add Expense</Text>
      </TouchableOpacity>

      {/* ── Settlements ── */}
      {settlements.length > 0 && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Settlements</Text>
          {settlements.map((s, i) => (
            <View key={i} style={styles.settlementRow}>
              <Text style={styles.settlementText}>• {s.fromname} owes {s.toname}</Text>
              <Text style={styles.settlementAmount}>₹{s.amount.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ── Total ── */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalAmount}>₹{totalSpent.toFixed(2)}</Text>
      </View>

      {/* ── Add Expense Modal ── */}
      <Modal visible={showAddExpenseModal} transparent animationType="slide"
        onRequestClose={() => { setShowAddExpenseModal(false); setNewTitle(""); setNewDescription(""); }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Expense</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => { setShowAddExpenseModal(false); setNewTitle(""); setNewDescription(""); }}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.inputLabel}>Title</Text>
            <TextInput placeholder="Enter title" style={styles.input} value={newTitle} onChangeText={setNewTitle} />
            <Text style={styles.inputLabel}>Description (Optional)</Text>
            <TextInput placeholder="Enter description" style={styles.input} value={newDescription} onChangeText={setNewDescription} multiline />
            <TouchableOpacity style={[styles.modalButton, { backgroundColor: "#007AFF" }]} onPress={handleAddExpense}>
              <Text style={styles.modalButtonText}>Add Expense</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Add Member Modal ── */}
      <Modal visible={showAddMemberModal} transparent animationType="fade" onRequestClose={() => setShowAddMemberModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowAddMemberModal(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Member</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowAddMemberModal(false)}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput placeholder="Search by name or email…" style={styles.input} value={memberSearch} onChangeText={setMemberSearch} autoFocus />
            <View style={styles.dropdownList}>
              {searchLoading ? <ActivityIndicator size="small" color="#007AFF" />
                : memberSearch.trim() === "" ? <Text style={styles.dropdownHint}>Start typing to search users</Text>
                  : searchResults.length === 0 ? <Text style={styles.dropdownHint}>No users found</Text>
                    : (
                      <ScrollView style={{ width: "100%" }} keyboardShouldPersistTaps="handled">
                        {(() => {
                          const inviteMap = new Map(invites.map(inv => [inv.invitedUserId, inv.status]));
                          return searchResults.map(user => {
                            const status = inviteMap.get(user.id);
                            return (
                              <View key={user.id} style={styles.resultRow}>
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.resultUsername}>{user.username}</Text>
                                  <Text style={styles.resultName}>{user.name}</Text>
                                </View>
                                {status === "PENDING" ? (
                                  <View style={styles.pendingBadge}><Text style={styles.pendingText}>Pending</Text></View>
                                ) : status === "REJECTED" ? (
                                  <View style={{ alignItems: "center", gap: 4 }}>
                                    <Text style={styles.rejectedText}>Rejected</Text>
                                    <TouchableOpacity style={[styles.sendButton, sendingInvite === user.id && { opacity: 0.6 }]} disabled={sendingInvite === user.id} onPress={() => sendInvite(user.username, user.id)}>
                                      {sendingInvite === user.id ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.sendButtonText}>Send Again</Text>}
                                    </TouchableOpacity>
                                  </View>
                                ) : (
                                  <TouchableOpacity style={[styles.sendButton, sendingInvite === user.id && { opacity: 0.6 }]} disabled={sendingInvite === user.id} onPress={() => sendInvite(user.username, user.id)}>
                                    {sendingInvite === user.id ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.sendButtonText}>Send Request</Text>}
                                  </TouchableOpacity>
                                )}
                              </View>
                            );
                          });
                        })()}
                      </ScrollView>
                    )}
            </View>
            <TouchableOpacity style={[styles.modalButton, { backgroundColor: "#777", marginTop: 16 }]} onPress={() => setShowAddMemberModal(false)}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Group Info Modal (WhatsApp-style bottom sheet) ── */}
      <Modal visible={showGroupInfo} transparent animationType="slide" onRequestClose={() => setShowGroupInfo(false)}>
        <TouchableOpacity style={styles.groupInfoOverlay} activeOpacity={1} onPress={() => setShowGroupInfo(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.groupInfoPanel}>
            <View style={styles.groupInfoHandle} />

            {/* Title row */}
            <View style={styles.groupInfoTitleRow}>
              <View style={styles.groupAvatar}>
                <Text style={styles.groupAvatarText}>{group.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.groupInfoName}>{group.name}</Text>
                <Text style={styles.groupInfoSub}>Group · {group.members.length} members</Text>
              </View>
              {isGroupAdmin && (
                <TouchableOpacity style={styles.addMemberButton} onPress={() => {
                  setShowGroupInfo(false);
                  setTimeout(() => { setMemberSearch(""); setSearchResults([]); setShowAddMemberModal(true); loadInvites(); }, 300);
                }}>
                  <Text style={styles.addMemberButtonText}>+ Add Member</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.divider} />

            <Text style={styles.membersLabel}>Members</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }}>
              {group.members.map(m => (
                <View key={m.id} style={styles.memberRow}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>{m.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <Text style={styles.memberName}>{m.name}</Text>
                  {m.role === "ADMIN" && <View style={styles.adminChip}><Text style={styles.adminChipText}>Admin</Text></View>}
                </View>
              ))}
            </ScrollView>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.leaveGroupButton}
              onPress={() => setShowLeaveConfirmation(true)}
            >
              <Text style={styles.leaveGroupButtonText}>Leave Group</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Leave Group Confirmation Modal ── */}
      <Modal visible={showLeaveConfirmation} transparent animationType="fade" onRequestClose={() => setShowLeaveConfirmation(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmationCard}>
            <Text style={styles.confirmationTitle}>Leave "{group.name}" group?</Text>
            <Text style={styles.confirmationMsg}>You will no longer be able to see expenses or settle debts in this group.</Text>

            <View style={styles.confirmationActions}>
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: "#F2F2F7" }]}
                onPress={() => setShowLeaveConfirmation(false)}
                disabled={leaving}
              >
                <Text style={[styles.confirmButtonText, { color: "#000" }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: "#FF3B30" }]}
                onPress={handleLeaveGroup}
                disabled={leaving}
              >
                {leaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Leave</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16, backgroundColor: "#F2F2F7" },
  headerRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
  backButton: { paddingRight: 12, paddingVertical: 4, justifyContent: "center" },
  backIcon: { fontSize: 22, color: "#007AFF" },
  title: { fontSize: 24, fontWeight: "bold", color: "#1A1A1A" },
  subtitle: { color: "#007AFF", fontSize: 13, marginTop: 2 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#1A1A1A", marginTop: 20, marginBottom: 6 },
  emptyText: { color: "#999", fontSize: 14, marginBottom: 8 },
  expenseCard: { backgroundColor: "#fff", padding: 14, borderRadius: 10, borderWidth: 1, borderColor: "#E5E5EA" },
  expenseTitle: { fontWeight: "600", fontSize: 15, marginBottom: 2, color: "#1A1A1A" },
  expenseDescription: { fontSize: 13, color: "#666", marginBottom: 4 },
  paidBy: { fontSize: 12, color: "#888", marginTop: 2 },
  dropdownMenu: {
    position: "absolute", right: 0, top: 30, backgroundColor: "#fff",
    borderRadius: 8, borderWidth: 1, borderColor: "#E5E5EA",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4, zIndex: 100,
  },
  createButton: {
    backgroundColor: "#007AFF", paddingVertical: 15, borderRadius: 12,
    alignItems: "center", marginTop: 16,
    shadowColor: "#007AFF", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  createButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  sectionCard: { marginTop: 20, backgroundColor: "#fff", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#E5E5EA" },
  settlementRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 4 },
  settlementText: { fontSize: 14, color: "#333", flex: 1 },
  settlementAmount: { fontSize: 14, color: "#34C759", fontWeight: "700" },
  totalCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16, backgroundColor: "#007AFF", borderRadius: 14, padding: 18 },
  totalLabel: { color: "#fff", fontSize: 16, fontWeight: "600" },
  totalAmount: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  // Modals
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { width: "90%", backgroundColor: "#fff", padding: 20, borderRadius: 14 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#1A1A1A" },
  closeButton: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#F0F0F0", justifyContent: "center", alignItems: "center" },
  closeIcon: { fontSize: 14, color: "#555", fontWeight: "600" },
  inputLabel: { fontSize: 14, fontWeight: "600", marginBottom: 6, color: "#1A1A1A" },
  input: { borderWidth: 1, borderColor: "#E5E5E5", padding: 12, borderRadius: 8, marginBottom: 14, fontSize: 14 },
  modalButton: { paddingVertical: 13, borderRadius: 10, alignItems: "center" },
  modalButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  dropdownList: { borderWidth: 1, borderColor: "#E5E5E5", borderRadius: 8, minHeight: 60, justifyContent: "center", alignItems: "center", paddingVertical: 10, paddingHorizontal: 8 },
  dropdownHint: { color: "#999", fontSize: 13 },
  resultRow: { paddingVertical: 10, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: "#F0F0F0", flexDirection: "row", alignItems: "center" },
  resultUsername: { fontSize: 14, fontWeight: "600", color: "#000" },
  resultName: { fontSize: 12, color: "#888", marginTop: 1 },
  sendButton: { backgroundColor: "#007AFF", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, alignItems: "center", minWidth: 96 },
  sendButtonText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  pendingBadge: { backgroundColor: "#F0F0F0", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, minWidth: 96, alignItems: "center" },
  pendingText: { color: "#888", fontSize: 12, fontWeight: "600" },
  rejectedText: { color: "#FF3B30", fontSize: 12, fontWeight: "600" },
  addMemberButton: { backgroundColor: "#007AFF", paddingVertical: 7, paddingHorizontal: 13, borderRadius: 8, alignSelf: "flex-start" },
  addMemberButtonText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  adminBadge: { color: "#007AFF", fontWeight: "600", fontSize: 12 },
  // Group Info bottom sheet
  groupInfoOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  groupInfoPanel: { backgroundColor: "#fff", borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingTop: 12, paddingBottom: 40, paddingHorizontal: 20 },
  groupInfoHandle: { width: 40, height: 4, backgroundColor: "#D1D1D6", borderRadius: 2, alignSelf: "center", marginBottom: 18 },
  groupInfoTitleRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  groupAvatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: "#007AFF", justifyContent: "center", alignItems: "center" },
  groupAvatarText: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  groupInfoName: { fontSize: 19, fontWeight: "bold", color: "#1A1A1A" },
  groupInfoSub: { fontSize: 13, color: "#888", marginTop: 2 },
  divider: { height: 1, backgroundColor: "#F0F0F0", marginBottom: 14 },
  membersLabel: { fontSize: 12, fontWeight: "700", color: "#8E8E93", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 },
  memberRow: { flexDirection: "row", alignItems: "center", paddingVertical: 9, gap: 12, borderBottomWidth: 1, borderBottomColor: "#F7F7F7" },
  memberAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#E5E5EA", justifyContent: "center", alignItems: "center" },
  memberAvatarText: { fontSize: 16, fontWeight: "600", color: "#555" },
  memberName: { flex: 1, fontSize: 15, fontWeight: "500", color: "#1A1A1A" },
  adminChip: { backgroundColor: "#EBF3FF", paddingVertical: 3, paddingHorizontal: 8, borderRadius: 10 },
  adminChipText: { color: "#007AFF", fontSize: 11, fontWeight: "700" },
  leaveGroupButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#FFF5F5",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFE5E5",
  },
  leaveGroupButtonText: {
    color: "#FF3B30",
    fontSize: 16,
    fontWeight: "600",
  },
  confirmationCard: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  confirmationTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 10,
    textAlign: "center",
  },
  confirmationMsg: {
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
  },
  confirmationActions: {
    flexDirection: "row",
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});