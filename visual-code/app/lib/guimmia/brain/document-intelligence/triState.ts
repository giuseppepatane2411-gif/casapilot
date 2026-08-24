import type { RuleCondition } from "../types";
import { getPath } from "../engine";

export type TriState = "TRUE" | "FALSE" | "UNKNOWN";

function missing(value: unknown) { return value === undefined || value === null; }

export function evaluateConditionTriState(condition: RuleCondition, facts: Record<string, unknown>): TriState {
  switch (condition.op) {
    case "exists": return missing(getPath(facts, condition.path)) ? "FALSE" : "TRUE";
    case "truthy": {
      const v = getPath(facts, condition.path); return missing(v) ? "UNKNOWN" : Boolean(v) ? "TRUE" : "FALSE";
    }
    case "falsy": {
      const v = getPath(facts, condition.path); return missing(v) ? "UNKNOWN" : !Boolean(v) ? "TRUE" : "FALSE";
    }
    case "eq": { const v=getPath(facts,condition.path); return missing(v)?"UNKNOWN":v===condition.value?"TRUE":"FALSE"; }
    case "neq": { const v=getPath(facts,condition.path); return missing(v)?"UNKNOWN":v!==condition.value?"TRUE":"FALSE"; }
    case "in": { const v=getPath(facts,condition.path); return missing(v)?"UNKNOWN":condition.values.includes(v)?"TRUE":"FALSE"; }
    case "not_in": { const v=getPath(facts,condition.path); return missing(v)?"UNKNOWN":!condition.values.includes(v)?"TRUE":"FALSE"; }
    case "gt": case "gte": case "lt": case "lte": {
      const v=getPath(facts,condition.path); if(missing(v)) return "UNKNOWN";
      const n=Number(v); if(!Number.isFinite(n)) return "UNKNOWN";
      if(condition.op==="gt") return n>condition.value?"TRUE":"FALSE";
      if(condition.op==="gte") return n>=condition.value?"TRUE":"FALSE";
      if(condition.op==="lt") return n<condition.value?"TRUE":"FALSE";
      return n<=condition.value?"TRUE":"FALSE";
    }
    case "all": {
      const states=condition.conditions.map(c=>evaluateConditionTriState(c,facts));
      if(states.includes("FALSE")) return "FALSE";
      return states.every(s=>s==="TRUE")?"TRUE":"UNKNOWN";
    }
    case "any": {
      const states=condition.conditions.map(c=>evaluateConditionTriState(c,facts));
      if(states.includes("TRUE")) return "TRUE";
      return states.every(s=>s==="FALSE")?"FALSE":"UNKNOWN";
    }
    case "not": {
      const s=evaluateConditionTriState(condition.condition,facts);
      return s==="UNKNOWN"?"UNKNOWN":s==="TRUE"?"FALSE":"TRUE";
    }
  }
}
