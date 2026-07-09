/**
 * STT Cleanup Utility
 *
 * Normalizes voice-to-text output before sending to Grok for scoring.
 * Handles common STT artifacts: filler words, spoken punctuation,
 * phonetic substitutions for technical terms, and number word normalization.
 *
 * This runs client-side with zero latency.
 */

// Filler words and disfluencies to strip
const FILLER_PATTERN =
  /\b(um+|uh+|er+|hmm+|like[,\s]|you know[,\s]|kind of[,\s]|sort of[,\s]|basically[,\s]|literally[,\s]|i mean[,\s]|actually[,\s]|well[,\s])\b/gi;

// Spoken punctuation — some STT engines emit these as words
const SPOKEN_PUNCTUATION: [RegExp, string][] = [
  [/\b(period|full stop)\b/gi, "."],
  [/\bcomma\b/gi, ","],
  [/\bquestion mark\b/gi, "?"],
  [/\bexclamation( point| mark)?\b/gi, "!"],
];

// Phonetic substitutions — what STT commonly mishears for academic/technical terms.
// Keys are regex patterns (case-insensitive), values are the correct term.
// Add more as you discover common mishearings in your sessions.
const PHONETIC_SUBS: [RegExp, string][] = [
  // Memory science terms
  [/\bebbinghaus\b/gi, "Ebbinghaus"],
  [/\bebb(ing)?\s*house\b/gi, "Ebbinghaus"],
  [/\bebing\s*house\b/gi, "Ebbinghaus"],
  [/\bebb\s*in\s*house\b/gi, "Ebbinghaus"],
  [/\bbartlett\b/gi, "Bartlett"],
  [/\bbart\s*let\b/gi, "Bartlett"],
  [/\batkinson\b/gi, "Atkinson"],
  [/\bshiffrin\b/gi, "Shiffrin"],
  [/\bshifrin\b/gi, "Shiffrin"],
  [/\btulving\b/gi, "Tulving"],
  [/\btool\s*ving\b/gi, "Tulving"],
  [/\bcraik\b/gi, "Craik"],
  [/\bcray?k\b/gi, "Craik"],
  [/\blockhart\b/gi, "Lockhart"],
  [/\block\s*heart\b/gi, "Lockhart"],
  [/\bepisodic\b/gi, "episodic"],
  [/\bsemantic\b/gi, "semantic"],
  [/\bprocedural\b/gi, "procedural"],
  // Common finance terms
  [/\bcompound(ed)?\b/gi, "compound"],
  [/\b(a\.?p\.?y\.?|annual percentage yield)\b/gi, "APY"],
  [/\b(a\.?p\.?r\.?|annual percentage rate)\b/gi, "APR"],
];

// Number word → digit for years and counts commonly tested in lessons
const NUMBER_WORDS: [RegExp, string][] = [
  // Full year patterns (most important for memory science dates)
  [/\beighteen\s*eighty[\s-]*five\b/gi, "1885"],
  [/\bnineteen\s*thirty[\s-]*two\b/gi, "1932"],
  [/\bnineteen\s*sixty[\s-]*eight\b/gi, "1968"],
  [/\bnineteen\s*seventy[\s-]*two\b/gi, "1972"],
  [/\bnineteen\s*seventy[\s-]*six\b/gi, "1976"],
  [/\bnineteen\s*eighty\b/gi, "1980"],
  [/\btwenty[\s-]*ten\b/gi, "2010"],
  // Basic single digits and small numbers
  [/\bzero\b/gi, "0"],
  [/\bone\b/gi, "1"],
  [/\btwo\b/gi, "2"],
  [/\bthree\b/gi, "3"],
  [/\bfour\b/gi, "4"],
  [/\bfive\b/gi, "5"],
  [/\bsix\b/gi, "6"],
  [/\bseven\b/gi, "7"],
  [/\beight\b/gi, "8"],
  [/\bnine\b/gi, "9"],
  [/\bten\b/gi, "10"],
  [/\beleven\b/gi, "11"],
  [/\btwelve\b/gi, "12"],
  [/\bthirteen\b/gi, "13"],
  [/\bfifteen\b/gi, "15"],
  [/\btwenty\b/gi, "20"],
  [/\bthirty\b/gi, "30"],
  [/\bfifty\b/gi, "50"],
  [/\bseventy\b/gi, "70"],
  [/\bhundred\b/gi, "100"],
];

/**
 * Clean a raw STT transcript before sending it for AI scoring.
 * Strips filler words, normalizes spoken punctuation, fixes common
 * phonetic mishearings, and converts number words to digits.
 */
export function cleanSttText(raw: string): string {
  if (!raw || !raw.trim()) return raw;

  let text = raw;

  // 1. Apply phonetic substitutions first (before stripping might break context)
  for (const [pattern, replacement] of PHONETIC_SUBS) {
    text = text.replace(pattern, replacement);
  }

  // 2. Convert number words to digits (multi-word patterns before single-word)
  for (const [pattern, digit] of NUMBER_WORDS) {
    text = text.replace(pattern, digit);
  }

  // 3. Strip filler words
  text = text.replace(FILLER_PATTERN, " ");

  // 4. Normalize spoken punctuation
  for (const [pattern, replacement] of SPOKEN_PUNCTUATION) {
    text = text.replace(pattern, replacement);
  }

  // 5. Collapse extra whitespace
  text = text.replace(/\s+/g, " ").trim();

  return text;
}
