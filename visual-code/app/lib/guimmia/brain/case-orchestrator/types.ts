
export const GUIMMIA_ORCHESTRATOR_AGENCY="GUIMMIA" as const;
export const GUIMMIA_ORCHESTRATOR_VERSION="77.0.0" as const;
export const SUPPORTED_OPERATION_TYPES=["SALE","RENT_LONG_TERM","RENT_TRANSITORY","RENT_STUDENT","RENT_TOURIST_SHORT"] as const;
export type GuimmiaOperationType=typeof SUPPORTED_OPERATION_TYPES[number];
export type GuimmiaServiceModel="COMPLETA"|"MENSILE";
export type CaseAuthorityClass="AI_AUTONOMOUS"|"CUSTOMER_CONFIRMATION"|"GUIMMIA_HUMAN"|"QUALIFIED_PROFESSIONAL";
export type CaseDecisionStatus="READY"|"BLOCKED"|"WAITING_CUSTOMER"|"WAITING_HUMAN"|"WAITING_PROFESSIONAL";
export type CaseActionPriority="LOW"|"NORMAL"|"HIGH"|"CRITICAL";
export type EvidenceStatus="READY"|"MISSING"|"UNVERIFIED"|"STALE";
export type CaseExecutionMode="DRY_RUN"|"COMMIT";

export interface CaseEvidence{
  factPath:string;
  status:EvidenceStatus;
  verified:boolean;
  sourceType:string;
  sourceRef?:string;
  observedAt:string;
  validUntil?:string;
  contentHash?:string;
}

export interface CaseContextInput{
  caseId:string;
  caseVersion:number;
  operatingAgencyCode:"GUIMMIA";
  operationType:GuimmiaOperationType;
  serviceModel:GuimmiaServiceModel;
  customerRole:string;
  propertyId?:string;
  currentPhase:string;
  internalOwnerId:string;
  facts:Record<string,unknown>;
  evidence:CaseEvidence[];
  computedAt:string;
}

export interface CaseContextSnapshot extends CaseContextInput{
  contextFingerprint:string;
  missingFactPaths:string[];
  staleEvidencePaths:string[];
  readyEvidencePaths:string[];
}

export interface CaseRuleFinding{
  ruleCode:string;
  phaseCode:string;
  severity:"info"|"warning"|"blocking"|"critical";
  matched:boolean;
  reasonCodes:string[];
  requiredFactPaths:string[];
  evidenceRefs:string[];
}

export interface CaseCandidateAction{
  code:string;
  actionType:string;
  title:string;
  priority:CaseActionPriority;
  authority:CaseAuthorityClass;
  ownerType:"AI"|"CUSTOMER"|"GUIMMIA"|"PROFESSIONAL";
  reasonCodes:string[];
  dependsOn:string[];
  resolves?:string[];
  dueAt?:string;
  customerVisible:boolean;
  customerConfirmation?:boolean;
  safeToRepeat?:boolean;
}

export interface ExistingBrainEvaluation{
  ruleCode:string;
  phaseCode:string;
  matched:boolean;
  severity:"info"|"warning"|"blocking"|"critical";
  outcomeCode?:string;
  requiredFactPaths?:string[];
  evidenceRefs?:string[];
  reasonCodes?:string[];
}

export interface CustomerQuestion{
  questionCode:string;
  factPath:string;
  prompt:string;
  whyItMatters:string;
  operationType:GuimmiaOperationType;
}

export interface CasePlaybookStage{
  code:string;
  title:string;
  gate:string;
  requiredFactPaths:string[];
  suggestedActionType:string;
  nextStage?:string;
}

export interface CaseOperationPlaybook{
  code:string;
  version:number;
  operationType:GuimmiaOperationType;
  stages:CasePlaybookStage[];
}

export interface CaseOrchestratorInput{
  context:CaseContextInput;
  findings?:CaseRuleFinding[];
  brainEvaluations?:ExistingBrainEvaluation[];
  candidateActions?:CaseCandidateAction[];
  previouslySelectedActionCodes?:string[];
  authorityEvidence?:CaseAuthorityEvidence;
  executionMode?:CaseExecutionMode;
  previousDecisionFingerprint?:string;
  confidence:number;
}

export interface CaseAuthorityEvidence{
  evidenceRef:string;
  authority:Exclude<CaseAuthorityClass,"AI_AUTONOMOUS">;
  actorType:"CUSTOMER"|"GUIMMIA"|"PROFESSIONAL";
  caseId:string;
  caseVersion:number;
  actionType:string;
  inputFingerprint:string;
  verified:boolean;
  decidedAt:string;
}

export interface CaseHumanHandoff{
  required:true;
  authority:Exclude<CaseAuthorityClass,"AI_AUTONOMOUS"|"CUSTOMER_CONFIRMATION">;
  reasonCodes:string[];
  contextFingerprint:string;
  requestedOwnerType:"GUIMMIA"|"PROFESSIONAL";
  slaMinutes:number;
  dueAt:string;
}

export interface CaseExecutionCommand{
  commandId:string;
  mode:CaseExecutionMode;
  caseId:string;
  expectedCaseVersion:number;
  idempotencyKey:string;
  inputFingerprint:string;
  actionType:string;
  authority:CaseAuthorityClass;
  executable:boolean;
  confirmationEvidenceRef?:string;
  approvalEvidenceRef?:string;
  blockedReasonCodes:string[];
}

export interface CaseOrchestratorDecision{
  runId:string;
  caseId:string;
  caseVersion:number;
  inputFingerprint:string;
  status:CaseDecisionStatus;
  playbookCode:string;
  playbookStage:string;
  nextPlaybookStage?:string;
  selectedAction?:CaseCandidateAction;
  customerQuestions:CustomerQuestion[];
  reasonCodes:string[];
  evidenceRefs:string[];
  ruleRefs:string[];
  customerExplanation:string;
  internalExplanation:string;
  handoff?:CaseHumanHandoff;
  aiExecutionAllowed:boolean;
  authorizedSystemExecutionAllowed:boolean;
  customerConfirmationRequired:boolean;
  unknownActionBlocked:boolean;
  executionCommand:CaseExecutionCommand;
  confidence:number;
  decidedAt:string;
}
