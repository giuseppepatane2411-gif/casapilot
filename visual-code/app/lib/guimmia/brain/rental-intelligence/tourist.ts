export interface TouristComplianceInput { cinStatus?:string; safetyStatus?:string; localRulesetStatus?:string; businessForm?:"BUSINESS"|"NON_BUSINESS"|"UNKNOWN"; sciaStatus?:string; guestReportingStatus?:string; }
export function touristPublicationReadiness(i:TouristComplianceInput) {
  const blockers:string[]=[];
  if (i.cinStatus!=="VERIFIED") blockers.push("CIN_NOT_VERIFIED");
  if (i.safetyStatus!=="VERIFIED") blockers.push("SAFETY_NOT_VERIFIED");
  if (i.localRulesetStatus!=="CURRENT") blockers.push("LOCAL_RULESET_NOT_CURRENT");
  if (!i.businessForm || i.businessForm==="UNKNOWN") blockers.push("BUSINESS_FORM_UNKNOWN");
  if (i.businessForm==="BUSINESS" && i.sciaStatus!=="VERIFIED") blockers.push("SCIA_NOT_VERIFIED");
  return {ready:blockers.length===0,blockers};
}
