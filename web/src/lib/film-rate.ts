/** Lab film rate. Default Mix stills stay 2s. `?burst=1` or `?burst=12` → ~12 fps. */

export type AgentTake = "home" | "morph" | "return" | "roundtrip";

export function filmStillEveryMs(search = ""): number {
  const q = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const raw = q.get("burst");
  let every = 2000;
  if (raw === "1") every = 80;
  else if (raw != null && raw !== "") {
    const fps = Number(raw);
    if (Number.isFinite(fps) && fps >= 4) every = Math.round(1000 / Math.min(24, fps));
  }
  // Roundtrip is ~2× as long — don't blow the 90-still cap.
  if (q.get("take") === "roundtrip" && every < 100) return 100;
  return every;
}

export function filmCanvasWidth(innerWidth: number): number {
  if (innerWidth <= 480) return 393;
  if (innerWidth <= 720) return 720;
  return 960;
}

export function filmSnapOpts(search = "", innerWidth = 393) {
  const burst = filmStillEveryMs(search) < 500;
  return {
    quality: burst ? 0.62 : 0.55,
    pixelRatio: burst && innerWidth <= 480 ? 2 : 1,
    skipFonts: !burst,
    cacheBust: false,
    canvasWidth: filmCanvasWidth(innerWidth),
  };
}

export function parseAgentTake(search = ""): {
  take: AgentTake | null;
  q: string;
  holdMs: number;
} {
  const q = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const raw = q.get("take");
  const take: AgentTake | null =
    raw === "home" || raw === "morph" || raw === "return" || raw === "roundtrip"
      ? raw
      : null;
  const fallback = take === "roundtrip" ? 2800 : 3200;
  const hold = Number(q.get("hold") || String(fallback));
  return {
    take,
    q: (q.get("q") || "capital of France").slice(0, 200),
    holdMs: Number.isFinite(hold) ? Math.min(8000, Math.max(1200, hold)) : fallback,
  };
}

/** Named stills an agent should open first. Extra `-tick` only if a blink sits between them. */
export const AGENT_FILM_KEYS = ["start", "travel", "mid", "late", "land", "end"] as const;

export function agentKeyframeFiles(names: string[]): string[] {
  return names
    .filter((name) => AGENT_FILM_KEYS.some((key) => name.includes(`-${key}.`)))
    .sort();
}

/** Fill the visible preview composer and click Ask. Demo `/preview` morphs Home → Chat. */
export function submitPreviewAsk(text: string): boolean {
  if (typeof document === "undefined") return false;
  const root =
    document.querySelector(".ask-shell-compose") ||
    document.querySelector(".ask-hero") ||
    document.body;
  const field = root.querySelector("textarea") as HTMLTextAreaElement | null;
  if (!field) return false;
  const desc = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    "value"
  );
  desc?.set?.call(field, text);
  field.dispatchEvent(new Event("input", { bubbles: true }));
  window.setTimeout(() => {
    const form = field.closest("form");
    const btn = form?.querySelector(
      'button[type="submit"]'
    ) as HTMLButtonElement | null;
    if (btn && !btn.disabled) btn.click();
    else if (form && typeof form.requestSubmit === "function") form.requestSubmit();
  }, 40);
  return true;
}

/** Cove mark — ChatThread goHome keeps the query string, so the recorder stays mounted. */
export function submitPreviewHome(): boolean {
  if (typeof document === "undefined") return false;
  const link = document.querySelector(
    "a.brand-home, a[aria-label$=', home']"
  ) as HTMLAnchorElement | null;
  if (!link) return false;
  link.click();
  return true;
}
