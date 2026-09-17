const STORAGE_KEY = "halo-kept-h1";

export const FIRST_HARVEST_LINE = "Kept — these come back tomorrow.";

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

export function hasSeenFirstHarvestLine(store: LineStore = memoryStore()) {
  try {
    return store.getItem(STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

/** Mark and return true the first time a real harvest lands. */
export function revealFirstHarvestLine(store: LineStore = memoryStore()) {
  if (hasSeenFirstHarvestLine(store)) return false;
  try {
    store.setItem(STORAGE_KEY, "1");
  } catch {
    return false;
  }
  return true;
}
