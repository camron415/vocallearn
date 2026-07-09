import { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureDetector } from "react-native-gesture-handler";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/auth-store";
import { useLessonStore } from "@/stores/lesson-store";
import { supabase } from "@/lib/supabase";
import { COLORS } from "@/constants/config";
import { useSwipeTabs } from "@/hooks/useSwipeTabs";
import { buildReviewQueueParam } from "@/lib/review-dashboard";
import {
  getFactMemoryState,
  type FactMemoryState,
  type FactProgress,
} from "@/engine/spaced-repetition";

interface ReviewLessonSummary {
  lessonId: string;
  lessonTitle: string;
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

interface ReviewOverview {
  trackedFacts: number;
  dueNow: number;
  dueSoon: number;
  learning: number;
  stable: number;
  mastered: number;
}

interface ReviewFactRow {
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

const SOON_WINDOW_DAYS = 3;

const MEMORY_STATE_META: Record<FactMemoryState, { label: string; color: string; bg: string }> = {
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
    stable: 0,
    mastered: 0,
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

function formatReviewWindow(nextReviewAt: string | null): string {
  if (!nextReviewAt) return "No review scheduled";

  const now = new Date();
  const reviewDate = new Date(nextReviewAt);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(reviewDate.getFullYear(), reviewDate.getMonth(), reviewDate.getDate());
  const dayDiff = Math.round((startOfTarget.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000));

  if (dayDiff <= 0) return "Due now";
  if (dayDiff === 1) return "Tomorrow";
  if (dayDiff <= SOON_WINDOW_DAYS) return `In ${dayDiff} days`;
  return reviewDate.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function getStateMix(summary: ReviewLessonSummary) {
  return [
    { key: "at_risk", count: summary.dueNow, color: MEMORY_STATE_META.at_risk.color },
    { key: "learning", count: summary.learning, color: MEMORY_STATE_META.learning.color },
    { key: "review", count: summary.review, color: MEMORY_STATE_META.review.color },
    { key: "solid", count: summary.solid, color: MEMORY_STATE_META.solid.color },
    { key: "mastered", count: summary.mastered, color: MEMORY_STATE_META.mastered.color },
  ].filter((segment) => segment.count > 0);
}

export default function LearnScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const subjects = useLessonStore((s) => s.subjects);
  const fetchSubjects = useLessonStore((s) => s.fetchSubjects);
  const [reviewLessons, setReviewLessons] = useState<ReviewLessonSummary[]>([]);
  const [overview, setOverview] = useState<ReviewOverview>(createEmptyOverview());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (session?.user?.id && subjects.length > 0) {
      fetchReviewSnapshot();
    } else {
      setLoading(false);
    }
  }, [session?.user?.id, subjects]);

  const fetchReviewSnapshot = async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from("user_fact_progress")
        .select(
          "fact_id, next_review_at, last_reviewed_at, mastery_level, repetitions, interval_days, times_correct, times_incorrect, facts(lesson_id, lessons(id, title))"
        )
        .eq("user_id", session.user.id);

      const lessonLookup = new Map<string, { lessonTitle: string; subjectName: string }>();
      subjects.forEach((subject) => {
        subject.lessons.forEach((lesson) => {
          lessonLookup.set(lesson.id, {
            lessonTitle: lesson.title,
            subjectName: subject.name,
          });
        });
      });

      const now = new Date();
      const soonCutoff = new Date(now.getTime() + SOON_WINDOW_DAYS * 24 * 60 * 60 * 1000);
      const overviewDraft = createEmptyOverview();
      const lessonMap = new Map<string, ReviewLessonSummary>();

