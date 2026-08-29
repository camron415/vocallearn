import { useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/config";
import { useAskStore } from "@/stores/ask-store";
import { useLessonStore } from "@/stores/lesson-store";
import { FROM_ASK_LESSON_ID, type ProposedFact } from "@/types/ask";

const FROM_ASK_LESSON = FROM_ASK_LESSON_ID;

export default function AskApprovalsScreen() {
  const router = useRouter();
  const pendingFacts = useAskStore((s) => s.pendingFacts);
  const pendingCount = useAskStore((s) => s.pendingCount);
  const approving = useAskStore((s) => s.approving);
  const error = useAskStore((s) => s.error);
  const fetchPendingFacts = useAskStore((s) => s.fetchPendingFacts);
  const approveProposedFact = useAskStore((s) => s.approveProposedFact);
  const rejectProposedFact = useAskStore((s) => s.rejectProposedFact);
  const fetchSubjects = useLessonStore((s) => s.fetchSubjects);

  useFocusEffect(
    useCallback(() => {
      void fetchPendingFacts();
    }, [fetchPendingFacts])
  );

  const onApprove = async (id: string) => {
    await approveProposedFact(id);
    await fetchSubjects();
  };

  const renderItem = ({ item }: { item: ProposedFact }) => (
    <View
      style={{
        backgroundColor: COLORS.bgElevated,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
      }}
    >
      <Text style={{ color: COLORS.text, fontSize: 15, fontWeight: "700", lineHeight: 22 }}>
        {item.content}
      </Text>
      {item.explanation ? (
        <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginTop: 8, lineHeight: 19 }}>
          {item.explanation}
        </Text>
      ) : null}
      {item.why_worth_learning ? (
        <Text style={{ color: COLORS.textTertiary, fontSize: 12, marginTop: 8, fontStyle: "italic" }}>
          {item.why_worth_learning}
        </Text>
      ) : null}
      <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
        <TouchableOpacity
          onPress={() => void rejectProposedFact(item.id)}
          disabled={approving}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 12,
            backgroundColor: COLORS.bgTertiary,
            alignItems: "center",
          }}
        >
          <Text style={{ color: COLORS.textSecondary, fontWeight: "700" }}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => void onApprove(item.id)}
          disabled={approving}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 12,
            backgroundColor: COLORS.primary,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>Approve</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={["bottom"]}>
      <Stack.Screen options={{ title: "Approve facts", headerBackTitle: "Ask" }} />

      {error ? (
        <Text style={{ color: COLORS.error, padding: 16 }}>{error}</Text>
      ) : null}

      {pendingCount === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
          <Ionicons name="checkmark-circle-outline" size={48} color={COLORS.success} />
          <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: "700", marginTop: 12 }}>
            Queue clear
          </Text>
          <Text style={{ color: COLORS.textSecondary, textAlign: "center", marginTop: 8 }}>
            Chat in Ask and learnable facts will show up here for approval before Practice.
          </Text>
          <TouchableOpacity
            onPress={() => router.push(`/lesson/${FROM_ASK_LESSON}`)}
            style={{ marginTop: 20, paddingHorizontal: 16, paddingVertical: 10 }}
          >
            <Text style={{ color: COLORS.primary, fontWeight: "700" }}>Open From Ask lesson</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={pendingFacts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => void fetchPendingFacts()}
              tintColor={COLORS.primary}
            />
          }
          ListHeaderComponent={
            approving ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>Updating…</Text>
              </View>
            ) : (
              <Text style={{ color: COLORS.textSecondary, marginBottom: 12, fontSize: 13 }}>
                {pendingCount} pending · approve to add to Practice
              </Text>
            )
          }
        />
      )}
    </SafeAreaView>
  );
}
