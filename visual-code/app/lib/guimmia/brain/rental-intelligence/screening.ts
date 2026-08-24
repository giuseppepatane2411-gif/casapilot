const FORBIDDEN = new Set(["race","ethnicity","religion","political_opinion","trade_union","sexual_orientation","health","disability","genetic_data","biometric_data"]);
export function evaluateScreeningFields(fields:string[]) {
  const forbidden = fields.filter(f=>FORBIDDEN.has(f));
  return { allowed:forbidden.length===0, reasonCodes:forbidden.map(f=>`PROTECTED_ATTRIBUTE:${f}`), humanDecisionRequired:true as const };
}
export function canAutoDecideCandidate() { return false; }
