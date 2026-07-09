import { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { COLORS } from "@/constants/config";

interface BugReportModalProps {
  visible: boolean;
  onClose: () => void;
  sessionLogId: string | null;
  userId: string | undefined;
  lessonId: string;
  phase: string;
  factContent: string | null;
}

export function BugReportModal({
  visible,
  onClose,
  sessionLogId,
  userId,
  lessonId,
  phase,
  factContent,
}: BugReportModalProps) {
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const trimmed = description.trim();
    if (!trimmed || !userId) return;

    setSubmitting(true);
    setError(null);

    const { error: dbError } = await supabase.from("bug_reports").insert({
      session_log_id: sessionLogId ?? null,
      user_id: userId,
      lesson_id: lessonId,
      phase,
      fact_content: factContent ?? null,
      user_description: trimmed,
    });

    setSubmitting(false);

    if (dbError) {
      setError("Failed to submit. Try again.");
    } else {
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setDescription("");
        onClose();
      }, 1800);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    setDescription("");
    setError(null);
    setSubmitted(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleClose}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View
              style={{
                backgroundColor: COLORS.bg,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: 24,
                paddingBottom: 36,
              }}
            >
              {/* Header row */}
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: COLORS.errorMuted,
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 10,
                  }}
                >
                  <Ionicons name="bug" size={18} color={COLORS.error} />
                </View>
                <Text style={{ color: COLORS.text, fontSize: 17, fontWeight: "700", flex: 1 }}>
                  Report a Bug
                </Text>
                <TouchableOpacity onPress={handleClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <Ionicons name="close" size={22} color={COLORS.textTertiary} />
                </TouchableOpacity>
              </View>

              {/* Context pill */}
              <View
                style={{
                  backgroundColor: COLORS.bgElevated,
                  borderRadius: 10,
                  padding: 10,
                  marginBottom: 14,
                  borderWidth: 1,
                  borderColor: COLORS.borderLight,
                }}
              >
                <Text style={{ color: COLORS.textTertiary, fontSize: 11, fontWeight: "600", letterSpacing: 0.5, marginBottom: 2 }}>
                  CONTEXT
                </Text>
                <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>
                  Phase: {phase} {factContent ? `· ${factContent.substring(0, 60)}${factContent.length > 60 ? "…" : ""}` : ""}
                </Text>
              </View>

              {/* Description input */}
              {submitted ? (
                <View style={{ alignItems: "center", paddingVertical: 20 }}>
                  <Ionicons name="checkmark-circle" size={42} color={COLORS.success} />
                  <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: "600", marginTop: 10 }}>
                    Report submitted
                  </Text>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginTop: 4 }}>
                    Thanks — we'll review it.
                  </Text>
                </View>
              ) : (
                <>
                  <TextInput
                    placeholder="What went wrong? (e.g. checkin question cut off, wrong fact repeated…)"
                    placeholderTextColor={COLORS.textTertiary}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                    maxLength={500}
                    autoFocus
                    style={{
                      backgroundColor: COLORS.bgElevated,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: COLORS.borderLight,
                      padding: 14,
                      color: COLORS.text,
                      fontSize: 15,
                      minHeight: 96,
                      textAlignVertical: "top",
                      marginBottom: 4,
                    }}
                  />
                  <Text style={{ color: COLORS.textTertiary, fontSize: 12, textAlign: "right", marginBottom: 14 }}>
                    {description.length}/500
                  </Text>

                  {error && (
                    <Text style={{ color: COLORS.error, fontSize: 13, marginBottom: 10 }}>{error}</Text>
                  )}

                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={!description.trim() || submitting}
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: description.trim() ? COLORS.error : COLORS.bgTertiary,
                      borderRadius: 14,
                      padding: 16,
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="send" size={16} color={description.trim() ? "#fff" : COLORS.textTertiary} />
                        <Text
                          style={{
                            color: description.trim() ? "#fff" : COLORS.textTertiary,
                            fontSize: 15,
                            fontWeight: "700",
                          }}
                        >
                          Submit Report
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}
