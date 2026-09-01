import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/config";
import { useAskStore } from "@/stores/ask-store";
import type { AskMessage } from "@/types/ask";

export default function AskConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const conversationId = Array.isArray(id) ? id[0] : id;

  const conversations = useAskStore((s) => s.conversations);
  const messagesByConversation = useAskStore((s) => s.messagesByConversation);
  const loadingMessages = useAskStore((s) => s.loadingMessages);
  const sending = useAskStore((s) => s.sending);
  const mining = useAskStore((s) => s.mining);
  const error = useAskStore((s) => s.error);
  const fetchMessages = useAskStore((s) => s.fetchMessages);
  const sendMessage = useAskStore((s) => s.sendMessage);

  const [draft, setDraft] = useState("");
  const listRef = useRef<FlatList<AskMessage>>(null);

  const conversation = conversations.find((c) => c.id === conversationId);
  const messages = conversationId ? messagesByConversation[conversationId] ?? [] : [];

  useEffect(() => {
    if (conversationId) void fetchMessages(conversationId);
  }, [conversationId]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [messages.length, sending]);

  const onSend = async () => {
    if (!conversationId || !draft.trim() || sending) return;
    const text = draft;
    setDraft("");
    await sendMessage(conversationId, text);
  };

  const renderMessage = ({ item }: { item: AskMessage }) => {
    const isUser = item.role === "user";
    return (
      <View
        style={{
          alignSelf: isUser ? "flex-end" : "flex-start",
          maxWidth: "86%",
          backgroundColor: isUser ? COLORS.primary : COLORS.bgElevated,
          borderRadius: 16,
          borderBottomRightRadius: isUser ? 4 : 16,
          borderBottomLeftRadius: isUser ? 16 : 4,
          paddingHorizontal: 14,
          paddingVertical: 10,
          marginBottom: 10,
        }}
      >
        <Text style={{ color: isUser ? "#fff" : COLORS.text, fontSize: 15, lineHeight: 22 }}>
          {item.content}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={["bottom"]}>
      <Stack.Screen
        options={{
          title: conversation?.title ?? "Ask",
          headerBackTitle: "Ask",
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={88}
      >
        {loadingMessages && messages.length === 0 ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={{ padding: 16, paddingBottom: 12 }}
            ListEmptyComponent={
              <Text style={{ color: COLORS.textTertiary, textAlign: "center", marginTop: 40 }}>
                Ask anything. Dictation works via the keyboard mic.
              </Text>
            }
            ListFooterComponent={
              sending || mining ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>
                    {sending ? "Thinking…" : "Mining facts…"}
                  </Text>
                </View>
              ) : null
            }
          />
        )}

        {error ? (
          <Text style={{ color: COLORS.error, paddingHorizontal: 16, marginBottom: 6, fontSize: 12 }}>
            {error}
          </Text>
        ) : null}

        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            gap: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderTopWidth: 1,
            borderTopColor: COLORS.borderLight,
            backgroundColor: COLORS.bg,
          }}
        >
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message Ask…"
            placeholderTextColor={COLORS.textTertiary}
            multiline
            style={{
              flex: 1,
              minHeight: 42,
              maxHeight: 120,
              backgroundColor: COLORS.bgElevated,
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: 10,
              color: COLORS.text,
              fontSize: 16,
              borderWidth: 1,
              borderColor: COLORS.borderLight,
            }}
          />
          <TouchableOpacity
            onPress={onSend}
            disabled={sending || !draft.trim()}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: sending || !draft.trim() ? COLORS.bgTertiary : COLORS.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
