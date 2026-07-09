#!/usr/bin/env node
// Generates high-quality WAV chime sounds for VocalLearn using pure Node.js.
// Additive synthesis (fundamental + harmonics) with exponential decay envelope
// for a clean, musical "bell/chime" quality — not a cheap sine beep.
//
// Run: node scripts/gen-sounds.js

const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(__dirname, "../assets/sounds");
const SAMPLE_RATE = 44100;
const NUM_CHANNELS = 1;
const BIT_DEPTH = 16;

// ── WAV writer ───────────────────────────────────────────────────────────────

function writeWav(filename, samples) {
  const dataLength = samples.length * 2; // 16-bit = 2 bytes/sample
  const fileLength = 44 + dataLength;
  const buf = Buffer.alloc(fileLength);

  // RIFF header
  buf.write("RIFF", 0);
  buf.writeUInt32LE(fileLength - 8, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16); // chunk size
  buf.writeUInt16LE(1, 20);  // PCM format
  buf.writeUInt16LE(NUM_CHANNELS, 22);
  buf.writeUInt32LE(SAMPLE_RATE, 24);
  buf.writeUInt32LE(SAMPLE_RATE * NUM_CHANNELS * BIT_DEPTH / 8, 28); // byte rate
  buf.writeUInt16LE(NUM_CHANNELS * BIT_DEPTH / 8, 32); // block align
  buf.writeUInt16LE(BIT_DEPTH, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(dataLength, 40);

  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    const s16 = Math.round(clamped * 32767);
    buf.writeInt16LE(s16, 44 + i * 2);
  }

  fs.writeFileSync(path.join(OUT_DIR, filename), buf);
  console.log(`  ✓ ${filename} (${(dataLength / 1024).toFixed(1)} KB)`);
}

// ── Synthesis helpers ────────────────────────────────────────────────────────

/**
 * Generate a single bell-like note at `freq` Hz for `durationSec` seconds.
 * Uses additive synthesis with 3 harmonics + exponential decay envelope.
 * @param {number} freq - Fundamental frequency in Hz
 * @param {number} durationSec - Note duration in seconds
 * @param {number} gain - Overall amplitude (0–1)
 * @param {number} decayRate - How fast the note fades (higher = faster)
 * @returns {Float64Array}
 */
function bellNote(freq, durationSec, gain = 0.65, decayRate = 18) {
  const n = Math.ceil(durationSec * SAMPLE_RATE);
  const out = new Float64Array(n);
  const attackSamples = Math.ceil(0.005 * SAMPLE_RATE); // 5ms attack

  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;

    // Exponential decay envelope (like a real bell/chime struck with mallet)
    const env = Math.exp(-decayRate * t);

    // Short linear attack to avoid click
    const attack = i < attackSamples ? i / attackSamples : 1;

    // Additive synthesis: fundamental + harmonics at decreasing amplitudes
    // Weight: 1.0, 0.45, 0.2, 0.08 → gives warmth without harshness
    const wave =
      Math.sin(2 * Math.PI * freq * t) * 1.0 +
      Math.sin(2 * Math.PI * freq * 2 * t) * 0.45 +
      Math.sin(2 * Math.PI * freq * 3 * t) * 0.2 +
      Math.sin(2 * Math.PI * freq * 4.1 * t) * 0.08; // slight inharmonicity

    out[i] = wave * env * attack * gain * 0.42; // 0.42 normalizes the harmonic sum
  }
  return out;
}

/** Concatenate multiple Float64Arrays into one. */
function concat(...arrays) {
  const total = arrays.reduce((s, a) => s + a.length, 0);
  const out = new Float64Array(total);
  let offset = 0;
  for (const arr of arrays) {
    out.set(arr, offset);
    offset += arr.length;
  }
  return out;
}

/** Add a short silence gap (in seconds). */
function silence(durationSec) {
  return new Float64Array(Math.ceil(durationSec * SAMPLE_RATE));
}

/** Normalize an array to peak amplitude `peak` (default 0.92 = -0.7 dBFS). */
function normalize(arr, peak = 0.92) {
  let max = 0;
  for (const s of arr) { const a = Math.abs(s); if (a > max) max = a; }
  if (max === 0) return arr;
  const scale = peak / max;
  const out = new Float64Array(arr.length);
  for (let i = 0; i < arr.length; i++) out[i] = arr[i] * scale;
  return out;
}

// ── Musical notes (equal temperament, A4 = 440 Hz) ──────────────────────────
const NOTE = {
  G4:  392.00,
  A4:  440.00,
  B4:  493.88,
  C5:  523.25,
  D5:  587.33,
  E5:  659.25,
  F5:  698.46,
  G5:  783.99,
  A5:  880.00,
  B5:  987.77,
  C6: 1046.50,
};

// ── Sound definitions ────────────────────────────────────────────────────────

// CORRECT: ascending major 3rd C5 → E5 (bright, positive)
// Two notes, quick gap, clean chime quality
function genCorrect() {
  const n1 = bellNote(NOTE.C5, 0.28, 0.7, 16);
  const gap = silence(0.02);
  const n2 = bellNote(NOTE.E5, 0.32, 0.75, 14);
  return normalize(concat(n1, gap, n2));
}

// PERFECT: ascending major triad C5 → E5 → G5 (joyful, full resolution)
// Three notes with tiny gaps, a touch slower than correct
function genPerfect() {
  const n1 = bellNote(NOTE.C5, 0.22, 0.65, 16);
  const g1 = silence(0.02);
  const n2 = bellNote(NOTE.E5, 0.22, 0.68, 15);
  const g2 = silence(0.02);
  const n3 = bellNote(NOTE.G5, 0.35, 0.75, 13);
  return normalize(concat(n1, g1, n2, g2, n3));
}

// WRONG: descending minor fall A4 → F5... actually let's do B4 → G4 (down a major 3rd)
// Lower, slightly darker — noticeable but not harsh
function genWrong() {
  const n1 = bellNote(NOTE.A4, 0.22, 0.55, 22);
  const gap = silence(0.03);
  const n2 = bellNote(NOTE.G4, 0.30, 0.50, 20);
  return normalize(concat(n1, gap, n2));
}

// MIC_OPEN: a very short, subtle single high chime — like a tiny notification
// Super brief — just signals the mic is live without being intrusive
function genMicOpen() {
  return normalize(bellNote(NOTE.B5, 0.18, 0.45, 28));
}

// SESSION_COMPLETE: ascending 4-note fanfare C5 → E5 → G5 → C6
// Celebratory, musical resolution to the octave
function genSessionComplete() {
  const n1 = bellNote(NOTE.C5, 0.20, 0.65, 16);
  const g1 = silence(0.025);
  const n2 = bellNote(NOTE.E5, 0.20, 0.68, 15);
  const g2 = silence(0.025);
  const n3 = bellNote(NOTE.G5, 0.20, 0.70, 14);
  const g3 = silence(0.03);
  const n4 = bellNote(NOTE.C6, 0.50, 0.80, 11); // longer ring on the resolution
  return normalize(concat(n1, g1, n2, g2, n3, g3, n4));
}

// ── Generate all files ───────────────────────────────────────────────────────

console.log("Generating sounds → assets/sounds/");
writeWav("correct.wav",          genCorrect());
writeWav("perfect.wav",          genPerfect());
writeWav("wrong.wav",            genWrong());
writeWav("mic_open.wav",         genMicOpen());
writeWav("session_complete.wav", genSessionComplete());
console.log("Done.");
