import { Redirect } from "expo-router";

// This page has been removed. Redirect to the Groups tab.
export default function ExplorePage() {
  return <Redirect href="/(tabs)" />;
}
