import type { HarvestLockChipLog } from "@/lib/harvest-lock";

export type HarvestLockReport = {
  conversationId: string;
  walkAway?: boolean;
  chips: HarvestLockChipLog[];
};

export function harvestLockEventMeta(report: HarvestLockReport) {
  const dropped = report.chips.filter((chip) => chip.outcome === "drop").length;
  return {
    conversationId: report.conversationId,
    walkAway: Boolean(report.walkAway),
    claimed: report.chips.filter((chip) => chip.outcome === "claimed").length,
    skipped: report.chips.filter((chip) => chip.outcome === "skip").length,
    dropped,
    reject: dropped > 0,
    chips: JSON.stringify(
      report.chips.slice(0, 8).map((chip) => ({
        ...chip,
        token: chip.token.slice(0, 120),
        prompt: chip.prompt.slice(0, 160),
      }))
    ),
  };
}

/** Best-effort. Lock-in lives on the client; never block Keep on analytics. */
export function reportHarvestLock(report: HarvestLockReport) {
  if (typeof window === "undefined") return;
  if (!report.conversationId || !report.chips.length) return;
  void fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kind: "harvest_lock",
      meta: harvestLockEventMeta(report),
    }),
  }).catch(() => undefined);
}
