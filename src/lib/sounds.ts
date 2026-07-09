// UI sound effects for VocalLearn — short chime sounds for answer feedback,
// mic activation, and session completion.
//
// All sounds are bundled WAV assets (assets/sounds/*.wav) loaded at session
// init and played instantly from memory — no file I/O during the session.
//
// Usage:
//   await initSounds()            — call once when session starts
//   playSound("correct")          — fire-and-forget, never throws
//   cleanupSounds()               — call on session unmount

import { Audio } from "expo-av";

export type SoundName = "correct" | "perfect" | "wrong" | "mic_open" | "session_complete";

const SOUND_FILES: Record<SoundName, number> = {
  correct:          require("../../assets/sounds/correct.wav"),
  perfect:          require("../../assets/sounds/perfect.wav"),
  wrong:            require("../../assets/sounds/wrong.wav"),
  mic_open:         require("../../assets/sounds/mic_open.wav"),
  session_complete: require("../../assets/sounds/session_complete.wav"),
};

const loaded = new Map<SoundName, Audio.Sound>();

/**
 * Pre-load all UI sounds into memory. Call once at session start.
 * Errors are swallowed — sounds are an enhancement, never a hard dependency.
 */
export async function initSounds(): Promise<void> {
  for (const [name, file] of Object.entries(SOUND_FILES) as [SoundName, number][]) {
    try {
      const { sound } = await Audio.Sound.createAsync(file, { shouldPlay: false });
      loaded.set(name, sound);
    } catch {
      // Missing file or device restriction — skip silently
    }
  }
}

/**
 * Play a UI sound. Fire-and-forget — never throws.
 * Rewinds to the start so rapid repeats (e.g. two quick correct answers) always
 * play the full chime without waiting for the previous one to finish.
 */
export async function playSound(name: SoundName): Promise<void> {
  const sound = loaded.get(name);
  if (!sound) return;
  try {
    await sound.setPositionAsync(0);
    await sound.setVolumeAsync(0.85);
    await sound.playAsync();
  } catch {
    // Swallow — never interrupt the session for a sound failure
  }
}

/**
 * Unload all sounds from memory. Call when the session screen unmounts.
 */
export async function cleanupSounds(): Promise<void> {
  for (const sound of loaded.values()) {
    try { await sound.unloadAsync(); } catch {}
  }
  loaded.clear();
}
