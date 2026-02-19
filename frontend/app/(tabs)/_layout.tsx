import { Tabs } from "expo-router";
import { Text } from "react-native";

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "#8E8E93",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopColor: "#E5E5E5",
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Groups",
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settlements"
        options={{
          title: "Settlements",
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="invitations"
        options={{
          title: "Invitations",
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{ href: null }}
      />
    </Tabs>
  );
}
