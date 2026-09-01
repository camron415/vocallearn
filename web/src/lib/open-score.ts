import { classifyRecall } from "./learn-recall";
import { gradeLocally } from "./learn";
import { resolveChipRecall, type ChipRecall } from "./chip-recall";

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

/** Sync, free. Closed facts never leave here. Open facts that already match also stop here. */
export function scoreOpenLocal(opts: {
  prompt?: string;
  expected: string;
  said: string;
  token?: string;
  recall?: ChipRecall | string | null;
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

  if (gradeLocally(said, expected) || (token && gradeLocally(said, token))) {
    return { ok: true, method: "local", reason: "matches token or answer" };
  }

  if (recall === "closed") {
    return { ok: false, method: "local", reason: "closed token mismatch" };
  }

  return {
    ok: false,
    method: "local",
    reason: "open gist needs cheap model",
    needsModel: true,
  };
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
      name: "open needs model",
      opts: {
        expected:
          "Photosynthesis is how plants make food from sunlight, water, and carbon dioxide.",
        said: "plants use light to make their own food",
        token: "photosynthesis",
        recall: "open",
      },
      want: { needsModel: true },
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

  return { ok: failures.length === 0, failures };
}
