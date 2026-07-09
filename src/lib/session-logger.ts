// Fire-and-forget logger for per-turn session interaction data.
// Call logInteraction() at each tutor/user exchange — it writes to Supabase
// in the background without blocking the session flow.
//
// The session_interactions table is the source of truth for:
//   - Latency analysis (where is the dead air coming from?)
//   - Filler-phrase mismatch detection (did the ack clip fit the AI response?)
//   - Tutor quality review (flag low-quality or off-topic responses)
//   - Prompt iteration (aggregate eval scores by interaction type to guide prompt changes)

import { supabase } from "@/lib/supabase";

export interface InteractionLog {
  // Required
  sessionLogId: string;
  userId: string;
  lessonId: string;
  interactionType:
    | "teach"
    | "quiz_prompt"
    | "review_prompt"
    | "user_answer"
    | "user_question"
    | "dont_know"
    | "teach_checkin_question"
    | "teach_checkin_advance"
    | "teach_checkin_timeout"
    | "clarification_question"
    | "skip";

  // Fact context (null for non-fact-bound interactions)
  factId?: string;
  factContent?: string;
  phase?: string;

  // Filler clip (only when a pre-cached clip played before the AI response)
  fillerClipKey?: string;
  fillerClipText?: string;

  // Tutor's spoken output
  tutorMessage?: string;

  // User's speech
  userTranscriptRaw?: string;
  userTranscriptClean?: string;

  // Scoring (quiz/review answer turns only)
  evalScore?: number;
  isCorrect?: boolean;

  // Timing (all milliseconds)
  sttLatencyMs?: number;        // mic-stop → transcript (future)
  grokLatencyMs?: number;       // callGrok start → response returned
  realtimeFirstAudioMs?: number;
  realtimeResponseDoneMs?: number;
  ttsLatencyMs?: number;        // speak() call → audio starts playing
  userResponseDelayMs?: number; // tutor finished speaking → submitResponse() called

  // Token usage
  tokenUsagePrompt?: number;
  tokenUsageCompletion?: number;
}

/**
 * Write an interaction record to Supabase. Fire-and-forget — never throws,
 * never blocks the caller. Errors are silently discarded (we don't want
 * logging failures to disrupt the lesson flow).
 */
export function logInteraction(log: InteractionLog): void {
  const basePayload = {
    session_log_id:          log.sessionLogId,
    user_id:                 log.userId,
    lesson_id:               log.lessonId,
    interaction_type:        log.interactionType,
    fact_id:                 log.factId ?? null,
    fact_content:            log.factContent ?? null,
    phase:                   log.phase ?? null,
    filler_clip_key:         log.fillerClipKey ?? null,
    filler_clip_text:        log.fillerClipText ?? null,
    tutor_message:           log.tutorMessage ?? null,
    user_transcript_raw:     log.userTranscriptRaw ?? null,
    user_transcript_clean:   log.userTranscriptClean ?? null,
    eval_score:              log.evalScore ?? null,
    is_correct:              log.isCorrect ?? null,
    stt_latency_ms:          log.sttLatencyMs ?? null,
    grok_latency_ms:         log.grokLatencyMs ?? null,
    tts_latency_ms:          log.ttsLatencyMs ?? null,
    user_response_delay_ms:  log.userResponseDelayMs ?? null,
    token_usage_prompt:      log.tokenUsagePrompt ?? null,
    token_usage_completion:  log.tokenUsageCompletion ?? null,
  };

  const extendedPayload = {
    ...basePayload,
    realtime_first_audio_ms: log.realtimeFirstAudioMs ?? null,
    realtime_response_done_ms: log.realtimeResponseDoneMs ?? null,
  };

  supabase
    .from("session_interactions")
    .insert(extendedPayload)
    .then(
      () => {},
      () => {
        supabase.from("session_interactions").insert(basePayload).then(() => {}, () => {});
      }
    );
}
