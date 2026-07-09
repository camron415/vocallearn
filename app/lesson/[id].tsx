import { useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useLessonStore } from "@/stores/lesson-store";
import { COLORS } from "@/constants/config";

export default function LessonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const currentLesson = useLessonStore((s) => s.currentLesson);
  const currentFacts = useLessonStore((s) => s.currentFacts);
  const loading = useLessonStore((s) => s.loading);
  const fetchLessonWithFacts = useLessonStore((s) => s.fetchLessonWithFacts);

  useEffect(() => {
    if (id) fetchLessonWithFacts(id);
  }, [id]);

  if (loading || !currentLesson) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
      >
        <Text style={{ color: COLORS.text, fontSize: 26, fontWeight: "700", letterSpacing: -0.5 }}>
          {currentLesson.title}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
          <Ionicons name="layers-outline" size={14} color={COLORS.textSecondary} />
          <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>
            {currentFacts.length} facts to learn
          </Text>
        </View>
        {currentLesson.description && (
          <Text style={{ color: COLORS.textTertiary, fontSize: 14, marginTop: 4, fontStyle: "italic" }}>
            {currentLesson.description}
          </Text>
        )}

        {/* Facts list */}
        <View style={{ marginTop: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 }}>
            <Ionicons name="list" size={14} color={COLORS.textSecondary} />
            <Text style={{ color: COLORS.textSecondary, fontSize: 13, fontWeight: "600", letterSpacing: 0.5 }}>
              FACTS IN THIS LESSON
            </Text>
          </View>
          {currentFacts.map((fact, index) => (
            <View
              key={fact.id}
              style={{
                backgroundColor: COLORS.bgElevated,
                borderRadius: 14,
                padding: 16,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: COLORS.borderLight,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                <View style={{
                  width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.bgTertiary,
                  justifyContent: "center", alignItems: "center", marginTop: 1,
                }}>
                  <Text style={{ color: COLORS.primary, fontSize: 12, fontWeight: "700" }}>
                    {index + 1}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: COLORS.text, fontSize: 15, lineHeight: 22 }}>
                    {fact.content}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }}>
                    <View style={{
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                      backgroundColor: fact.strictness === "high" ? COLORS.errorMuted
                        : fact.strictness === "medium" ? COLORS.warningMuted : COLORS.successMuted,
                    }}>
                      <Text style={{
                        color: fact.strictness === "high" ? COLORS.error
                          : fact.strictness === "medium" ? COLORS.warning : COLORS.success,
                        fontSize: 11,
                        fontWeight: "600",
                      }}>
                        {fact.strictness.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Fixed bottom button */}
      <View style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: 20, paddingBottom: 36,
        backgroundColor: COLORS.bg,
        borderTopWidth: 1,
        borderTopColor: COLORS.borderLight,
      }}>
        <TouchableOpacity
          onPress={() => router.push(`/session/${id}?mode=lesson`)}
          activeOpacity={0.8}
          style={{
            backgroundColor: COLORS.primary,
            borderRadius: 14,
            padding: 18,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Ionicons name="play-circle" size={22} color="#fff" />
          <Text style={{ color: "#ffffff", fontSize: 17, fontWeight: "700" }}>
            Start Learning Session
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
