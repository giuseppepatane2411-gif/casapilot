import type {
  CommunicationPreference,
  LanguageCode,
  LanguageSkill,
  OwnerPresenceRequirement,
  PresenceAvailability,
  ProfessionalRemoteCapabilities,
  RemoteExecutionLevel,
  RemoteFeasibility,
  DocumentHandlingMode,
  SignatureMode,
  RemoteWorkflowStep,
} from "@/lib/remote-layer/types";

export type ProfessionalAccountType =
  | "freelancer"
  | "studio"
  | "agency"
  | "company"
  | "service_company";

export type VerificationStatus =
  | "not_started"
  | "pending"
  | "verified"
  | "rejected"
  | "expired";

export type OfferingActivationStatus =
  | "draft"
  | "pending_verification"
  | "active"
  | "limited"
  | "paused"
  | "rejected";

export type DeliveryMode = "onsite" | "online" | "hybrid";
export type PricingMode =
  | "fixed"
  | "starting_from"
  | "range"
  | "hourly"
  | "daily"
  | "per_sqm"
  | "after_inspection";

export type LeadUrgency =
  | "asap"
  | "within_week"
  | "within_month"
  | "flexible";

export type PropertyType =
  | "apartment"
  | "house"
  | "commercial"
  | "office"
  | "land"
  | "condominium"
  | "garage"
  | "other";

export type LeadStatus =
  | "draft"
  | "submitted"
  | "matching"
  | "invited"
  | "quotes_open"
  | "quote_accepted"
  | "contacts_unlocked"
  | "job_in_progress"
  | "job_completed"
  | "cancelled";

export type MatchDecision = "eligible" | "reserve" | "blocked";
export type DistributionStatus =
  | "queued"
  | "wave_1"
  | "wave_2"
  | "completed"
  | "manual_review";
export type QuoteStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "accepted"
  | "declined"
  | "expired"
  | "withdrawn";

export interface ProfessionalIdentity {
  id: string;
  userId: string;
  accountType: ProfessionalAccountType;
  displayName: string;
  legalName: string;
  profession: string;
  taxId?: string;
  vatNumber?: string;
  bio: string;
  yearsExperience: number;
  languages: string[];
  languageSkills: LanguageSkill[];
  remoteCapabilities: ProfessionalRemoteCapabilities;
  generalAreas: string[];
  onlineAvailable: boolean;
  weeklyLeadLimit: number;
  pauseAllLeads: boolean;
  verificationStatus: VerificationStatus;
  verificationItems: VerificationItem[];
  createdAt: string;
  updatedAt: string;
}

export interface VerificationItem {
  id: string;
  type:
    | "identity"
    | "vat"
    | "business_registry"
    | "professional_register"
    | "insurance"
    | "license"
    | "certification"
    | "drone_license"
    | "other";
  label: string;
  status: VerificationStatus;
  reference?: string;
  expiresAt?: string;
}

export interface ServiceRequirement {
  id: string;
  label: string;
  description: string;
  required: boolean;
  acceptedVerificationTypes: VerificationItem["type"][];
}

export interface ServiceCapability {
  id: string;
  label: string;
  description?: string;
}

export interface ServicePolicy {
  serviceId: string;
  regulated: boolean;
  compatibleProfessions: string[];
  requirements: ServiceRequirement[];
  defaultCapabilities: ServiceCapability[];
  allowedDeliveryModes: DeliveryMode[];
  supportedPropertyTypes: PropertyType[];
  quoteTemplate: string[];
  reviewCriteria: string[];
}

export interface AvailabilityWindow {
  id: string;
  day:
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday";
  start: string;
  end: string;
  enabled: boolean;
}

