export type TouristOperationPhase="T06"|"T07"|"T08"|"T09";
export interface MoneyBreakdown { gross:number; cleaning:number; taxes:number; commissions:number; refunds:number; payout:number; currency:string; }
export interface TouristReadiness { ready:boolean; blockers:string[]; humanReviewRequired:boolean; }
export interface OperationalTask { code:string; status:"PENDING"|"READY"|"COMPLETED"|"BLOCKED"; dueAt?:string; humanOwnerId?:string; evidenceRefs:string[]; }
