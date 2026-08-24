import type { BrainRule } from "../types";
import { makeSaleRule } from "../sale-operations/ruleFactory";
export const phaseP10Rules:BrainRule[]=[
  makeSaleRule({"id":"P10_QUALIFIED_LEAD_MISSING","module":"SALE_VISIT_OPERATIONS","phase":"PHASE_10_VISITS","title":"Qualified Lead Missing","factPath":"sale.p10.qualified_lead_missing.status","decisionLevel":"REVIEW","severity":"blocking","gate":"OFFER"}),
  makeSaleRule({"id":"P10_SCHEDULING_CONFLICT","module":"SALE_VISIT_OPERATIONS","phase":"PHASE_10_VISITS","title":"Scheduling Conflict","factPath":"sale.p10.scheduling_conflict.status","decisionLevel":"REVIEW","severity":"blocking","gate":"OFFER"}),
  makeSaleRule({"id":"P10_ACCESS_AUTHORIZATION_MISSING","module":"SALE_VISIT_OPERATIONS","phase":"PHASE_10_VISITS","title":"Access Authorization Missing","factPath":"sale.p10.access_authorization_missing.status","decisionLevel":"REVIEW","severity":"blocking","gate":"OFFER"}),
  makeSaleRule({"id":"P10_PRIVACY_NOTICE_MISSING","module":"SALE_VISIT_OPERATIONS","phase":"PHASE_10_VISITS","title":"Privacy Notice Missing","factPath":"sale.p10.privacy_notice_missing.status","decisionLevel":"REVIEW","severity":"blocking","gate":"OFFER"}),
  makeSaleRule({"id":"P10_VISITOR_COUNT_INVALID","module":"SALE_VISIT_OPERATIONS","phase":"PHASE_10_VISITS","title":"Visitor Count Invalid","factPath":"sale.p10.visitor_count_invalid.status","decisionLevel":"REVIEW","severity":"blocking","gate":"OFFER"}),
  makeSaleRule({"id":"P10_AGENT_ASSIGNMENT_MISSING","module":"SALE_VISIT_OPERATIONS","phase":"PHASE_10_VISITS","title":"Agent Assignment Missing","factPath":"sale.p10.agent_assignment_missing.status","decisionLevel":"REVIEW","severity":"blocking","gate":"OFFER"}),
  makeSaleRule({"id":"P10_REMINDER_UNSENT","module":"SALE_VISIT_OPERATIONS","phase":"PHASE_10_VISITS","title":"Reminder Unsent","factPath":"sale.p10.reminder_unsent.status","decisionLevel":"REVIEW","severity":"blocking","gate":"OFFER"}),
  makeSaleRule({"id":"P10_NO_SHOW_UNRESOLVED","module":"SALE_VISIT_OPERATIONS","phase":"PHASE_10_VISITS","title":"No Show Unresolved","factPath":"sale.p10.no_show_unresolved.status","decisionLevel":"REVIEW","severity":"blocking","gate":"OFFER"}),
  makeSaleRule({"id":"P10_FEEDBACK_MISSING","module":"SALE_VISIT_OPERATIONS","phase":"PHASE_10_VISITS","title":"Feedback Missing","factPath":"sale.p10.feedback_missing.status","decisionLevel":"REVIEW","severity":"blocking","gate":"OFFER"}),
  makeSaleRule({"id":"P10_SAFETY_NOTE_UNREVIEWED","module":"SALE_VISIT_OPERATIONS","phase":"PHASE_10_VISITS","title":"Safety Note Unreviewed","factPath":"sale.p10.safety_note_unreviewed.status","decisionLevel":"REVIEW","severity":"blocking","gate":"OFFER"}),
  makeSaleRule({"id":"P10_FOLLOWUP_OVERDUE","module":"SALE_VISIT_OPERATIONS","phase":"PHASE_10_VISITS","title":"Followup Overdue","factPath":"sale.p10.followup_overdue.status","decisionLevel":"REVIEW","severity":"blocking","gate":"OFFER"}),
  makeSaleRule({"id":"P10_PIPELINE_ACTIVE","module":"SALE_VISIT_OPERATIONS","phase":"PHASE_10_VISITS","title":"Pipeline Active","factPath":"sale.p10.pipeline_active.status","ready":true,"decisionLevel":"AUTO","severity":"info","gate":"OFFER"})
];
