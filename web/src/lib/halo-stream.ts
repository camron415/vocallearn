import type { AskMessage } from "@/lib/types";
import type { HarvestChip } from "@/lib/harvest";

export type HaloWorkStatus = "searching" | "reading" | "checking";

export type HaloStreamEvent =
  | { type: "status"; status: HaloWorkStatus; detail?: string }
  | { type: "thinking"; text: string }
  | { type: "delta"; text: string }
  | { type: "done"; conversationId: string; reply: AskMessage }
  | { type: "harvest"; chips: HarvestChip[] }
  | { type: "saveOffer"; kind: "recipe"; messageId: string }
  | { type: "error"; error: string };

export function encodeHaloEvent(event: HaloStreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function readHaloStream(
  response: Response,
  onEvent: (event: HaloStreamEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  if (!response.body) {
    throw new Error("No response body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const abort = () => {
    void reader.cancel().catch(() => undefined);
  };
  signal?.addEventListener("abort", abort, { once: true });

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split("\n\n");
      buffer = chunks.pop() ?? "";
      for (const chunk of chunks) {
        const event = parseSseChunk(chunk);
        if (event) onEvent(event);
      }
    }
    const tail = parseSseChunk(buffer);
    if (tail) onEvent(tail);
  } finally {
    signal?.removeEventListener("abort", abort);
  }
}

function parseSseChunk(chunk: string): HaloStreamEvent | null {
  const data = chunk
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart())
    .join("\n")
    .trim();
  if (!data || data === "[DONE]") return null;
  try {
    const parsed = JSON.parse(data) as HaloStreamEvent;
    if (!parsed || typeof parsed !== "object" || !("type" in parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
