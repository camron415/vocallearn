// Voice engine — xAI Ara TTS + expo-speech-recognition STT
import { Audio } from "expo-av";
import { File, Paths } from "expo-file-system";
import * as Speech from "expo-speech";
import { Platform } from "react-native";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import type { LessonPace } from "@/stores/settings-store";

const GROK_API_URL =
  process.env.EXPO_PUBLIC_GROK_API_URL || "https://api.x.ai/v1";
const GROK_API_KEY = process.env.EXPO_PUBLIC_GROK_API_KEY;

let currentSound: Audio.Sound | null = null;
let currentTempFile: File | null = null;
let isSpeakingNow = false;
let backgroundAudioActive = false;
let lessonPace: LessonPace = "standard";
// Resolve handle for the current speakWithAra Promise — called by stopSpeaking()
// so that interrupting audio (e.g. at session transitions) always unblocks the awaiter.
// Without this, stopAsync() does NOT fire didJustFinish, leaving the Promise hanging.
let resolveCurrentSpeak: (() => void) | null = null;
let abortCurrentStreamPlayback: (() => void) | null = null;

// Optional name substitution: displayName → ttsName applied before any TTS call
// so the voice says e.g. "Cameron" while the screen shows "Camron"
let nameSub: { from: RegExp; to: string } | null = null;

/**
 * Set a pronunciation substitution for the user's name.
 * Called once at profile load. Pass matching strings to clear it.
 */
