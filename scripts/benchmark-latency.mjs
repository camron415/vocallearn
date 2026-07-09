import fs from "node:fs";
import path from "node:path";

function readEnvValue(contents, key) {
  return (contents.match(new RegExp(`^${key}=(.*)$`, "m")) || [])[1]
    ?.trim()
    .replace(/^['\"]|['\"]$/g, "");
}

function summarize(values) {
  const sorted = values.slice().sort((left, right) => left - right);
  return {
    avg: Math.round(sorted.reduce((sum, value) => sum + value, 0) / sorted.length),
    p50: sorted[Math.floor(sorted.length * 0.5)],
    p90: sorted[Math.floor(sorted.length * 0.9)],
    max: sorted[sorted.length - 1],
  };
}

async function runSuite({ name, model, body }, url, apiKey) {
  const runs = [];

  for (let index = 0; index < 5; index += 1) {
    const startedAt = Date.now();
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, ...body }),
    });

    if (!response.ok) {
      throw new Error(`${name}: ${await response.text()}`);
    }

    const json = await response.json();
    runs.push({
      ms: Date.now() - startedAt,
      promptTokens: json.usage?.prompt_tokens ?? null,
      completionTokens: json.usage?.completion_tokens ?? null,
    });
  }

  return {
    name,
    model,
    summary: summarize(runs.map((run) => run.ms)),
    runs,
    passesFiveSecondTarget: runs.every((run) => run.ms <= 5000),
  };
}

async function main() {
  const envPath = path.resolve(".env.local");
  const env = fs.readFileSync(envPath, "utf8");
  const apiUrl = readEnvValue(env, "EXPO_PUBLIC_GROK_API_URL") || "https://api.x.ai/v1";
  const apiKey = readEnvValue(env, "EXPO_PUBLIC_GROK_API_KEY");

  if (!apiKey) {
    throw new Error("Missing EXPO_PUBLIC_GROK_API_KEY in .env.local");
  }

  const chatUrl = `${apiUrl}/chat/completions`;
  const fastModel = process.env.EXPO_PUBLIC_GROK_BENCHMARK_MODEL || "grok-4-fast-non-reasoning";

  const suites = [
    {
      name: "question-turn-large-context",
      model: fastModel,
      body: {
        temperature: 0.5,
        max_tokens: 180,
        messages: [
          {
            role: "system",
            content: `You are a spoken tutor. Return only the exact next words to say out loud.

Style:
- Warm, direct, human.
- One short sentence by default. Use two only if needed.
- Keep replies under 25 words.

Rules:
- Answer the student's latest message directly before adding any transition.
- If the user asks a follow-up, answer it briefly and bridge back to the current fact in the same sentence.
- Do not ask a follow-up question.
- Never mention speech recognition, transcription, wording, or being an AI.
- No JSON, labels, bullets, markdown, analysis, or stage directions.
- Never use filler openers like "alright so", "here's the thing", "let me think about that", or "ok so".
- Never say "does that make sense?" or "do you have any questions?"

Session phase: teach
CURRENT FACT:
"The outer planets-Jupiter, Saturn, Uranus, and Neptune-are massive worlds mostly made of gas and ice."
PRIVATE NOTE: Use the temperature gradient in the early Solar System as the explanation anchor.`,
          },
          { role: "assistant", content: "Exactly. They are smaller and have solid surfaces." },
          { role: "user", content: "Why are they rocky instead of gaseous?" },
          { role: "assistant", content: "Because it was hotter near the Sun, so only rock and metal could condense there." },
          { role: "user", content: "How does that connect back to the formation idea?" },
        ],
      },
    },
    {
      name: "scoring-turn-current-prompt",
      model: fastModel,
      body: {
        temperature: 0,
        max_tokens: 120,
        messages: [
          {
            role: "system",
            content: `Score a student's spoken answer by MEANING - be generous with phrasing and STT errors.

Fact: "Prompt injection is a security risk where user-provided input contains instructions that override your system prompt."
Question asked: "Why is prompt injection a security risk?"
Score whether the student answered THIS question, not whether they recited every detail of the fact.
MEDIUM strictness - key terms and numbers must be correct; phrasing is flexible.
Score >= 3 = correct. LOW strictness: 2 = correct.

JSON only, no fences: {"score":<0-5>,"feedback":"<spoken response>","isCorrect":<bool>}

Feedback rules:
- Correct: 2-6 words max. Never repeat or paraphrase their answer.
- Wrong: 1 short sentence. Acknowledge any partial credit, then correct the gap directly. Do not ask a follow-up question.
- If the question asks for a short direct entity or number answer and the student gives that answer exactly, mark it correct even if they omit extra descriptive detail from the full fact.
- Never mention speech recognition, typos, wording, or transcription. React to meaning only.`,
          },
          {
            role: "user",
            content: 'Student said: "because the user can slip instructions in that override the system prompt"',
          },
        ],
      },
    },
  ];

  const results = [];
  for (const suite of suites) {
    results.push(await runSuite(suite, chatUrl, apiKey));
  }

  console.log(JSON.stringify({ model: fastModel, results }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});