import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { callGrok, type GrokMessage } from "@/lib/grok";
import { ASK_SYSTEM_PROMPT } from "@/constants/ask";
import { isLikelyDuplicate, mineFactsFromMessages } from "@/engine/fact-miner";
import { stripMarkdownForDisplay } from "@/utils/markdown-plain";
import {
  FROM_ASK_LESSON_ID,
  FROM_ASK_SUBJECT_ID,
  type AskConversation,
  type AskMessage,
  type ProposedFact,
} from "@/types/ask";

interface AskState {
  conversations: AskConversation[];
  messagesByConversation: Record<string, AskMessage[]>;
  pendingFacts: ProposedFact[];
  pendingCount: number;
  loadingConversations: boolean;
  loadingMessages: boolean;
  sending: boolean;
  mining: boolean;
  approving: boolean;
  error: string | null;

  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  fetchPendingFacts: () => Promise<void>;
  createConversation: () => Promise<string | null>;
  sendMessage: (conversationId: string, text: string) => Promise<void>;
  approveProposedFact: (proposedId: string) => Promise<void>;
  rejectProposedFact: (proposedId: string) => Promise<void>;
}

function titleFromFirstMessage(text: string): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return "New chat";
  return cleaned.length > 48 ? `${cleaned.slice(0, 45)}…` : cleaned;
}

async function loadExistingFactContents(): Promise<string[]> {
  const { data: facts } = await supabase.from("facts").select("content").limit(2000);
  const { data: pending } = await supabase
    .from("proposed_facts")
    .select("content")
    .in("status", ["pending", "approved"]);

  return [
    ...(facts ?? []).map((f) => f.content as string),
    ...(pending ?? []).map((f) => f.content as string),
  ].filter(Boolean);
}

