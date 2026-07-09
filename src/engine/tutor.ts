import type { GrokMessage } from "@/lib/grok";
import type { Fact, UserFactProgress } from "@/types/lesson";

// Seven depth-processing techniques drawn from cognitive science.
// Each activates a different mechanism that drives durable memory encoding.
// Picked deterministically per fact ID so the same fact always gets the same
// technique — varied across facts within a lesson.
const DEPTH_TECHNIQUES = [
  "Use an analogy: connect this concept to something the student definitely already knows from everyday life. Make the comparison explicit.",
  "Lead with consequence: explain what goes wrong, breaks, or stays confusing if someone doesn't understand this — make the stakes real before stating the fact.",
  "Open with the misconception: start with what most people wrongly assume about this, then correct it. The contrast is what makes it stick.",
  "Make it concrete: give a specific example with real names, numbers, or a scenario the student can picture. Abstractions don't stick; specifics do.",
  "Explain the mechanism: don't just say what is true — explain why it must be true, or how it works step by step. Causal understanding beats memorization.",
  "Callback to an earlier fact: explicitly connect this to something from earlier in this lesson. Say the link out loud — 'remember when we talked about X? This is why that matters.'",
  "End with a generative question: after explaining, ask a 'what would happen if...' or 'so why do you think...' question. Don't answer it — let them think. Active generation doubles retention.",
] as const;

/** Deterministic technique pick per fact — consistent within a session, varied across facts. */
function pickDepthTechnique(factId: string): string {
  let hash = 0;
  for (let i = 0; i < factId.length; i++) {
    hash = (hash * 31 + factId.charCodeAt(i)) >>> 0;
  }
  return DEPTH_TECHNIQUES[hash % DEPTH_TECHNIQUES.length];
}

function getMasteryLabel(progress: UserFactProgress | undefined): string {
  if (!progress) return "new";
  if (progress.mastery_level >= 4) return "mastered";
  if (progress.mastery_level >= 2) return "learning";
  return "struggling";
}

function buildLessonSnapshot(
  facts: Fact[],
  progress: Map<string, UserFactProgress>,
  currentFact: Fact | null
): string {
  if (facts.length === 0) return "- No lesson facts loaded.";

  if (!currentFact) {
    return facts
      .slice(0, 4)
      .map((fact, index) => `- [${index + 1}/${facts.length}] [${getMasteryLabel(progress.get(fact.id))}] ${fact.content}`)
      .join("\n");
  }

  const currentIndex = Math.max(0, facts.findIndex((fact) => fact.id === currentFact.id));
  const start = Math.max(0, currentIndex - 1);
  const end = Math.min(facts.length, currentIndex + 3);

  return facts
    .slice(start, end)
    .map((fact, index) => {
      const absoluteIndex = start + index;
      const marker = fact.id === currentFact.id ? "current" : absoluteIndex < currentIndex ? "recent" : "next";
      return `- [${marker}] [${absoluteIndex + 1}/${facts.length}] [${getMasteryLabel(progress.get(fact.id))}] ${fact.content}`;
    })
    .join("\n");
}

/**
 * Builds the live system message for every conversational Grok call.
 * Keeps only the current fact plus nearby lesson context to reduce voice-turn latency.
 */
export function buildSessionSystemMessage(
  facts: Fact[],
  progress: Map<string, UserFactProgress>,
  currentFact: Fact | null,
  phase: string
): string {
  const depthInstruction = currentFact
    ? pickDepthTechnique(currentFact.id)
    : "";
  const lessonSnapshot = buildLessonSnapshot(facts, progress, currentFact);

  const masteryLevel = currentFact ? (progress.get(currentFact.id)?.mastery_level ?? 0) : 0;
  const socraticNote =
    masteryLevel >= 2 && phase === "teach"
      ? `\nStudent already has some exposure (${masteryLevel}/5 mastery). Briefly validate or recall what they know before filling the gap.`
      : "";

  const currentFactBlock = currentFact
    ? `\nCURRENT FOCUS:
Fact: "${currentFact.content}"
Strictness: ${currentFact.strictness}${currentFact.explanation ? `
Teaching notes (private prep, never mention as if already said): ${currentFact.explanation}` : ""}
Teaching approach: ${depthInstruction}${socraticNote}
`
    : "";

  return `You are a spoken tutor. Return only the exact next words to say out loud.

Style:
- Warm, direct, human.
- Default to 1-2 short sentences.
- Keep most replies under 35 words.
- If you are actively teaching the current fact, you may use up to 3 short sentences.

Rules:
- Use only facts from CURRENT FOCUS, LESSON SNAPSHOT, and the conversation history.
- Answer the student's latest message directly before adding any transition.
- Never mention speech recognition, transcription, wording, or being an AI.
- No JSON, labels, bullets, markdown, analysis, or stage directions.
- Never use filler openers like "alright so", "here's the thing", "let me think about that", or "ok so".
- Avoid empty closers like "does that make sense?" or repeating "do you have any questions?" without a clear purpose.
- The Teaching notes are private prep. Never imply the student already heard them.

Session phase: ${phase}${currentFactBlock}
LESSON SNAPSHOT:
${lessonSnapshot}`;
}

