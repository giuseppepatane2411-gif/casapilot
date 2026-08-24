export type ActorKind = "HUMAN" | "SYSTEM" | "AI" | "EXTERNAL_PROVIDER";
export interface OperationActor { kind: ActorKind; id?: string; roles?: string[]; }
export interface TransitionCommand<E extends string> { event: E; actor: OperationActor; idempotencyKey: string; guards?: Record<string, boolean>; occurredAt?: string; }
export interface TransitionEdge<S extends string,E extends string> { from:S; event:E; to:S; humanOnly?:boolean; guard?:string; }
export interface TransitionMachine<S extends string,E extends string> { name:string; initial:S; terminal:S[]; edges:TransitionEdge<S,E>[]; }
export interface TransitionResult<S extends string> { allowed:boolean; state:S; previousState:S; reasonCodes:string[]; audit:{machine:string;event:string;actorKind:ActorKind;actorId?:string;idempotencyKey:string;occurredAt:string}; }

export function applyTransition<S extends string,E extends string>(machine:TransitionMachine<S,E>,state:S,command:TransitionCommand<E>):TransitionResult<S> {
  const audit={machine:machine.name,event:command.event,actorKind:command.actor.kind,actorId:command.actor.id,idempotencyKey:command.idempotencyKey,occurredAt:command.occurredAt??new Date().toISOString()};
  if (!command.idempotencyKey.trim()) return {allowed:false,state,previousState:state,reasonCodes:["IDEMPOTENCY_KEY_REQUIRED"],audit};
  const edge=machine.edges.find(item=>item.from===state&&item.event===command.event);
  if (!edge) return {allowed:false,state,previousState:state,reasonCodes:["ILLEGAL_STATE_TRANSITION"],audit};
  if (edge.humanOnly&&command.actor.kind!=="HUMAN") return {allowed:false,state,previousState:state,reasonCodes:["HUMAN_ACTOR_REQUIRED"],audit};
  if (edge.guard&&command.guards?.[edge.guard]!==true) return {allowed:false,state,previousState:state,reasonCodes:["GUARD_NOT_SATISFIED:"+edge.guard],audit};
  return {allowed:true,state:edge.to,previousState:state,reasonCodes:[],audit};
}

export type ListingState="DRAFT"|"IN_REVIEW"|"READY"|"PUBLISHED"|"PAUSED"|"ARCHIVED";
export type ListingEvent="SUBMIT"|"APPROVE"|"PUBLISH"|"PAUSE"|"RESUME"|"INVALIDATE"|"ARCHIVE";
export const listingMachine:TransitionMachine<ListingState,ListingEvent>={name:"RENTAL_LISTING",initial:"DRAFT",terminal:["ARCHIVED"],edges:[
 {from:"DRAFT",event:"SUBMIT",to:"IN_REVIEW"},{from:"IN_REVIEW",event:"APPROVE",to:"READY",humanOnly:true,guard:"UPSTREAM_CURRENT"},{from:"READY",event:"PUBLISH",to:"PUBLISHED",humanOnly:true,guard:"PUBLICATION_GATE_READY"},{from:"PUBLISHED",event:"PAUSE",to:"PAUSED",humanOnly:true},{from:"PAUSED",event:"RESUME",to:"PUBLISHED",humanOnly:true,guard:"PUBLICATION_GATE_READY"},{from:"IN_REVIEW",event:"INVALIDATE",to:"IN_REVIEW"},{from:"READY",event:"INVALIDATE",to:"IN_REVIEW"},{from:"PUBLISHED",event:"INVALIDATE",to:"IN_REVIEW"},{from:"PAUSED",event:"INVALIDATE",to:"IN_REVIEW"},{from:"DRAFT",event:"ARCHIVE",to:"ARCHIVED",humanOnly:true},{from:"PAUSED",event:"ARCHIVE",to:"ARCHIVED",humanOnly:true}
]};

