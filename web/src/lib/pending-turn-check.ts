import { encodeHaloEvent, type HaloStreamEvent } from "@/lib/halo-stream";
import {
  abortPendingTurn,
  armPendingStream,
  takePendingResume,
} from "@/lib/pending-turn";

function fail(failures: string[], message: string) {
  failures.push(message);
}

function sseResponse(events: HaloStreamEvent[]): Response {
  const body = events.map((event) => encodeHaloEvent(event)).join("");
  return new Response(body, {
    headers: { "Content-Type": "text/event-stream; charset=utf-8" },
  });
}

export async function runPendingTurnFixtures(): Promise<{
  ok: boolean;
  failures: string[];
}> {
  const failures: string[] = [];
  abortPendingTurn();

  const abort = new AbortController();
  const conversationId = "conv-pending-1";
  const reply = {
    id: "a1",
    conversation_id: conversationId,
    role: "assistant" as const,
    content: "Jupiter",
    created_at: new Date().toISOString(),
  };
  armPendingStream(
    conversationId,
    sseResponse([
      { type: "status", status: "checking" },
      { type: "delta", text: "Jupiter" },
      { type: "done", conversationId, reply },
    ]),
    abort
  );

  const pending = takePendingResume(conversationId);
  if (!pending) {
    fail(failures, "takePendingResume should return the armed stream");
    return { ok: false, failures };
  }
  if (takePendingResume(conversationId)) {
    fail(failures, "takePendingResume should be single-use");
  }

  const seen: string[] = [];
  await pending.replayAndFollow((event) => {
    seen.push(event.type);
  });
  if (seen.join(",") !== "status,delta,done") {
    fail(failures, `replay should keep event order, got ${seen.join(",")}`);
  }

  abortPendingTurn();
  return { ok: failures.length === 0, failures };
}
