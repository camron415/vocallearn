import { readHaloStream, type HaloStreamEvent } from "@/lib/halo-stream";

type PendingTurn = {
  conversationId: string;
  abort: AbortController;
  replayAndFollow: (
    onEvent: (event: HaloStreamEvent) => void,
    signal?: AbortSignal
  ) => Promise<void>;
};

let pending: PendingTurn | null = null;

/**
 * Home starts the real answer stream during travel. Chat replays whatever
 * already arrived, then follows the rest. One classify, one model call.
 */
export function armPendingStream(
  conversationId: string,
  response: Response,
  abort: AbortController
) {
  abortPendingTurn();
  const queued: HaloStreamEvent[] = [];
  const pumps = new Set<() => void>();
  let settled: { ok: true } | { ok: false; error: unknown } | null = null;
  let resolveDone: () => void = () => undefined;
  const done = new Promise<void>((resolve) => {
    resolveDone = resolve;
  });

  void readHaloStream(
    response,
    (event) => {
      queued.push(event);
      for (const pump of pumps) pump();
    },
    abort.signal
  ).then(
    () => {
      settled = { ok: true };
      resolveDone();
    },
    (error: unknown) => {
      settled = { ok: false, error };
      resolveDone();
    }
  );

  pending = {
    conversationId,
    abort,
    replayAndFollow: async (onEvent, signal) => {
      let index = 0;
      const pump = () => {
        while (index < queued.length) {
          onEvent(queued[index]);
          index += 1;
        }
      };
      pumps.add(pump);
      pump();
      const onAbort = () => pumps.delete(pump);
      signal?.addEventListener("abort", onAbort, { once: true });
      try {
        await done;
        pump();
        if (settled && !settled.ok) throw settled.error;
      } finally {
        pumps.delete(pump);
        signal?.removeEventListener("abort", onAbort);
      }
    },
  };
}

export function peekPendingResume(conversationId: string) {
  return pending?.conversationId === conversationId;
}

export function takePendingResume(
  conversationId: string
): PendingTurn | null {
  if (!pending || pending.conversationId !== conversationId) return null;
  const hit = pending;
  pending = null;
  return hit;
}

export function abortPendingTurn() {
  if (!pending) return;
  pending.abort.abort();
  pending = null;
}
