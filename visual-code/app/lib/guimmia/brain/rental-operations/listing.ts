import { applyTransition, listingMachine, type ListingState, type ListingEvent, type TransitionCommand } from "./state-machine";
export function transitionRentalListing(state:ListingState,command:TransitionCommand<ListingEvent>){return applyTransition(listingMachine,state,command)}
export function listingRequiresReapproval(changedPaths:string[]){const material=["rentAmount","expenses","availability","energyDisclosure","contractProfile","propertyFacts"];return changedPaths.some(path=>material.some(prefix=>path.includes(prefix)))}
