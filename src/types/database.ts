/**
 * Supabase Database Types
 *
 * These types will eventually be auto-generated using:
 *   npx supabase gen types typescript --project-id <your-project-id> > src/types/database.ts
 *
 * For now, manually defined to match our schema.
 */

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          preferred_mode: string;
          notification_style: string;
          notification_times: Record<string, unknown> | null;
          daily_goal_minutes: number;
          streak_count: number;
          tier: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          preferred_mode?: string;
          notification_style?: string;
          notification_times?: Record<string, unknown> | null;
          daily_goal_minutes?: number;
          streak_count?: number;
          tier?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          preferred_mode?: string;
          notification_style?: string;
          notification_times?: Record<string, unknown> | null;
          daily_goal_minutes?: number;
          streak_count?: number;
          tier?: string;
        };
        Relationships: [];
      };
      subjects: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          icon: string | null;
          is_community: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          icon?: string | null;
          is_community?: boolean;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          icon?: string | null;
          is_community?: boolean;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "subjects_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      lessons: {
        Row: {
          id: string;
          subject_id: string;
          title: string;
          description: string | null;
          order_index: number;
          teaching_plan: Record<string, unknown> | null;
          is_community: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          subject_id: string;
          title: string;
          description?: string | null;
          order_index?: number;
          teaching_plan?: Record<string, unknown> | null;
          is_community?: boolean;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          subject_id?: string;
          title?: string;
          description?: string | null;
          order_index?: number;
          teaching_plan?: Record<string, unknown> | null;
          is_community?: boolean;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "lessons_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lessons_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      facts: {
        Row: {
          id: string;
          lesson_id: string;
          content: string;
          explanation: string | null;
          strictness: string;
          order_index: number;
          tags: string[] | null;
          teaching_plan: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lesson_id: string;
          content: string;
          explanation?: string | null;
          strictness?: string;
          order_index?: number;
          tags?: string[] | null;
          teaching_plan?: Record<string, unknown> | null;
        };
        Update: {
          id?: string;
          lesson_id?: string;
          content?: string;
          explanation?: string | null;
          strictness?: string;
          order_index?: number;
          tags?: string[] | null;
          teaching_plan?: Record<string, unknown> | null;
        };
        Relationships: [
          {
            foreignKeyName: "facts_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "lessons";
            referencedColumns: ["id"];
          },
        ];
      };
      user_fact_progress: {
        Row: {
          id: string;
          user_id: string;
          fact_id: string;
          ease_factor: number;
          interval_days: number;
          repetitions: number;
          next_review_at: string;
          last_reviewed_at: string;
          mastery_level: number;
          times_correct: number;
          times_incorrect: number;
          learning_profile: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          fact_id: string;
          ease_factor?: number;
          interval_days?: number;
          repetitions?: number;
          next_review_at?: string;
          last_reviewed_at?: string;
          mastery_level?: number;
          times_correct?: number;
          times_incorrect?: number;
          learning_profile?: Record<string, unknown> | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          fact_id?: string;
          ease_factor?: number;
          interval_days?: number;
          repetitions?: number;
          next_review_at?: string;
          last_reviewed_at?: string;
          mastery_level?: number;
          times_correct?: number;
          times_incorrect?: number;
          learning_profile?: Record<string, unknown> | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_fact_progress_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_fact_progress_fact_id_fkey";
            columns: ["fact_id"];
            isOneToOne: false;
            referencedRelation: "facts";
            referencedColumns: ["id"];
          },
        ];
      };
      session_logs: {
        Row: {
          id: string;
          user_id: string;
          lesson_id: string;
          mode: string;
          started_at: string;
          ended_at: string | null;
          facts_reviewed: number;
          facts_correct: number;
          duration_seconds: number | null;
          avg_eval_score: number | null;
          avg_grok_latency_ms: number | null;
          total_grok_calls: number;
          total_questions_asked: number;
          flagged_interactions_count: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          lesson_id: string;
          mode: string;
          started_at?: string;
          ended_at?: string | null;
          facts_reviewed?: number;
          facts_correct?: number;
          duration_seconds?: number | null;
          avg_eval_score?: number | null;
          avg_grok_latency_ms?: number | null;
          total_grok_calls?: number;
          total_questions_asked?: number;
          flagged_interactions_count?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          lesson_id?: string;
          mode?: string;
          started_at?: string;
          ended_at?: string | null;
          facts_reviewed?: number;
          facts_correct?: number;
          duration_seconds?: number | null;
          avg_eval_score?: number | null;
          avg_grok_latency_ms?: number | null;
          total_grok_calls?: number;
          total_questions_asked?: number;
          flagged_interactions_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "session_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "session_logs_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "lessons";
            referencedColumns: ["id"];
          },
        ];
      };
      leaderboard_entries: {
        Row: {
          id: string;
          user_id: string;
          subject_id: string;
          mastery_score: number;
          facts_mastered: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject_id: string;
          mastery_score?: number;
          facts_mastered?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          subject_id?: string;
          mastery_score?: number;
          facts_mastered?: number;
        };
        Relationships: [
          {
            foreignKeyName: "leaderboard_entries_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leaderboard_entries_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
        ];
      };
      lesson_completions: {
        Row: {
          id: string;
          user_id: string;
          lesson_id: string;
          completed_at: string;
          times_completed: number;
          facts_total: number;
          facts_correct: number;
          best_accuracy: number;
          last_duration_seconds: number | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          lesson_id: string;
          completed_at?: string;
          times_completed?: number;
          facts_total?: number;
          facts_correct?: number;
          best_accuracy?: number;
          last_duration_seconds?: number | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          lesson_id?: string;
          completed_at?: string;
          times_completed?: number;
          facts_total?: number;
          facts_correct?: number;
          best_accuracy?: number;
          last_duration_seconds?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "lesson_completions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lesson_completions_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "lessons";
            referencedColumns: ["id"];
          },
        ];
      };
      session_interactions: {
        Row: {
          id: string;
          session_log_id: string;
          user_id: string;
          lesson_id: string;
          fact_id: string | null;
          fact_content: string | null;
          phase: string | null;
          interaction_type: string;
          filler_clip_key: string | null;
          filler_clip_text: string | null;
          tutor_message: string | null;
          user_transcript_raw: string | null;
          user_transcript_clean: string | null;
          eval_score: number | null;
          is_correct: boolean | null;
          stt_latency_ms: number | null;
          grok_latency_ms: number | null;
          realtime_first_audio_ms: number | null;
          realtime_response_done_ms: number | null;
          tts_latency_ms: number | null;
          user_response_delay_ms: number | null;
          token_usage_prompt: number | null;
          token_usage_completion: number | null;
          quality_flag: string | null;
          quality_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_log_id: string;
          user_id: string;
          lesson_id: string;
          fact_id?: string | null;
          fact_content?: string | null;
          phase?: string | null;
          interaction_type: string;
          filler_clip_key?: string | null;
          filler_clip_text?: string | null;
          tutor_message?: string | null;
          user_transcript_raw?: string | null;
          user_transcript_clean?: string | null;
          eval_score?: number | null;
          is_correct?: boolean | null;
          stt_latency_ms?: number | null;
          grok_latency_ms?: number | null;
          realtime_first_audio_ms?: number | null;
          realtime_response_done_ms?: number | null;
          tts_latency_ms?: number | null;
          user_response_delay_ms?: number | null;
          token_usage_prompt?: number | null;
          token_usage_completion?: number | null;
          quality_flag?: string | null;
          quality_notes?: string | null;
        };
        Update: {
          quality_flag?: string | null;
          quality_notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "session_interactions_session_log_id_fkey";
            columns: ["session_log_id"];
            isOneToOne: false;
            referencedRelation: "session_logs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "session_interactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      bug_reports: {
        Row: {
          id: string;
          session_log_id: string | null;
          user_id: string | null;
          lesson_id: string | null;
          phase: string | null;
          fact_content: string | null;
          user_description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_log_id?: string | null;
          user_id?: string | null;
          lesson_id?: string | null;
          phase?: string | null;
          fact_content?: string | null;
          user_description: string;
          created_at?: string;
        };
        Update: {
          user_description?: string;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}
