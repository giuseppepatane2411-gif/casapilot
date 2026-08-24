import type { OperationType } from "../types";

export type RentalOperation = Exclude<OperationType, "SALE">;
export type TransactionGateCode =
  | "PUBLICATION" | "OFFER" | "PRELIMINARY" | "CLOSING"
  | "RENTAL_PUBLICATION" | "CANDIDATE_SELECTION" | "LEASE_SIGNING" | "LEASE_REGISTRATION" | "HANDOVER"
  | "TOURIST_PUBLICATION" | "BOOKING" | "CHECK_IN" | "GUEST_REPORTING" | "PAYOUT_TAX";

export interface TransactionProfile {
  code: OperationType;
  family: "SALE" | "RENTAL_RESIDENTIAL" | "RENTAL_TOURIST";
  label: string;
  workflowSlug: string;
  defaultGates: TransactionGateCode[];
  legalFreshnessRequired: boolean;
}

export interface TransactionRouteResult {
  operation: OperationType | null;
  profile?: TransactionProfile;
  status: "ROUTED" | "UNKNOWN" | "UNSUPPORTED";
  reasons: string[];
}
