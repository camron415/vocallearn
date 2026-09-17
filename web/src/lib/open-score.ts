import { classifyRecall } from "./learn-recall";
import { gradeLocally } from "./learn";
import { closedHit, edits1, stripSpeakFillers } from "./closed-grade";
import { resolveChipRecall, type ChipRecall } from "./chip-recall";
import type { ChipKind } from "./harvest";
import { contentWords, foldClozeWord } from "./open-cloze";

export type OpenScoreMethod = "local" | "model" | "skip";

export type OpenScoreResult = {
  ok: boolean;
  method: OpenScoreMethod;
  reason: string;
  /** True only when an open gist still needs the cheap model. Callers may ignore. */
  needsModel?: boolean;
};

const SCORE_SYSTEM = `You grade one family review. The learner is restating a fact in their own words.
Return ONLY JSON: {"ok":true} or {"ok":false}
ok=true if the gist is the same (paraphrase allowed). Ignore spelling and small extra words.
ok=false if they named a different thing, contradicted the fact, or left out the vital meaning.
Do not quote the expected answer. Do not add commentary.`;

function foldJson(text: string): { ok?: boolean } | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as { ok?: boolean };
  } catch {
    return null;
  }
}

function stripFillers(text: string) {
  return stripSpeakFillers(text);
}

function vitalFolds(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const word of contentWords(text).sort(
    (a, b) => b.fold.length - a.fold.length || a.start - b.start
  )) {
    if (seen.has(word.fold)) continue;
    seen.add(word.fold);
    out.push(word.fold);
    if (out.length >= 6) break;
  }
  return out;
}

function gistWordHit(saidFolds: string[], vital: string) {
  return saidFolds.some((token) => {
    if (token === vital) return true;
    if (vital.length >= 6 && token.length >= 6 && edits1(token, vital)) {
      return true;
    }
    if (vital.length >= 4 && token.length >= 4) {
      return token.includes(vital) || vital.includes(token);
    }
    return false;
  });
}

/**
 * VocalLearn LOW strictness, pass/fail only: paraphrase and STT fillers are OK;
 * label-only, "I don't know", and a different concept fail. No hint ladder.
 */
export function scoreGistLocal(opts: {
  prompt?: string;
  expected: string;
  said: string;
  token?: string;
}): OpenScoreResult {
  const said = stripFillers(opts.said).trim().slice(0, 500);
  const expected = opts.expected.trim();
  const token = (opts.token ?? "").trim();
  const kind = classifyRecall(said);

  if (kind === "blank" || kind === "dontknow") {
    return { ok: false, method: "skip", reason: "no attempt" };
  }
  if (kind === "hint" || kind === "answer") {
    return { ok: false, method: "skip", reason: "asked for help" };
  }
  if (!expected) {
    return { ok: false, method: "skip", reason: "no expected answer" };
  }
  if (
    contentWords(said).length >= 4 &&
    gradeLocally(said, expected)
  ) {
    return { ok: true, method: "local", reason: "matches answer" };
  }

  const saidFolds = said
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map(foldClozeWord)
    .filter((word) => word.length >= 3);
  const tokenFold = foldClozeWord(token);
  const vitals = vitalFolds(expected).filter((word) => word !== tokenFold);
  const hits = vitals.filter((vital) => gistWordHit(saidFolds, vital)).length;
  const need = Math.max(2, Math.ceil(Math.max(vitals.length, 1) * 0.3));
  if (contentWords(said).length < 2) {
    return { ok: false, method: "local", reason: "too brief" };
  }
  if (vitals.length && hits >= need) {
    return { ok: true, method: "local", reason: "gist overlap" };
  }
  return { ok: false, method: "local", reason: "gist miss" };
}

/** Sync, free. Closed = exact token. Open = VocalLearn-style gist pass/fail. */
export function scoreOpenLocal(opts: {
  prompt?: string;
  expected: string;
  said: string;
  token?: string;
  recall?: ChipRecall | string | null;
  kind?: ChipKind;
}): OpenScoreResult {
  const said = opts.said.trim().slice(0, 500);
  const expected = opts.expected.trim();
  const token = (opts.token ?? "").trim();
  const kind = classifyRecall(said);
  const recall = resolveChipRecall({
    recall: opts.recall,
    token: token || expected,
    answer: expected,
  });

  if (kind === "blank" || kind === "dontknow") {
    return { ok: false, method: "skip", reason: "no attempt" };
  }
  if (kind === "hint" || kind === "answer") {
    return { ok: false, method: "skip", reason: "asked for help" };
  }
  if (!expected) {
    return { ok: false, method: "skip", reason: "no expected answer" };
  }

  if (recall === "closed") {
    if (
      closedHit(said, {
        kind: opts.kind ?? "meaning",
        answer: expected,
        token,
        span: token,
      })
    ) {
      return { ok: true, method: "local", reason: "matches token or answer" };
    }
    return { ok: false, method: "local", reason: "closed token mismatch" };
  }

  return scoreGistLocal({
    prompt: opts.prompt,
    expected,
    said,
    token,
  });
}

