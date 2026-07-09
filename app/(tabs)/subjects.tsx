import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Modal, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureDetector } from "react-native-gesture-handler";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/auth-store";
import { useLessonStore } from "@/stores/lesson-store";
import { COLORS } from "@/constants/config";
import { useSwipeTabs } from "@/hooks/useSwipeTabs";
import { generateLessonFromTopic } from "@/lib/grok";
import {
  buildReviewQueueParam,
  fetchReviewSnapshot,
  formatReviewWindow,
  getStateMix,
  type ReviewSnapshot,
} from "@/lib/review-dashboard";

const JUNIOR_INTERVIEW_SUBJECT_ID = "7b0c1d2e-3f40-4567-89ab-cdef01234567";
const CAREER_PREP_SUBJECT_ID = "a9b8c7d6-e5f4-4321-abcd-ef9876543210";

const UNLOCK_ALL_LESSONS_SUBJECT_IDS = new Set([
  JUNIOR_INTERVIEW_SUBJECT_ID,
  CAREER_PREP_SUBJECT_ID,
]);

export default function SubjectsScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const subjects = useLessonStore((s) => s.subjects);
  const loading = useLessonStore((s) => s.loading);
  const error = useLessonStore((s) => s.error);
  const fetchSubjects = useLessonStore((s) => s.fetchSubjects);
  const completions = useLessonStore((s) => s.completions);
  const fetchCompletions = useLessonStore((s) => s.fetchCompletions);
  const createLessonFromGenerated = useLessonStore((s) => s.createLessonFromGenerated);

  const [showGenerate, setShowGenerate] = useState(false);
  const [topicInput, setTopicInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [reviewSnapshot, setReviewSnapshot] = useState<ReviewSnapshot | null>(null);

  useEffect(() => {
    fetchSubjects();
    fetchCompletions();
  }, []);

  useEffect(() => {
    if (session?.user?.id && subjects.length > 0) {
      fetchReviewData();
    }
  }, [session?.user?.id, subjects]);

  const fetchReviewData = async () => {
    if (!session?.user?.id) return;
    try {
      const snapshot = await fetchReviewSnapshot(session.user.id, subjects);
      setReviewSnapshot(snapshot);
    } catch {
      // Silent fail — subject browsing should still work without review metadata
    }
  };

  const reviewBySubjectId = new Map((reviewSnapshot?.subjects ?? []).map((subject) => [subject.subjectId, subject]));

  const swipe = useSwipeTabs();

  const isLessonUnlocked = (subject: typeof subjects[number], lessonId: string): boolean => {
    if (UNLOCK_ALL_LESSONS_SUBJECT_IDS.has(subject.id)) {
      return true;
    }

    const orderedLessons = [...subject.lessons].sort((a, b) => a.order_index - b.order_index);
    const index = orderedLessons.findIndex((lesson) => lesson.id === lessonId);
    if (index <= 0) return true;

    const previousLesson = orderedLessons[index - 1];
    const completion = completions.get(previousLesson.id);
    return !!completion && completion.best_accuracy >= previousLesson.unlock_threshold;
  };

  const getFirstAvailableLessonId = (subject: typeof subjects[number]): string | null => {
    const orderedLessons = [...subject.lessons].sort((a, b) => a.order_index - b.order_index);
    return orderedLessons.find((lesson) => isLessonUnlocked(subject, lesson.id))?.id ?? orderedLessons[0]?.id ?? null;
  };

  const getModuleSections = (subject: typeof subjects[number]) => {
    const orphanLessons = subject.lessons
      .filter((lesson) => !lesson.module_id)
      .sort((a, b) => a.order_index - b.order_index);

    const sections = subject.modules.map((module) => ({
      id: module.id,
      title: module.title,
      description: module.description,
      lessons: [...module.lessons].sort((a, b) => a.order_index - b.order_index),
    }));

    if (orphanLessons.length > 0 || sections.length === 0) {
      sections.push({
        id: `${subject.id}-ungrouped`,
        title: sections.length === 0 ? "Lessons" : "More Lessons",
        description: null,
        lessons: orphanLessons.length > 0 ? orphanLessons : [...subject.lessons].sort((a, b) => a.order_index - b.order_index),
      });
    }

    return sections;
  };

  if (loading && subjects.length === 0) {
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
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: COLORS.text, fontSize: 28, fontWeight: "700", letterSpacing: -0.5 }}>Subjects</Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: 15, marginTop: 4 }}>
            Choose a subject to start learning
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowGenerate(true)}
          activeOpacity={0.7}
          style={{
            backgroundColor: COLORS.primary,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 10,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginTop: 4,
          }}
        >
          <Ionicons name="sparkles" size={16} color="#fff" />
          <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>Generate</Text>
        </TouchableOpacity>
      </View>

      {/* Generate Lesson Modal */}
      <Modal visible={showGenerate} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end", padding: 24, paddingBottom: 40 }}>
          <View style={{ backgroundColor: COLORS.bgElevated, borderRadius: 20, padding: 24 }}>
            <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: "700" }}>Generate a Lesson</Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 14, marginTop: 6 }}>
              Describe what you want to learn and AI will create a lesson with facts.
            </Text>
            <TextInput
              value={topicInput}
              onChangeText={setTopicInput}
              placeholder='e.g. "Basics of the solar system"'
              placeholderTextColor={COLORS.textTertiary}
              multiline
              style={{
                backgroundColor: COLORS.bgTertiary,
                borderRadius: 12,
                padding: 14,
                color: COLORS.text,
                fontSize: 15,
                marginTop: 16,
                maxHeight: 100,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
              editable={!generating}
            />
            <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
              <TouchableOpacity
                onPress={() => { setShowGenerate(false); setTopicInput(""); }}
                disabled={generating}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  borderRadius: 12,
                  padding: 14,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: COLORS.textSecondary, fontSize: 15, fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  if (!topicInput.trim()) return;
                  setGenerating(true);
                  try {
                    const generated = await generateLessonFromTopic(topicInput.trim());
                    const lessonId = await createLessonFromGenerated(generated);
                    setShowGenerate(false);
                    setTopicInput("");
                    router.push(`/lesson/${lessonId}`);
                  } catch (e: any) {
                    Alert.alert("Error", e.message || "Failed to generate lesson");
                  } finally {
                    setGenerating(false);
                  }
                }}
                disabled={generating || !topicInput.trim()}
                activeOpacity={0.8}
                style={{
                  flex: 2,
                  backgroundColor: generating || !topicInput.trim() ? COLORS.border : COLORS.primary,
                  borderRadius: 12,
                  padding: 14,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {generating ? (
                  <>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>Generating...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="sparkles" size={16} color="#fff" />
                    <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>Create</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {error && (
        <Text style={{ color: COLORS.error, fontSize: 14, marginTop: 12 }}>{error}</Text>
      )}

      {subjects.length === 0 && !loading && (
        <View style={{ marginTop: 48, alignItems: "center" }}>
          <Ionicons name="library-outline" size={48} color={COLORS.textTertiary} />
          <Text style={{ color: COLORS.textSecondary, fontSize: 15, marginTop: 16, textAlign: "center" }}>
            No subjects available yet.
          </Text>
        </View>
      )}

      {subjects.map((subject) => (
        (() => {
          const reviewSummary = reviewBySubjectId.get(subject.id);
          const reviewMix = reviewSummary ? getStateMix(reviewSummary) : [];

          return (
        <View
          key={subject.id}
          style={{
            backgroundColor: COLORS.bgElevated,
            borderRadius: 16,
            marginTop: 16,
            borderWidth: 1,
            borderColor: COLORS.borderLight,
            overflow: "hidden",
          }}
        >
          {/* Subject header */}
          <TouchableOpacity
            onPress={() => {
              const lessonId = getFirstAvailableLessonId(subject);
              if (lessonId) {
                router.push(`/lesson/${lessonId}`);
              }
            }}
            activeOpacity={0.7}
            style={{ padding: 20, flexDirection: "row", alignItems: "center", gap: 14 }}
          >
            <View style={{
              width: 48, height: 48, borderRadius: 12, backgroundColor: COLORS.primaryMuted,
              justifyContent: "center", alignItems: "center",
            }}>
              <Text style={{ fontSize: 24 }}>{subject.icon ?? "📚"}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: "600" }}>
                {subject.name}
              </Text>
              <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginTop: 2 }} numberOfLines={2}>
                {subject.description}
              </Text>
              {(() => {
                const completed = subject.lessons.filter((l) => completions.has(l.id)).length;
                return (
                  <>
                    <Text style={{
                      color: completed === subject.lessonCount && completed > 0 ? COLORS.success : COLORS.primary,
                      fontSize: 12,
                      fontWeight: "600",
                      marginTop: 4,
                    }}>
                      {completed}/{subject.lessonCount} lesson{subject.lessonCount !== 1 ? "s" : ""} completed
                    </Text>
                    {reviewSummary && reviewSummary.trackedFacts > 0 ? (
                      <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginTop: 4 }}>
                        {reviewSummary.dueNow} due now · {reviewSummary.trackedFacts} tracked · {reviewSummary.solid + reviewSummary.mastered} stable
                      </Text>
                    ) : null}
                  </>
                );
              })()}
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
          </TouchableOpacity>

          {reviewSummary && reviewSummary.trackedFacts > 0 && (
            <View style={{ borderTopWidth: 1, borderTopColor: COLORS.borderLight, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: COLORS.text, fontSize: 13, fontWeight: "700", letterSpacing: 0.3 }}>
                    Review state
                  </Text>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginTop: 4, lineHeight: 18 }}>
                    {reviewSummary.dueNow > 0
                      ? `${reviewSummary.dueNow} fact${reviewSummary.dueNow !== 1 ? "s" : ""} due across ${reviewSummary.lessonsDueNow} lesson${reviewSummary.lessonsDueNow !== 1 ? "s" : ""}`
                      : `Next review ${formatReviewWindow(reviewSummary.nextReviewAt)}`}
                  </Text>
                </View>
                {reviewSummary.queueLessonIds.length > 0 ? (
                  <TouchableOpacity
                    onPress={() => {
                      const queueParam = buildReviewQueueParam(reviewSummary.queueLessonIds);
                      if (!queueParam) return;
                      router.push(`/session/${reviewSummary.queueLessonIds[0]}?mode=review&queue=${encodeURIComponent(queueParam)}`);
                    }}
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: COLORS.primary,
                      borderRadius: 10,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                    }}
                  >
                    <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}>Review Queue</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              <View style={{ height: 6, backgroundColor: COLORS.borderLight, borderRadius: 999, overflow: "hidden", flexDirection: "row", marginTop: 12 }}>
                {reviewMix.map((segment) => (
                  <View
                    key={segment.key}
                    style={{
                      width: `${(segment.count / reviewSummary.trackedFacts) * 100}%`,
                      backgroundColor: segment.color,
                    }}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Module / lesson list */}
          {subject.lessons.length > 0 && (
            <View style={{ borderTopWidth: 1, borderTopColor: COLORS.borderLight }}>
              {getModuleSections(subject).map((section, sectionIndex) => (
                <View key={section.id} style={{ borderTopWidth: sectionIndex === 0 ? 0 : 1, borderTopColor: COLORS.borderLight }}>
                  <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10 }}>
                    <Text style={{ color: COLORS.text, fontSize: 13, fontWeight: "700", letterSpacing: 0.4, textTransform: "uppercase" }}>
                      {section.title}
                    </Text>
                    {section.description ? (
                      <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginTop: 4 }}>
                        {section.description}
                      </Text>
                    ) : null}
                  </View>
                  {section.lessons.map((lesson, i) => {
                    const completed = completions.get(lesson.id);
                    const unlocked = isLessonUnlocked(subject, lesson.id);
                    const statusText = completed
                      ? `${Math.round(completed.best_accuracy * 100)}% best accuracy`
                      : UNLOCK_ALL_LESSONS_SUBJECT_IDS.has(subject.id)
                        ? "Open in any order"
                      : unlocked
                        ? "Unlocked"
                        : `Unlocks after ${Math.round(lesson.unlock_threshold * 100)}% on previous lesson`;

                    return (
                      <TouchableOpacity
                        key={lesson.id}
                        onPress={() => router.push(`/lesson/${lesson.id}`)}
                        disabled={!unlocked}
                        activeOpacity={0.6}
                        style={{
                          paddingVertical: 14,
                          paddingHorizontal: 20,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 10,
                          opacity: unlocked ? 1 : 0.55,
                          borderBottomWidth: i < section.lessons.length - 1 ? 1 : 0,
                          borderBottomColor: COLORS.borderLight,
                        }}
                      >
                        <View style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: completed
                            ? COLORS.success
                            : unlocked
                              ? COLORS.bgTertiary
                              : COLORS.border,
                          justifyContent: "center",
                          alignItems: "center",
                        }}>
                          {completed ? (
                            <Ionicons name="checkmark" size={14} color="#fff" />
                          ) : unlocked ? (
                            <Text style={{ color: COLORS.primary, fontSize: 12, fontWeight: "700" }}>
                              {lesson.order_index}
                            </Text>
                          ) : (
                            <Ionicons name="lock-closed" size={12} color={COLORS.textSecondary} />
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: COLORS.text, fontSize: 15 }}>
                            {lesson.title}
                          </Text>
                          <Text style={{ color: completed ? COLORS.success : COLORS.textSecondary, fontSize: 12, marginTop: 3 }}>
                            {statusText}
                          </Text>
                        </View>
                        <Ionicons
                          name={unlocked ? "chevron-forward" : "lock-closed"}
                          size={16}
                          color={COLORS.textTertiary}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          )}
        </View>
          );
        })()
      ))}
    </ScrollView>
    </SafeAreaView>
    </GestureDetector>
  );
}
