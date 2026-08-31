export type OperationType =
  | "sale"
  | "rent"
  | "rent_long_term"
  | "rent_transitory"
  | "rent_student"
  | "rent_room"
  | "rent_tourist_short";

export type PropertyType =
  | "apartment"
  | "house"
  | "commercial"
  | "land"
  | "garage"
  | "room";

export type RoomType = "single" | "double" | "shared";
export type HouseholdComposition =
  | "none"
  | "men"
  | "women"
  | "mixed"
  | "not_specified";
export type OccupantProfile = "student" | "worker";
export type RoomGenderPreference = "none" | "men" | "women";

export type RoomRentalData = {
  roomType: RoomType | "";
  roomSurface: string;
  privateBathroom: boolean;
  roomFurnished: boolean;
  currentRoommates: string;
  householdComposition: HouseholdComposition;
  acceptedOccupantProfiles: OccupantProfile[];
  genderPreference: RoomGenderPreference;
  availableFrom: string;
  expensesIncluded: boolean;
  compatibilityNotes: string;
};

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
  | "leaseTemplate"
  | "rentalAuthority"
  | "transitoryReasonEvidence"
  | "studentEnrollment"
  | "guarantorEvidence"
  | "touristUnitCompliance"
  | "touristLocalRules"
  | "touristGuestReporting";

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
  cadastralSheet: string;
  cadastralParcel: string;
  cadastralSubaltern: string;
  latitude: number | null;
  longitude: number | null;
  locationVerified: boolean;
  locationVerifiedAt: string;
  locationLabel: string;
  roomRental: RoomRentalData;
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
    cadastralSheet: string;
    cadastralParcel: string;
    cadastralSubaltern: string;
    latitude: number | null;
    longitude: number | null;
    locationVerified: boolean;
    locationVerifiedAt: string;
    locationLabel: string;
    roomRental: RoomRentalData;
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
