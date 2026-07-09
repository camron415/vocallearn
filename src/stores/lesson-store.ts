import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { Fact, Lesson, LessonCompletion, Module, Subject, UserFactProgress } from "@/types/lesson";
import type { GeneratedLesson } from "@/lib/grok";
import { inferFactTeachingPlan, inferLessonTeachingPlan } from "@/engine/teaching-plan";
import { createDefaultLearningProfile } from "@/engine/fact-learning";

export interface ModuleWithLessons extends Module {
  lessons: Lesson[];
  lessonCount: number;
}

export interface SubjectWithLessons extends Subject {
  lessons: Lesson[];
  modules: ModuleWithLessons[];
  lessonCount: number;
}

interface LessonState {
  subjects: SubjectWithLessons[];
  currentLesson: Lesson | null;
  currentFacts: Fact[];
  userProgress: Map<string, UserFactProgress>;
  completions: Map<string, LessonCompletion>;
  loading: boolean;
  error: string | null;
  fetchSubjects: () => Promise<void>;
  fetchLessonWithFacts: (lessonId: string) => Promise<void>;
  fetchUserProgress: (lessonId: string) => Promise<void>;
  fetchCompletions: () => Promise<void>;
  recordCompletion: (lessonId: string, factsTotal: number, factsCorrect: number, durationSeconds: number) => Promise<void>;
  getNextLesson: (subjectId: string) => Lesson | null;
  createLessonFromGenerated: (generated: GeneratedLesson) => Promise<string>;
}

const AI_SUBJECT_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const JUNIOR_INTERVIEW_SUBJECT_ID = "7b0c1d2e-3f40-4567-89ab-cdef01234567";
const CAREER_PREP_SUBJECT_ID = "a9b8c7d6-e5f4-4321-abcd-ef9876543210";

const UNLOCK_ALL_LESSONS_SUBJECT_IDS = new Set([
  JUNIOR_INTERVIEW_SUBJECT_ID,
  CAREER_PREP_SUBJECT_ID,
]);
const REMOVED_AI_LESSON_IDS = new Set([
  "d4e5f6a7-b8c9-0123-def0-123456789903",
]);

const AI_SYNTHETIC_MODULES = [
  {
    id: "ai-foundations",
    title: "Foundations",
    description: "Core mental models for what large language models are doing under the hood.",
    lessonIds: ["b2c3d4e5-f6a7-8901-bcde-f12345678901"],
  },
  {
    id: "ai-prompting",
    title: "Prompting",
    description: "How developers steer behavior at inference time.",
    lessonIds: ["c3d4e5f6-a7b8-9012-cdef-012345678902"],
  },
  {
    id: "ai-model-internals",
    title: "Model Internals",
    description: "Training objectives, embeddings, and tool-augmented reasoning.",
    lessonIds: [
      "e5f60718-c9da-1234-ef01-234567899004",
      "f6071829-d0eb-2345-f012-3456789a9005",
      "0718293a-e1fc-3456-a123-456789ab9006",
    ],
  },
  {
    id: "ai-knowledge-safety",
    title: "Knowledge and Safety",
    description: "Multimodal inputs, retrieval systems, and evaluation guardrails.",
    lessonIds: [
      "18293a4b-f20d-4567-b234-56789abc9007",
      "293a4b5c-031e-5678-c345-6789abcd9008",
      "3a4b5c6d-142f-6789-d456-789abcde9009",
    ],
  },
  {
    id: "ai-advanced-practice",
    title: "Advanced Practice",
    description: "Customization, product design, and realistic limits of current AI systems.",
    lessonIds: [
      "4b5c6d7e-2530-789a-e567-89abcdef9010",
      "5c6d7e8f-3641-89ab-f678-9abcdef09011",
      "6d7e8f90-4752-9abc-a789-abcdef019012",
    ],
  },
] as const;

const AI_SYNTHETIC_LESSON_MODULE_MAP = Object.fromEntries(
  AI_SYNTHETIC_MODULES.flatMap((module) => module.lessonIds.map((lessonId) => [lessonId, module.id]))
) as Record<string, string>;

function isLegacyCurriculumSchemaError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;

  return (
    error.code === "42703" ||
    error.code === "42P01" ||
    error.message?.includes("module_id") === true ||
    error.message?.includes("unlock_threshold") === true ||
    error.message?.includes("modules") === true
  );
}