export interface ServiceOffering {
  id: string;
  professionalId: string;
  serviceId: string;
  activationStatus: OfferingActivationStatus;
  deliveryModes: DeliveryMode[];
  useGeneralAreas: boolean;
  areas: string[];
  radiusKm?: number;
  acceptedUrgencies: LeadUrgency[];
  propertyTypes: PropertyType[];
  pricingMode: PricingMode;
  priceMin?: number;
  priceMax?: number;
  vatIncluded: boolean;
  weeklyCapacity: number;
  currentWeekAssigned: number;
  minimumLeadQuality: number;
  responseSlaHours: number;
  availabilityWindows: AvailabilityWindow[];
  capabilities: string[];
  exclusions: string[];
  verificationItemIds: string[];
  internalNotes: string;
  autoPauseWhenFull: boolean;
  remoteExecutionLevel: RemoteExecutionLevel;
  ownerPresenceRequirement: OwnerPresenceRequirement;
  inspectionRequired: boolean;
  delegationSupported: boolean;
  photoReportAvailable: boolean;
  videoCallAvailable: boolean;
  remoteFeasibility?: RemoteFeasibility;
  documentHandling?: DocumentHandlingMode;
  signatureMode?: SignatureMode;
  localContactSufficient?: boolean;
  ownerActionRequired?: string[];
  remoteWorkflowSteps?: RemoteWorkflowStep[];
  createdAt: string;
  updatedAt: string;
}

export interface LeadRequest {
  id: string;
  ownerId: string;
  serviceId: string;
  categoryId: string;
  propertyLabel: string;
  approximateLocation: string;
  propertyType: PropertyType;
  urgency: LeadUrgency;
  budgetMin?: number;
  budgetMax?: number;
  answers: Record<string, string | number | boolean | string[]>;
  notes: string;
  qualityScore: number;
  ownerLanguage: LanguageCode;
  countryOfResidence: string;
  timezone: string;
  presenceAvailability: PresenceAvailability;
  specificPresenceDates?: string;
  localContactAvailable: boolean;
  translationEnabled: boolean;
  videoCallPreferred: boolean;
  communicationPreference?: CommunicationPreference;
  showOriginalByDefault?: boolean;
  localContactRole?: string;
  status: LeadStatus;
  distributionStatus: DistributionStatus;
  maxProfessionals: number;
  createdAt: string;
  updatedAt: string;
}

export interface MatchEvaluation {
  leadId: string;
  professionalId: string;
  offeringId?: string;
  decision: MatchDecision;
  score: number;
  hardBlockers: string[];
  positiveReasons: string[];
  warnings: string[];
  evaluatedAt: string;
}

export interface LeadInvitation {
  id: string;
  leadId: string;
  professionalId: string;
  offeringId: string;
  wave: 1 | 2;
  rank: number;
  score: number;
  status: "sent" | "viewed" | "accepted" | "declined" | "expired";
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Quote {
  id: string;
  leadId: string;
  professionalId: string;
  offeringId: string;
  priceType: PricingMode;
  priceMin: number;
  priceMax?: number;
  vatIncluded: boolean;
  includedItems: string[];
  excludedItems: string[];
  additionalCosts: string;
  firstAvailability: string;
  estimatedDuration: string;
  validityDays: number;
  message: string;
  status: QuoteStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  leadId: string;
  senderRole: "owner" | "professional" | "admin";
  senderId: string;
  body: string;
  redacted: boolean;
  originalLanguage?: LanguageCode;
  translatedLanguage?: LanguageCode;
  translatedText?: string;
  createdAt: string;
}

export interface Job {
  id: string;
  leadId: string;
  quoteId: string;
  professionalId: string;
  status:
    | "pending"
    | "appointment_scheduled"
    | "waiting_documents"
    | "in_progress"
    | "waiting_owner"
    | "completed"
    | "issue_reported"
    | "cancelled";
  nextAction?: string;
  startedAt?: string;
  completedAt?: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  jobId: string;
  professionalId: string;
  clarity: number;
  communication: number;
  punctuality: number;
  quality: number;
  value: number;
  comment: string;
  verified: true;
  professionalReply?: string;
  createdAt: string;
}

export interface ProfessionalOsState {
  version: 72;
  identity: ProfessionalIdentity | null;
  offerings: ServiceOffering[];
  leads: LeadRequest[];
  matches: MatchEvaluation[];
  invitations: LeadInvitation[];
  quotes: Quote[];
  messages: Message[];
  jobs: Job[];
  reviews: Review[];
}
