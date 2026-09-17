const STORAGE_KEY = "halo-home-due-h1";

export const FIRST_DUE_LINE = "Tap one to review.";

type LineStore = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

function memoryStore(): LineStore {
  if (typeof window === "undefined") {
    const map = new Map<string, string>();
    return {
      getItem: (key) => map.get(key) ?? null,
      setItem: (key, value) => {
        map.set(key, value);
      },
    };
  }
  try {
    return window.localStorage;
  } catch {
    const map = new Map<string, string>();
    return {
      getItem: (key) => map.get(key) ?? null,
      setItem: (key, value) => {
        map.set(key, value);
      },
    };
  }
}

export function hasSeenFirstDueLine(store: LineStore = memoryStore()) {
  try {
    return store.getItem(STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

/** Mark and return true the first time due chips sit on Home. */
export function revealFirstDueLine(store: LineStore = memoryStore()) {
  if (hasSeenFirstDueLine(store)) return false;
  try {
    store.setItem(STORAGE_KEY, "1");
  } catch {
    return false;
  }
  return true;
}