export function buildFastTurnSystemMessage(currentFact: Fact | null, phase: string): string {
  const phaseInstruction =
    phase === "teach"
      ? "If the user asks a follow-up, answer it briefly, bridge back to the current fact, and you may end with one short closing question if it keeps the lesson moving."
      : "Answer briefly and stay anchored to the current fact.";
  const followUpRule =
    phase === "teach"
      ? "You may ask one short follow-up question when it clearly closes the side question and moves the lesson forward."
      : "Do not ask a follow-up question.";

  const privateNote = currentFact?.explanation
    ? currentFact.explanation.split(/[.!?]/)[0]?.trim()
    : "";

  const currentFactBlock = currentFact
    ? `CURRENT FACT:\n"${currentFact.content}"${privateNote ? `\nPRIVATE NOTE: ${privateNote}.` : ""}`
    : "CURRENT FACT:\nNo fact loaded.";

  return `You are a spoken tutor. Return only the exact next words to say out loud.

Style:
- Warm, direct, human.
- One short sentence by default. Use two only if needed.
- Keep replies under 25 words.

Rules:
- Answer the student's latest message directly.
- ${phaseInstruction}
- ${followUpRule}
- No markdown, labels, bullet points, analysis, or filler openers.
- Never mention speech recognition, wording, or being an AI.

Session phase: ${phase}
${currentFactBlock}`;
}

/**
 * Builds the evaluation prompt for scoring a user's response.
 * Pass `question` (the specific quiz question asked) so the model
 * scores the answer against what was actually asked, not the full fact text.
 */
export function buildEvaluationPrompt(
  fact: Fact,
  userResponse: string,
  question?: string
): GrokMessage[] {
  const strictnessGuide =
    fact.strictness === "high"
      ? "HIGH strictness — exact values/terms required."
      : fact.strictness === "medium"
        ? "MEDIUM strictness — key numbers and distinctions must be correct, but do not fail a spoken answer just because a technical label is slightly garbled if the mechanism is clearly right."
        : "LOW strictness — general understanding is enough, but the core idea still needs to be there. Be generous, not careless.";

  const questionContext = question
    ? `\nQuestion asked: "${question}"\nScore whether the student answered THIS question, not whether they recited every detail of the fact.`
    : "";

  return [
    {
      role: "system",
      content: `Score a student's spoken answer by MEANING — be generous with phrasing and STT errors.

Fact: "${fact.content}"${questionContext}
${strictnessGuide}
    Score 3-5 = correct. Score 2 = partial understanding but still incorrect.

JSON only, no fences: {"score":<0-5>,"feedback":"<spoken response>","isCorrect":<bool>}

Feedback rules:
    - Score 5: one short upbeat sentence, 2-6 words max. Never repeat or paraphrase their answer.
    - Score 4: one short upbeat sentence, optionally naming one small missing detail.
    - Score 3: one short sentence that says they are on the right track and adds the missing key idea.
    - Score 0-2: 1-2 short sentences. Acknowledge any partial credit, correct the gap directly, and clearly tell the student to try again in their own words.
- If the question asks for a short direct entity or number answer and the student gives that answer exactly, mark it correct even if they omit extra descriptive detail from the full fact.
- Spoken answers may contain STT-garbled technical labels. If the student clearly describes the right mechanism, count it correct unless the mistaken term changes the underlying meaning.
- Example: if the fact is few-shot prompting and the student says "fuchsia" but correctly describes giving example input/output pairs to show the format, that is still correct.
- Never mention speech recognition, typos, wording, or transcription. React to meaning only.`,
    },
    {
      role: "user",
      content: `Student said: "${userResponse}"`,
    },
  ];
}

/**
 * Parse the AI's evaluation response.
 */
export function parseEvaluation(response: string): {
  score: number;
  feedback: string;
  isCorrect: boolean;
} {
  try {
    // Strip markdown code fences if present
    let cleaned = response.trim();
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: Math.max(0, Math.min(5, Number(parsed.score) || 0)),
        feedback: String(parsed.feedback || ""),
        isCorrect: Boolean(parsed.isCorrect),
      };
    }
  } catch {
    // Fallback if JSON parsing fails
  }

  return {
    score: 2,
    feedback: "I had trouble evaluating that. Let's try again.",
    isCorrect: false,
  };
}
