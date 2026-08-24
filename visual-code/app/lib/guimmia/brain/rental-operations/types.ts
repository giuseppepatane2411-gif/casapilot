export type RentalOperationPhase="R06"|"R07"|"R08"|"R09"|"R10"|"R11";
export type OperationalStatus="UNKNOWN"|"DRAFT"|"IN_REVIEW"|"READY"|"BLOCKED"|"STALE"|"ACTIVE"|"CLOSED";
export interface OperationSnapshot { caseId:string; operationType:"RENT_LONG_TERM"|"RENT_TRANSITORY"|"RENT_STUDENT"; phase05SnapshotId:string; factsFingerprint:string; rulesetVersions:Record<string,string>; createdAt:string; }
export interface NextAction { code:string; phase:RentalOperationPhase; priority:"NORMAL"|"HIGH"|"CRITICAL"; humanRequired:boolean; dueAt?:string; reasonCodes:string[]; }
export interface CandidateSafetyResult { allowed:boolean; humanDecisionRequired:true; forbiddenFields:string[]; reasonCodes:string[]; }
