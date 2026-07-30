export type OperationType = "sale" | "rent";

export type PropertyType =
  | "apartment"
  | "house"
  | "commercial"
  | "land"
  | "garage";

export type OccupancyStatus = "free" | "owner" | "tenant" | "other";

export type DocumentKey =
  | "ownership"
  | "cadastralPlan"
  | "cadastralSurvey"
  | "energyCertificate"
  | "habitability"
  | "systems"
  | "condominium"
  | "urbanCompliance"
  | "leaseTemplate";

export type WizardData = {
  operation: OperationType | "";
  propertyType: PropertyType | "";
  propertyName: string;
  surface: string;
  occupancy: OccupancyStatus | "";
  country: string;
  city: string;
  province: string;
  address: string;
  postalCode: string;
  documents: DocumentKey[];
};

export type PropertyJourney = {
  version: 1;
  id: string;
  status: "active";
  createdAt: string;
  updatedAt: string;
  operation: OperationType;
  property: {
    type: PropertyType;
    name: string;
    surface: number | null;
    occupancy: OccupancyStatus | null;
    country: string;
    city: string;
    province: string;
    address: string;
    postalCode: string;
  };
  documents: DocumentKey[];
  healthScore: number;
  progress: number;
  completedActivities: number;
  totalActivities: number;
};

export type JourneyMission = {
  title: string;
  description: string;
  time: string;
  scoreGain: number;
  href: string;
};

export type WizardDraft = {
  version: 1;
  step: number;
  data: WizardData;
  updatedAt: string;
};
