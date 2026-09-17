import type { HarvestChip } from "@/lib/harvest";

const STORAGE_KEY = "halo-lock-pending";
export const LOCK_IN_DELAY_MS = 720;

type PendingLock = {
  conversationId: string;
  chips: HarvestChip[];
};

function store() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readPendingLock(conversationId: string): HarvestChip[] {
  const raw = store()?.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as PendingLock;
    if (parsed.conversationId !== conversationId || !Array.isArray(parsed.chips)) {
      return [];
    }
    return parsed.chips.filter((chip) => chip?.id && chip.prompt);
  } catch {
    return [];
  }
}

export function writePendingLock(conversationId: string, chips: HarvestChip[]) {
  const mem = store();
  if (!mem) return;
  if (!chips.length) {
    mem.removeItem(STORAGE_KEY);
    return;
  }
  mem.setItem(STORAGE_KEY, JSON.stringify({ conversationId, chips }));
}

export function clearPendingLock() {
  store()?.removeItem(STORAGE_KEY);
}
