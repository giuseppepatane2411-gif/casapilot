import type { GuimmiaOperationType } from "@/lib/guimmia/brain/case-orchestrator/types";
import type { SiteCustomerRole } from "@/lib/guimmia/site-orchestration/types";

export type GuimmiaCaseRoomPanel =
  | "CASE_ROOM"
  | "PROPERTY"
  | "DOCUMENTS"
  | "AGENDA";

export type GuimmiaCaseRoomDraft = {
  id: string;
  objective: string;
  propertyType: string;
  country: string;
  city: string;
  province: string;
  address: string;
  postalCode: string;
  locationVerified: boolean;
  surface: string;
  rooms: string;
  condition: string;
  occupancy: string;
  notes: string;
  operationType?: GuimmiaOperationType;
  customerRole?: SiteCustomerRole;
  status: "draft" | "confirmed";
  updatedAt: string;
};

export type GuimmiaActionReceipt = {
  title: string;
  items: string[];
  targetPanel?: GuimmiaCaseRoomPanel;
  requiresConfirmation?: boolean;
};

export type GuimmiaCaseRoomNextAction = {
  code:
    | "DESCRIBE_GOAL"
    | "COMPLETE_PROPERTY"
    | "CONFIRM_LOCATION"
    | "CONFIRM_PROPERTY"
    | "UPLOAD_DOCUMENT"
    | "REVIEW_DOCUMENT"
    | "DECLARE_AVAILABILITY"
    | "CONFIRM_APPOINTMENT"
    | "ASK_NEXT_MOVE";
  title: string;
  explanation: string;
  panel: GuimmiaCaseRoomPanel;
  prompt?: string;
  authority: "CUSTOMER" | "GUIMMIA" | "PROFESSIONAL";
};

export type GuimmiaCaseTimelineEvent = {
  id: string;
  label: string;
  detail: string;
  at: string;
  tone: "BLUE" | "GREEN" | "AMBER" | "SLATE";
};
