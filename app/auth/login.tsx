import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/auth-store";
import { COLORS } from "@/constants/config";

export default function LoginScreen() {
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: COLORS.bg }}
    >
      <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
        {/* Logo area */}
        <View style={{ alignItems: "center", marginBottom: 48 }}>
          <View style={{
            width: 72, height: 72, borderRadius: 20, backgroundColor: COLORS.primaryMuted,
            justifyContent: "center", alignItems: "center",
          }}>
            <Ionicons name="mic" size={36} color={COLORS.primary} />
          </View>
          <Text style={{ color: COLORS.text, fontSize: 32, fontWeight: "800", marginTop: 16, letterSpacing: -0.5 }}>
            VocalLearn
          </Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: 15, marginTop: 4 }}>
            Speak to remember
          </Text>
        </View>

        {/* Email */}
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={COLORS.textTertiary}
          keyboardType="email-address"
          autoCapitalize="none"
          style={{
            backgroundColor: COLORS.bgTertiary,
            borderRadius: 12,
            padding: 16,
            color: COLORS.text,
            fontSize: 16,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        />

        {/* Password */}
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={COLORS.textTertiary}
          secureTextEntry
          style={{
            backgroundColor: COLORS.bgTertiary,
            borderRadius: 12,
            padding: 16,
            color: COLORS.text,
            fontSize: 16,
            borderWidth: 1,
            borderColor: COLORS.border,
            marginTop: 12,
          }}
        />

        {/* Error */}
        {error ? (
          <Text style={{ color: COLORS.error, fontSize: 14, marginTop: 8 }}>{error}</Text>
        ) : null}

        {/* Sign In button */}
        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
          style={{
            backgroundColor: loading ? COLORS.primaryDark : COLORS.primary,
            borderRadius: 14,
            padding: 18,
            marginTop: 20,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#ffffff", fontSize: 17, fontWeight: "700" }}>
            {loading ? "Signing in..." : "Sign In"}
          </Text>
        </TouchableOpacity>

        {/* Register link */}
        <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 24 }}>
          <Text style={{ color: COLORS.textSecondary }}>Don't have an account? </Text>
          <Link href="/auth/register">
            <Text style={{ color: COLORS.primary, fontWeight: "600" }}>Sign Up</Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
