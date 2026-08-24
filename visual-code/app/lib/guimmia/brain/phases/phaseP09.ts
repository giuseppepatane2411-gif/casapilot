import type { BrainRule } from "../types";
import { makeSaleRule } from "../sale-operations/ruleFactory";
export const phaseP09Rules:BrainRule[]=[
  makeSaleRule({"id":"P09_LISTING_NOT_ACTIVE","module":"SALE_LEAD_OPERATIONS","phase":"PHASE_09_LEADS","title":"Listing Not Active","factPath":"sale.p09.listing_not_active.status","decisionLevel":"REVIEW","severity":"blocking","gate":"OFFER"}),
  makeSaleRule({"id":"P09_CONSENT_MISSING","module":"SALE_LEAD_OPERATIONS","phase":"PHASE_09_LEADS","title":"Consent Missing","factPath":"sale.p09.consent_missing.status","decisionLevel":"REVIEW","severity":"blocking","gate":"OFFER"}),
  makeSaleRule({"id":"P09_CONTACT_INVALID","module":"SALE_LEAD_OPERATIONS","phase":"PHASE_09_LEADS","title":"Contact Invalid","factPath":"sale.p09.contact_invalid.status","decisionLevel":"REVIEW","severity":"blocking","gate":"OFFER"}),
  makeSaleRule({"id":"P09_DUPLICATE_UNRESOLVED","module":"SALE_LEAD_OPERATIONS","phase":"PHASE_09_LEADS","title":"Duplicate Unresolved","factPath":"sale.p09.duplicate_unresolved.status","decisionLevel":"REVIEW","severity":"blocking","gate":"OFFER"}),
  makeSaleRule({"id":"P09_SOURCE_MISSING","module":"SALE_LEAD_OPERATIONS","phase":"PHASE_09_LEADS","title":"Source Missing","factPath":"sale.p09.source_missing.status","decisionLevel":"REVIEW","severity":"blocking","gate":"OFFER"}),
  makeSaleRule({"id":"P09_EXCESSIVE_DATA_REQUESTED","module":"SALE_LEAD_OPERATIONS","phase":"PHASE_09_LEADS","title":"Excessive Data Requested","factPath":"sale.p09.excessive_data_requested.status","decisionLevel":"REVIEW","severity":"blocking","gate":"OFFER"}),
  makeSaleRule({"id":"P09_RETENTION_PLAN_MISSING","module":"SALE_LEAD_OPERATIONS","phase":"PHASE_09_LEADS","title":"Retention Plan Missing","factPath":"sale.p09.retention_plan_missing.status","decisionLevel":"REVIEW","severity":"blocking","gate":"OFFER"}),
  makeSaleRule({"id":"P09_ASSIGNMENT_MISSING","module":"SALE_LEAD_OPERATIONS","phase":"PHASE_09_LEADS","title":"Assignment Missing","factPath":"sale.p09.assignment_missing.status","decisionLevel":"REVIEW","severity":"blocking","gate":"OFFER"}),
  makeSaleRule({"id":"P09_FOLLOWUP_OVERDUE","module":"SALE_LEAD_OPERATIONS","phase":"PHASE_09_LEADS","title":"Followup Overdue","factPath":"sale.p09.followup_overdue.status","decisionLevel":"REVIEW","severity":"blocking","gate":"OFFER"}),
  makeSaleRule({"id":"P09_IDENTITY_CLAIM_UNVERIFIED","module":"SALE_LEAD_OPERATIONS","phase":"PHASE_09_LEADS","title":"Identity Claim Unverified","factPath":"sale.p09.identity_claim_unverified.status","decisionLevel":"REVIEW","severity":"blocking","gate":"OFFER"}),
  makeSaleRule({"id":"P09_OPT_OUT_UNPROCESSED","module":"SALE_LEAD_OPERATIONS","phase":"PHASE_09_LEADS","title":"Opt Out Unprocessed","factPath":"sale.p09.opt_out_unprocessed.status","decisionLevel":"REVIEW","severity":"blocking","gate":"OFFER"}),
  makeSaleRule({"id":"P09_PIPELINE_ACTIVE","module":"SALE_LEAD_OPERATIONS","phase":"PHASE_09_LEADS","title":"Pipeline Active","factPath":"sale.p09.pipeline_active.status","ready":true,"decisionLevel":"AUTO","severity":"info","gate":"OFFER"})
];
