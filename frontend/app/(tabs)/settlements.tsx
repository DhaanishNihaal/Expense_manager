import { View, Text, StyleSheet } from "react-native";

export default function SettlementsScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.emoji}>💸</Text>
            <Text style={styles.title}>Settlements</Text>
            <Text style={styles.subtitle}>Coming Soon</Text>
            <Text style={styles.description}>
                View and manage your group settlements here.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F5F7FA",
        padding: 24,
    },
    emoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#1A1A1A",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#007AFF",
        marginBottom: 12,
    },
    description: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
        lineHeight: 22,
    },
});
