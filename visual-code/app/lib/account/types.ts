export type AccountType = "private" | "professional";

export type ProfessionalVerificationStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "changes_requested"
  | "verified"
  | "suspended";

export type AccountProfile = {
  id: string;
  email: string;
  accountType: AccountType;
  fullName: string;
  phone: string;
  city: string;
  province: string;
  marketingConsent: boolean;
};

export type ProfessionalProfile = {
  userId: string;
  profession: string;
  businessName: string;
  vatNumber: string;
  registrationNumber: string;
  phone: string;
  city: string;
  province: string;
  websiteUrl: string;
  bio: string;
  serviceAreas: string[];
  yearsExperience: number | null;
  verificationStatus: ProfessionalVerificationStatus;
  verificationNotes: string;
  isPublic: boolean;
  verifiedAt: string | null;
};
