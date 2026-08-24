import { applyTransition, reconciliationMachine, type ReconciliationState, type ReconciliationEvent, type TransitionCommand } from "../rental-operations/state-machine";
import type { MoneyBreakdown } from "./types";
export function expectedPayout(m:MoneyBreakdown){return Number((m.gross+m.cleaning+m.taxes-m.commissions-m.refunds).toFixed(2))}
export function reconcilePayout(m:MoneyBreakdown,tolerance=0.01){const expected=expectedPayout(m);const difference=Number((m.payout-expected).toFixed(2));return{matched:Math.abs(difference)<=tolerance,expected,difference,currency:m.currency,humanTaxReviewRequired:true as const}}
export function transitionReconciliation(state:ReconciliationState,command:TransitionCommand<ReconciliationEvent>){return applyTransition(reconciliationMachine,state,command)}
export function canIssueFinalTaxVerdict(actorKind:string){return actorKind==="HUMAN"}
