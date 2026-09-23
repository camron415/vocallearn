/** Same-mint haptics + earcons. Soft / OS reduce always win. Not TTS.
 *
 *  Three weights only. Objects (chips / beads) share medium. Chrome is light.
 *  Sound only on lock-in and gold — not on every tap.
 */

export type HaloJuiceVerb =
  | "chrome"
  | "object"
  | "hold"
  | "send"
  | "mic"
  | "done"
  | "lock"
  | "gold";

export type JuiceWeight = "light" | "medium" | "success";

export const JUICE_WEIGHT: Record<HaloJuiceVerb, JuiceWeight> = {
  chrome: "light",
  send: "light",
  mic: "light",
  done: "light",
  object: "medium",
  hold: "medium",
  lock: "medium",
  gold: "success",
};

export const JUICE_SOUND: Record<HaloJuiceVerb, boolean> = {
  chrome: false,
  send: false,
  mic: false,
  done: false,
  object: false,
  hold: false,
  lock: true,
  gold: true,
};

type CapHaptics = {
  impact?: (opts: { style: string }) => Promise<void>;
  notification?: (opts: { type: string }) => Promise<void>;
};

function capHaptics(): CapHaptics | null {
  if (typeof window === "undefined") return null;
  const cap = (
    window as unknown as {
      Capacitor?: { Plugins?: { Haptics?: CapHaptics } };
    }
  ).Capacitor;
  return cap?.Plugins?.Haptics ?? null;
}

/** Soft motion, OS reduce, or SSR → no tap / no tick. */
export function juiceQuiet(): boolean {
  if (typeof document === "undefined") return true;
  if (document.documentElement.dataset.haloMotion === "soft") return true;
  if (typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* iOS Safari no-ops; ignore denied */
  }
}

async function haptic(verb: HaloJuiceVerb) {
  const plugin = capHaptics();
  const weight = JUICE_WEIGHT[verb];
  try {
    if (weight === "success") {
      if (plugin?.notification) {
        await plugin.notification({ type: "SUCCESS" });
        return;
      }
      vibrate([12, 36, 18]);
      return;
    }
    const style = weight === "medium" ? "MEDIUM" : "LIGHT";
    if (plugin?.impact) {
      await plugin.impact({ style });
      return;
    }
    vibrate(weight === "medium" ? (verb === "hold" ? 28 : 22) : 10);
  } catch {
    vibrate(
      weight === "success" ? [12, 36, 18] : weight === "medium" ? 22 : 10
    );
  }
}

function sinePcm(freq: number, ms: number, peak = 0.09) {
  const rate = 22050;
  const n = Math.max(1, Math.floor((rate * ms) / 1000));
  const samples = new Int16Array(n);
  for (let i = 0; i < n; i++) {
    const env = Math.exp((-4 * i) / n);
    samples[i] = Math.round(
      Math.sin((2 * Math.PI * freq * i) / rate) * env * peak * 32767
    );
  }
  return samples;
}

function pcmWav(samples: Int16Array, rate = 22050) {
  const bytes = samples.length * 2;
  const buffer = new ArrayBuffer(44 + bytes);
  const view = new DataView(buffer);
  const ascii = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };
  ascii(0, "RIFF");
  view.setUint32(4, 36 + bytes, true);
  ascii(8, "WAVE");
  ascii(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  ascii(36, "data");
  view.setUint32(40, bytes, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    view.setInt16(offset, samples[i], true);
  }
  const raw = new Uint8Array(buffer);
  let bin = "";
  for (let i = 0; i < raw.length; i++) bin += String.fromCharCode(raw[i]);
  return `data:audio/wav;base64,${btoa(bin)}`;
}

const EARCON = {
  lock: pcmWav(sinePcm(220, 90, 0.08)),
  gold: pcmWav(sinePcm(392, 140, 0.09)),
};

let speaker: HTMLAudioElement | null = null;

function earcon(verb: HaloJuiceVerb) {
  if (!JUICE_SOUND[verb]) return;
  if (typeof Audio === "undefined") return;
  const src = verb === "gold" ? EARCON.gold : EARCON.lock;
  try {
    if (!speaker) speaker = new Audio();
    speaker.src = src;
    speaker.volume = 0.55;
    void speaker.play().catch(() => undefined);
  } catch {
    /* autoplay / silent */
  }
}

/** Light chrome / Send / mic / done. Medium chips, beads, hold, lock-in. Success gold. */
export function haloJuice(verb: HaloJuiceVerb) {
  if (juiceQuiet()) return;
  void haptic(verb);
  earcon(verb);
}

export const HALO_JUICE = "halo-juice";

/** Composer / other lanes can fire `halo-juice` with detail `send` | `done` without importing. */
export function startHaloJuiceBridge() {
  if (typeof document === "undefined") return () => undefined;
  function onSubmit(event: Event) {
    const form = event.target;
    if (form instanceof HTMLFormElement && form.classList.contains("compose-form")) {
      haloJuice("send");
    }
  }
  function onCustom(event: Event) {
    const verb = (event as CustomEvent<unknown>).detail;
    if (typeof verb === "string" && verb in JUICE_WEIGHT) {
      haloJuice(verb as HaloJuiceVerb);
    }
  }
  document.addEventListener("submit", onSubmit, true);
  window.addEventListener(HALO_JUICE, onCustom);
  return () => {
    document.removeEventListener("submit", onSubmit, true);
    window.removeEventListener(HALO_JUICE, onCustom);
  };
}
