import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureDetector } from "react-native-gesture-handler";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/auth-store";
import { useLessonStore } from "@/stores/lesson-store";
import { supabase } from "@/lib/supabase";
import { buildSessionHref, useSessionStore } from "@/stores/session-store";
import { COLORS } from "@/constants/config";
import { useSwipeTabs } from "@/hooks/useSwipeTabs";
import {
  buildReviewQueueParam,
  fetchReviewSnapshot,
  getStateMix,
  MEMORY_STATE_META,
  type ReviewSnapshot,
} from "@/lib/review-dashboard";

export default function HomeScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const subjects = useLessonStore((s) => s.subjects);
  const fetchSubjects = useLessonStore((s) => s.fetchSubjects);
  const getNextLesson = useLessonStore((s) => s.getNextLesson);
  const [stats, setStats] = useState({ factsReviewed: 0, factsMastered: 0, todayMinutes: 0, streak: 0 });
  const [reviewSnapshot, setReviewSnapshot] = useState<ReviewSnapshot | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const activeSessionIsActive = useSessionStore((s) => s.isActive);
  const activeSessionLessonId = useSessionStore((s) => s.lessonId);
  const activeSessionMode = useSessionStore((s) => s.sessionMode);
  const activeSessionQueueLessonIds = useSessionStore((s) => s.queueLessonIds);
  const activeSessionReviewStartIndex = useSessionStore((s) => s.reviewStartIndex);
  const activeSessionReviewFactLimit = useSessionStore((s) => s.reviewFactLimit);

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      fetchStats();
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (session?.user?.id && subjects.length > 0) {
      fetchReviewData();
    }
  }, [session?.user?.id, subjects]);

  const fetchStats = async () => {
    if (!session?.user?.id) return;
    try {
      const { data: progress } = await supabase
        .from("user_fact_progress")
        .select("mastery_level")
        .eq("user_id", session.user.id);

      const factsMastered = (progress ?? []).filter((p) => p.mastery_level >= 4).length;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data: sessions } = await supabase
        .from("session_logs")
        .select("duration_seconds, facts_reviewed")
        .eq("user_id", session.user.id)
        .gte("started_at", today.toISOString());

      const todayMinutes = Math.round(
        (sessions ?? []).reduce((acc, s) => acc + (s.duration_seconds ?? 0), 0) / 60
      );
      const factsReviewed = (sessions ?? []).reduce((acc, s) => acc + (s.facts_reviewed ?? 0), 0);

      setStats({ factsReviewed, factsMastered, todayMinutes, streak: 0 });
    } catch {
      // Silent fail — stats are non-critical
    }
  };

  const fetchReviewData = async () => {
    if (!session?.user?.id) return;
    try {
      const snapshot = await fetchReviewSnapshot(session.user.id, subjects);
      setReviewSnapshot(snapshot);
      if (snapshot.overview.dueNow > 0) {
        setShowReviewModal(true);
      }
    } catch {
      // Silent fail
    }
  };

  const startReviewQueue = () => {
    const queueLessonIds = reviewSnapshot?.queueLessonIds ?? [];
    const queueParam = buildReviewQueueParam(queueLessonIds);
    if (!queueParam) return;
    setShowReviewModal(false);
    router.push(`/session/${queueLessonIds[0]}?mode=review&queue=${encodeURIComponent(queueParam)}`);
  };

  const resumeHref =
    activeSessionIsActive && activeSessionLessonId && activeSessionMode
      ? buildSessionHref(activeSessionLessonId, activeSessionMode, {
          queueLessonIds: activeSessionQueueLessonIds,
          reviewStartIndex: activeSessionReviewStartIndex,
          reviewFactLimit: activeSessionReviewFactLimit,
        })
      : null;

  const startLearning = () => {
    if (resumeHref) {
      router.push(resumeHref);
      return;
    }

    const nextLesson = subjects
      .map((subject) => getNextLesson(subject.id))
      .find((lesson): lesson is NonNullable<typeof lesson> => Boolean(lesson));

    if (nextLesson) {
      router.push(`/lesson/${nextLesson.id}`);
      return;
    }

    router.push("/subjects");
  };

  const displayName = session?.user?.user_metadata?.display_name || session?.user?.email?.split("@")[0] || "Learner";
  const progressPercent = Math.min(100, (stats.todayMinutes / 30) * 100);
  const swipe = useSwipeTabs();
  const nextDueLesson = reviewSnapshot?.nextDueLesson ?? null;
  const queueCount = reviewSnapshot?.queueLessonIds.length ?? 0;
  const reviewMix = reviewSnapshot
    ? getStateMix({
        dueNow: reviewSnapshot.overview.dueNow,
        learning: reviewSnapshot.overview.learning,
        review: reviewSnapshot.overview.review,
        solid: Math.max(0, reviewSnapshot.overview.stable - reviewSnapshot.overview.mastered),
        mastered: reviewSnapshot.overview.mastered,
      })
    : [];

  return (
    <GestureDetector gesture={swipe}>
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={["top"]}>

      {/* Review Due Modal — appears on mount when facts are overdue */}
      <Modal
        visible={showReviewModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.55)",
          justifyContent: "flex-end",
        }}>
          <View style={{
            backgroundColor: COLORS.bg,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: 28,
            paddingBottom: 44,
          }}>
            {/* Icon */}
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.warningMuted, justifyContent: "center", alignItems: "center" }}>
                <Ionicons name="alarm" size={32} color={COLORS.warning} />
              </View>
            </View>

            <Text style={{ color: COLORS.text, fontSize: 22, fontWeight: "800", textAlign: "center", letterSpacing: -0.5 }}>
              Review time!
            </Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 15, textAlign: "center", marginTop: 8, lineHeight: 22 }}>
              You have{" "}
              <Text style={{ color: COLORS.warning, fontWeight: "700" }}>
                {reviewSnapshot?.overview.dueNow ?? 0} fact{(reviewSnapshot?.overview.dueNow ?? 0) !== 1 ? "s" : ""}
              </Text>{" "}
              due across{" "}
              <Text style={{ color: COLORS.text, fontWeight: "600" }}>{queueCount}</Text>{" "}
              lesson{queueCount !== 1 ? "s" : ""}.
              {"\n"}Up next: <Text style={{ color: COLORS.text, fontWeight: "600" }}>{nextDueLesson?.lessonTitle}</Text>
            </Text>

            <TouchableOpacity
              onPress={startReviewQueue}
              activeOpacity={0.85}
              style={{
                backgroundColor: COLORS.warning,
                borderRadius: 16,
                padding: 18,
                marginTop: 28,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 17, fontWeight: "800" }}>
                Start Review Queue
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowReviewModal(false)}
              style={{ marginTop: 14, alignItems: "center", padding: 10 }}
            >
              <Text style={{ color: COLORS.textSecondary, fontSize: 15 }}>
                Skip for now
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
    >
      {/* Greeting */}
      <Text style={{ color: COLORS.text, fontSize: 28, fontWeight: "700", marginTop: 8, letterSpacing: -0.5 }}>
        Welcome back, {displayName}
      </Text>
      <Text style={{ color: COLORS.textSecondary, fontSize: 16, marginTop: 4 }}>
        VocalLearn 2.0 — Learn anything by voice
      </Text>

      {/* Daily Progress Card */}
      <View
        style={{
          backgroundColor: COLORS.bgElevated,
          borderRadius: 16,
          padding: 24,
          marginTop: 24,
          borderWidth: 1,
          borderColor: COLORS.borderLight,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ color: COLORS.textSecondary, fontSize: 13, fontWeight: "600", letterSpacing: 0.5 }}>
            TODAY'S PROGRESS
          </Text>
          <View style={{ backgroundColor: COLORS.primaryMuted, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
            <Text style={{ color: COLORS.primary, fontSize: 12, fontWeight: "600" }}>
              {stats.factsReviewed} facts
            </Text>
          </View>
        </View>
        <Text style={{ color: COLORS.text, fontSize: 36, fontWeight: "800", marginTop: 12, letterSpacing: -1 }}>
          {stats.todayMinutes}
          <Text style={{ color: COLORS.textSecondary, fontSize: 18, fontWeight: "500" }}> / 30 min</Text>
        </Text>
        {/* Progress bar */}
        <View style={{ height: 4, backgroundColor: COLORS.borderLight, borderRadius: 2, marginTop: 16, overflow: "hidden" }}>
          <View style={{ height: "100%", backgroundColor: COLORS.primary, width: `${progressPercent}%`, borderRadius: 2 }} />
        </View>
      </View>

      {reviewSnapshot && reviewSnapshot.overview.trackedFacts > 0 && (
        <View
          style={{
            backgroundColor: COLORS.bgElevated,
            borderRadius: 16,
            padding: 22,
            marginTop: 16,
            borderWidth: 1,
            borderColor: COLORS.borderLight,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ color: COLORS.textSecondary, fontSize: 13, fontWeight: "600", letterSpacing: 0.5 }}>
              REVIEW HEALTH
            </Text>
            <View style={{ backgroundColor: COLORS.primaryMuted, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ color: COLORS.primary, fontSize: 12, fontWeight: "700" }}>
                {reviewSnapshot.overview.trackedFacts} tracked
              </Text>
            </View>
          </View>

          <Text style={{ color: COLORS.text, fontSize: 24, fontWeight: "800", marginTop: 12 }}>
            {reviewSnapshot.overview.dueNow} due now
          </Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: 14, marginTop: 4, lineHeight: 21 }}>
            {reviewSnapshot.overview.dueSoon} more due soon. Stable facts are spaced out further; shaky facts return faster.
          </Text>

          <View style={{ height: 8, backgroundColor: COLORS.borderLight, borderRadius: 999, overflow: "hidden", flexDirection: "row", marginTop: 16 }}>
            {reviewMix.map((segment) => (
              <View
                key={segment.key}
                style={{
                  width: `${(segment.count / reviewSnapshot.overview.trackedFacts) * 100}%`,
                  backgroundColor: segment.color,
                }}
              />
            ))}
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
            {reviewSnapshot.overview.dueNow > 0 && (
              <View style={{ backgroundColor: MEMORY_STATE_META.at_risk.bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
                <Text style={{ color: MEMORY_STATE_META.at_risk.color, fontSize: 12, fontWeight: "700" }}>
                  {reviewSnapshot.overview.dueNow} due now
                </Text>
              </View>
            )}
            {reviewSnapshot.overview.learning > 0 && (
              <View style={{ backgroundColor: MEMORY_STATE_META.learning.bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
                <Text style={{ color: MEMORY_STATE_META.learning.color, fontSize: 12, fontWeight: "700" }}>
                  {reviewSnapshot.overview.learning} learning
                </Text>
              </View>
            )}
            {reviewSnapshot.overview.review > 0 && (
              <View style={{ backgroundColor: MEMORY_STATE_META.review.bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
                <Text style={{ color: MEMORY_STATE_META.review.color, fontSize: 12, fontWeight: "700" }}>
                  {reviewSnapshot.overview.review} in rotation
                </Text>
              </View>
            )}
            {reviewSnapshot.overview.stable > 0 && (
              <View style={{ backgroundColor: MEMORY_STATE_META.solid.bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
                <Text style={{ color: MEMORY_STATE_META.solid.color, fontSize: 12, fontWeight: "700" }}>
                  {reviewSnapshot.overview.stable} stable
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Continue Learning — due review card */}
      {nextDueLesson && (
        <TouchableOpacity
          onPress={startReviewQueue}
          activeOpacity={0.8}
          style={{
            backgroundColor: COLORS.bgElevated,
            borderRadius: 14,
            padding: 18,
            marginTop: 16,
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1,
            borderColor: COLORS.warning,
            gap: 14,
          }}
        >
          <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.warningMuted, justifyContent: "center", alignItems: "center" }}>
            <Ionicons name="refresh" size={20} color={COLORS.warning} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: COLORS.text, fontSize: 15, fontWeight: "700" }}>
              Review Queue
            </Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginTop: 2 }}>
              {nextDueLesson.lessonTitle} · {reviewSnapshot?.overview.dueNow ?? 0} fact{(reviewSnapshot?.overview.dueNow ?? 0) !== 1 ? "s" : ""} due across {queueCount} lesson{queueCount !== 1 ? "s" : ""}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
        </TouchableOpacity>
      )}

      {resumeHref && (
        <TouchableOpacity
          onPress={() => router.push(resumeHref)}
          activeOpacity={0.8}
          style={{
            backgroundColor: COLORS.bgElevated,
            borderRadius: 14,
            padding: 18,
            marginTop: 16,
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1,
            borderColor: COLORS.primary,
            gap: 14,
          }}
        >
          <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.primaryMuted, justifyContent: "center", alignItems: "center" }}>
            <Ionicons name="play" size={18} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: COLORS.text, fontSize: 15, fontWeight: "700" }}>
              Resume Session
            </Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginTop: 2 }}>
              Pick up your {activeSessionMode === "review" ? "review queue" : "lesson"} where you left off.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
        </TouchableOpacity>
      )}

      {/* Start Learning */}
      <TouchableOpacity
        onPress={startLearning}
        activeOpacity={0.8}
        style={{
          backgroundColor: COLORS.primary,
          borderRadius: 14,
          padding: 18,
          marginTop: 20,
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <Ionicons name="play-circle" size={22} color="#fff" />
        <Text style={{ color: "#ffffff", fontSize: 17, fontWeight: "700" }}>
          {resumeHref ? "Resume Learning" : "Start Learning"}
        </Text>
      </TouchableOpacity>

      {/* Quick Stats */}
      <View style={{ flexDirection: "row", gap: 12, marginTop: 24 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: COLORS.bgElevated,
            borderRadius: 14,
            padding: 20,
            borderWidth: 1,
            borderColor: COLORS.borderLight,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <Ionicons name="star" size={14} color={COLORS.warning} />
            <Text style={{ color: COLORS.textSecondary, fontSize: 12, fontWeight: "600", letterSpacing: 0.3 }}>MASTERED</Text>
          </View>
          <Text style={{ color: COLORS.text, fontSize: 28, fontWeight: "800", letterSpacing: -0.5 }}>{stats.factsMastered}</Text>
          <Text style={{ color: COLORS.textTertiary, fontSize: 12, marginTop: 2 }}>facts</Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: COLORS.bgElevated,
            borderRadius: 14,
            padding: 20,
            borderWidth: 1,
            borderColor: COLORS.borderLight,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <Ionicons name="library" size={14} color={COLORS.blue} />
            <Text style={{ color: COLORS.textSecondary, fontSize: 12, fontWeight: "600", letterSpacing: 0.3 }}>SUBJECTS</Text>
          </View>
          <Text style={{ color: COLORS.text, fontSize: 28, fontWeight: "800", letterSpacing: -0.5 }}>{subjects.length}</Text>
          <Text style={{ color: COLORS.textTertiary, fontSize: 12, marginTop: 2 }}>available</Text>
        </View>
      </View>
    </ScrollView>
    </SafeAreaView>
    </GestureDetector>
  );
}
