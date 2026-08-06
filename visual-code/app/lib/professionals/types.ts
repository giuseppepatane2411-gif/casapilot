import type {
  LanguageCode,
  RemoteRequestContext,
  RemoteExecutionLevel,
  RemoteFeasibility,
  DocumentHandlingMode,
  SignatureMode,
} from "@/lib/remote-layer/types";

export type AvailabilityStatus = "active" | "limited" | "activating";
export type WizardQuestionType =
  | "single"
  | "multi"
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "boolean";
export type LeadStatus =
  | "draft"
  | "submitted"
  | "matching"
  | "matched"
  | "viewed"
  | "quote_received"
  | "quote_accepted"
  | "contacts_unlocked"
  | "job_in_progress"
  | "job_completed"
  | "cancelled";
export type QuoteStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "accepted"
  | "rejected";

export interface WizardOption {
  value: string;
  label: string;
  description?: string;
}

export interface WizardQuestion {
  id: string;
  label: string;
  helper?: string;
  type: WizardQuestionType;
  required?: boolean;
  placeholder?: string;
  options?: WizardOption[];
}

export interface ProfessionalService {
  id: string;
  categoryId: string;
  name: string;
  shortDescription: string;
  eligibleProfessions: string[];
  availabilityStatus: AvailabilityStatus;
  questions: WizardQuestion[];
  quoteFields: string[];
  reviewCriteria: string[];
}

export interface ProfessionalCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  availabilityStatus: AvailabilityStatus;
  services: ProfessionalService[];
}

export interface LeadRequest {
  id: string;
  ownerId: string;
  categoryId: string;
  serviceId: string;
  propertyLabel: string;
  location: string;
  answers: Record<string, string | string[] | boolean>;
  urgency: string;
  budget: string;
  notes: string;
  remoteContext: RemoteRequestContext;
  status: LeadStatus;
  leadScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteRemoteSupport {
  remoteExecutionLevel: RemoteExecutionLevel;
  ownerPresenceRequired: boolean;
  videoCallAvailable: boolean;
  photoReportAvailable: boolean;
  delegationSupported: boolean;
  spokenLanguages: LanguageCode[];
  remoteFeasibility?: RemoteFeasibility;
  documentHandling?: DocumentHandlingMode;
  signatureMode?: SignatureMode;
  localContactSufficient?: boolean;
}

export interface Quote {
  id: string;
  leadId: string;
  professionalId: string;
  professionalName: string;
  professionalTitle: string;
  verified: boolean;
  rating: number;
  reviewsCount: number;
  priceType:
    | "fixed"
    | "range"
    | "starting_from"
    | "hourly"
    | "after_inspection";
  priceMin: number;
  priceMax?: number;
  vatIncluded: boolean;
  included: string[];
  excluded: string[];
  additionalCosts: string;
  firstAvailability: string;
  estimatedDuration: string;
  validUntil: string;
  message: string;
  remoteSupport?: QuoteRemoteSupport;
  status: QuoteStatus;
  createdAt: string;
}

export interface ProfessionalProfile {
  id: string;
  accountType:
    | "freelancer"
    | "studio"
    | "agency"
    | "company"
    | "service_company";
  displayName: string;
  profession: string;
  serviceIds: string[];
  serviceAreas: string[];
  onlineAvailable: boolean;
  yearsExperience: number;
  bio: string;
  verificationItems: string[];
  acceptedRules: boolean;
  updatedAt: string;
}

export interface Message {
  id: string;
  leadId: string;
  sender: "owner" | "professional";
  body: string;
  redacted: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  leadId: string;
  quoteId: string;
  professionalId: string;
  professionalName: string;
  clarity: number;
  communication: number;
  punctuality: number;
  quality: number;
  value: number;
  comment: string;
  verified: true;
  createdAt: string;
}
