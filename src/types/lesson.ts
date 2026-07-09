import type {
  FactLearningProfile,
  FactTeachingPlan,
  LessonTeachingPlan,
} from "@/types/teaching";

export interface Subject {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  is_community: boolean;
  created_by: string | null;
  created_at: string;
}

export interface Module {
  id: string;
  subject_id: string;
  title: string;
  description: string | null;
  order_index: number;
  created_at: string;
}

export interface Lesson {
  id: string;
  subject_id: string;
  module_id: string | null;
  title: string;
  description: string | null;
  order_index: number;
  unlock_threshold: number;
  teaching_plan?: LessonTeachingPlan | null;
  is_community: boolean;
  created_by: string | null;
  created_at: string;
}

export interface Fact {
  id: string;
  lesson_id: string;
  content: string;
  explanation: string | null;
  strictness: "high" | "medium" | "low";
  order_index: number;
  tags: string[] | null;
  teaching_plan?: FactTeachingPlan | null;
  created_at: string;
}

export interface UserFactProgress {
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
  learning_profile?: FactLearningProfile | null;
  created_at: string;
  updated_at: string;
}

export interface SessionLog {
  id: string;
  user_id: string;
  lesson_id: string;
  mode: "voice" | "write" | "both";
  started_at: string;
  ended_at: string | null;
  facts_reviewed: number;
  facts_correct: number;
  duration_seconds: number | null;
}

export interface LessonCompletion {
  id: string;
  user_id: string;
  lesson_id: string;
  completed_at: string;
  times_completed: number;
  facts_total: number;
  facts_correct: number;
  best_accuracy: number;
  last_duration_seconds: number | null;
}
