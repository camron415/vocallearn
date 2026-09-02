export type AskConversation = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type AskMessage = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
};

export type AnswerLength = "short" | "medium" | "long";

export type HaloLane = "family" | "tester" | "lab";

export type HaloProfile = {
  displayName: string;
  answerLength: AnswerLength;
  onboarded: boolean;
  isAdmin: boolean;
  lane: HaloLane;
  timeZone?: string;
  geoCity?: string;
  geoRegion?: string;
  geoCountry?: string;
};

export type HaloRecipe = {
  id: string;
  title: string;
  ingredients: string;
  steps: string;
  photo_path?: string | null;
  created_at: string;
};

export type ChatAttachment = {
  name: string;
  type: string;
  data: string;
};
