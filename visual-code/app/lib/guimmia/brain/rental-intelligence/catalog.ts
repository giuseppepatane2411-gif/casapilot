import type { RentalContractProfile } from "./types";
export const RENTAL_CONTRACT_PROFILES: RentalContractProfile[] = [
 {operation:"RENT_LONG_TERM",contractModel:"RESIDENTIAL_STANDARD_OR_AGREED",requiresRegistration:true,localAgreementDependent:false,touristCompliance:false},
 {operation:"RENT_TRANSITORY",contractModel:"RESIDENTIAL_TRANSITORY",requiresRegistration:true,localAgreementDependent:true,touristCompliance:false},
 {operation:"RENT_STUDENT",contractModel:"UNIVERSITY_STUDENT",requiresRegistration:true,localAgreementDependent:true,touristCompliance:false},
 {operation:"RENT_TOURIST_SHORT",contractModel:"TOURIST_SHORT",requiresRegistration:"DYNAMIC",localAgreementDependent:true,touristCompliance:true},
];
export const RENTAL_GATE_DEFS = [
 ["RENTAL_PUBLICATION","Pronto alla pubblicazione locativa"],["CANDIDATE_SELECTION","Pronto alla scelta conduttore"],["LEASE_SIGNING","Pronto alla firma del contratto"],["LEASE_REGISTRATION","Pronto agli adempimenti di registrazione"],["HANDOVER","Pronto alla consegna"],
 ["TOURIST_PUBLICATION","Pronto alla pubblicazione turistica"],["BOOKING","Pronto ad accettare prenotazioni"],["CHECK_IN","Pronto al check-in"],["GUEST_REPORTING","Pronto agli adempimenti ospiti"],["PAYOUT_TAX","Pronto a gestire incassi/adempimenti fiscali"],
] as const;
export const RENTAL_DOCUMENT_TYPES = [
 "LANDLORD_ID","TITLE_OR_AUTHORITY","CURRENT_CADASTRAL_DATA","FLOORPLAN","APE","CONDOMINIUM_RULES","EXISTING_LEASE","UTILITY_INFO","FURNITURE_INVENTORY","HANDOVER_REPORT",
 "TRANSITORY_NEED_EVIDENCE","STUDENT_STATUS_EVIDENCE","LOCAL_AGREEMENT_REFERENCE","CIN_EVIDENCE","REGIONAL_LOCAL_AUTHORIZATION","TOURIST_SAFETY_EVIDENCE","SCIA_EVIDENCE","GUEST_REPORTING_CREDENTIALS","TAX_OPTION_INSTRUCTIONS","PAYMENT_INTERMEDIARY_ROLE",
] as const;