export type CandidateState="INQUIRY"|"INVITED"|"APPLIED"|"EVIDENCE_REVIEW"|"SHORTLISTED"|"HUMAN_DECIDED"|"WITHDRAWN"|"EXPIRED"|"CLOSED";
export type CandidateEvent="INVITE"|"APPLY"|"START_REVIEW"|"SHORTLIST"|"HUMAN_DECIDE"|"WITHDRAW"|"EXPIRE"|"CLOSE"|"INVALIDATE";
export const candidateMachine:TransitionMachine<CandidateState,CandidateEvent>={name:"RENTAL_CANDIDATE",initial:"INQUIRY",terminal:["WITHDRAWN","EXPIRED","CLOSED"],edges:[
 {from:"INQUIRY",event:"INVITE",to:"INVITED"},{from:"INVITED",event:"APPLY",to:"APPLIED"},{from:"APPLIED",event:"START_REVIEW",to:"EVIDENCE_REVIEW",guard:"CONSENT_VALID"},{from:"EVIDENCE_REVIEW",event:"SHORTLIST",to:"SHORTLISTED",humanOnly:true,guard:"FAIR_SCREENING_PASSED"},{from:"SHORTLISTED",event:"HUMAN_DECIDE",to:"HUMAN_DECIDED",humanOnly:true,guard:"HUMAN_DECISION_RECORDED"},{from:"HUMAN_DECIDED",event:"CLOSE",to:"CLOSED",humanOnly:true},{from:"INQUIRY",event:"WITHDRAW",to:"WITHDRAWN"},{from:"INVITED",event:"WITHDRAW",to:"WITHDRAWN"},{from:"APPLIED",event:"WITHDRAW",to:"WITHDRAWN"},{from:"EVIDENCE_REVIEW",event:"WITHDRAW",to:"WITHDRAWN"},{from:"SHORTLISTED",event:"WITHDRAW",to:"WITHDRAWN"},{from:"INVITED",event:"EXPIRE",to:"EXPIRED"},{from:"APPLIED",event:"EXPIRE",to:"EXPIRED"},{from:"SHORTLISTED",event:"INVALIDATE",to:"EVIDENCE_REVIEW"},{from:"HUMAN_DECIDED",event:"INVALIDATE",to:"EVIDENCE_REVIEW",humanOnly:true}
]};

export type LeaseState="DRAFT"|"TEMPLATE_BOUND"|"HUMAN_REVIEW"|"READY_TO_SIGN"|"SIGNING"|"SIGNED"|"REGISTRATION_PENDING"|"ACTIVE"|"CLOSED";
export type LeaseEvent="BIND_TEMPLATE"|"START_HUMAN_REVIEW"|"APPROVE"|"START_SIGNING"|"COMPLETE_SIGNATURES"|"REQUIRE_REGISTRATION"|"COMPLETE_REGISTRATION"|"ACTIVATE"|"CLOSE"|"INVALIDATE";
export const leaseMachine:TransitionMachine<LeaseState,LeaseEvent>={name:"RESIDENTIAL_LEASE",initial:"DRAFT",terminal:["CLOSED"],edges:[
 {from:"DRAFT",event:"BIND_TEMPLATE",to:"TEMPLATE_BOUND",guard:"TEMPLATE_APPROVED"},{from:"TEMPLATE_BOUND",event:"START_HUMAN_REVIEW",to:"HUMAN_REVIEW"},{from:"HUMAN_REVIEW",event:"APPROVE",to:"READY_TO_SIGN",humanOnly:true,guard:"PHASE05_CURRENT"},{from:"READY_TO_SIGN",event:"START_SIGNING",to:"SIGNING",humanOnly:true},{from:"SIGNING",event:"COMPLETE_SIGNATURES",to:"SIGNED",guard:"SIGNATURE_EVIDENCE_VERIFIED"},{from:"SIGNED",event:"REQUIRE_REGISTRATION",to:"REGISTRATION_PENDING",guard:"REGISTRATION_REQUIRED"},{from:"REGISTRATION_PENDING",event:"COMPLETE_REGISTRATION",to:"SIGNED",humanOnly:true,guard:"REGISTRATION_RECEIPT_VERIFIED"},{from:"SIGNED",event:"ACTIVATE",to:"ACTIVE",humanOnly:true,guard:"REGISTRATION_GATE_READY"},{from:"ACTIVE",event:"CLOSE",to:"CLOSED",humanOnly:true,guard:"FINAL_HANDOVER_COMPLETE"},{from:"TEMPLATE_BOUND",event:"INVALIDATE",to:"DRAFT"},{from:"HUMAN_REVIEW",event:"INVALIDATE",to:"DRAFT"},{from:"READY_TO_SIGN",event:"INVALIDATE",to:"DRAFT"}
]};

