export type ValuationOperation =
  | "SALE"
  | "RENT_LONG_TERM"
  | "RENT_SHORT_TERM"
  | "RENT_ROOM";

export type PropertyCondition =
  | "NEW"
  | "RENOVATED"
  | "GOOD"
  | "TO_RENOVATE";

export type PropertyOccupancy = "VACANT" | "OWNER_OCCUPIED" | "TENANTED";

export type HeatingType =
  | "AUTONOMOUS"
  | "CENTRAL"
  | "HEAT_PUMP"
  | "NONE"
  | "UNKNOWN";

export type PropertyValuationInput = {
  operation: ValuationOperation;
  property: {
    propertyType: string;
    country?: string;
    city: string;
    province: string;
    postalCode?: string;
    address?: string;
    latitude?: number | null;
    longitude?: number | null;
    locationVerified?: boolean;
    locationLabel?: string;
    surfaceSqm: number;
    rooms: number;
    bedrooms: number;
    bathrooms: number;
    floor?: number | null;
    yearBuilt?: number | null;
    elevator: boolean;
    condition: PropertyCondition;
    energyClass?: string;
    heating: HeatingType;
    occupancy: PropertyOccupancy;
    monthlyCondominiumFees?: number | null;
    outdoorSpace: boolean;
    parking: boolean;
    furnished: boolean;
    roomDetails?: {
      roomType: "SINGLE" | "DOUBLE_SINGLE_USE" | "SHARED";
      roomSurfaceSqm: number;
      privateBathroom: boolean;
      currentRoommates: number;
      householdComposition: "NONE" | "MEN" | "WOMEN" | "MIXED" | "UNKNOWN";
      acceptedOccupantProfiles: Array<"STUDENT" | "WORKER">;
      availableFrom?: string;
      expensesIncluded: boolean;
    };
    notes?: string;
  };
  owner: {
    name: string;
    email: string;
    phone: string;
  };
  privacyAccepted: boolean;
  automatedAnalysisAccepted: boolean;
  website?: string;
};

export type ValuationSource = {
  title: string;
  url: string;
};

export type ValuationComparableSignal = {
  label: string;
  location: string;
  askingPrice: number;
  surfaceSqm: number;
  pricePerSqm: number;
  similarity: "HIGH" | "MEDIUM" | "LOW";
  note: string;
};

export type PropertyValuationResult = {
  currency: "EUR";
  period: "TOTAL" | "MONTH" | "NIGHT";
  range: {
    low: number;
    suggested: number;
    high: number;
  };
  officialBenchmark: {
    source: "OMI";
    available: boolean;
    referencePeriod: string;
    zone: string;
    propertyType: string;
    unit: "EUR_SQM_SALE" | "EUR_SQM_MONTH";
    low: number;
    high: number;
    note: string;
  };
  valuationMethod: {
    surfaceBasis: string;
    appliedFactors: string[];
    note: string;
  };
  marketEvidence: {
    evidenceSummary: string;
    observedUnit:
      | "EUR_SQM_SALE"
      | "EUR_SQM_MONTH"
      | "EUR_ROOM_MONTH"
      | "EUR_NIGHT";
    observedLow: number;
    observedMedian: number;
    observedHigh: number;
    comparableSignals: ValuationComparableSignal[];
  };
  rentalProjection: {
    applicable: boolean;
    basis: "NONE" | "ANNUAL_RENT" | "ANNUAL_GROSS_REVENUE";
    occupancyLowPercent: number;
    occupancyHighPercent: number;
    annualLow: number;
    annualSuggested: number;
    annualHigh: number;
    note: string;
  };
  confidence: "LOW" | "MEDIUM" | "HIGH";
  summary: string;
  factors: string[];
  cautions: string[];
  missingData: string[];
  nextSteps: string[];
  methodology: string;
  disclaimer: string;
};

export type ValuationQuality = {
  score: number;
  grade: "LIMITED" | "USEFUL" | "STRONG";
  sourceCount: number;
  comparableCount: number;
  dataCompleteness: number;
  notes: string[];
};

export type ValuationUsage = {
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  webSearchCalls: number;
  estimatedCostUsd: number;
};

export type PropertyValuationSuccess = {
  ok: true;
  leadId: string;
  leadSaved: boolean;
  mode: "DRY_RUN";
  model: "gpt-5.6-luna";
  operation: ValuationOperation;
  result: PropertyValuationResult;
  sources: ValuationSource[];
  usage: ValuationUsage;
  quality: ValuationQuality;
  continuationUrl: string;
  emailDelivery: "SENT" | "NOT_CONFIGURED" | "FAILED";
  humanReviewRequired: true;
};

export type PropertyValuationError = {
  ok: false;
  error:
    | "invalid_request"
    | "registration_required"
    | "openai_not_configured"
    | "database_not_configured"
    | "lead_capture_failed"
    | "valuation_persistence_failed"
    | "valuation_failed"
    | "request_limit_reached"
    | "budget_limit_reached";
  message: string;
  leadId?: string;
  leadSaved?: boolean;
};