export const useAskStore = create<AskState>((set, get) => ({
  conversations: [],
  messagesByConversation: {},
  pendingFacts: [],
  pendingCount: 0,
  loadingConversations: false,
  loadingMessages: false,
  sending: false,
  mining: false,
  approving: false,
  error: null,

  fetchConversations: async () => {
    set({ loadingConversations: true, error: null });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        set({ conversations: [], loadingConversations: false });
        return;
      }

      const { data, error } = await supabase
        .from("ask_conversations")
        .select("*")
        .eq("user_id", session.user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      set({ conversations: (data ?? []) as AskConversation[], loadingConversations: false });
    } catch (e: any) {
      set({ error: e.message ?? "Failed to load chats", loadingConversations: false });
    }
  },

  fetchMessages: async (conversationId) => {
    set({ loadingMessages: true, error: null });
    try {
      const { data, error } = await supabase
        .from("ask_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      set((state) => ({
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: (data ?? []) as AskMessage[],
        },
        loadingMessages: false,
      }));
    } catch (e: any) {
      set({ error: e.message ?? "Failed to load messages", loadingMessages: false });
    }
  },

  fetchPendingFacts: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        set({ pendingFacts: [], pendingCount: 0 });
        return;
      }

      const { data, error } = await supabase
        .from("proposed_facts")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      const pending = (data ?? []) as ProposedFact[];
      set({ pendingFacts: pending, pendingCount: pending.length });
    } catch (e: any) {
      set({ error: e.message ?? "Failed to load proposed facts" });
    }
  },

  createConversation: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not signed in");

      const { data, error } = await supabase
        .from("ask_conversations")
        .insert({
          user_id: session.user.id,
          title: "New chat",
        })
        .select("*")
        .single();

      if (error) throw error;
      const conversation = data as AskConversation;
      set((state) => ({
        conversations: [conversation, ...state.conversations],
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversation.id]: [],
        },
      }));
      return conversation.id;
    } catch (e: any) {
      set({ error: e.message ?? "Failed to create chat" });
      return null;
    }
  },

  sendMessage: async (conversationId, text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    set({ sending: true, error: null });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not signed in");

      const { data: userRow, error: userErr } = await supabase
        .from("ask_messages")
        .insert({
          conversation_id: conversationId,
          role: "user",
          content: trimmed,
        })
        .select("*")
        .single();
      if (userErr) throw userErr;

      const existing = get().messagesByConversation[conversationId] ?? [];
      const withUser = [...existing, userRow as AskMessage];
      set((state) => ({
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: withUser,
        },
      }));

      // Title from first user message
      if (existing.filter((m) => m.role === "user").length === 0) {
        const title = titleFromFirstMessage(trimmed);
        await supabase
          .from("ask_conversations")
          .update({ title, updated_at: new Date().toISOString() })
          .eq("id", conversationId);
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId ? { ...c, title, updated_at: new Date().toISOString() } : c
          ),
        }));
      }

      const historyForModel: GrokMessage[] = [
        { role: "system", content: ASK_SYSTEM_PROMPT },
        ...withUser
          .filter((m) => m.role === "user" || m.role === "assistant")
          .slice(-20)
          .map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      ];

      const grok = await callGrok(historyForModel, {
        temperature: 0.6,
        maxTokens: 1200,
        timeoutMs: 45000,
      });

      const { data: assistantRow, error: assistantErr } = await supabase
        .from("ask_messages")
        .insert({
          conversation_id: conversationId,
          role: "assistant",
          content: stripMarkdownForDisplay(
            grok.content.trim() || "Sorry — I couldn't generate a reply."
          ),
        })
        .select("*")
        .single();
      if (assistantErr) throw assistantErr;

      const withAssistant = [...withUser, assistantRow as AskMessage];
      set((state) => ({
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: withAssistant,
        },
        sending: false,
      }));

      await supabase
        .from("ask_conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);

      // Always-on miner (non-blocking for UX; await so errors surface lightly)
      set({ mining: true });
      try {
        const candidates = await mineFactsFromMessages(withAssistant);
        if (candidates.length > 0) {
          const existingContents = await loadExistingFactContents();
          const rows = candidates
            .filter((c) => !isLikelyDuplicate(c.content, existingContents))
            .map((c) => ({
              user_id: session.user.id,
              source_conversation_id: conversationId,
              source_message_id: (assistantRow as AskMessage).id,
              content: c.content,
              explanation: c.explanation,
              tags: c.tags,
              why_worth_learning: c.why_worth_learning,
              confidence: c.confidence,
              status: "pending" as const,
            }));

          if (rows.length > 0) {
            const { error: insertErr } = await supabase.from("proposed_facts").insert(rows);
            if (insertErr) throw insertErr;
            await get().fetchPendingFacts();
          }
        }
      } catch (mineErr) {
        console.warn("Fact mining failed:", mineErr);
      } finally {
        set({ mining: false });
      }
    } catch (e: any) {
      set({ sending: false, mining: false, error: e.message ?? "Failed to send message" });
    }
  },

  approveProposedFact: async (proposedId) => {
    set({ approving: true, error: null });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not signed in");

      const pending = get().pendingFacts.find((f) => f.id === proposedId);
      if (!pending) throw new Error("Proposed fact not found");

      // Ensure From Ask lesson exists (seeded by SQL); get next order_index
      const { data: existingFacts } = await supabase
        .from("facts")
        .select("order_index")
        .eq("lesson_id", FROM_ASK_LESSON_ID)
        .order("order_index", { ascending: false })
        .limit(1);

      const nextIndex = (existingFacts?.[0]?.order_index ?? 0) + 1;

      const { data: factRow, error: factErr } = await supabase
        .from("facts")
        .insert({
          lesson_id: FROM_ASK_LESSON_ID,
          content: pending.content,
          explanation: pending.explanation,
          strictness: "medium",
          order_index: nextIndex,
          tags: pending.tags,
        })
        .select("id")
        .single();

      if (factErr) throw factErr;

      const { error: updateErr } = await supabase
        .from("proposed_facts")
        .update({
          status: "approved",
          approved_fact_id: factRow.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", proposedId)
        .eq("user_id", session.user.id);

      if (updateErr) throw updateErr;

      // Touch subject so it shows for this user context (created_by optional)
      await supabase
        .from("subjects")
        .update({ created_by: session.user.id })
        .eq("id", FROM_ASK_SUBJECT_ID)
        .is("created_by", null);

      await get().fetchPendingFacts();
      set({ approving: false });
    } catch (e: any) {
      set({ approving: false, error: e.message ?? "Failed to approve fact" });
    }
  },

  rejectProposedFact: async (proposedId) => {
    set({ approving: true, error: null });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not signed in");

      const { error } = await supabase
        .from("proposed_facts")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", proposedId)
        .eq("user_id", session.user.id);

      if (error) throw error;
      await get().fetchPendingFacts();
      set({ approving: false });
    } catch (e: any) {
      set({ approving: false, error: e.message ?? "Failed to reject fact" });
    }
  },
}));
