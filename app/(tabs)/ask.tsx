import { useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/config";
import { useAskStore } from "@/stores/ask-store";
import type { AskConversation } from "@/types/ask";

function formatUpdatedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AskTabScreen() {
  const router = useRouter();
  const conversations = useAskStore((s) => s.conversations);
  const pendingCount = useAskStore((s) => s.pendingCount);
  const loadingConversations = useAskStore((s) => s.loadingConversations);
  const error = useAskStore((s) => s.error);
  const fetchConversations = useAskStore((s) => s.fetchConversations);
  const fetchPendingFacts = useAskStore((s) => s.fetchPendingFacts);
  const createConversation = useAskStore((s) => s.createConversation);

  useFocusEffect(
    useCallback(() => {
      void fetchConversations();
      void fetchPendingFacts();
    }, [fetchConversations, fetchPendingFacts])
  );

  useEffect(() => {
    void fetchConversations();
    void fetchPendingFacts();
  }, []);

  const onNewChat = async () => {
    const id = await createConversation();
    if (id) router.push(`/ask/${id}`);
  };

  const renderItem = ({ item }: { item: AskConversation }) => (
    <TouchableOpacity
      onPress={() => router.push(`/ask/${item.id}`)}
      activeOpacity={0.7}
      style={{
        backgroundColor: COLORS.bgElevated,
        borderRadius: 14,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
      }}
    >
      <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: "700" }} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={{ color: COLORS.textTertiary, fontSize: 12, marginTop: 6 }}>
        {formatUpdatedAt(item.updated_at)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={["top"]}>
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 12,
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: COLORS.text, fontSize: 28, fontWeight: "800", letterSpacing: -0.5 }}>
            Ask
          </Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginTop: 2 }}>
            Type or dictate. Facts go to Practice after you approve.
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/ask/approvals")}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{
            flexShrink: 0,
            marginTop: 4,
            backgroundColor: pendingCount > 0 ? COLORS.primaryMuted : COLORS.bgElevated,
            borderRadius: 999,
            paddingHorizontal: 12,
            paddingVertical: 8,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            borderWidth: 1,
            borderColor: pendingCount > 0 ? COLORS.primary : COLORS.borderLight,
          }}
        >
          <Ionicons name="checkbox-outline" size={16} color={pendingCount > 0 ? COLORS.primary : COLORS.textSecondary} />
          <Text style={{ color: pendingCount > 0 ? COLORS.primary : COLORS.textSecondary, fontWeight: "700", fontSize: 13 }}>
            {pendingCount}
          </Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <Text style={{ color: COLORS.error, paddingHorizontal: 20, marginBottom: 8 }}>{error}</Text>
      ) : null}

      {loadingConversations && conversations.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={loadingConversations}
              onRefresh={() => {
                void fetchConversations();
                void fetchPendingFacts();
              }}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={{ paddingTop: 48, alignItems: "center" }}>
              <Ionicons name="chatbubble-ellipses-outline" size={40} color={COLORS.textTertiary} />
              <Text style={{ color: COLORS.textSecondary, marginTop: 12, textAlign: "center", paddingHorizontal: 24 }}>
                Start a chat. After each answer, learnable facts may appear for approval.
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        onPress={onNewChat}
        activeOpacity={0.85}
        style={{
          position: "absolute",
          right: 20,
          bottom: 24,
          backgroundColor: COLORS.primary,
          borderRadius: 28,
          width: 56,
          height: 56,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
        }}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
