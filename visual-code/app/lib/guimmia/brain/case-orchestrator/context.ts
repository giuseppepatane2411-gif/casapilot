
import{GUIMMIA_ORCHESTRATOR_AGENCY,SUPPORTED_OPERATION_TYPES,type CaseContextInput,type CaseContextSnapshot,type CaseEvidence,type GuimmiaOperationType}from"./types";

function canonical(value:unknown):string{
  if(Array.isArray(value))return"["+value.map(canonical).join(",")+"]";
  if(value&&typeof value==="object")return"{"+Object.entries(value as Record<string,unknown>).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>JSON.stringify(k)+":"+canonical(v)).join(",")+"}";
  return JSON.stringify(value)??"undefined";
}

export function stableFingerprint(value:unknown):string{
  const text=canonical(value);let hash=BigInt("14695981039346656037");
  for(const character of text){hash^=BigInt(character.codePointAt(0)??0);hash=BigInt.asUintN(64,hash*BigInt("1099511628211"))}
  return"fnv1a64-"+hash.toString(16).padStart(16,"0");
}

export function isSupportedOperationType(value:string):value is GuimmiaOperationType{return(SUPPORTED_OPERATION_TYPES as readonly string[]).includes(value)}
export function isEvidenceCurrent(evidence:CaseEvidence,now:string):boolean{return evidence.status==="READY"&&evidence.verified&&(!evidence.validUntil||Date.parse(evidence.validUntil)>=Date.parse(now))}

export function assertCaseContext(input:CaseContextInput):void{
  if(!input.caseId)throw new Error("V770_CASE_ID_REQUIRED");
  if(!Number.isInteger(input.caseVersion)||input.caseVersion<1)throw new Error("V770_CASE_VERSION_REQUIRED");
  if(input.operatingAgencyCode!==GUIMMIA_ORCHESTRATOR_AGENCY)throw new Error("V770_SINGLE_GUIMMIA_AGENCY_REQUIRED");
  if(!isSupportedOperationType(input.operationType))throw new Error("V770_OPERATION_TYPE_UNSUPPORTED");
  if(!["COMPLETA","MENSILE"].includes(input.serviceModel))throw new Error("V770_SERVICE_MODEL_UNSUPPORTED");
  if(!input.customerRole||!input.currentPhase||!input.internalOwnerId)throw new Error("V770_CASE_CORE_CONTEXT_REQUIRED");
  if(!input.computedAt||Number.isNaN(Date.parse(input.computedAt)))throw new Error("V770_CONTEXT_TIMESTAMP_REQUIRED");
}

export function buildCaseContextSnapshot(input:CaseContextInput,requiredFactPaths:string[]=[]):CaseContextSnapshot{
  assertCaseContext(input);
  const evidenceByPath=new Map(input.evidence.map(item=>[item.factPath,item]));
  const factReady=(value:unknown)=>value==="READY"||!!value&&typeof value==="object"&&(value as{status?:unknown}).status==="READY";
  const missingFactPaths=[...new Set(requiredFactPaths)].filter(path=>!factReady(input.facts[path])&&!((evidenceByPath.get(path))&&isEvidenceCurrent(evidenceByPath.get(path)!,input.computedAt))).sort();
  const staleEvidencePaths=input.evidence.filter(item=>!isEvidenceCurrent(item,input.computedAt)).map(item=>item.factPath).sort();
  const readyEvidencePaths=input.evidence.filter(item=>isEvidenceCurrent(item,input.computedAt)).map(item=>item.factPath).sort();
  const base={...input,evidence:[...input.evidence].sort((a,b)=>a.factPath.localeCompare(b.factPath)),missingFactPaths,staleEvidencePaths,readyEvidencePaths};
  return{...base,contextFingerprint:stableFingerprint(base)};
}