      (data as ReviewFactRow[] | null ?? []).forEach((row) => {
        const lessonId = row.facts?.lesson_id;
        if (!lessonId) return;

        const lessonMeta = lessonLookup.get(lessonId);
        const lessonTitle = lessonMeta?.lessonTitle ?? row.facts?.lessons?.title ?? "Lesson";
        const subjectName = lessonMeta?.subjectName ?? "Subject";
        const nextReview = new Date(row.next_review_at);
        const isDueNow = nextReview <= now;
        const isDueSoon = nextReview > now && nextReview <= soonCutoff;
        const memoryState = getFactMemoryState(buildFactProgress(row), now);

        overviewDraft.trackedFacts += 1;
        if (isDueNow) overviewDraft.dueNow += 1;
        if (isDueSoon) overviewDraft.dueSoon += 1;
        if (memoryState === "learning" || memoryState === "review") overviewDraft.learning += 1;
        if (memoryState === "solid" || memoryState === "mastered") overviewDraft.stable += 1;
        if (memoryState === "mastered") overviewDraft.mastered += 1;

        const existing = lessonMap.get(lessonId) ?? {
          lessonId,
          lessonTitle,
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

      const lessons = Array.from(lessonMap.values()).sort((left, right) => {
        if (right.dueNow !== left.dueNow) return right.dueNow - left.dueNow;
        if (right.dueSoon !== left.dueSoon) return right.dueSoon - left.dueSoon;
        if (!left.nextReviewAt) return 1;
        if (!right.nextReviewAt) return -1;
        return new Date(left.nextReviewAt).getTime() - new Date(right.nextReviewAt).getTime();
      });

      setOverview(overviewDraft);
      setReviewLessons(lessons);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  const dueLessons = useMemo(
    () => reviewLessons.filter((lesson) => lesson.dueNow > 0),
    [reviewLessons]
  );

  const upcomingLessons = useMemo(
    () => reviewLessons.filter((lesson) => lesson.dueNow === 0 && lesson.dueSoon > 0),
    [reviewLessons]
  );

  const startReviewQueue = () => {
    const queueLessonIds = dueLessons.map((lesson) => lesson.lessonId);
    const queueParam = buildReviewQueueParam(queueLessonIds);
    if (!queueParam) return;
    router.push(`/session/${queueLessonIds[0]}?mode=review&queue=${encodeURIComponent(queueParam)}`);
  };

  const swipe = useSwipeTabs();

  if (loading) {
    return (
      <GestureDetector gesture={swipe}>
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={["top"]}>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
      </SafeAreaView>
      </GestureDetector>
    );
  }

  return (
    <GestureDetector gesture={swipe}>
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={["top"]}>
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
    >
      <Text style={{ color: COLORS.text, fontSize: 28, fontWeight: "700", letterSpacing: -0.5 }}>Learn</Text>
      <Text style={{ color: COLORS.textSecondary, fontSize: 15, marginTop: 4 }}>
        Fact-based review queue with clear timing and memory states
      </Text>

      <View
        style={{
          marginTop: 22,
          backgroundColor: COLORS.bgElevated,
          borderRadius: 16,
          padding: 18,
          borderWidth: 1,
          borderColor: COLORS.borderLight,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: COLORS.primaryMuted,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="git-branch-outline" size={18} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: "700" }}>
              How reviews work
            </Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginTop: 2, lineHeight: 19 }}>
              Reviews are scheduled per fact, not per lesson. A fact enters the queue after its first scored recall attempt, whether you got it right or wrong.
            </Text>
          </View>
        </View>

        <View style={{ marginTop: 14, gap: 8 }}>
          <Text style={{ color: COLORS.textSecondary, fontSize: 13, lineHeight: 19 }}>
            Due now means that fact's personal timer has reached its review date. Due soon means it will come back within the next {SOON_WINDOW_DAYS} days.
          </Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: 13, lineHeight: 19 }}>
            With the new overhaul, easy recalls move out more gradually at first, late recalls are rewarded more conservatively, and stable facts come back less often than shaky ones.
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 18 }}>
        {[
          { label: "Due now", value: overview.dueNow, color: COLORS.warning, bg: COLORS.warningMuted, icon: "alarm-outline" },
          { label: "Due soon", value: overview.dueSoon, color: COLORS.blue, bg: "rgba(0, 122, 255, 0.10)", icon: "calendar-outline" },
          { label: "Tracked facts", value: overview.trackedFacts, color: COLORS.primary, bg: COLORS.primaryMuted, icon: "layers-outline" },
          { label: "Stable", value: overview.stable, color: COLORS.success, bg: COLORS.successMuted, icon: "shield-checkmark-outline" },
        ].map((card) => (
          <View
            key={card.label}
            style={{
              width: "47%",
              backgroundColor: COLORS.bgElevated,
              borderRadius: 14,
              padding: 16,
              borderWidth: 1,
              borderColor: COLORS.borderLight,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: card.bg,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name={card.icon as any} size={16} color={card.color} />
            </View>
            <Text style={{ color: COLORS.text, fontSize: 24, fontWeight: "800", marginTop: 14 }}>
              {card.value}
            </Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginTop: 4 }}>
              {card.label}
            </Text>
          </View>
        ))}
      </View>

      {dueLessons.length > 0 && (
        <TouchableOpacity
          onPress={startReviewQueue}
          activeOpacity={0.8}
          style={{
            marginTop: 18,
            backgroundColor: COLORS.primary,
            borderRadius: 16,
            padding: 18,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>
              Start Review Queue
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.84)", fontSize: 13, marginTop: 4, lineHeight: 19 }}>
              Review due facts across {dueLessons.length} lesson{dueLessons.length !== 1 ? "s" : ""} without bouncing back to the tabs after each one.
            </Text>
          </View>
          <Ionicons name="arrow-forward-circle" size={26} color="#fff" />
        </TouchableOpacity>
      )}

      {dueLessons.length > 0 ? (
        <View style={{ marginTop: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 }}>
            <Ionicons name="time" size={14} color={COLORS.warning} />
            <Text style={{ color: COLORS.textSecondary, fontSize: 13, fontWeight: "600", letterSpacing: 0.5 }}>
              REVIEW NOW
            </Text>
          </View>
          {dueLessons.map((lesson) => (
            <TouchableOpacity
              key={lesson.lessonId}
              onPress={() => router.push(`/session/${lesson.lessonId}?mode=review`)}
              activeOpacity={0.7}
              style={{
                backgroundColor: COLORS.bgElevated,
                borderRadius: 14,
                padding: 18,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: COLORS.borderLight,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: "600" }}>
                  {lesson.lessonTitle}
                </Text>
                <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginTop: 3 }}>
                  {lesson.subjectName}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.warning }} />
                  <Text style={{ color: COLORS.warning, fontSize: 13 }}>
                    {lesson.dueNow} fact{lesson.dueNow !== 1 ? "s" : ""} due now
                  </Text>
                </View>
                <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginTop: 6 }}>
                  {lesson.review > 0 ? `${lesson.review} in spaced review` : `${lesson.learning} still in early learning`} · {lesson.solid + lesson.mastered} stable
                </Text>
                <View
                  style={{
                    height: 6,
                    backgroundColor: COLORS.borderLight,
                    borderRadius: 999,
                    marginTop: 10,
                    overflow: "hidden",
                    flexDirection: "row",
                  }}
                >
                  {getStateMix(lesson).map((segment) => (
                    <View
                      key={segment.key}
                      style={{
                        width: `${(segment.count / lesson.trackedFacts) * 100}%`,
                        backgroundColor: segment.color,
                      }}
                    />
                  ))}
                </View>
              </View>
              <View
                style={{
                  backgroundColor: COLORS.primary,
                  paddingHorizontal: 18,
                  paddingVertical: 10,
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "700" }}>Review</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={{ marginTop: 32, alignItems: "center" }}>
          <View style={{
            width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.successMuted,
            justifyContent: "center", alignItems: "center",
          }}>
            <Ionicons name="checkmark-done" size={36} color={COLORS.success} />
          </View>
          <Text
            style={{
              color: COLORS.text,
              fontSize: 20,
              fontWeight: "700",
              marginTop: 20,
              textAlign: "center",
            }}
          >
            All caught up!
          </Text>
          <Text
            style={{
              color: COLORS.textSecondary,
              fontSize: 15,
              marginTop: 8,
              textAlign: "center",
              paddingHorizontal: 24,
              lineHeight: 22,
            }}
          >
            No facts due right now. Start a lesson to learn new facts, or come back later for review.
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/subjects")}
            activeOpacity={0.8}
            style={{
              backgroundColor: COLORS.primary,
              borderRadius: 14,
              paddingVertical: 16,
              paddingHorizontal: 36,
              marginTop: 28,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Ionicons name="library" size={18} color="#fff" />
            <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "700" }}>
              Browse Subjects
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {upcomingLessons.length > 0 && (
        <View style={{ marginTop: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 }}>
            <Ionicons name="calendar" size={14} color={COLORS.blue} />
            <Text style={{ color: COLORS.textSecondary, fontSize: 13, fontWeight: "600", letterSpacing: 0.5 }}>
              COMING UP SOON
            </Text>
          </View>
          {upcomingLessons.map((lesson) => (
            <View
              key={lesson.lessonId}
              style={{
                backgroundColor: COLORS.bgElevated,
                borderRadius: 14,
                padding: 18,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: COLORS.borderLight,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: "600" }}>
                    {lesson.lessonTitle}
                  </Text>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginTop: 3 }}>
                    {lesson.subjectName}
                  </Text>
                </View>
                <View style={{ backgroundColor: "rgba(0, 122, 255, 0.10)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
                  <Text style={{ color: COLORS.blue, fontSize: 12, fontWeight: "700" }}>
                    {formatReviewWindow(lesson.nextReviewAt)}
                  </Text>
                </View>
              </View>
              <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginTop: 8, lineHeight: 19 }}>
                {lesson.dueSoon} fact{lesson.dueSoon !== 1 ? "s" : ""} will return soon. This lesson is not due yet, so there is no pressure to review it today.
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ marginTop: 24 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 }}>
          <Ionicons name="analytics" size={14} color={COLORS.primary} />
          <Text style={{ color: COLORS.textSecondary, fontSize: 13, fontWeight: "600", letterSpacing: 0.5 }}>
            MEMORY STATES
          </Text>
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {[
            ["learning", "Seen recently and still on short intervals."],
            ["review", "Passed early recalls and now spacing out."],
            ["solid", "Survived wider gaps and is fairly stable."],
            ["mastered", "Very stable and should appear infrequently."],
          ].map(([stateKey, description]) => {
            const meta = MEMORY_STATE_META[stateKey as FactMemoryState];
            return (
              <View
                key={stateKey}
                style={{
                  width: "47%",
                  backgroundColor: COLORS.bgElevated,
                  borderRadius: 14,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: COLORS.borderLight,
                }}
              >
                <View style={{ alignSelf: "flex-start", backgroundColor: meta.bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
                  <Text style={{ color: meta.color, fontSize: 12, fontWeight: "700" }}>{meta.label}</Text>
                </View>
                <Text style={{ color: COLORS.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 10 }}>
                  {description}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
    </SafeAreaView>
    </GestureDetector>
  );
}