/** Play + lock-in: no extra model call. */
export function scoreLockIn(opts: {
  prompt?: string;
  expected: string;
  said: string;
  token?: string;
  recall?: ChipRecall | string | null;
  kind?: ChipKind;
}): OpenScoreResult {
  return scoreOpenLocal(opts);
}

/**
 * Open paraphrase scorer. No GUI.
 * Closed → local only (free). Open → local first, then one Grok 4.3 call, no search.
 */
export async function scoreOpenFact(opts: {
  prompt?: string;
  expected: string;
  said: string;
  token?: string;
  recall?: ChipRecall | string | null;
  kind?: ChipKind;
}): Promise<OpenScoreResult> {
  const local = scoreOpenLocal(opts);
  if (!local.needsModel) return local;

  try {
    const { callGrokChat } = await import("./grok");
    const raw = await callGrokChat(
      [
        {
          role: "user",
          content: `PROMPT: ${(opts.prompt ?? "").slice(0, 240)}\nEXPECTED: ${opts.expected.slice(0, 400)}\nSAID: ${opts.said.trim().slice(0, 500)}`,
        },
      ],
      {
        tools: false,
        effort: "none",
        maxTokens: 40,
        temperature: 0,
        system: SCORE_SYSTEM,
      }
    );
    const parsed = foldJson(raw);
    if (parsed && typeof parsed.ok === "boolean") {
      return {
        ok: parsed.ok,
        method: "model",
        reason: parsed.ok ? "gist match" : "gist miss",
      };
    }
    return { ok: false, method: "model", reason: "unreadable model grade" };
  } catch {
    return { ok: false, method: "skip", reason: "model unavailable" };
  }
}

export function runOpenScoreFixtures(): { ok: boolean; failures: string[] } {
  const failures: string[] = [];
  const cases: Array<{ name: string; want: Partial<OpenScoreResult>; opts: Parameters<typeof scoreOpenLocal>[0] }> = [
    {
      name: "closed exact",
      opts: { expected: "The Nile", said: "Nile", token: "Nile", recall: "closed" },
      want: { ok: true, method: "local" },
    },
    {
      name: "closed drops trailing era",
      opts: {
        expected: "Mesozoic Era",
        said: "Mesozoic",
        token: "Mesozoic Era",
        recall: "closed",
        kind: "meaning",
      },
      want: { ok: true, method: "local" },
    },
    {
      name: "closed miss",
      opts: { expected: "The Nile", said: "Amazon", token: "Nile", recall: "closed" },
      want: { ok: false, method: "local" },
    },
    {
      name: "blank skip",
      opts: { expected: "The Nile", said: "  ", token: "Nile" },
      want: { ok: false, method: "skip" },
    },
    {
      name: "open local paraphrase",
      opts: {
        expected: "Egypt is the gift of the Nile",
        said: "egypt is the gift of the nile",
        token: "gift of the Nile",
        recall: "open",
      },
      want: { ok: true, method: "local" },
    },
    {
      name: "open gist paraphrase",
      opts: {
        expected:
          "Photosynthesis is how plants make food from sunlight, water, and carbon dioxide.",
        said: "plants use light to make their own food",
        token: "photosynthesis",
        recall: "open",
      },
      want: { ok: true, method: "local" },
    },
    {
      name: "open label only",
      opts: {
        expected:
          "Photosynthesis is how plants make food from sunlight, water, and carbon dioxide.",
        said: "photosynthesis",
        token: "photosynthesis",
        recall: "open",
      },
      want: { ok: false, method: "local" },
    },
    {
      name: "open dontknow",
      opts: {
        expected:
          "Photosynthesis is how plants make food from sunlight, water, and carbon dioxide.",
        said: "I don't know",
        token: "photosynthesis",
        recall: "open",
      },
      want: { ok: false, method: "skip" },
    },
  ];

  for (const row of cases) {
    const got = scoreOpenLocal(row.opts);
    if (row.want.ok !== undefined && got.ok !== row.want.ok) {
      failures.push(`${row.name}: ok ${got.ok}`);
    }
    if (row.want.method && got.method !== row.want.method) {
      failures.push(`${row.name}: method ${got.method}`);
    }
    if (row.want.needsModel && !got.needsModel) {
      failures.push(`${row.name}: expected needsModel`);
    }
  }

  const lockOk = scoreLockIn({
    expected:
      "Photosynthesis is how plants make food from sunlight, water, and carbon dioxide.",
    said: "plants use sunlight and water to make their own food",
    token: "photosynthesis",
    recall: "open",
  });
  if (!lockOk.ok) failures.push("lock-in open overlap should pass");

  const lockMiss = scoreLockIn({
    expected:
      "Photosynthesis is how plants make food from sunlight, water, and carbon dioxide.",
    said: "the amazon is a long river",
    token: "photosynthesis",
    recall: "open",
  });
  if (lockMiss.ok) failures.push("lock-in open mismatch should fail");

  const filler = scoreGistLocal({
    expected:
      "Compound interest earns interest on both the principal and past interest.",
    said: "um it earns interest on interest so it grows faster",
    token: "compound interest",
  });
  if (!filler.ok) failures.push("STT fillers should still pass a real gist");

  return { ok: failures.length === 0, failures };
}
