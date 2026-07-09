import { COLORS } from "@/constants/config";
import {
  getFactMemoryState,
  type FactMemoryState,
  type FactProgress,
} from "@/engine/spaced-repetition";
import { supabase } from "@/lib/supabase";
import type { SubjectWithLessons } from "@/stores/lesson-store";

export interface ReviewLessonSummary {
  lessonId: string;
  lessonTitle: string;
  subjectId: string;
  subjectName: string;
  trackedFacts: number;
  dueNow: number;
  dueSoon: number;
  learning: number;
  review: number;
  solid: number;
  mastered: number;
  nextReviewAt: string | null;
}

export interface ReviewSubjectSummary {
  subjectId: string;
  subjectName: string;
  trackedFacts: number;
  dueNow: number;
  dueSoon: number;
  learning: number;
  review: number;
  solid: number;
  mastered: number;
  lessonsDueNow: number;
  nextReviewAt: string | null;
  queueLessonIds: string[];
}

export interface ReviewOverview {
  trackedFacts: number;
  dueNow: number;
  dueSoon: number;
  learning: number;
  review: number;
  stable: number;
  mastered: number;
  dueLessons: number;
}

export interface ReviewSnapshot {
  overview: ReviewOverview;
  lessons: ReviewLessonSummary[];
  subjects: ReviewSubjectSummary[];
  queueLessonIds: string[];
  nextDueLesson: ReviewLessonSummary | null;
}

export interface ReviewFactRow {
  fact_id: string;
  next_review_at: string;
  last_reviewed_at: string;
  mastery_level: number;
  repetitions: number;
  interval_days: number;
  times_correct: number;
  times_incorrect: number;
  facts?: {
    lesson_id?: string;
    lessons?: {
      id?: string;
      title?: string;
    };
  };
}

export interface ReviewMixSummary {
  dueNow: number;
  learning: number;
  review: number;
  solid: number;
  mastered: number;
}

export const REVIEW_SOON_WINDOW_DAYS = 3;

export const MEMORY_STATE_META: Record<FactMemoryState, { label: string; color: string; bg: string }> = {
  new: { label: "New", color: COLORS.textSecondary, bg: COLORS.bgElevated },
  learning: { label: "Learning", color: COLORS.blue, bg: "rgba(0, 122, 255, 0.10)" },
  review: { label: "Review", color: COLORS.primary, bg: COLORS.primaryMuted },
  solid: { label: "Solid", color: COLORS.success, bg: COLORS.successMuted },
  at_risk: { label: "Due now", color: COLORS.warning, bg: COLORS.warningMuted },
  mastered: { label: "Mastered", color: COLORS.purple, bg: "rgba(175, 82, 222, 0.10)" },
};

function createEmptyOverview(): ReviewOverview {
  return {
    trackedFacts: 0,
    dueNow: 0,
    dueSoon: 0,
    learning: 0,
    review: 0,
    stable: 0,
    mastered: 0,
    dueLessons: 0,
  };
}

function buildFactProgress(row: ReviewFactRow): FactProgress {
  return {
    easeFactor: 2.5,
    intervalDays: row.interval_days,
    repetitions: row.repetitions,
    nextReviewAt: new Date(row.next_review_at),
    lastReviewedAt: new Date(row.last_reviewed_at),
    masteryLevel: row.mastery_level,
    timesCorrect: row.times_correct,
    timesIncorrect: row.times_incorrect,
  };
}

