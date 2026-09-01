import {
  applyKeepCloudPayload,
  attachKeepCloudPush,
  keepStateIsEmpty,
  markKeepCloudSynced,
  parseKeepCloudPayload,
  snapshotKeepState,
} from "@/lib/keep-memory";

const PUSH_MS = 500;

let started = false;
let pushTimer = 0;
let pushing = false;
let pulling = false;

function scheduleKeepPush() {
  if (typeof window === "undefined") return;
  window.clearTimeout(pushTimer);
  pushTimer = window.setTimeout(() => {
    void pushKeep();
  }, PUSH_MS);
}

async function pullKeep() {
  if (typeof window === "undefined" || pulling) return;
  pulling = true;
  try {
    const res = await fetch("/api/keep", { credentials: "include" });
    if (res.status === 401) return;
    if (!res.ok) return;
    const data = (await res.json()) as {
      payload?: unknown;
      updatedAt?: string | null;
    };
    const remoteAt = data.updatedAt ? Date.parse(data.updatedAt) : 0;
    const parsed = data.payload ? parseKeepCloudPayload(data.payload) : null;
    const local = snapshotKeepState();
    if (!parsed || !remoteAt) {
      if (!keepStateIsEmpty()) scheduleKeepPush();
      return;
    }
    if (remoteAt > local.updatedAt) {
      applyKeepCloudPayload(parsed, remoteAt);
      return;
    }
    if (local.updatedAt > remoteAt) scheduleKeepPush();
  } catch {
    /* offline / table missing */
  } finally {
    pulling = false;
  }
}

async function pushKeep() {
  if (typeof window === "undefined" || pushing) return;
  const { payload, updatedAt } = snapshotKeepState();
  if (keepStateIsEmpty() && updatedAt === 0) return;
  pushing = true;
  try {
    const res = await fetch("/api/keep", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload, updatedAt }),
    });
    if (res.status === 401) return;
    if (!res.ok) return;
    const data = (await res.json()) as {
      payload?: unknown;
      updatedAt?: string | null;
      won?: boolean;
    };
    const remoteAt = data.updatedAt ? Date.parse(data.updatedAt) : 0;
    const parsed = data.payload ? parseKeepCloudPayload(data.payload) : null;
    if (data.won === false && parsed && remoteAt) {
      applyKeepCloudPayload(parsed, remoteAt);
    } else if (remoteAt) {
      markKeepCloudSynced(remoteAt);
    }
  } catch {
    /* offline / table missing */
  } finally {
    pushing = false;
  }
}

/** Pull on load/focus; debounce PUT after local persist. Skip preview/demo. */
export function startKeepCloudSync(opts?: { skip?: boolean }) {
  if (typeof window === "undefined" || started) return;
  if (opts?.skip) return;
  started = true;
  attachKeepCloudPush(scheduleKeepPush);
  void pullKeep();
  window.addEventListener("focus", () => {
    void pullKeep();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void pullKeep();
  });
  window.addEventListener("online", () => {
    void pullKeep();
  });
}
