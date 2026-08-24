
import type{CaseAuthorityClass,CaseCandidateAction}from"./types";

const AI_AUTONOMOUS_ACTIONS=new Set(["REQUEST_MISSING_INFORMATION","PREPARE_SERVICE_SUMMARY","PREPARE_MANDATE_DRAFT","PREPARE_PROPERTY_DOSSIER","PREPARE_LISTING_DRAFT","QUALIFY_LEAD_DATA","PROPOSE_AVAILABLE_SLOTS","PREPARE_OFFER_SUMMARY","PREPARE_CONTRACT_DRAFT","PREPARE_CLOSING_CHECKLIST","UPDATE_CUSTOMER_PROGRESS","CREATE_REMINDER","SUMMARIZE_CASE","REQUEST_DOCUMENT","PREPARE_SCREENING_SUMMARY","PREPARE_HANDOVER_CHECKLIST","PREPARE_BOOKING_SUMMARY","PREPARE_CHECKIN_CHECKLIST","PREPARE_GUEST_REPORTING_DRAFT","PREPARE_TURNOVER_PLAN","REQUEST_TRANSITORY_REASON","REQUEST_STUDENT_EVIDENCE","REQUEST_TOURIST_COMPLIANCE_EVIDENCE"]);
const PROFESSIONAL_ACTIONS=new Set(["ISSUE_LEGAL_CONCLUSION","ISSUE_TAX_CONCLUSION","ISSUE_TECHNICAL_CONCLUSION","CERTIFY_COMPLIANCE"]);
const GUIMMIA_HUMAN_ACTIONS=new Set(["APPROVE_DOCUMENT","SIGN_DOCUMENT","SET_PRICE","COUNTEROFFER","SELECT_CANDIDATE","ACCEPT_OFFER","REJECT_OFFER","APPROVE_LISTING","CLOSE_CASE"]);
const CUSTOMER_CONFIRMATION_ACTIONS=new Set(["BOOK_APPOINTMENT","CONFIRM_APPOINTMENT","SUBMIT_APPLICATION","SEND_OFFER","PUBLISH_LISTING"]);

export function classifyAuthority(actionType:string):CaseAuthorityClass{
  if(AI_AUTONOMOUS_ACTIONS.has(actionType))return"AI_AUTONOMOUS";
  if(PROFESSIONAL_ACTIONS.has(actionType))return"QUALIFIED_PROFESSIONAL";
  if(GUIMMIA_HUMAN_ACTIONS.has(actionType))return"GUIMMIA_HUMAN";
  if(CUSTOMER_CONFIRMATION_ACTIONS.has(actionType))return"CUSTOMER_CONFIRMATION";
  return"GUIMMIA_HUMAN";
}

export function isKnownActionType(actionType:string):boolean{return AI_AUTONOMOUS_ACTIONS.has(actionType)||PROFESSIONAL_ACTIONS.has(actionType)||GUIMMIA_HUMAN_ACTIONS.has(actionType)||CUSTOMER_CONFIRMATION_ACTIONS.has(actionType)}
export function isUnknownActionType(actionType:string):boolean{return!isKnownActionType(actionType)}

export function normalizeActionAuthority(action:CaseCandidateAction):CaseCandidateAction{
  const authority=classifyAuthority(action.actionType);
  const ownerType=authority==="AI_AUTONOMOUS"?"AI":authority==="CUSTOMER_CONFIRMATION"?"CUSTOMER":authority==="QUALIFIED_PROFESSIONAL"?"PROFESSIONAL":"GUIMMIA";
  return{...action,authority,ownerType,customerConfirmation:authority==="CUSTOMER_CONFIRMATION"?true:action.customerConfirmation};
}

export function canAiExecute(action:CaseCandidateAction):boolean{return isKnownActionType(action.actionType)&&classifyAuthority(action.actionType)==="AI_AUTONOMOUS"}
