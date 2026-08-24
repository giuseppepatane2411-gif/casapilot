import type {
  CaseDecisionStatus,
  GuimmiaOperationType,
  GuimmiaServiceModel,
} from "@/lib/guimmia/brain/case-orchestrator/types";

export type SiteCustomerRole =
  | "OWNER"
  | "SELLER"
  | "BUYER"
  | "LANDLORD"
  | "TENANT"
  | "GUEST"
  | "REPRESENTATIVE"
  | "UNCONFIRMED";

export type SitePropertySnapshot = {
  id?: string;
  type?: string;
  country?: string;
  city?: string;
  province?: string;
  address?: string;
  locationVerified?: boolean;
  documents?: string[];
};

export type SiteProgressSnapshot = {
  currentPhase?: string;
  completedActionCodes?: string[];
};

export type SiteOrchestrationRequest = {
  caseId: string;
  caseVersion?: number;
  operationType?: GuimmiaOperationType | null;
  customerRole?: SiteCustomerRole;
  serviceModel?: GuimmiaServiceModel;
  property?: SitePropertySnapshot;
  progress?: SiteProgressSnapshot;
  confidence?: number;
};

export type SiteQuestionOption = {
  value: string;
  label: string;
};

export type SiteCustomerQuestion = {
  id: string;
  prompt: string;
  whyItMatters: string;
  options?: SiteQuestionOption[];
};

export type SiteOrchestrationResponse = {
  ok: true;
  integrationVersion: "77.2.0";
  engineVersion: string;
  mode: "DRY_RUN";
  operationType: GuimmiaOperationType | null;
  operationLabel: string;
  status: CaseDecisionStatus;
  statusLabel: string;
  stage: {
    title: string;
  };
  nextAction: {
    title: string;
    owner: "AI" | "CUSTOMER" | "GUIMMIA" | "PROFESSIONAL";
    ctaLabel: string;
    href: string;
  } | null;
  customerQuestions: SiteCustomerQuestion[];
  customerExplanation: string;
  handoff: {
    required: true;
    destination: "GUIMMIA" | "PROFESSIONAL";
    dueAt: string;
  } | null;
  safety: {
    executionPerformed: false;
    humanAuthorityPreserved: true;
    internalReasonCodesExposed: false;
  };
};

export type SiteOrchestrationError = {
  ok: false;
  error: string;
};
