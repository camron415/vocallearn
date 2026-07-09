import { View, Text, TouchableOpacity, ScrollView, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureDetector } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/auth-store";
import { useSettingsStore } from "@/stores/settings-store";
import { COLORS } from "@/constants/config";
import { useSwipeTabs } from "@/hooks/useSwipeTabs";

export default function ProfileScreen() {
  const session = useAuthStore((s) => s.session);
  const signOut = useAuthStore((s) => s.signOut);
  const handsFreeMode = useSettingsStore((s) => s.handsFreeMode);
  const setHandsFreeMode = useSettingsStore((s) => s.setHandsFreeMode);
  const backgroundAudioEnabled = useSettingsStore((s) => s.backgroundAudioEnabled);
  const setBackgroundAudioEnabled = useSettingsStore((s) => s.setBackgroundAudioEnabled);
  const lessonPace = useSettingsStore((s) => s.lessonPace);
  const setLessonPace = useSettingsStore((s) => s.setLessonPace);

  const displayName = session?.user?.user_metadata?.display_name || session?.user?.email?.split("@")[0] || "Guest";
  const email = session?.user?.email ?? "";
  const swipe = useSwipeTabs();

  return (
    <GestureDetector gesture={swipe}>
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={["top"]}>
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
    >
      {/* Avatar + name */}
      <View style={{ alignItems: "center", marginTop: 8 }}>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: COLORS.primaryMuted,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="person" size={36} color={COLORS.primary} />
        </View>
        <Text style={{ color: COLORS.text, fontSize: 22, fontWeight: "700", marginTop: 14, letterSpacing: -0.3 }}>
          {displayName}
        </Text>
        {email ? (
          <Text style={{ color: COLORS.textSecondary, fontSize: 14, marginTop: 2 }}>
            {email}
          </Text>
        ) : null}
      </View>

      {/* Settings */}
      <View style={{ marginTop: 36 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 }}>
          <Ionicons name="settings-outline" size={14} color={COLORS.textSecondary} />
          <Text style={{ color: COLORS.textSecondary, fontSize: 13, fontWeight: "600", letterSpacing: 0.5 }}>
            PREFERENCES
          </Text>
        </View>
        {[
          { label: "Learning Mode", value: "Voice + Write", icon: "mic-outline" as const },
          { label: "Notifications", value: "Scheduled", icon: "notifications-outline" as const },
          { label: "Daily Goal", value: "30 minutes", icon: "timer-outline" as const },
        ].map((item, i) => (
          <View
            key={item.label}
            style={{
              backgroundColor: COLORS.bgElevated,
              borderRadius: i === 0 ? 14 : i === 2 ? 14 : 0,
              borderTopLeftRadius: i === 0 ? 14 : 0,
              borderTopRightRadius: i === 0 ? 14 : 0,
              borderBottomLeftRadius: i === 2 ? 14 : 0,
              borderBottomRightRadius: i === 2 ? 14 : 0,
              padding: 16,
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 1,
              borderColor: COLORS.borderLight,
              borderTopWidth: i === 0 ? 1 : 0,
              gap: 12,
            }}
          >
            <Ionicons name={item.icon} size={18} color={COLORS.textSecondary} />
            <Text style={{ color: COLORS.text, fontSize: 16, flex: 1 }}>{item.label}</Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 15 }}>{item.value}</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
          </View>
        ))}

        {/* Hands-free toggle */}
        <View
          style={{
            backgroundColor: COLORS.bgElevated,
            borderRadius: 14,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1,
            borderColor: COLORS.borderLight,
            marginTop: 10,
            gap: 12,
          }}
        >
          <Ionicons name="headset-outline" size={18} color={COLORS.textSecondary} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: COLORS.text, fontSize: 16 }}>Hands-Free Mode</Text>
            <Text style={{ color: COLORS.textTertiary, fontSize: 12, marginTop: 2 }}>
              Voice commands: "skip", "repeat", "stop"
            </Text>
          </View>
          <Switch
            value={handsFreeMode}
            onValueChange={setHandsFreeMode}
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
            thumbColor="#ffffff"
          />
        </View>

        {/* Background audio toggle */}
        <View
          style={{
            backgroundColor: COLORS.bgElevated,
            borderRadius: 14,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1,
            borderColor: COLORS.borderLight,
            marginTop: 10,
            gap: 12,
          }}
        >
          <Ionicons name="moon-outline" size={18} color={COLORS.textSecondary} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: COLORS.text, fontSize: 16 }}>Background Audio</Text>
            <Text style={{ color: COLORS.textTertiary, fontSize: 12, marginTop: 2 }}>
              Keep lessons playing when screen locks
            </Text>
          </View>
          <Switch
            value={backgroundAudioEnabled}
            onValueChange={setBackgroundAudioEnabled}
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
            thumbColor="#ffffff"
          />
        </View>

        <View
          style={{
            backgroundColor: COLORS.bgElevated,
            borderRadius: 14,
            padding: 16,
            borderWidth: 1,
            borderColor: COLORS.borderLight,
            marginTop: 10,
            gap: 12,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Ionicons name="speedometer-outline" size={18} color={COLORS.textSecondary} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: COLORS.text, fontSize: 16 }}>Lesson Pace</Text>
              <Text style={{ color: COLORS.textTertiary, fontSize: 12, marginTop: 2 }}>
                Slower pace slows the voice and gives you more breathing room between facts.
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {[
              { key: "standard" as const, label: "Standard" },
              { key: "slower" as const, label: "Slower" },
            ].map((option) => {
              const selected = lessonPace === option.key;
              return (
                <TouchableOpacity
                  key={option.key}
                  onPress={() => setLessonPace(option.key)}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: "center",
                    backgroundColor: selected ? COLORS.primaryMuted : COLORS.bg,
                    borderWidth: 1,
                    borderColor: selected ? COLORS.primary : COLORS.borderLight,
                  }}
                >
                  <Text style={{ color: selected ? COLORS.primary : COLORS.textSecondary, fontSize: 14, fontWeight: "700" }}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* Sign Out */}
      <TouchableOpacity
        onPress={signOut}
        activeOpacity={0.8}
        style={{
          backgroundColor: COLORS.errorMuted,
          borderRadius: 14,
          padding: 16,
          marginTop: 36,
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
        <Text style={{ color: COLORS.error, fontSize: 16, fontWeight: "600" }}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
    </SafeAreaView>
    </GestureDetector>
  );
}