function normalizeLesson(rawLesson: any): Lesson {
  return {
    id: rawLesson.id,
    subject_id: rawLesson.subject_id,
    module_id: rawLesson.module_id ?? null,
    title: rawLesson.title,
    description: rawLesson.description,
    order_index: rawLesson.order_index,
    unlock_threshold: rawLesson.unlock_threshold ?? 0.7,
    teaching_plan: rawLesson.teaching_plan ?? null,
    is_community: rawLesson.is_community,
    created_by: rawLesson.created_by,
    created_at: rawLesson.created_at,
  };
}

const FACT_OVERRIDES: Record<string, Partial<Fact>> = {};

function normalizeFact(rawFact: any): Fact {
  const override = FACT_OVERRIDES[`${rawFact.lesson_id}:${rawFact.order_index}`] ?? {};

  return {
    id: rawFact.id,
    lesson_id: rawFact.lesson_id,
    content: override.content ?? rawFact.content,
    explanation: override.explanation ?? rawFact.explanation ?? null,
    strictness: rawFact.strictness,
    order_index: rawFact.order_index,
    tags: rawFact.tags ?? null,
    teaching_plan: rawFact.teaching_plan ?? null,
    created_at: rawFact.created_at,
  };
}

function applySyntheticAiModules(subject: SubjectWithLessons): SubjectWithLessons {
  const lessons: Lesson[] = subject.lessons
    .filter((lesson) => !REMOVED_AI_LESSON_IDS.has(lesson.id))
    .map((lesson) => ({
      ...lesson,
      module_id: AI_SYNTHETIC_LESSON_MODULE_MAP[lesson.id] ?? lesson.module_id,
    }));

  const lessonsById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const modules: ModuleWithLessons[] = AI_SYNTHETIC_MODULES.map((module, index) => {
    const moduleLessons = module.lessonIds
      .map((lessonId): Lesson | undefined => lessonsById.get(lessonId))
      .filter((lesson): lesson is Lesson => lesson !== undefined)
      .sort((a, b) => a.order_index - b.order_index);

    return {
      id: module.id,
      subject_id: subject.id,
      title: module.title,
      description: module.description,
      order_index: index + 1,
      created_at: subject.created_at,
      lessons: moduleLessons,
      lessonCount: moduleLessons.length,
    };
  }).filter((module) => module.lessonCount > 0);

  return {
    ...subject,
    lessons,
    modules,
  };
}

function mapSubjectsWithLessons(rows: any[], includeModules: boolean): SubjectWithLessons[] {
  return rows.map((subject: any) => {
    const mappedSubject: SubjectWithLessons = {
      id: subject.id,
      name: subject.name,
      description: subject.description,
      icon: subject.icon,
      is_community: subject.is_community,
      created_by: subject.created_by,
      created_at: subject.created_at,
      lessons: (subject.lessons ?? []).map(normalizeLesson).sort((a: Lesson, b: Lesson) => a.order_index - b.order_index),
      modules: includeModules
        ? (subject.modules ?? [])
            .map((module: any) => ({
              id: module.id,
              subject_id: module.subject_id,
              title: module.title,
              description: module.description,
              order_index: module.order_index,
              created_at: module.created_at,
              lessons: (module.lessons ?? []).map(normalizeLesson).sort((a: Lesson, b: Lesson) => a.order_index - b.order_index),
              lessonCount: module.lessons?.length ?? 0,
            }))
            .sort((a: ModuleWithLessons, b: ModuleWithLessons) => a.order_index - b.order_index)
        : [],
      lessonCount: subject.lessons?.length ?? 0,
    };

    if (mappedSubject.id === AI_SUBJECT_ID && mappedSubject.modules.length === 0) {
      return applySyntheticAiModules(mappedSubject);
    }

    return mappedSubject;
  });
}

