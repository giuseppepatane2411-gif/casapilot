import type { RentalOperation } from "../transaction-intelligence/types";
export type RentalAuthorityStatus = "UNKNOWN"|"DECLARED"|"EVIDENCE_PENDING"|"REVIEW_REQUIRED"|"VERIFIED"|"BLOCKED"|"STALE";
export type RentalReadinessStatus = "UNKNOWN"|"IN_REVIEW"|"READY"|"BLOCKED"|"STALE";
export type CandidateDecision = "PENDING"|"SHORTLISTED"|"ACCEPTED"|"REJECTED"|"WITHDRAWN";
export interface RentalContractProfile { operation:RentalOperation; contractModel:string; requiresRegistration:boolean|"DYNAMIC"; localAgreementDependent:boolean; touristCompliance:boolean; }
export interface ScreeningGuardResult { allowed:boolean; reasonCodes:string[]; humanDecisionRequired:true; }
