import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useState } from "react";
import { useEffect } from "react";
import api from "../../src/api/api";
import { useRouter } from "expo-router";
import { AxiosError } from "axios";


export default function SignupScreen() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");


  const handleSignup = async () => {
    try {
    setLoading(true);
    setError("");
    setSuccess("");

    const res = await api.post("/api/auth/signup", {
      name,
      username,
      email,
      password,
    });

    // SUCCESS
    setSuccess("Account created successfully. Redirecting to login...");

    setTimeout(() => {
      router.replace("/login");
    }, 1000);

  } catch (err) {
  const error = err as AxiosError<any>;

  console.log(
    "Signup error:",
    error.response?.data || error.message
  );

  setError("Signup failed");
} finally {
    setLoading(false);
  }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <TextInput
        placeholder="Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
{success ? <Text style={styles.success}>{success}</Text> : null}



      <TouchableOpacity
        style={styles.button}
        onPress={handleSignup}
        disabled={loading}
      >


        <Text style={styles.buttonText}>
          {loading ? "Creating..." : "Sign Up"}
        </Text>
      </TouchableOpacity>
    <TouchableOpacity onPress={() => router.replace("/login")}>
        <Text style={styles.linkText}>
            Already have an account? Login
        </Text>
    </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  button: {
    backgroundColor: "#007bff",
    padding: 14,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  
  error: {
    color: "red",
    marginBottom: 10,
  },
  success: {
  color: "green",
  marginBottom: 10,
  fontWeight: "600",
  },
  linkText: {
  color: "#2563eb",
  marginTop: 16,
  textAlign: "center",
  },

});
