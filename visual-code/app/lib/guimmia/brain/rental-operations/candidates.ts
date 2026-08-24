import { applyTransition, candidateMachine, type CandidateState, type CandidateEvent, type TransitionCommand } from "./state-machine";
const PROTECTED=new Set(["race","ethnicity","religion","political_opinion","trade_union","sexual_orientation","health","disability","genetic_data","biometric_data"]);
const PROXIES=new Set(["nationality_preference","family_status_preference","neighborhood_ethnicity","religious_dress","medical_history"]);
export function inspectCandidateFields(fields:string[]){const forbidden=fields.filter(field=>PROTECTED.has(field)||PROXIES.has(field));return{allowed:forbidden.length===0,humanDecisionRequired:true as const,forbiddenFields:forbidden,reasonCodes:forbidden.map(field=>"FORBIDDEN_SCREENING_FIELD:"+field)}}
export function transitionCandidate(state:CandidateState,command:TransitionCommand<CandidateEvent>){return applyTransition(candidateMachine,state,command)}
export function canAutoDecideOperationalCandidate(){return false}
