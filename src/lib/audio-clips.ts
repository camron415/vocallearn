// Pre-cached Ara voice clips for zero-latency filler phrases.
//
// On first use each clip is downloaded from the Grok TTS API and saved to the
// device's cache directory. All subsequent plays read the local file (~50ms),
// keeping the same Ara voice throughout the lesson with no API round-trip.
//
// Usage:
//   prewarmClips()  — call once on app startup, downloads in background
//   playClip(name)  — plays instantly after prewarm; gracefully no-ops if not ready

import { Audio } from "expo-av";
import { File, Paths } from "expo-file-system";

const GROK_API_URL = process.env.EXPO_PUBLIC_GROK_API_URL || "https://api.x.ai/v1";
const GROK_API_KEY = process.env.EXPO_PUBLIC_GROK_API_KEY;

// ── Clip definitions ──────────────────────────────────────────────────────────
// ~3 seconds each at Ara's natural pace — long enough to feel like a real teacher
// pause while Grok + Ara TTS prepares the full answer in the background.

export const CLIPS = {
  // Question acknowledgment — played immediately when user asks a question
  "great-question-think":      "Great question — let me think about that for a second.",
  "good-question-explain":     "Good question — here's how I'd explain that.",
  "ooh-good-one":              "Ooh, good one — let me walk you through that.",
  "nice-question-break-down":  "Nice question — let me break that down for you.",
  "good-question-thing":       "Good question — here's the thing about that one.",
  "let-me-explain-clearly":    "Let me explain that one a bit more clearly.",
  "absolutely-clarify":        "Absolutely — let me clarify that one right now.",
  "great-lets-dig-in":         "Great question — let's dig into that a little.",

  // Don't-know fillers — played before the Grok re-explanation loads
  "no-worries-walk-through":   "No worries at all — let me walk you through that one again.",
  "thats-okay-fresh-angle":    "That's okay — let me try explaining that from a fresh angle.",
  "easy-to-mix-up":            "That one's easy to mix up — let me explain it again.",
  "no-problem-different-way":  "No problem — let me try explaining that a different way.",

  // Neutral bridging — for ambiguous inputs that aren't clearly questions
  "okay-let-me-think":         "Okay — let me think about that for a second.",
  "alright-so":                "Alright, so here's the thing.",
  "let-me-address-that":       "Let me address that real quick.",
} as const;

export type ClipName = keyof typeof CLIPS;

export const ACK_CLIPS: ClipName[] = [
  "great-question-think",
  "good-question-explain",
  "ooh-good-one",
  "nice-question-break-down",
  "good-question-thing",
  "let-me-explain-clearly",
  "absolutely-clarify",
  "great-lets-dig-in",
];

export const DONT_KNOW_CLIPS: ClipName[] = [
  "no-worries-walk-through",
  "thats-okay-fresh-angle",
  "easy-to-mix-up",
  "no-problem-different-way",
];

export const NEUTRAL_ACK_CLIPS: ClipName[] = [
  "okay-let-me-think",
  "alright-so",
  "let-me-address-that",
];

// ── Internal state ────────────────────────────────────────────────────────────

// In-memory URI map — survives re-renders, resets on full app kill
const fileCache = new Map<ClipName, string>();
// Prevents parallel downloads of the same clip
const pending = new Map<ClipName, Promise<string | null>>();

let activeClipSound: Audio.Sound | null = null;

// ── Download ──────────────────────────────────────────────────────────────────

async function downloadClip(name: ClipName): Promise<string | null> {
  if (!GROK_API_KEY || GROK_API_KEY === "your-grok-api-key-here") return null;
  try {
    const res = await fetch(`${GROK_API_URL}/tts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROK_API_KEY}`,
      },
      body: JSON.stringify({ text: CLIPS[name], voice_id: "ara", language: "en" }),
    });
    if (!res.ok) return null;

    const buf = await res.arrayBuffer();
    const file = new File(Paths.cache, `clip_${name}.mp3`);
    file.create({ overwrite: true });
    file.write(new Uint8Array(buf));
    return file.uri;
  } catch {
    return null;
  }
}

async function getClipUri(name: ClipName): Promise<string | null> {
  // In-memory hit
  if (fileCache.has(name)) return fileCache.get(name)!;
  // Already downloading
  if (pending.has(name)) return pending.get(name)!;

  // Check disk — File.exists is available in expo-file-system SDK 54
  const file = new File(Paths.cache, `clip_${name}.mp3`);
  if (file.exists) {
    fileCache.set(name, file.uri);
    return file.uri;
  }

  // Download from Grok TTS
  const p = downloadClip(name).then((uri) => {
    pending.delete(name);
    if (uri) fileCache.set(name, uri);
    return uri;
  });
  pending.set(name, p);
  return p;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Play a pre-cached Ara clip. Instant after prewarm (local file read, no API call).
 * Gracefully no-ops if the clip isn't downloaded yet — never crashes or throws.
 */
export async function playClip(name: ClipName): Promise<void> {
  const uri = await getClipUri(name);
  if (!uri) return; // Not downloaded yet — silent fallback

  // Stop any previously playing clip
  if (activeClipSound) {
    try {
      await activeClipSound.stopAsync();
      await activeClipSound.unloadAsync();
    } catch {}
    activeClipSound = null;
  }

  // Put audio session in playback mode (mirrors speakWithAra)
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: false,
    });
  } catch {}

  const { sound } = await Audio.Sound.createAsync({ uri });
  activeClipSound = sound;
  await sound.setVolumeAsync(1.0);

  return new Promise<void>((resolve) => {
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
        activeClipSound = null;
        resolve();
      }
    });
    sound.playAsync().catch(() => resolve());
  });
}

/**
 * Stop any currently playing clip. Call from session cleanup.
 */
export async function stopActiveClip(): Promise<void> {
  if (activeClipSound) {
    try {
      await activeClipSound.stopAsync();
      await activeClipSound.unloadAsync();
    } catch {}
    activeClipSound = null;
  }
}

/**
 * Fire-and-forget background download of all clips.
 * Call once on app startup. After this completes, all playClip() calls are instant.
 */
export function prewarmClips(): void {
  (Object.keys(CLIPS) as ClipName[]).forEach((name) => {
    getClipUri(name).catch(() => {});
  });
}
