import type { ChatAttachment } from "@/lib/types";

type PendingTurn = {
  conversationId: string;
  response: Promise<Response>;
  abort: AbortController;
};

let pending: PendingTurn | null = null;

/** Start Grok during the Home→Chat travel so first token isn't waiting on RSC. */
export function armPendingResume(
  conversationId: string,
  attachments: ChatAttachment[]
) {
  abortPendingTurn();
  const abort = new AbortController();
  const response = fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({
      conversationId,
      resume: true,
      attachments: attachments.length ? attachments : undefined,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }),
    signal: abort.signal,
  });
  pending = { conversationId, response, abort };
}

export function takePendingResume(
  conversationId: string
): { response: Promise<Response>; abort: AbortController } | null {
  if (!pending || pending.conversationId !== conversationId) return null;
  const hit = pending;
  pending = null;
  return { response: hit.response, abort: hit.abort };
}

export function abortPendingTurn() {
  if (!pending) return;
  pending.abort.abort();
  pending = null;
}
