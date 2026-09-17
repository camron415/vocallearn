import type { ChipKind } from "./harvest";

/**
 * Shared closed SAY normalizer (Sunday spec).
 * Case, punctuation, commas in numbers, unit aliases, leading the/a/an.
 * Speak: um/uh plus “it’s the…” hedges (dictate / STT).
 * Type labels: trailing era/period/river/ocean/city/… — same idea as
 * Where dropping Mount/Lake. Distinctive head must remain; label-only fails.
 * Who: last name or full name (not first-only).
 * Where: exact after Mount/Lake/the + type label.
 * When / numeric meaning: digit string.
 * Meaning text: exact after normalize, or 1-edit if both cores are ≥8.
 */

const MIN_NAME_LEN = 3;

const UNITS = new Set([
  "miles",
  "mile",
  "mi",
  "km",
  "kilometers",
  "kilometres",
  "kilometer",
  "kilometre",
  "m",
  "meters",
  "metres",
  "meter",
  "metre",
  "ft",
  "feet",
  "foot",
]);

const PLACE_PREFIX = /^(mount|mt|lake|the|a|an)\s+/;

const CLASS_SUFFIX = new Set([
  "era",
  "period",
  "dynasty",
  "epoch",
  "eon",
  "aeon",
  "century",
  "millennium",
  "millenium",
  "war",
  "battle",
  "revolution",
  "river",
  "ocean",
  "sea",
  "lake",
  "gulf",
  "bay",
  "mountain",
  "mount",
  "mt",
  "range",
  "desert",
  "island",
  "isles",
  "peninsula",
  "continent",
  "planet",
  "moon",
  "star",
  "galaxy",
  "theory",
  "law",
  "principle",
  "effect",
  "syndrome",
  "disease",
  "virus",
  "element",
  "compound",
  "kingdom",
  "empire",
  "republic",
  "federation",
  "city",
  "province",
  "county",
  "strait",
  "canal",
  "falls",
  "peak",
  "volcano",
  "protocol",
  "process",
  "system",
  "cycle",
  "phase",
]);

const FILLERS =
  /\b(um+|uh+|er+|ah+|like|basically|kinda|sorta|sort of|you know|i think|i guess|i mean|maybe|probably|well)\b/gi;

const HEDGE_PREFIX =
  /^(it'?s|it is|that'?s|that is|the answer is|answer is|i think(?: it'?s)?|i believe(?: it'?s)?)\s+/i;

export type ClosedChip = {
  kind: ChipKind;
  answer?: string | null;
  token?: string | null;
  span?: string | null;
};

export function stripSpeakFillers(text: string) {
  return text
    .replace(FILLERS, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function edits1(a: string, b: string) {
  if (a === b) return true;
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > 1) return false;
  let i = 0;
  let j = 0;
  let skip = 0;
  while (i < la && j < lb) {
    if (a[i] === b[j]) {
      i += 1;
      j += 1;
      continue;
    }
    skip += 1;
    if (skip > 1) return false;
    if (la > lb) i += 1;
    else if (lb > la) j += 1;
    else {
      i += 1;
      j += 1;
    }
  }
  return skip + (la - i) + (lb - j) <= 1;
}

function foldClosed(text: string) {
  return stripSpeakFillers(text)
    .replace(HEDGE_PREFIX, "")
    .toLowerCase()
    .replace(/,/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripThe(text: string) {
  return text.replace(/^(the|a|an)\s+/, "");
}

function stripUnits(text: string) {
  let next = text;
  for (let i = 0; i < 2; i++) {
    const parts = next.split(" ");
    if (parts.length < 2) break;
    const last = parts[parts.length - 1];
    if (!last || !UNITS.has(last)) break;
    const head = parts.slice(0, -1).join(" ");
    if (!/\d/.test(head)) break;
    next = head;
  }
  return next;
}

function stripPlace(text: string) {
  return text.replace(PLACE_PREFIX, "").trim();
}

function stripClassSuffix(text: string) {
  let next = text;
  for (let i = 0; i < 3; i++) {
    const parts = next.split(" ").filter(Boolean);
    if (parts.length < 2) break;
    const last = parts[parts.length - 1]!;
    if (!CLASS_SUFFIX.has(last)) break;
    const head = parts.slice(0, -1).join(" ");
    if (head.replace(/\s/g, "").length < MIN_NAME_LEN) break;
    next = head;
  }
  return next;
}

function normalizeClosed(text: string) {
  return stripClassSuffix(stripUnits(stripThe(foldClosed(text))));
}

function digitsOf(text: string) {
  return text.replace(/\D/g, "");
}

function gradeAgainst(said: string, target: string, kind: ChipKind) {
  if (!said || !target) return false;
  if (said === target) return true;
  if (said.length < 2) return false;

  const saidDigits = digitsOf(said);
  const targetDigits = digitsOf(target);
  const numericTarget = /\d/.test(target);

  if (kind === "when" || (numericTarget && saidDigits && targetDigits)) {
    return saidDigits.length >= 2 && saidDigits === targetDigits;
  }

  if (kind === "who") {
    const a = stripPlace(said);
    const b = stripPlace(target);
    if (!a || !b) return false;
    if (a === b) return true;
    const saidParts = a.split(" ").filter(Boolean);
    const targetParts = b.split(" ").filter(Boolean);
    if (saidParts.length === 1 && targetParts.length >= 2) {
      const last = targetParts[targetParts.length - 1]!;
      const first = targetParts[0]!;
      return (
        saidParts[0]!.length >= MIN_NAME_LEN &&
        saidParts[0] === last &&
        saidParts[0] !== first
      );
    }
    return false;
  }

  if (kind === "where") {
    const a = stripPlace(said);
    const b = stripPlace(target);
    if (!a || !b || a.length < MIN_NAME_LEN) return false;
    return a === b;
  }

  if (kind === "meaning" && numericTarget) {
    return saidDigits.length >= 2 && saidDigits === targetDigits;
  }

  if (
    kind === "meaning" &&
    !saidDigits &&
    said.length >= 8 &&
    target.length >= 8 &&
    edits1(said, target)
  ) {
    return true;
  }

  return false;
}

export function closedHit(said: string, chip: ClosedChip, cue = "") {
  const trimmed = said.trim();
  if (!trimmed) return false;
  const variants = [trimmed];
  if (cue && !trimmed.toLowerCase().startsWith(cue.toLowerCase())) {
    variants.push(cue + trimmed);
  }
  const targets = [chip.answer, chip.token, chip.span]
    .map((t) => (t ?? "").trim())
    .filter(Boolean);
  if (!targets.length) return false;

  return variants.some((raw) => {
    const a = normalizeClosed(raw);
    if (!a) return false;
    return targets.some((target) =>
      gradeAgainst(a, normalizeClosed(target), chip.kind)
    );
  });
}
