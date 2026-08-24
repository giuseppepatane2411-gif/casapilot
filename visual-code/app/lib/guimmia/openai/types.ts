export type ValuationOperation = "SALE" | "RENT_LONG_TERM";

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
    city: string;
    province: string;
    postalCode?: string;
    address?: string;
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
    notes?: string;
  };
  owner: {
    name: string;
    email: string;
    phone?: string;
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
  period: "TOTAL" | "MONTH";
  range: {
    low: number;
    suggested: number;
    high: number;
  };
  marketEvidence: {
    evidenceSummary: string;
    observedUnit: "EUR_SQM_SALE" | "EUR_SQM_MONTH";
    observedLow: number;
    observedMedian: number;
    observedHigh: number;
    comparableSignals: ValuationComparableSignal[];
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
  humanReviewRequired: true;
};

export type PropertyValuationError = {
  ok: false;
  error:
    | "invalid_request"
    | "openai_not_configured"
    | "database_not_configured"
    | "valuation_failed"
    | "request_limit_reached"
    | "budget_limit_reached";
  message: string;
  leadId?: string;
  leadSaved?: boolean;
};
