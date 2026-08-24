import { applyTransition, bookingMachine, type BookingState, type BookingEvent, type TransitionCommand } from "../rental-operations/state-machine";
export function transitionBooking(state:BookingState,command:TransitionCommand<BookingEvent>){return applyTransition(bookingMachine,state,command)}
export function bookingWindowOverlaps(a:{from:string;to:string},b:{from:string;to:string}){return new Date(a.from).getTime()<new Date(b.to).getTime()&&new Date(b.from).getTime()<new Date(a.to).getTime()}
export function bookingTermsFingerprint(terms:unknown){return JSON.stringify(terms)}