export const useLessonStore = create<LessonState>((set, get) => ({
  subjects: [],
  currentLesson: null,
  currentFacts: [],
  userProgress: new Map(),
  completions: new Map(),
  loading: false,
  error: null,

  fetchSubjects: async () => {
    set({ loading: true, error: null });
    try {
      const moduleAwareResult = await supabase
        .from("subjects")
        .select(`
          *,
          lessons(id, title, description, order_index, subject_id, module_id, unlock_threshold, is_community, created_by, created_at),
          modules(id, subject_id, title, description, order_index, created_at, lessons(id, title, description, order_index, subject_id, module_id, unlock_threshold, is_community, created_by, created_at))
        `)
        .order("name");

      let data = moduleAwareResult.data ?? [];

      if (moduleAwareResult.error) {
        if (!isLegacyCurriculumSchemaError(moduleAwareResult.error)) {
          throw moduleAwareResult.error;
        }

        const legacyResult = await supabase
          .from("subjects")
          .select(`
            *,
            lessons(id, title, description, order_index, subject_id, is_community, created_by, created_at)
          `)
          .order("name");

        if (legacyResult.error) throw legacyResult.error;

        set({ subjects: mapSubjectsWithLessons(legacyResult.data ?? [], false), loading: false });
        return;
      }

      const subjects = mapSubjectsWithLessons(data, true);

      set({ subjects, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  fetchLessonWithFacts: async (lessonId: string) => {
    set({ loading: true, error: null, currentLesson: null, currentFacts: [] });
    try {
      const [lessonResult, factsResult] = await Promise.all([
        supabase.from("lessons").select("*").eq("id", lessonId).single(),
        supabase.from("facts").select("*").eq("lesson_id", lessonId).order("order_index"),
      ]);

      if (lessonResult.error) throw lessonResult.error;
      if (factsResult.error) throw factsResult.error;

      const normalizedLesson = normalizeLesson(lessonResult.data);
      const normalizedFacts = (factsResult.data ?? []).map(normalizeFact);
      const lessonPlan = normalizedLesson.teaching_plan ?? inferLessonTeachingPlan(normalizedLesson, normalizedFacts);
      const factsWithPlans = normalizedFacts.map((fact) => ({
        ...fact,
        teaching_plan: fact.teaching_plan ?? inferFactTeachingPlan(fact, lessonPlan),
      }));

      set({
        currentLesson: { ...normalizedLesson, teaching_plan: lessonPlan },
        currentFacts: factsWithPlans,
        loading: false,
      });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  fetchUserProgress: async (lessonId: string) => {
    try {
      set({ userProgress: new Map() });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: facts } = await supabase
        .from("facts")
        .select("id")
        .eq("lesson_id", lessonId);

      if (!facts || facts.length === 0) return;

      const factIds = facts.map((f) => f.id);
      const { data: progress } = await supabase
        .from("user_fact_progress")
        .select("*")
        .eq("user_id", session.user.id)
        .in("fact_id", factIds);

      const progressMap = new Map<string, UserFactProgress>();
      (progress ?? []).forEach((p: any) => {
        progressMap.set(p.fact_id, {
          ...(p as UserFactProgress),
          learning_profile: p.learning_profile ?? createDefaultLearningProfile(),
        });
      });

      set({ userProgress: progressMap });
    } catch (e: any) {
      console.error("Failed to fetch user progress:", e.message);
    }
  },

  fetchCompletions: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from("lesson_completions")
        .select("*")
        .eq("user_id", session.user.id);

      const completionMap = new Map<string, LessonCompletion>();
      (data ?? []).forEach((c: any) => {
        completionMap.set(c.lesson_id, c as LessonCompletion);
      });

      set({ completions: completionMap });
    } catch (e: any) {
      console.error("Failed to fetch completions:", e.message);
    }
  },

  recordCompletion: async (lessonId: string, _factsTotal: number, _factsCorrect: number, durationSeconds: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const existing = get().completions.get(lessonId);
      const { data: facts, error: factsError } = await supabase
        .from("facts")
        .select("id")
        .eq("lesson_id", lessonId);
      if (factsError) throw factsError;

      const lessonFacts = facts ?? [];
      const factIds = lessonFacts.map((fact: { id: string }) => fact.id);
      const { data: progress, error: progressError } = factIds.length > 0
        ? await supabase
            .from("user_fact_progress")
            .select("fact_id, times_correct")
            .eq("user_id", session.user.id)
            .in("fact_id", factIds)
        : { data: [], error: null };

      if (progressError) throw progressError;

      const masteredFactIds = new Set(
        (progress ?? [])
          .filter((row: { times_correct: number | null }) => (row.times_correct ?? 0) > 0)
          .map((row: { fact_id: string }) => row.fact_id)
      );
      const factsTotal = lessonFacts.length;
      const factsCorrect = lessonFacts.filter((fact: { id: string }) => masteredFactIds.has(fact.id)).length;
      const masteryAccuracy = factsTotal > 0 ? factsCorrect / factsTotal : 0;

      await supabase.from("lesson_completions").upsert(
        {
          user_id: session.user.id,
          lesson_id: lessonId,
          completed_at: new Date().toISOString(),
          times_completed: (existing?.times_completed ?? 0) + 1,
          facts_total: factsTotal,
          facts_correct: factsCorrect,
          best_accuracy: Math.max(existing?.best_accuracy ?? 0, masteryAccuracy),
          last_duration_seconds: durationSeconds,
        },
        { onConflict: "user_id,lesson_id" }
      );

      // Refresh completions
      await get().fetchCompletions();
    } catch (e: any) {
      console.error("Failed to record completion:", e.message);
    }
  },

  getNextLesson: (subjectId: string) => {
    const { subjects, completions } = get();
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return null;

    const sorted = [...subject.lessons].sort((a, b) => a.order_index - b.order_index);

    if (UNLOCK_ALL_LESSONS_SUBJECT_IDS.has(subjectId)) {
      return sorted.find((lesson) => !completions.has(lesson.id)) ?? sorted[0] ?? null;
    }

    return sorted.find((lesson) => (completions.get(lesson.id)?.best_accuracy ?? 0) < lesson.unlock_threshold) ?? null;
  },

  createLessonFromGenerated: async (generated: GeneratedLesson) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    // Find or create the subject
    let subjectId: string;
    const { data: existingSubject } = await supabase
      .from("subjects")
      .select("id")
      .eq("name", generated.subjectName)
      .eq("created_by", session.user.id)
      .single();

    if (existingSubject) {
      subjectId = existingSubject.id;
    } else {
      const { data: newSubject, error } = await supabase
        .from("subjects")
        .insert({
          name: generated.subjectName,
          description: null,
          icon: null,
          is_community: false,
          created_by: session.user.id,
        })
        .select("id")
        .single();
      if (error) throw error;
      subjectId = newSubject.id;
    }

    // Get next order_index for lessons in this subject
    const { data: existingLessons } = await supabase
      .from("lessons")
      .select("order_index")
      .eq("subject_id", subjectId)
      .order("order_index", { ascending: false })
      .limit(1);

    const nextIndex = (existingLessons?.[0]?.order_index ?? -1) + 1;

    // Create the lesson
    const moduleAwareLessonValues = {
      subject_id: subjectId,
      module_id: null,
      title: generated.lessonTitle,
      description: generated.lessonDescription,
      order_index: nextIndex,
      unlock_threshold: 0.7,
      is_community: false,
      created_by: session.user.id,
    } as any;

    const moduleAwareLessonInsert = await supabase
      .from("lessons")
      .insert(moduleAwareLessonValues)
      .select("id")
      .single();

    let lesson = moduleAwareLessonInsert.data;

    if (moduleAwareLessonInsert.error) {
      if (!isLegacyCurriculumSchemaError(moduleAwareLessonInsert.error)) {
        throw moduleAwareLessonInsert.error;
      }

      const legacyLessonValues = {
        subject_id: subjectId,
        title: generated.lessonTitle,
        description: generated.lessonDescription,
        order_index: nextIndex,
        is_community: false,
        created_by: session.user.id,
      } as any;

      const legacyLessonInsert = await supabase
        .from("lessons")
        .insert(legacyLessonValues)
        .select("id")
        .single();

      if (legacyLessonInsert.error) throw legacyLessonInsert.error;
      lesson = legacyLessonInsert.data;
    }

    if (!lesson) throw new Error("Failed to create lesson");

    // Insert facts
    const factsToInsert = generated.facts.map((f, i) => ({
      lesson_id: lesson.id,
      content: f.content,
      explanation: f.explanation,
      strictness: f.strictness,
      order_index: i,
      tags: null,
    }));

    const { error: factsError } = await supabase.from("facts").insert(factsToInsert);
    if (factsError) {
      // Roll back the lesson so we don't leave an empty shell
      await supabase.from("lessons").delete().eq("id", lesson.id);
      throw factsError;
    }

    // Refresh subjects list
    await get().fetchSubjects();

    return lesson.id;
  },
}));
