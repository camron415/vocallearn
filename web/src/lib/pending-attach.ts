import type { ChatAttachment } from "@/lib/types";

function key(id: string) {
  return `halo-ask-files:${id}`;
}

/** Home Ask uses prepareOnly, then Chat resume. Files have to ride along. */
export function stashAskAttachments(id: string, files: ChatAttachment[]) {
  if (!id || !files.length) return;
  try {
    sessionStorage.setItem(key(id), JSON.stringify(files));
  } catch {
    /* quota / private browsing — resume will send text only */
  }
}

export function peekAskAttachments(id: string): ChatAttachment[] {
  try {
    const raw = sessionStorage.getItem(key(id));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (row): row is ChatAttachment =>
        Boolean(row) &&
        typeof row === "object" &&
        typeof (row as ChatAttachment).name === "string" &&
        typeof (row as ChatAttachment).data === "string"
    );
  } catch {
    return [];
  }
}

export function clearAskAttachments(id: string) {
  try {
    sessionStorage.removeItem(key(id));
  } catch {
    /* private browsing */
  }
}
