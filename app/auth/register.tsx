import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/auth-store";
import { COLORS } from "@/constants/config";

export default function RegisterScreen() {
  const router = useRouter();
  const signUp = useAuthStore((s) => s.signUp);

  const [firstName, setFirstName] = useState("");
  const [pronunciation, setPronunciation] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!firstName || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await signUp(email, password, firstName.trim(), pronunciation.trim() || undefined);
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e.message || "Registration failed");
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
        <View style={{ alignItems: "center", marginBottom: 48 }}>
          <View style={{
            width: 72, height: 72, borderRadius: 20, backgroundColor: COLORS.primaryMuted,
            justifyContent: "center", alignItems: "center",
          }}>
            <Ionicons name="person-add" size={32} color={COLORS.primary} />
          </View>
          <Text style={{ color: COLORS.text, fontSize: 32, fontWeight: "800", marginTop: 16, letterSpacing: -0.5 }}>
            Create Account
          </Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: 15, marginTop: 4 }}>
            Start your learning journey
          </Text>
        </View>

        <TextInput
          value={firstName}
          onChangeText={setFirstName}
          placeholder="First Name"
          placeholderTextColor={COLORS.textTertiary}
          autoCapitalize="words"
          style={{
            backgroundColor: COLORS.bgTertiary,
            borderRadius: 12,
            padding: 16,
            color: COLORS.text,
            fontSize: 16,
            borderWidth: 1,
            borderColor: COLORS.border,
            marginBottom: 12,
          }}
        />

        <TextInput
          value={pronunciation}
          onChangeText={setPronunciation}
          placeholder="How is it pronounced? (optional)"
          placeholderTextColor={COLORS.textTertiary}
          autoCapitalize="words"
          style={{
            backgroundColor: COLORS.bgTertiary,
            borderRadius: 12,
            padding: 16,
            color: COLORS.text,
            fontSize: 16,
            borderWidth: 1,
            borderColor: COLORS.border,
            marginBottom: 4,
          }}
        />
        <Text style={{ color: COLORS.textTertiary, fontSize: 12, marginBottom: 12, paddingHorizontal: 4 }}>
          e.g. if your name is "Camron", type "Cameron" so the AI voice says it right
        </Text>

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

        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm Password"
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

        {error ? (
          <Text style={{ color: COLORS.error, fontSize: 14, marginTop: 8 }}>{error}</Text>
        ) : null}

        <TouchableOpacity
          onPress={handleRegister}
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
            {loading ? "Creating account..." : "Create Account"}
          </Text>
        </TouchableOpacity>

        <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 24 }}>
          <Text style={{ color: COLORS.textSecondary }}>Already have an account? </Text>
          <Link href="/auth/login">
            <Text style={{ color: COLORS.primary, fontWeight: "600" }}>Sign In</Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
