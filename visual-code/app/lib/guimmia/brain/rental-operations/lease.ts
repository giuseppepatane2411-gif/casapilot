import { applyTransition, leaseMachine, type LeaseState, type LeaseEvent, type TransitionCommand } from "./state-machine";
export function transitionLease(state:LeaseState,command:TransitionCommand<LeaseEvent>){return applyTransition(leaseMachine,state,command)}
export function signedContentMatches(expectedHash:string,actualHash:string){return expectedHash.length>0&&expectedHash===actualHash}
