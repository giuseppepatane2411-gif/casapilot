import type { TransactionProfile } from "./types";

export const TRANSACTION_PROFILES: TransactionProfile[] = [
  { code:"SALE", family:"SALE", label:"Vendita", workflowSlug:"sale-private-apartment", defaultGates:["PUBLICATION","OFFER","PRELIMINARY","CLOSING"], legalFreshnessRequired:true },
  { code:"RENT_LONG_TERM", family:"RENTAL_RESIDENTIAL", label:"Locazione abitativa lungo termine", workflowSlug:"rent-long-term-residential", defaultGates:["RENTAL_PUBLICATION","CANDIDATE_SELECTION","LEASE_SIGNING","LEASE_REGISTRATION","HANDOVER"], legalFreshnessRequired:true },
  { code:"RENT_TRANSITORY", family:"RENTAL_RESIDENTIAL", label:"Locazione abitativa transitoria", workflowSlug:"rent-transitory-residential", defaultGates:["RENTAL_PUBLICATION","CANDIDATE_SELECTION","LEASE_SIGNING","LEASE_REGISTRATION","HANDOVER"], legalFreshnessRequired:true },
  { code:"RENT_STUDENT", family:"RENTAL_RESIDENTIAL", label:"Locazione studenti universitari", workflowSlug:"rent-student-residential", defaultGates:["RENTAL_PUBLICATION","CANDIDATE_SELECTION","LEASE_SIGNING","LEASE_REGISTRATION","HANDOVER"], legalFreshnessRequired:true },
  { code:"RENT_TOURIST_SHORT", family:"RENTAL_TOURIST", label:"Locazione breve/turistica", workflowSlug:"rent-tourist-short", defaultGates:["TOURIST_PUBLICATION","BOOKING","CHECK_IN","GUEST_REPORTING","PAYOUT_TAX"], legalFreshnessRequired:true },
];
export const TRANSACTION_PROFILE_MAP = Object.fromEntries(TRANSACTION_PROFILES.map(p=>[p.code,p])) as Record<string,TransactionProfile>;
