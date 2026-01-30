import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { logout } from "../src/auth/authService";
import AuthGuard from "../src/auth/authGuard";

export default function GroupsScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    await logout();          // removes JWT from storage
    router.replace("/login"); // send user to login
  };

  return (
    <AuthGuard>
      <View style={{ flex: 1, padding: 24 }}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text>Groups Screen</Text>
      </View>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  logoutBtn: {
  marginTop: 20,
  padding: 10,
  backgroundColor: "#dc3545",
  borderRadius: 5,
  alignSelf: "flex-end",
},

logoutText: {
  color: "white",
  fontWeight: "bold",
},

});