export type HandoverState="PLANNED"|"INVENTORY_READY"|"KEY_METER_CAPTURED"|"SIGNED_OFF"|"COMPLETED";
export type HandoverEvent="PREPARE_INVENTORY"|"CAPTURE_KEYS_METERS"|"SIGN_OFF"|"COMPLETE"|"INVALIDATE";
export const handoverMachine:TransitionMachine<HandoverState,HandoverEvent>={name:"RENTAL_HANDOVER",initial:"PLANNED",terminal:["COMPLETED"],edges:[
 {from:"PLANNED",event:"PREPARE_INVENTORY",to:"INVENTORY_READY",guard:"INVENTORY_VERIFIED"},{from:"INVENTORY_READY",event:"CAPTURE_KEYS_METERS",to:"KEY_METER_CAPTURED",guard:"KEYS_METERS_VERIFIED"},{from:"KEY_METER_CAPTURED",event:"SIGN_OFF",to:"SIGNED_OFF",humanOnly:true,guard:"PARTIES_CONFIRMED"},{from:"SIGNED_OFF",event:"COMPLETE",to:"COMPLETED",humanOnly:true,guard:"DEPOSIT_RECONCILED"},{from:"INVENTORY_READY",event:"INVALIDATE",to:"PLANNED"},{from:"KEY_METER_CAPTURED",event:"INVALIDATE",to:"PLANNED"},{from:"SIGNED_OFF",event:"INVALIDATE",to:"PLANNED",humanOnly:true}
]};

export type LifecycleState="PENDING_ACTIVATION"|"ACTIVE"|"RENEWAL_REVIEW"|"CLOSING"|"CLOSED";
export type LifecycleEvent="ACTIVATE"|"START_RENEWAL_REVIEW"|"CONTINUE"|"START_CLOSING"|"CLOSE";
export const lifecycleMachine:TransitionMachine<LifecycleState,LifecycleEvent>={name:"RENTAL_LIFECYCLE",initial:"PENDING_ACTIVATION",terminal:["CLOSED"],edges:[
 {from:"PENDING_ACTIVATION",event:"ACTIVATE",to:"ACTIVE",humanOnly:true,guard:"HANDOVER_COMPLETE"},{from:"ACTIVE",event:"START_RENEWAL_REVIEW",to:"RENEWAL_REVIEW",guard:"RENEWAL_DUE"},{from:"RENEWAL_REVIEW",event:"CONTINUE",to:"ACTIVE",humanOnly:true,guard:"RENEWAL_DECISION_RECORDED"},{from:"ACTIVE",event:"START_CLOSING",to:"CLOSING",humanOnly:true},{from:"RENEWAL_REVIEW",event:"START_CLOSING",to:"CLOSING",humanOnly:true},{from:"CLOSING",event:"CLOSE",to:"CLOSED",humanOnly:true,guard:"FINAL_HANDOVER_COMPLETE"}
]};

