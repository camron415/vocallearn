import type { Fact, Lesson } from "@/types/lesson";
import type { FactLearningProfile, LessonTeachingPlan } from "@/types/teaching";
import { inferFactTeachingPlan, inferLessonTeachingPlan } from "@/engine/teaching-plan";

const TEACH_FACT_BRIDGES = [
  "So here's what you need to know:",
  "Bottom line:",
  "Here's the key idea:",
  "And the thing to hold onto:",
  "Here's what matters:",
];

function pickDeterministic<T>(items: T[], seed: string): T {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return items[hash % items.length];
}

function firstSentence(text: string | null | undefined): string | null {
  const sentence = text?.trim().split(/(?<=[.!?])\s+/)[0]?.trim();
  return sentence ? sentence : null;
}

function buildScaffoldLine(fact: Fact, lessonPlan: LessonTeachingPlan): string | null {
  const explanationLead = firstSentence(fact.explanation);
  if (explanationLead) return explanationLead;

  const factPlan = fact.teaching_plan ?? inferFactTeachingPlan(fact, lessonPlan);
  const hook = factPlan.memoryHooks[0];
  if (!hook) return null;

  switch (lessonPlan.frameType) {
    case "pipeline":
      return `Think of this as one step in the ${lessonPlan.frameLabel}: ${hook}.`;
    case "contrast":
      return `Keep the boundary clear here: ${hook}.`;
    case "checklist":
      return `Put this on your ${lessonPlan.frameLabel}: ${hook}.`;
    case "operating_model":
      return `Place this in the system: ${hook}.`;
    default:
      return `Use this memory anchor: ${hook}.`;
  }
}

export function buildTeachScript(
  fact: Fact,
  lesson?: Lesson | null,
  lessonPlan?: LessonTeachingPlan | null
): string {
  const resolvedLessonPlan = lessonPlan ?? lesson?.teaching_plan ?? inferLessonTeachingPlan(lesson ?? {
    id: fact.lesson_id,
    subject_id: "",
    module_id: null,
    title: "Lesson",
    description: null,
    order_index: fact.order_index,
    unlock_threshold: 0.7,
    is_community: false,
    created_by: null,
    created_at: "",
  }, [fact]);
  const factPlan = fact.teaching_plan ?? inferFactTeachingPlan(fact, resolvedLessonPlan);
  const scaffoldLine = buildScaffoldLine(fact, resolvedLessonPlan);
  const bridge = pickDeterministic(TEACH_FACT_BRIDGES, fact.id);

  if (factPlan.teachingPasses === 2 && scaffoldLine) {
    return `${scaffoldLine} ${bridge} ${fact.content}`;
  }

  if (scaffoldLine) {
    return `${scaffoldLine} ${fact.content}`;
  }

  return `${bridge} ${fact.content}`;
}

export function buildRecallHint(
  fact: Fact,
  hintLevel: 1 | 2,
  lessonPlan: LessonTeachingPlan,
  learningProfile?: FactLearningProfile | null
): string {
  const factPlan = fact.teaching_plan ?? inferFactTeachingPlan(fact, lessonPlan);
  const primaryHook = factPlan.memoryHooks[0];
  const secondaryHook = factPlan.memoryHooks[1] ?? factPlan.memoryHooks[0];

  if (hintLevel === 1) {
    if (factPlan.hintStrategy === "analogy_then_context" && primaryHook) {
      return `Hint: think back to ${primaryHook}. Use that memory handle and say the idea, not the exact sentence.`;
    }
    if (factPlan.hintStrategy === "checklist_then_contrast" && primaryHook) {
      return `Hint: put this on your mental checklist under ${primaryHook}. What job is it doing?`;
    }
    if (factPlan.hintStrategy === "contrast_then_example" && secondaryHook) {
      return `Hint: separate it from ${secondaryHook}. What makes this one different?`;
    }
    return "Hint: focus on the core job, contrast, or consequence in the idea and try again.";
  }

  if (factPlan.hintStrategy === "analogy_then_context" && secondaryHook) {
    return `Stronger hint: stay with ${secondaryHook}. Name the idea it was helping you remember.`;
  }
  if (factPlan.hintStrategy === "mechanism_then_example") {
    return `Stronger hint: name the mechanism or moving part first, then give the idea it points to.`;
  }
  if (factPlan.hintStrategy === "contrast_then_example" && primaryHook) {
    return `Stronger hint: compare it against ${primaryHook}, then give the fact.`;
  }

  return learningProfile?.needsReteach
    ? "Stronger hint: retrieve the main distinction first, then say the fact in one clean line."
    : "Stronger hint: name the core distinction or job first, then give the fact.";
}

export function buildRevealPrompt(fact: Fact): string {
  return `Here's the answer: ${fact.content} Say it back once as best you can, then we'll move on.`;
}

export function buildReviewPrompt(
  fact: Fact,
  lessonPlan: LessonTeachingPlan,
  learningProfile?: FactLearningProfile | null
): string {
  const factPlan = fact.teaching_plan ?? inferFactTeachingPlan(fact, lessonPlan);
  const scaffoldLine = buildScaffoldLine(fact, lessonPlan);

  if (learningProfile?.needsReteach) {
    if (learningProfile.nextReteachStrategy === "alternate_lens") {
      const hook = factPlan.memoryHooks[1] ?? factPlan.memoryHooks[0];
      return hook
        ? `Let's revisit this from a different angle. Think about ${hook}. Now what's the fact?`
        : "Let's revisit this from a different angle. What's the fact now?";
    }

    return scaffoldLine
      ? `Let's try this one again. ${scaffoldLine} Now what's the fact?`
      : "Let's try this one again. Give me the fact in your own words.";
  }

  return buildRecallHint(fact, 1, lessonPlan, learningProfile);
}
