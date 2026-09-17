import type { AskIntent, ClassifyOptions } from "@/lib/ask-intent";
import { classifyAskIntent } from "@/lib/ask-intent";

const TTL_MS = 120_000;
const plans = new Map<string, Promise<AskIntent>>();

function cacheKey(userId: string, conversationId: string, userText: string) {
  return `${userId}:${conversationId}:${userText.trim().slice(0, 400)}`;
}

/** One classify flight per user turn — shared by prepareOnly and resume stream. */
export function ensureAskClassify(
  userId: string,
  conversationId: string,
  userText: string,
  options?: ClassifyOptions
): Promise<AskIntent> {
  const key = cacheKey(userId, conversationId, userText);
  const existing = plans.get(key);
  if (existing) return existing;

  const promise = classifyAskIntent(userText, options).finally(() => {
    setTimeout(() => {
      if (plans.get(key) === promise) plans.delete(key);
    }, TTL_MS);
  });
  plans.set(key, promise);
  return promise;
}

export function clearAskClassifyCacheForTests() {
  plans.clear();
}
