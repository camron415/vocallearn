import { useEffect, Component, type ReactNode } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, Text, ScrollView } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { prewarmClips } from "@/lib/audio-clips";
import { COLORS } from "@/constants/config";
import { useAuthStore } from "@/stores/auth-store";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null; componentStack: string }> {
  state = { error: null as Error | null, componentStack: "" };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(_error: Error, info: { componentStack: string }) {
    this.setState({ componentStack: info.componentStack });
  }
  render() {
    if (this.state.error) {
      return (
        <ScrollView style={{ flex: 1, backgroundColor: "#900", padding: 40 }}>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
            App Crashed:
          </Text>
          <Text style={{ color: "#fff", fontSize: 14 }}>
            {this.state.error.message}
          </Text>
          <Text style={{ color: "#ccc", fontSize: 12, marginTop: 10 }}>
            {this.state.error.stack}
          </Text>
          {this.state.componentStack ? (
            <Text style={{ color: "#fff", fontSize: 12, marginTop: 18 }}>
              {this.state.componentStack}
            </Text>
          ) : null}
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  useEffect(() => {
    void useAuthStore.getState().initialize();
    // Download Ara voice clips to device cache in background.
    // After this completes, all filler ack phrases play instantly (no API call).
    prewarmClips();
  }, []);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: COLORS.bg,
            },
            headerTintColor: COLORS.text,
            headerTitleStyle: { fontWeight: "700", fontSize: 17 },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: COLORS.bg },
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth/login" options={{ title: "Sign In", headerShown: false }} />
          <Stack.Screen name="auth/register" options={{ title: "Create Account", headerShown: false }} />
          <Stack.Screen name="lesson/[id]" options={{ title: "Lesson", headerBackTitle: "Back" }} />
          <Stack.Screen name="session/[id]" options={{ title: "Session", headerShown: false, animation: "slide_from_bottom" }} />
        </Stack>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
