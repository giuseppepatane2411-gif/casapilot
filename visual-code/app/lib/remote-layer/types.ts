export type LanguageCode = "it" | "en" | "de" | "fr" | "es";

// Kept for backward compatibility with V71 components.
export type LanguageLevel = "basic" | "intermediate" | "advanced" | "native";
export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "native";

export type PresenceAvailability =
  | "available"
  | "specific_dates"
  | "remote_only"
  | "local_contact";

export type RemoteExecutionLevel =
  | "none"
  | "consultation_only"
  | "mostly_remote"
  | "fully_remote";

export type OwnerPresenceRequirement =
  | "never"
  | "sometimes"
  | "required";

export type CommunicationPreference =
  | "automatic"
  | "direct_preferred"
  | "translation_allowed"
  | "direct_only";

export type ContentSensitivity =
  | "routine"
  | "technical"
  | "financial"
  | "legal"
  | "official_document";

export type TranslationMethod =
  | "same_language"
  | "local_glossary"
  | "provider"
  | "human_review"
  | "none";

export type TranslationQuality = "unknown" | "low" | "medium" | "high";

export type TranslationStatus =
  | "same_language"
  | "queued"
  | "processing"
  | "translated"
  | "demo_translation"
  | "provider_required"
  | "needs_review"
  | "approved"
  | "failed"
  | "original_only";

export type RemoteFeasibility =
  | "local_only"
  | "remote_coordination"
  | "mostly_remote"
  | "fully_remote";

export type DocumentHandlingMode =
  | "digital"
  | "digital_and_originals"
  | "physical_originals"
  | "not_applicable";

export type SignatureMode =
  | "not_required"
  | "digital_possible"
  | "delegation_possible"
  | "in_person_required";

export interface LanguageSkill {
  language: LanguageCode;
  level: LanguageLevel;
  cefr?: CefrLevel;
  verified?: boolean;
}

export interface PreferredContactWindow {
  day: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
  start: string;
  end: string;
  enabled: boolean;
}

export interface OwnerRemotePreferences {
  preferredLanguage: LanguageCode;
  countryOfResidence: string;
  timezone: string;
  presenceAvailability: PresenceAvailability;
  specificPresenceDates: string;
  localContactAvailable: boolean;
  localContactRole?: string;
  translationEnabled: boolean;
  translationConsent?: boolean;
  communicationPreference?: CommunicationPreference;
  showOriginalByDefault?: boolean;
  videoCallPreferred: boolean;
  preferredContactWindows?: PreferredContactWindow[];
  updatedAt: string;
}

export interface RemoteRequestContext {
  ownerLanguage: LanguageCode;
  countryOfResidence: string;
  timezone: string;
  presenceAvailability: PresenceAvailability;
  specificPresenceDates?: string;
  localContactAvailable: boolean;
  localContactRole?: string;
  translationEnabled: boolean;
  translationConsent?: boolean;
  communicationPreference?: CommunicationPreference;
  showOriginalByDefault?: boolean;
  videoCallPreferred: boolean;
  preferredContactWindows?: PreferredContactWindow[];
}

export interface ProfessionalRemoteCapabilities {
  languageSkills: LanguageSkill[];
  remoteConsultation: boolean;
  videoCallAvailable: boolean;
  internationalClientExperience: boolean;
  photoReportAvailable: boolean;
  delegationSupported: boolean;
  asynchronousUpdates?: boolean;
  preferredContactWindows?: PreferredContactWindow[];
}

export interface RemoteWorkflowStep {
  id: string;
  title: string;
  description: string;
  responsible: "owner" | "professional" | "local_contact" | "pilot";
  ownerPresenceRequired: boolean;
  canUseDelegation: boolean;
  documentRequired?: string;
}

export interface ServiceRemoteConfiguration {
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
  workflowSteps?: RemoteWorkflowStep[];
  reportFrequency?: "on_milestone" | "daily" | "weekly" | "on_request";
}

export interface GlossaryReference {
  term: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  explanation?: string;
}

export interface RemoteMessage {
  id: string;
  leadId: string;
  senderRole: "owner" | "professional" | "admin";
  senderId: string;
  originalLanguage: LanguageCode;
  originalText: string;
  translatedLanguage?: LanguageCode;
  translatedText?: string;
  translationStatus: TranslationStatus;
  translationMethod?: TranslationMethod;
  translationQuality?: TranslationQuality;
  contentSensitivity?: ContentSensitivity;
  reviewRequired?: boolean;
  reviewedAt?: string;
  reviewedBy?: string;
  glossaryReferences?: GlossaryReference[];
  contactDataProtected: boolean;
  createdAt: string;
}

export interface TranslationRequestInput {
  originalText: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  contentSensitivity?: ContentSensitivity;
  context?: "chat" | "quote" | "technical_note" | "document";
}

export interface TranslationResult {
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  originalText: string;
  translatedText?: string;
  status: TranslationStatus;
  method?: TranslationMethod;
  quality?: TranslationQuality;
  contentSensitivity?: ContentSensitivity;
  reviewRequired?: boolean;
  notice?: string;
  glossaryReferences?: GlossaryReference[];
}

export interface RemoteOperationPlan {
  leadId: string;
  serviceId: string;
  feasibility: RemoteFeasibility;
  summary: string;
  ownerPresenceNeeded: boolean;
  localContactUseful: boolean;
  delegationPossible: boolean;
  inspectionRequired: boolean;
  signatureMode: SignatureMode;
  documentHandling: DocumentHandlingMode;
  steps: RemoteWorkflowStep[];
  warnings: string[];
}
