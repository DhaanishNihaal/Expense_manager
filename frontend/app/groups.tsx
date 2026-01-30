import { View, Text, TouchableOpacity } from "react-native";
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
        <TouchableOpacity
          onPress={handleLogout}
          style={{ alignSelf: "flex-end", marginBottom: 20 }}
        >
          <Text style={{ color: "red" }}>Logout</Text>
        </TouchableOpacity>

        <Text>Groups Screen</Text>
      </View>
    </AuthGuard>
  );
}