export function formatReviewWindow(nextReviewAt: string | null): string {
  if (!nextReviewAt) return "No review scheduled";

  const now = new Date();
  const reviewDate = new Date(nextReviewAt);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(reviewDate.getFullYear(), reviewDate.getMonth(), reviewDate.getDate());
  const dayDiff = Math.round((startOfTarget.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000));

  if (dayDiff <= 0) return "Due now";
  if (dayDiff === 1) return "Tomorrow";
  if (dayDiff <= REVIEW_SOON_WINDOW_DAYS) return `In ${dayDiff} days`;
  return reviewDate.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function getStateMix(summary: ReviewMixSummary) {
  return [
    { key: "at_risk", count: summary.dueNow, color: MEMORY_STATE_META.at_risk.color },
    { key: "learning", count: summary.learning, color: MEMORY_STATE_META.learning.color },
    { key: "review", count: summary.review, color: MEMORY_STATE_META.review.color },
    { key: "solid", count: summary.solid, color: MEMORY_STATE_META.solid.color },
    { key: "mastered", count: summary.mastered, color: MEMORY_STATE_META.mastered.color },
  ].filter((segment) => segment.count > 0);
}

function sortReviewLessons(left: ReviewLessonSummary, right: ReviewLessonSummary): number {
  if (right.dueNow !== left.dueNow) return right.dueNow - left.dueNow;
  if (right.dueSoon !== left.dueSoon) return right.dueSoon - left.dueSoon;
  if (!left.nextReviewAt) return 1;
  if (!right.nextReviewAt) return -1;
  return new Date(left.nextReviewAt).getTime() - new Date(right.nextReviewAt).getTime();
}

function sortReviewSubjects(left: ReviewSubjectSummary, right: ReviewSubjectSummary): number {
  if (right.dueNow !== left.dueNow) return right.dueNow - left.dueNow;
  if (right.dueSoon !== left.dueSoon) return right.dueSoon - left.dueSoon;
  if (!left.nextReviewAt) return 1;
  if (!right.nextReviewAt) return -1;
  return new Date(left.nextReviewAt).getTime() - new Date(right.nextReviewAt).getTime();
}

export function buildReviewQueueParam(queueLessonIds: string[]): string | undefined {
  return queueLessonIds.length > 0 ? queueLessonIds.join(",") : undefined;
}

export function parseReviewQueueParam(rawQueue: string | string[] | undefined): string[] {
  const queueValue = Array.isArray(rawQueue) ? rawQueue[0] : rawQueue;
  if (!queueValue) return [];
  return queueValue
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

export async function fetchReviewSnapshot(
  userId: string,
  subjects: SubjectWithLessons[]
): Promise<ReviewSnapshot> {
  const { data } = await supabase
    .from("user_fact_progress")
    .select(
      "fact_id, next_review_at, last_reviewed_at, mastery_level, repetitions, interval_days, times_correct, times_incorrect, facts(lesson_id, lessons(id, title))"
    )
    .eq("user_id", userId);

  const lessonLookup = new Map<string, { lessonTitle: string; subjectId: string; subjectName: string }>();
  subjects.forEach((subject) => {
    subject.lessons.forEach((lesson) => {
      lessonLookup.set(lesson.id, {
        lessonTitle: lesson.title,
        subjectId: subject.id,
        subjectName: subject.name,
      });
    });
  });

  const now = new Date();
  const soonCutoff = new Date(now.getTime() + REVIEW_SOON_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const overview = createEmptyOverview();
  const lessonMap = new Map<string, ReviewLessonSummary>();

  (data as ReviewFactRow[] | null ?? []).forEach((row) => {
    const lessonId = row.facts?.lesson_id;
    if (!lessonId) return;

    const lessonMeta = lessonLookup.get(lessonId);
    const lessonTitle = lessonMeta?.lessonTitle ?? row.facts?.lessons?.title ?? "Lesson";
    const subjectId = lessonMeta?.subjectId ?? "unknown-subject";
    const subjectName = lessonMeta?.subjectName ?? "Subject";
    const nextReview = new Date(row.next_review_at);
    const isDueNow = nextReview <= now;
    const isDueSoon = nextReview > now && nextReview <= soonCutoff;
    const memoryState = getFactMemoryState(buildFactProgress(row), now);

    overview.trackedFacts += 1;
    if (isDueNow) overview.dueNow += 1;
    if (isDueSoon) overview.dueSoon += 1;
    if (memoryState === "learning") overview.learning += 1;
    if (memoryState === "review") overview.review += 1;
    if (memoryState === "solid" || memoryState === "mastered") overview.stable += 1;
    if (memoryState === "mastered") overview.mastered += 1;

    const existing = lessonMap.get(lessonId) ?? {
      lessonId,
      lessonTitle,
      subjectId,
      subjectName,
      trackedFacts: 0,
      dueNow: 0,
      dueSoon: 0,
      learning: 0,
      review: 0,
      solid: 0,
      mastered: 0,
      nextReviewAt: null,
    };

    existing.trackedFacts += 1;
    if (isDueNow) existing.dueNow += 1;
    if (isDueSoon) existing.dueSoon += 1;
    if (memoryState === "learning") existing.learning += 1;
    if (memoryState === "review") existing.review += 1;
    if (memoryState === "solid") existing.solid += 1;
    if (memoryState === "mastered") existing.mastered += 1;
    if (!existing.nextReviewAt || nextReview < new Date(existing.nextReviewAt)) {
      existing.nextReviewAt = row.next_review_at;
    }

    lessonMap.set(lessonId, existing);
  });

  const lessons = Array.from(lessonMap.values()).sort(sortReviewLessons);
  overview.dueLessons = lessons.filter((lesson) => lesson.dueNow > 0).length;

  const subjectMap = new Map<string, ReviewSubjectSummary>();
  lessons.forEach((lesson) => {
    const existing = subjectMap.get(lesson.subjectId) ?? {
      subjectId: lesson.subjectId,
      subjectName: lesson.subjectName,
      trackedFacts: 0,
      dueNow: 0,
      dueSoon: 0,
      learning: 0,
      review: 0,
      solid: 0,
      mastered: 0,
      lessonsDueNow: 0,
      nextReviewAt: null,
      queueLessonIds: [],
    };

    existing.trackedFacts += lesson.trackedFacts;
    existing.dueNow += lesson.dueNow;
    existing.dueSoon += lesson.dueSoon;
    existing.learning += lesson.learning;
    existing.review += lesson.review;
    existing.solid += lesson.solid;
    existing.mastered += lesson.mastered;
    if (lesson.dueNow > 0) {
      existing.lessonsDueNow += 1;
      existing.queueLessonIds.push(lesson.lessonId);
    }
    if (!existing.nextReviewAt || (lesson.nextReviewAt && new Date(lesson.nextReviewAt) < new Date(existing.nextReviewAt))) {
      existing.nextReviewAt = lesson.nextReviewAt;
    }

    subjectMap.set(lesson.subjectId, existing);
  });

  const subjectSummaries = Array.from(subjectMap.values()).sort(sortReviewSubjects);
  const queueLessonIds = lessons.filter((lesson) => lesson.dueNow > 0).map((lesson) => lesson.lessonId);

  return {
    overview,
    lessons,
    subjects: subjectSummaries,
    queueLessonIds,
    nextDueLesson: lessons.find((lesson) => lesson.dueNow > 0) ?? null,
  };
}