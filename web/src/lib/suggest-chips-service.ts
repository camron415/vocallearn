import { generateSuggestChips, type ChatSignal } from "@/lib/suggest-chips-ai";
import {
  STARTERS,
  suggestChips,
  type SuggestChip,
} from "@/lib/suggest-chips";
import { trackHaloEvent } from "@/lib/track";
import type { AskConversation } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

const MIN_CHATS = 8;
const REFRESH_DAYS = 7;
const NEW_CHAT_TRIGGER = 3;
const MAX_GENERATIONS_PER_MONTH = 4;
const SUGGEST_CACHE_VERSION = 3;
const PERSONALIZE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

type CachedSuggest = {
  chips: SuggestChip[];
  at: string | null;
  chatCount: number;
};

function daysAgo(days: number) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  return since;
}

function parseCached(
  chips: unknown,
  at: string | null,
  chatCount: number | null
): CachedSuggest | null {
  let version = 1;
  let rows: unknown = chips;
  if (chips && typeof chips === "object" && !Array.isArray(chips)) {
    const rec = chips as Record<string, unknown>;
    version = Number(rec.v) || 0;
    rows = rec.chips;
  }
  if (version !== SUGGEST_CACHE_VERSION) return null;
  if (!Array.isArray(rows) || rows.length < 4) return null;
  const parsed: SuggestChip[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const rec = row as Record<string, unknown>;
    const label = String(rec.label ?? "").trim();
    const prompt = String(rec.prompt ?? "").trim();
    const id = String(rec.id ?? `c${parsed.length}`);
    if (label.length < 8 || prompt.length < 12) continue;
    parsed.push({ id, label, prompt });
  }
  if (parsed.length < 4) return null;
  return { chips: parsed.slice(0, 6), at, chatCount: chatCount ?? 0 };
}

function canPersonalize(conversations: AskConversation[]) {
  if (conversations.length < MIN_CHATS) return false;
  const byCreated = [...conversations].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const eighth = byCreated[MIN_CHATS - 1];
  const started = new Date(eighth.created_at).getTime();
  if (!Number.isFinite(started)) return false;
  return Date.now() - started >= PERSONALIZE_AFTER_MS;
}

function needsRefresh(cache: CachedSuggest | null, chatCount: number) {
  if (chatCount < MIN_CHATS) return false;
  if (!cache?.at) return true;
  const ageMs = Date.now() - new Date(cache.at).getTime();
  const stale = ageMs > REFRESH_DAYS * 24 * 60 * 60 * 1000;
  const newChats = chatCount - cache.chatCount;
  return stale || newChats >= NEW_CHAT_TRIGGER;
}

async function suggestGenerationsThisMonth(
  supabase: SupabaseClient,
  userId: string
) {
  const { count, error } = await supabase
    .from("halo_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("kind", "suggest")
    .gte("created_at", daysAgo(30).toISOString());
  if (error) return 0;
  return count ?? 0;
}

async function loadChatSignals(
  supabase: SupabaseClient,
  userId: string,
  conversations: AskConversation[]
): Promise<ChatSignal[]> {
  const recent = conversations.slice(0, 12);
  const ids = recent.map((c) => c.id);
  if (!ids.length) return [];

  const { data: messages } = await supabase
    .from("ask_messages")
    .select("conversation_id, content, created_at")
    .in("conversation_id", ids)
    .eq("role", "user")
    .order("created_at", { ascending: true });

  const firstByConvo = new Map<string, string>();
  for (const row of messages ?? []) {
    if (!firstByConvo.has(row.conversation_id)) {
      firstByConvo.set(row.conversation_id, String(row.content ?? ""));
    }
  }

  return recent.map((convo) => ({
    title: convo.title,
    question:
      firstByConvo.get(convo.id)?.replace(/\s+/g, " ").trim() ||
      convo.title,
  }));
}

async function cacheReady(supabase: SupabaseClient, userId: string) {
  const { error } = await supabase
    .from("profiles")
    .select("halo_suggest_at")
    .eq("id", userId)
    .maybeSingle();
  return !error;
}

async function loadCached(
  supabase: SupabaseClient,
  userId: string
): Promise<CachedSuggest | null> {
  const { data } = await supabase
    .from("profiles")
    .select("halo_suggest_chips, halo_suggest_at, halo_suggest_chat_count")
    .eq("id", userId)
    .maybeSingle();

  return parseCached(
    data?.halo_suggest_chips,
    data?.halo_suggest_at ?? null,
    data?.halo_suggest_chat_count ?? null
  );
}

async function saveCached(
  supabase: SupabaseClient,
  userId: string,
  chips: SuggestChip[],
  chatCount: number
) {
  const { error } = await supabase
    .from("profiles")
    .update({
      halo_suggest_chips: { v: SUGGEST_CACHE_VERSION, chips },
      halo_suggest_at: new Date().toISOString(),
      halo_suggest_chat_count: chatCount,
    })
    .eq("id", userId);
  return !error;
}

function padToSix(chips: SuggestChip[], titles: string[]): SuggestChip[] {
  if (chips.length >= 6) return chips.slice(0, 6);
  const used = new Set(chips.map((c) => c.label.toLowerCase()));
  const fill = suggestChips(titles).filter(
    (c) => !used.has(c.label.toLowerCase())
  );
  return [...chips, ...fill].slice(0, 6).map((chip, i) => ({
    ...chip,
    id: chip.id || `p${i}`,
  }));
}

/** Server-side chips: cached AI, refresh on a timer, heuristic fallback. */
export async function resolveSuggestChips(
  supabase: SupabaseClient,
  userId: string,
  displayName: string,
  conversations: AskConversation[]
): Promise<SuggestChip[]> {
  const titles = conversations.map((c) => c.title);
  const chatCount = conversations.length;

  if (!canPersonalize(conversations)) {
    return STARTERS;
  }

  const canCache = await cacheReady(supabase, userId);
  const cached = canCache ? await loadCached(supabase, userId) : null;
  if (cached && !needsRefresh(cached, chatCount)) {
    return cached.chips;
  }

  if (!canCache) {
    return suggestChips(titles);
  }

  const generations = await suggestGenerationsThisMonth(supabase, userId);
  const overBudget = generations >= MAX_GENERATIONS_PER_MONTH;
  if (overBudget && cached) {
    return cached.chips;
  }

  const signals = await loadChatSignals(supabase, userId, conversations);
  const generated = await generateSuggestChips(displayName, signals);

  if (generated) {
    const chips = padToSix(generated.chips, titles);
    await saveCached(supabase, userId, chips, chatCount);
    await trackHaloEvent(supabase, userId, "suggest", {
      costMicros: generated.costMicros,
      inputTokens: generated.inputTokens,
      outputTokens: generated.outputTokens,
      chatCount,
    });
    return chips;
  }

  if (cached) return cached.chips;
  return suggestChips(titles);
}
