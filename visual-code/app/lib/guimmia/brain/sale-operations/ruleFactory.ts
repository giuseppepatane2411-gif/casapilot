import type { BrainRule, DecisionLevel, KnowledgeStability, Severity } from "../types";
import { internalPolicy } from "../data/sourceMap";
export interface SaleRuleSpec { id:string; module:string; phase:string; title:string; factPath:string; ready?:boolean; dynamic?:boolean; decisionLevel:DecisionLevel; severity:Severity; gate:"PUBLICATION"|"OFFER"|"PRELIMINARY"|"CLOSING"; rulesetKey?:string; }
export function makeSaleRule(spec:SaleRuleSpec):BrainRule {
  const stability:KnowledgeStability=spec.dynamic?"DYNAMIC":"INTERNAL";
  const phaseCondition=spec.ready?{op:"eq" as const,path:spec.factPath,value:"READY"}:{op:"neq" as const,path:spec.factPath,value:"READY"};
  return {id:spec.id,module:spec.module,phase:spec.phase,title:spec.title,description:spec.title,stability,decisionLevel:spec.decisionLevel,severity:spec.severity,
    condition:{op:"all",conditions:[{op:"eq",path:"operation.type",value:"SALE"},phaseCondition]},
    outcome:{code:spec.id.replace(/^(P\d+)_/,"SALE_"),message:spec.ready?"Fase operativa pronta: "+spec.title+".":"Completare o revisionare: "+spec.title+".",blockProgress:spec.ready?undefined:true,gateImpact:[spec.gate]},
    sourceRefs:[internalPolicy("V76.8 Sale Operations & Closing Lifecycle Engine")],freshnessPolicy:spec.rulesetKey?{required:true,rulesetKey:spec.rulesetKey,maxAgeDays:30}:undefined,
    evidencePolicy:{requiredFactPaths:["operation.type",spec.factPath],requireVerifiedEvidence:spec.dynamic||spec.decisionLevel!=="AUTO"},active:true,version:1};
}
