import type { GuimmiaOperationType } from "@/lib/guimmia/brain/case-orchestrator/types";
import type { GuimmiaIntakeField } from "@/lib/guimmia/intake/options";
import type { GuimmiaBrainConversationMessage, GuimmiaBrainUsage } from "@/lib/guimmia/openai/brain-types";
import type { SiteCustomerRole } from "@/lib/guimmia/site-orchestration/types";

export type GuimmiaIntakeDraft = {
  id: string;
  objective: string;
  operationType: GuimmiaOperationType | null;
  customerRole: SiteCustomerRole;
  propertyType: string;
  country: string;
  city: string;
  province: string;
  address: string;
  postalCode: string;
  surfaceSqm: number | null;
  rooms: number | null;
  condition: string;
  occupancy: string;
  notes: string;
  locationVerified: boolean;
};

export type GuimmiaIntakeRequest = {
  message: string;
  draft: GuimmiaIntakeDraft;
  conversation?: GuimmiaBrainConversationMessage[];
};

export type GuimmiaIntakePatch = Partial<Omit<GuimmiaIntakeDraft, "id" | "locationVerified">>;

export type GuimmiaIntakeSuccess = {
  ok: true;
  interactionId: string;
  cacheHit: boolean;
  auditSaved: boolean;
  model: "gpt-5.6-luna";
  mode: "DRY_RUN";
  assistantMessage: string;
  patch: GuimmiaIntakePatch;
  extractedFields: GuimmiaIntakeField[];
  missingField: GuimmiaIntakeField | null;
  quickReplies: string[];
  readyForConfirmation: boolean;
  usage: GuimmiaBrainUsage;
  safety: {
    humanConfirmationRequired: true;
    caseCreated: false;
    personalContactDataSentToModel: false;
    controlledVocabularyApplied: true;
  };
};

export type GuimmiaIntakeError = {
  ok: false;
  error:
    | "invalid_request"
    | "authentication_required"
    | "openai_not_configured"
    | "database_not_configured"
    | "request_limit_reached"
    | "budget_limit_reached"
    | "intake_failed";
  message: string;
};
