export type AskMessageRole = "user" | "assistant" | "system";

export type ProposedFactStatus = "pending" | "approved" | "rejected" | "duplicate";

export interface AskConversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface AskMessage {
  id: string;
  conversation_id: string;
  role: AskMessageRole;
  content: string;
  created_at: string;
}

export interface ProposedFact {
  id: string;
  user_id: string;
  source_conversation_id: string | null;
  source_message_id: string | null;
  content: string;
  explanation: string | null;
  tags: string[] | null;
  why_worth_learning: string | null;
  confidence: number;
  status: ProposedFactStatus;
  dedup_of_fact_id: string | null;
  approved_fact_id: string | null;
  created_at: string;
  reviewed_at: string | null;
}

/** Fixed destination for approved Ask facts (must match SQL seed). */
export const FROM_ASK_SUBJECT_ID = "d0e1f2a3-b4c5-4678-9abc-def012345601";
export const FROM_ASK_LESSON_ID = "e1f2a3b4-c5d6-4789-abcd-ef0123456702";