export function setNamePronunciation(displayName: string, ttsName: string): void {
  const trimFrom = displayName.trim();
  const trimTo = ttsName.trim();
  if (trimFrom && trimTo && trimFrom.toLowerCase() !== trimTo.toLowerCase()) {
    nameSub = {
      from: new RegExp(`\\b${trimFrom.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi"),
      to: trimTo,
    };
  } else {
    nameSub = null;
  }
}

function applyNameSub(text: string): string {
  return nameSub ? text.replace(nameSub.from, nameSub.to) : text;
}

// Pre-fetched audio cache: text → promise of prepared (but not yet playing) audio
type CachedAudio = { sound: Audio.Sound; file: File };
const prefetchCache = new Map<string, Promise<CachedAudio>>();

type StreamingPcmPlayback = {
  appendBase64Chunk: (base64Chunk: string) => void;
  finish: () => Promise<void>;
  completion: Promise<void>;
};

const BASE64_LOOKUP = (() => {
  const table = new Int16Array(256).fill(-1);
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  for (let i = 0; i < alphabet.length; i++) {
    table[alphabet.charCodeAt(i)] = i;
  }
  table["=".charCodeAt(0)] = 0;
  return table;
})();

/**
 * Enable or disable background audio mode.
 * When enabled, audio session stays active when app is backgrounded.
 */
export function setBackgroundAudio(enabled: boolean): void {
  backgroundAudioActive = enabled;
}

export function setLessonPace(pace: LessonPace): void {
  lessonPace = pace;
}

function getAudioPlaybackRate(): number {
  return lessonPace === "slower" ? 0.9 : 1;
}

function getExpoSpeechRate(): number {
  return lessonPace === "slower" ? 0.82 : 0.9;
}

function sanitizeContextualStrings(contextualStrings?: string[]): string[] | undefined {
  if (!contextualStrings?.length) return undefined;

  const cleaned = Array.from(
    new Set(
      contextualStrings
        .map((value) => value.trim())
        .filter((value) => value.length > 1)
    )
  ).slice(0, 12);

  return cleaned.length > 0 ? cleaned : undefined;
}

function stopRecognitionSession(): void {
  try {
    ExpoSpeechRecognitionModule.stop();
  } catch {}
}

/**
 * Speak text using xAI Ara voice, falling back to expo-speech.
 */
export async function speak(text: string, onPlaybackStart?: (latencyMs: number) => void): Promise<void> {
  const ttsText = applyNameSub(text);
  const t0 = Date.now();
  // Prevent overlapping speech
  if (isSpeakingNow) {
    await stopSpeaking();
  }
  stopRecognitionSession();
  isSpeakingNow = true;

  try {
    if (GROK_API_KEY && GROK_API_KEY !== "your-grok-api-key-here") {
      try {
        await speakWithAra(ttsText, () => onPlaybackStart?.(Date.now() - t0));
        return;
      } catch (e) {
        console.warn("Ara TTS failed, using fallback:", e);
      }
    }
    onPlaybackStart?.(Date.now() - t0); // expo-speech starts near-instantly
    await speakWithExpo(ttsText);
    // Reset audio session after expo-speech — it leaves the iOS session in a state
    // that prevents Ara from routing through the speaker on subsequent calls.
    await resetAudioForPlayback();
  } finally {
    isSpeakingNow = false;
  }
}

/**
 * Speak a short phrase immediately using device TTS (expo-speech).
 * Starts in ~100ms with zero API latency — use for acknowledgment fillers
 * like "Great question" where instant response is more important than voice quality.
 */
export async function speakImmediate(text: string): Promise<void> {
  const ttsText = applyNameSub(text);
  if (isSpeakingNow) await stopSpeaking();
  stopRecognitionSession();
  isSpeakingNow = true;
  try {
    await speakWithExpo(ttsText);
  } finally {
    isSpeakingNow = false;
  }
}

// Fetches TTS audio from Grok API and returns a ready-to-play Sound object.
// Does NOT touch the audio session — session setup happens right before playback.
async function fetchAudio(text: string): Promise<CachedAudio> {
  const res = await fetch(`${GROK_API_URL}/tts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROK_API_KEY}`,
    },
    body: JSON.stringify({ text, voice_id: "ara", language: "en" }),
  });

  if (!res.ok) throw new Error(`TTS ${res.status}`);

  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);

  const file = new File(Paths.cache, `tts_${Date.now()}.mp3`);
  file.create({ overwrite: true });
  file.write(bytes);

  const { sound } = await Audio.Sound.createAsync({ uri: file.uri });
  await sound.setVolumeAsync(1.0);
  return { sound, file };
}

function createWavFromPcm16(pcmBytes: Uint8Array, sampleRate: number): Uint8Array {
  const wavHeaderSize = 44;
  const channelCount = 1;
  const bytesPerSample = 2;
  const byteRate = sampleRate * channelCount * bytesPerSample;
  const blockAlign = channelCount * bytesPerSample;
  const wavBytes = new Uint8Array(wavHeaderSize + pcmBytes.length);
  const view = new DataView(wavBytes.buffer);

  const writeAscii = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) {
      wavBytes[offset + i] = value.charCodeAt(i);
    }
  };

  writeAscii(0, "RIFF");
  view.setUint32(4, 36 + pcmBytes.length, true);
  writeAscii(8, "WAVE");
  writeAscii(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channelCount, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeAscii(36, "data");
  view.setUint32(40, pcmBytes.length, true);
  wavBytes.set(pcmBytes, wavHeaderSize);

  return wavBytes;
}

function decodeBase64ToBytes(base64: string): Uint8Array {
  const normalized = base64.replace(/\s+/g, "");
  if (!normalized) return new Uint8Array(0);

  const padding = normalized.endsWith("==") ? 2 : normalized.endsWith("=") ? 1 : 0;
  const outputLength = Math.floor((normalized.length * 3) / 4) - padding;
  const bytes = new Uint8Array(outputLength);

  let byteIndex = 0;
  for (let i = 0; i < normalized.length; i += 4) {
    const c1 = BASE64_LOOKUP[normalized.charCodeAt(i)];
    const c2 = BASE64_LOOKUP[normalized.charCodeAt(i + 1)];
    const c3 = BASE64_LOOKUP[normalized.charCodeAt(i + 2)];
    const c4 = BASE64_LOOKUP[normalized.charCodeAt(i + 3)];

    if (c1 < 0 || c2 < 0 || c3 < 0 || c4 < 0) {
      throw new Error("Invalid base64 audio payload");
    }

    const triple = (c1 << 18) | (c2 << 12) | (c3 << 6) | c4;
    if (byteIndex < outputLength) bytes[byteIndex++] = (triple >> 16) & 0xff;
    if (byteIndex < outputLength) bytes[byteIndex++] = (triple >> 8) & 0xff;
    if (byteIndex < outputLength) bytes[byteIndex++] = triple & 0xff;
  }

  return bytes;
}

async function createAudioFromBytes(bytes: Uint8Array, extension: string): Promise<CachedAudio> {
  const file = new File(Paths.cache, `tts_${Date.now()}.${extension}`);
  file.create({ overwrite: true });
  file.write(bytes);

  const { sound } = await Audio.Sound.createAsync({ uri: file.uri });
  await sound.setVolumeAsync(1.0);
  return { sound, file };
}

function concatBytes(left: Uint8Array<ArrayBufferLike>, right: Uint8Array<ArrayBufferLike>): Uint8Array<ArrayBufferLike> {
  if (left.length === 0) return right;
  if (right.length === 0) return left;

  const combined = new Uint8Array(left.length + right.length);
  combined.set(left, 0);
  combined.set(right, left.length);
  return combined;
}

export async function startStreamingPcmPlayback(
  sampleRate = 24000,
  onPlaybackStart?: (latencyMs: number) => void
): Promise<StreamingPcmPlayback> {
  const startedAt = Date.now();
  if (isSpeakingNow) {
    await stopSpeaking();
  }
  stopRecognitionSession();
  isSpeakingNow = true;

  if (Platform.OS === "ios") {
    ExpoSpeechRecognitionModule.setCategoryIOS({
      category: "playback",
      categoryOptions: [],
      mode: "default",
    });
  }
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: backgroundAudioActive,
    shouldDuckAndroid: false,
  });

  const segmentByteSize = Math.max(4096, Math.floor(sampleRate * 2 * 0.3));
  let bufferedBytes: Uint8Array<ArrayBufferLike> = new Uint8Array(0);
  const queuedSegments: Uint8Array<ArrayBufferLike>[] = [];
  let isDraining = false;
  let isFinished = false;
  let isAborted = false;
  let hasStartedPlayback = false;
  let wakeDrain: (() => void) | null = null;
  let appendBase64Chunk = (_base64Chunk: string) => {};
  let finishPlayback = async () => {};

  const completion = new Promise<void>((resolve) => {
    const waitForSegments = () => new Promise<void>((resume) => { wakeDrain = resume; });
    const signalDrain = () => {
      wakeDrain?.();
      wakeDrain = null;
    };

    const drainQueue = async () => {
      if (isDraining) return;
      isDraining = true;
      try {
        while (!isAborted) {
          if (queuedSegments.length === 0) {
            if (isFinished) {
              if (bufferedBytes.length > 0) {
                queuedSegments.push(bufferedBytes);
                bufferedBytes = new Uint8Array(0);
              } else {
                break;
              }
            } else {
              await waitForSegments();
              continue;
            }
          }

          const segment = queuedSegments.shift();
          if (!segment || segment.length === 0) continue;

          const wavBytes = createWavFromPcm16(segment, sampleRate);
          const audio = await createAudioFromBytes(wavBytes, "wav");
          await playCachedAudio(audio, () => {
            if (!hasStartedPlayback) {
              hasStartedPlayback = true;
              onPlaybackStart?.(Date.now() - startedAt);
            }
          });
        }
      } finally {
        abortCurrentStreamPlayback = null;
        isSpeakingNow = false;
        resolve();
      }
    };

    abortCurrentStreamPlayback = () => {
      isAborted = true;
      queuedSegments.length = 0;
      bufferedBytes = new Uint8Array(0);
      signalDrain();
    };

    const queueBufferedSegments = () => {
      while (bufferedBytes.length >= segmentByteSize) {
        queuedSegments.push(bufferedBytes.slice(0, segmentByteSize));
        bufferedBytes = bufferedBytes.slice(segmentByteSize);
      }
      signalDrain();
      drainQueue().catch(() => resolve());
    };

    resolveCurrentSpeak = () => {
      isAborted = true;
      signalDrain();
      resolve();
    };

    appendBase64Chunk = (base64Chunk: string) => {
      if (isAborted || !base64Chunk) return;
      bufferedBytes = concatBytes(bufferedBytes, decodeBase64ToBytes(base64Chunk));
      queueBufferedSegments();
    };

    finishPlayback = async () => {
      if (isFinished) {
        await completion;
        return;
      }
      isFinished = true;
      signalDrain();
      drainQueue().catch(() => resolve());
      await completion;
    };
  });

  return {
    appendBase64Chunk,
    finish: finishPlayback,
    completion,
  };
}

async function playCachedAudio(audio: CachedAudio, onPlaybackStart?: () => void): Promise<void> {
  currentSound = audio.sound;
  currentTempFile = audio.file;

  try {
    await audio.sound.setRateAsync(getAudioPlaybackRate(), true);
  } catch {}

  return new Promise<void>((resolve) => {
    let resolved = false;
    const done = () => {
      if (!resolved) {
        resolved = true;
        resolveCurrentSpeak = null;
        resolve();
      }
    };
    resolveCurrentSpeak = done;

    audio.sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        currentSound = null;
        audio.sound.unloadAsync().catch(() => {});
        cleanupTempFile();
        done();
      }
    });
    onPlaybackStart?.();
    audio.sound.playAsync().catch(() => done());
  });
}

/**
 * Pre-fetch TTS audio for the given text in the background.
 * Call this while current audio is playing to eliminate latency on the next speak().
 */
export function prefetchSpeak(text: string): void {
  if (!GROK_API_KEY || GROK_API_KEY === "your-grok-api-key-here") return;
  const ttsText = applyNameSub(text);
  if (prefetchCache.has(ttsText)) return;
  // Fire-and-forget — errors are swallowed; speak() falls back to a fresh fetch
  prefetchCache.set(
    ttsText,
    fetchAudio(ttsText).catch((e) => {
      prefetchCache.delete(ttsText);
      throw e;
    })
  );
}

/**
 * Like prefetchSpeak but awaitable — resolves when the audio file is fully
 * downloaded and cached. Use this when you need to guarantee the audio is
 * ready before speak() is called (e.g. pipeline: Grok text → fetch Ara audio
 * → clip ends → speak instantly from cache).
 */
export async function prefetchSpeakAndWait(text: string): Promise<void> {
  if (!GROK_API_KEY || GROK_API_KEY === "your-grok-api-key-here") return;
  const ttsText = applyNameSub(text);
  if (!prefetchCache.has(ttsText)) {
    prefetchCache.set(
      ttsText,
      fetchAudio(ttsText).catch((e) => {
        prefetchCache.delete(ttsText);
        throw e;
      })
    );
  }
  try {
    await prefetchCache.get(ttsText)!;
  } catch {
    // Download failed — speak() will do a fresh fetch, that's OK
  }
}

async function speakWithAra(text: string, onPlaybackStart?: () => void): Promise<void> {
  await stopSpeaking();

  // Force audio session to playback mode — critical after STT which sets
  // the session to playAndRecord, causing iOS to route audio through earpiece.
  if (Platform.OS === "ios") {
    ExpoSpeechRecognitionModule.setCategoryIOS({
      category: "playback",
      categoryOptions: [],
      mode: "default",
    });
  }
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: backgroundAudioActive,
    shouldDuckAndroid: false,
  });

  // Use pre-fetched audio if available, otherwise fetch now
  let audio: CachedAudio;
  const cached = prefetchCache.get(text);
  if (cached) {
    prefetchCache.delete(text);
    try {
      audio = await cached;
    } catch {
      // Pre-fetch failed — fetch fresh
      audio = await fetchAudio(text);
    }
  } else {
    audio = await fetchAudio(text);
  }

  await playCachedAudio(audio, onPlaybackStart);
}

export async function speakFromPcmBase64(
  audioDataBase64: string,
  sampleRate = 24000,
  onPlaybackStart?: (latencyMs: number) => void
): Promise<void> {
  const t0 = Date.now();
  if (isSpeakingNow) {
    await stopSpeaking();
  }
  stopRecognitionSession();
  isSpeakingNow = true;
  await stopSpeaking();

  try {
    if (Platform.OS === "ios") {
      ExpoSpeechRecognitionModule.setCategoryIOS({
        category: "playback",
        categoryOptions: [],
        mode: "default",
      });
    }
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: backgroundAudioActive,
      shouldDuckAndroid: false,
    });

    const pcmBytes = decodeBase64ToBytes(audioDataBase64);
    const wavBytes = createWavFromPcm16(pcmBytes, sampleRate);
    const audio = await createAudioFromBytes(wavBytes, "wav");
    await playCachedAudio(audio, () => onPlaybackStart?.(Date.now() - t0));
  } finally {
    isSpeakingNow = false;
  }
}

function cleanupTempFile() {
  if (currentTempFile) {
    try {
      currentTempFile.delete();
    } catch {}
    currentTempFile = null;
  }
}

function speakWithExpo(text: string): Promise<void> {
  return new Promise((resolve) => {
    Speech.speak(text, {
      language: "en-US",
      rate: getExpoSpeechRate(),
      onDone: resolve,
      onError: () => resolve(),
    });
  });
}

/**
 * Stop any currently playing speech or audio.
 */
export async function stopSpeaking(): Promise<void> {
  // Unblock any awaiting speakWithAra Promise first — stopAsync() does NOT fire
  // didJustFinish, so without this the Promise would hang indefinitely.
  resolveCurrentSpeak?.();
  resolveCurrentSpeak = null;
  abortCurrentStreamPlayback?.();
  abortCurrentStreamPlayback = null;

  if (currentSound) {
    try {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
    } catch {}
    currentSound = null;
  }
  cleanupTempFile();
  Speech.stop();
}

/**
 * Start listening for speech input.
 */
export async function startListening(
  config?: Partial<{ language: string; continuous: boolean; contextualStrings: string[] }>
): Promise<void> {
  const available =
    await ExpoSpeechRecognitionModule.isRecognitionAvailable();
  if (!available) {
    throw new Error("Speech recognition is not available on this device");
  }

  const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
  if (!result.granted) {
    throw new Error("Microphone permission not granted");
  }

  // Clear any orphaned recognition session before starting a new one.
  // On iOS, a previous STT run can survive long enough to make the next start()
  // silently no-op, which leaves the lesson stuck after a spoken prompt.
  try {
    ExpoSpeechRecognitionModule.stop();
  } catch {}

  if (Platform.OS === "ios") {
    ExpoSpeechRecognitionModule.setCategoryIOS({
      category: "playAndRecord",
      categoryOptions: ["defaultToSpeaker", "allowBluetooth"],
      mode: "voiceChat",
    });
  }
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
    staysActiveInBackground: backgroundAudioActive,
    shouldDuckAndroid: false,
  });

  ExpoSpeechRecognitionModule.start({
    lang: config?.language ?? "en-US",
    interimResults: true,
    continuous: config?.continuous ?? false,
    contextualStrings: sanitizeContextualStrings(config?.contextualStrings),
    iosCategory: {
      category: "playAndRecord",
      categoryOptions: ["defaultToSpeaker", "allowBluetooth"],
      mode: "voiceChat",
    },
  });
}

/**
 * Reset audio session to playback mode.
 * Call after STT ends to prevent iOS routing audio through earpiece.
 * Includes delay to let native STT cleanup finish before overriding.
 */
export async function resetAudioForPlayback(): Promise<void> {
  // Brief wait for native STT engine to finish its audio session cleanup
  await new Promise((resolve) => setTimeout(resolve, 100));

  if (Platform.OS === "ios") {
    ExpoSpeechRecognitionModule.setCategoryIOS({
      category: "playback",
      categoryOptions: [],
      mode: "default",
    });
  }
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: backgroundAudioActive,
    shouldDuckAndroid: false,
  });
}

/**
 * Stop listening for speech input.
 */
export async function stopListening(): Promise<void> {
  ExpoSpeechRecognitionModule.stop();
  await resetAudioForPlayback();
}

export { useSpeechRecognitionEvent };