export type BookingState="REQUESTED"|"ACCEPTED"|"PAYMENT_PENDING"|"CONFIRMED"|"CANCELLED"|"REFUND_PENDING"|"REFUNDED"|"CHECKED_IN"|"CHECKED_OUT"|"RECONCILED"|"ARCHIVED";
export type BookingEvent="ACCEPT"|"REQUEST_PAYMENT"|"CONFIRM"|"CANCEL"|"REQUEST_REFUND"|"COMPLETE_REFUND"|"CHECK_IN"|"CHECK_OUT"|"RECONCILE"|"ARCHIVE";
export const bookingMachine:TransitionMachine<BookingState,BookingEvent>={name:"TOURIST_BOOKING",initial:"REQUESTED",terminal:["CANCELLED","REFUNDED","ARCHIVED"],edges:[
 {from:"REQUESTED",event:"ACCEPT",to:"ACCEPTED",humanOnly:true,guard:"AVAILABILITY_CURRENT"},{from:"ACCEPTED",event:"REQUEST_PAYMENT",to:"PAYMENT_PENDING",guard:"TERMS_SNAPSHOTTED"},{from:"PAYMENT_PENDING",event:"CONFIRM",to:"CONFIRMED",guard:"PAYMENT_CONDITION_MET"},{from:"ACCEPTED",event:"CONFIRM",to:"CONFIRMED",humanOnly:true,guard:"PAYMENT_NOT_REQUIRED"},{from:"REQUESTED",event:"CANCEL",to:"CANCELLED"},{from:"ACCEPTED",event:"CANCEL",to:"CANCELLED"},{from:"PAYMENT_PENDING",event:"CANCEL",to:"REFUND_PENDING",guard:"FUNDS_CAPTURED"},{from:"CONFIRMED",event:"CANCEL",to:"REFUND_PENDING",guard:"REFUND_DUE"},{from:"REFUND_PENDING",event:"COMPLETE_REFUND",to:"REFUNDED",guard:"REFUND_EVIDENCE_VERIFIED"},{from:"CONFIRMED",event:"CHECK_IN",to:"CHECKED_IN",humanOnly:true,guard:"CHECKIN_GATE_READY"},{from:"CHECKED_IN",event:"CHECK_OUT",to:"CHECKED_OUT",humanOnly:true,guard:"CHECKOUT_EVIDENCE_READY"},{from:"CHECKED_OUT",event:"RECONCILE",to:"RECONCILED",humanOnly:true,guard:"PAYOUT_TAX_REVIEWED"},{from:"RECONCILED",event:"ARCHIVE",to:"ARCHIVED",humanOnly:true,guard:"ARCHIVE_COMPLETE"}
]};

export type SupportState="OPEN"|"TRIAGED"|"ASSIGNED"|"WAITING_CUSTOMER"|"RESOLVED"|"CLOSED";
export type SupportEvent="TRIAGE"|"ASSIGN"|"WAIT_CUSTOMER"|"RESOLVE"|"REOPEN"|"CLOSE";
export const supportMachine:TransitionMachine<SupportState,SupportEvent>={name:"GUIMMIA_24_7_SUPPORT",initial:"OPEN",terminal:["CLOSED"],edges:[
 {from:"OPEN",event:"TRIAGE",to:"TRIAGED"},{from:"TRIAGED",event:"ASSIGN",to:"ASSIGNED",guard:"ASSIGNEE_AVAILABLE"},{from:"ASSIGNED",event:"WAIT_CUSTOMER",to:"WAITING_CUSTOMER"},{from:"WAITING_CUSTOMER",event:"ASSIGN",to:"ASSIGNED"},{from:"ASSIGNED",event:"RESOLVE",to:"RESOLVED",humanOnly:true,guard:"RESOLUTION_EVIDENCE_READY"},{from:"RESOLVED",event:"REOPEN",to:"ASSIGNED"},{from:"RESOLVED",event:"CLOSE",to:"CLOSED",humanOnly:true}
]};

export type ReconciliationState="OPEN"|"LEDGER_COMPLETE"|"HUMAN_REVIEW"|"RECONCILED"|"ARCHIVED";
export type ReconciliationEvent="COMPLETE_LEDGER"|"START_REVIEW"|"RECONCILE"|"ARCHIVE"|"INVALIDATE";
export const reconciliationMachine:TransitionMachine<ReconciliationState,ReconciliationEvent>={name:"TOURIST_RECONCILIATION",initial:"OPEN",terminal:["ARCHIVED"],edges:[
 {from:"OPEN",event:"COMPLETE_LEDGER",to:"LEDGER_COMPLETE",guard:"LEDGER_BALANCED"},{from:"LEDGER_COMPLETE",event:"START_REVIEW",to:"HUMAN_REVIEW"},{from:"HUMAN_REVIEW",event:"RECONCILE",to:"RECONCILED",humanOnly:true,guard:"TAX_REVIEW_CURRENT"},{from:"RECONCILED",event:"ARCHIVE",to:"ARCHIVED",humanOnly:true,guard:"ARCHIVE_COMPLETE"},{from:"LEDGER_COMPLETE",event:"INVALIDATE",to:"OPEN"},{from:"HUMAN_REVIEW",event:"INVALIDATE",to:"OPEN"}
]};
