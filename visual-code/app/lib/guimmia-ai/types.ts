export const GUIMMIA_ASSISTANT_FOCUSES = [
  "GENERAL",
  "SALE",
  "RENT",
  "LISTING",
  "CONTRACT",
  "DOCUMENTS",
  "VALUATION",
] as const;

export type GuimmiaAssistantFocus =
  (typeof GUIMMIA_ASSISTANT_FOCUSES)[number];

export type GuimmiaAIProject = {
  id: string;
  name: string;
  created_at: string;
};

export type GuimmiaAIConversation = {
  id: string;
  project_id: string | null;
  title: string;
  focus: GuimmiaAssistantFocus;
  created_at: string;
  updated_at: string;
};

export type GuimmiaAIMessage = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type GuimmiaAIPracticeLink = {
  conversation_id: string;
  listing_id: string;
  created_at: string;
};

export type GuimmiaAIReviewStatus =
  | "SUBMITTED"
  | "IN_REVIEW"
  | "COMPLETED"
  | "CLOSED";

export type GuimmiaAIReviewRequest = {
  id: string;
  conversation_id: string;
  listing_id: string | null;
  request_type: "GENERAL_REVIEW" | "PROFESSIONAL_REVIEW";
  subject: string;
  note: string;
  status: GuimmiaAIReviewStatus;
  created_at: string;
  updated_at: string;
};

export function isGuimmiaAssistantFocus(
  value: unknown,
): value is GuimmiaAssistantFocus {
  return GUIMMIA_ASSISTANT_FOCUSES.includes(
    value as GuimmiaAssistantFocus,
  );
}
