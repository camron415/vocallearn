import type { Fact, Lesson } from "@/types/lesson";
import type {
  FactComplexity,
  FactTeachingPlan,
  HintStrategy,
  LessonTeachingPlan,
  TeachingFrameType,
} from "@/types/teaching";

function tokenize(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9']+/g) ?? [];
}

function countClauses(text: string): number {
  return (text.match(/[,:;]|\b(and|but|while|whereas|instead|because|which|that)\b/gi) ?? []).length;
}

function looksLikeEnumeration(text: string): boolean {
  const commaCount = (text.match(/,/g) ?? []).length;
  return commaCount >= 2 || /\b(first|second|third|fourth|finally)\b/i.test(text);
}

function countDistinctConcepts(fact: Fact): number {
  const text = `${fact.content} ${fact.explanation ?? ""}`;
  const matches = text.match(/\b(vs|versus|while|whereas|and|or)\b/gi) ?? [];
  return Math.max(1, matches.length + 1);
}

export function inferFactComplexity(fact: Fact): FactComplexity {
  const contentTokens = tokenize(fact.content);
  const clauseCount = countClauses(fact.content);
  const conceptCount = countDistinctConcepts(fact);
  const preciseStrictness = fact.strictness === "high";
  const denseSignals = [
    contentTokens.length >= 24,
    clauseCount >= 3,
    conceptCount >= 4,
    looksLikeEnumeration(fact.content),
  ].filter(Boolean).length;

  if (preciseStrictness && (contentTokens.length >= 12 || clauseCount >= 1)) {
    return "high_precision";
  }

  if (denseSignals >= 2) {
    return "dense";
  }

  if (contentTokens.length >= 14 || clauseCount >= 2 || conceptCount >= 3) {
    return "moderate";
  }

  return "simple";
}

function pickLessonFrameType(lesson: Lesson, facts: Fact[]): TeachingFrameType {
  const joined = `${lesson.title} ${lesson.description ?? ""} ${facts.map((fact) => `${fact.content} ${fact.tags?.join(" ") ?? ""}`).join(" ")}`;

  if (/\b(flow|pipeline|request|lifecycle|queue|background|process|steps?)\b/i.test(joined)) {
    return "pipeline";
  }

  if (/\b(compare|contrast|versus|vs\.?|difference|tradeoff|trade-off|authentication|authorization)\b/i.test(joined)) {
    return "contrast";
  }

  if (/\barchitecture|system|components?|roles?|ownership|state|contracts?\b/i.test(joined)) {
    return "operating_model";
  }

  if (/\bchecklist|criteria|requirements|review|quality|validation|accessibility\b/i.test(joined)) {
    return "checklist";
  }

  return "analogy";
}

function buildLessonFrame(frameType: TeachingFrameType, lesson: Lesson): LessonTeachingPlan {
  switch (frameType) {
    case "pipeline":
      return {
        frameType,
        frameLabel: "relay pipeline",
        frameDescription: `Teach ${lesson.title} as work moving through a sequence of handoffs so each step has a clear job and failure point.`,
        frameKeywords: ["handoff", "sequence", "step", "flow"],
      };
    case "contrast":
      return {
        frameType,
        frameLabel: "compare and separate",
        frameDescription: `Teach ${lesson.title} by keeping nearby concepts distinct so the student remembers what each thing is and is not.`,
        frameKeywords: ["versus", "difference", "boundary", "tradeoff"],
      };
    case "operating_model":
      return {
        frameType,
        frameLabel: "team operating model",
        frameDescription: `Teach ${lesson.title} as a system of roles, boundaries, and responsibilities that work together.`,
        frameKeywords: ["role", "boundary", "owner", "contract"],
      };
    case "checklist":
      return {
        frameType,
        frameLabel: "quality checklist",
        frameDescription: `Teach ${lesson.title} as a repeatable checklist the student can run in their head during work or an interview.`,
        frameKeywords: ["checklist", "criteria", "signals", "quality"],
      };
    default:
      return {
        frameType: "analogy",
        frameLabel: "memory anchor",
        frameDescription: `Teach ${lesson.title} with one concrete memory anchor that keeps abstract ideas tied to something familiar.`,
        frameKeywords: ["anchor", "concrete", "analogy", "memory"],
      };
  }
}

function pickHintStrategy(frameType: TeachingFrameType, complexity: FactComplexity): HintStrategy {
  if (frameType === "analogy") return "analogy_then_context";
  if (frameType === "checklist") return "checklist_then_contrast";
  if (frameType === "contrast") return "contrast_then_example";
  return complexity === "dense" || complexity === "high_precision"
    ? "mechanism_then_example"
    : "context_then_contrast";
}

function pickExpectedRecallDepth(fact: Fact, complexity: FactComplexity): FactTeachingPlan["expectedRecallDepth"] {
  if (fact.strictness === "high") return "precise_wording";
  if (complexity === "dense" || complexity === "high_precision") return "key_distinction";
  return "core_meaning";
}

function buildMemoryHooks(fact: Fact, lessonPlan: LessonTeachingPlan): string[] {
  const tagHooks = (fact.tags ?? []).map((tag) => tag.replace(/[_-]+/g, " ").trim()).filter(Boolean);
  const contentHooks = fact.content
    .split(/[,:;]/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 4)
    .slice(0, 2);

  return Array.from(new Set([...lessonPlan.frameKeywords, ...tagHooks, ...contentHooks])).slice(0, 6);
}

export function inferLessonTeachingPlan(lesson: Lesson, facts: Fact[]): LessonTeachingPlan {
  const frameType = pickLessonFrameType(lesson, facts);
  return buildLessonFrame(frameType, lesson);
}

export function inferFactTeachingPlan(fact: Fact, lessonPlan: LessonTeachingPlan): FactTeachingPlan {
  const complexity = inferFactComplexity(fact);

  return {
    complexity,
    teachingPasses: complexity === "dense" || complexity === "high_precision" ? 2 : 1,
    hintStrategy: pickHintStrategy(lessonPlan.frameType, complexity),
    initialReteachStrategy: "reword_same_lens",
    memoryHooks: buildMemoryHooks(fact, lessonPlan),
    expectedRecallDepth: pickExpectedRecallDepth(fact, complexity),
  };
}
