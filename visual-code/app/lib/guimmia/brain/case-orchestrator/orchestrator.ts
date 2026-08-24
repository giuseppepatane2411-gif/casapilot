
import{buildCaseContextSnapshot,stableFingerprint}from"./context";
import{canAiExecute,isUnknownActionType}from"./authority";
import{activeBlockingFindings,selectNextBestAction}from"./next-action";
import{buildCustomerExplanation,buildInternalExplanation}from"./explain";
import{buildCustomerQuestions}from"./question-catalog";
import{buildPlaybookCandidateActions}from"./playbooks";
import{adaptExistingBrainEvaluations,mergeRuleFindings}from"./rule-adapter";
import{buildExecutionCommand}from"./execution";
import{assertDecisionContract}from"./decision-contract";
import type{CaseAuthorityClass,CaseAuthorityEvidence,CaseCandidateAction,CaseHumanHandoff,CaseOrchestratorDecision,CaseOrchestratorInput}from"./types";

function evidenceMatches(authority:CaseAuthorityClass,evidence:CaseAuthorityEvidence|undefined,args:{caseId:string;caseVersion:number;actionType:string;inputFingerprint:string;computedAt:string}):boolean{if(authority==="AI_AUTONOMOUS"||!evidence?.verified||evidence.authority!==authority||evidence.caseId!==args.caseId||evidence.caseVersion!==args.caseVersion||evidence.actionType!==args.actionType||evidence.inputFingerprint!==args.inputFingerprint)return false;const decided=Date.parse(evidence.decidedAt);if(Number.isNaN(decided)||decided>Date.parse(args.computedAt))return false;if(authority==="CUSTOMER_CONFIRMATION")return evidence.actorType==="CUSTOMER";if(authority==="QUALIFIED_PROFESSIONAL")return evidence.actorType==="PROFESSIONAL";return evidence.actorType==="GUIMMIA"}
function mergeActions(actions:CaseCandidateAction[]):CaseCandidateAction[]{const unique=new Map<string,CaseCandidateAction>();for(const action of actions)unique.set(action.code,action);return[...unique.values()]}
function plusMinutes(iso:string,minutes:number):string{return new Date(Date.parse(iso)+minutes*60000).toISOString()}

export function orchestrateGuimmiaCase(input:CaseOrchestratorInput):CaseOrchestratorDecision{
  if(input.confidence<0||input.confidence>1)throw new Error("V770_CONFIDENCE_RANGE_INVALID");
  const findings=mergeRuleFindings(input.findings??[],adaptExistingBrainEvaluations(input.brainEvaluations));
  const playbookResult=buildPlaybookCandidateActions(input.context);
  const requiredPaths=[...findings.filter(item=>item.matched).flatMap(item=>item.requiredFactPaths),...playbookResult.missingFactPaths];
  const context=buildCaseContextSnapshot(input.context,requiredPaths);
  const candidateActions=mergeActions([...playbookResult.actions,...(input.candidateActions??[])]);
  const blocking=activeBlockingFindings(findings);
  const selectedAction=selectNextBestAction(candidateActions,findings,input.previouslySelectedActionCodes);
  const questions=buildCustomerQuestions([...context.missingFactPaths,...playbookResult.missingFactPaths],input.context.operationType,3);
  const lowConfidence=input.confidence<0.75;
  const authority=selectedAction?.authority??"GUIMMIA_HUMAN";
  const unknownActionBlocked=!!selectedAction&&isUnknownActionType(selectedAction.actionType);
  const inputFingerprint=stableFingerprint({context:context.contextFingerprint,findings,candidates:candidateActions,previouslySelectedActionCodes:input.previouslySelectedActionCodes??[],confidence:input.confidence,playbook:playbookResult.playbook.code,stage:playbookResult.stage.code});
  const authorityVerified=!!selectedAction&&evidenceMatches(authority,input.authorityEvidence,{caseId:input.context.caseId,caseVersion:input.context.caseVersion,actionType:selectedAction.actionType,inputFingerprint,computedAt:input.context.computedAt});
  const humanAuthority=!!selectedAction&&(authority==="GUIMMIA_HUMAN"||authority==="QUALIFIED_PROFESSIONAL");
  const handoffRequired=lowConfidence||unknownActionBlocked||(humanAuthority&&!authorityVerified);
  const slaMinutes=blocking.some(item=>item.severity==="critical")||lowConfidence?60:authority==="QUALIFIED_PROFESSIONAL"?240:480;
  const handoff:CaseHumanHandoff|undefined=handoffRequired?{required:true,authority:authority==="QUALIFIED_PROFESSIONAL"?"QUALIFIED_PROFESSIONAL":"GUIMMIA_HUMAN",reasonCodes:[...new Set([...(selectedAction?.reasonCodes??[]),...(lowConfidence?["LOW_CONFIDENCE"]:[]),...(unknownActionBlocked?["UNKNOWN_ACTION_TYPE_BLOCKED"]:[])])],contextFingerprint:context.contextFingerprint,requestedOwnerType:authority==="QUALIFIED_PROFESSIONAL"?"PROFESSIONAL":"GUIMMIA",slaMinutes,dueAt:plusMinutes(input.context.computedAt,slaMinutes)}:undefined;
  const criticalBlock=blocking.some(item=>item.severity==="critical");
  const customerAuthorityWaiting=authority==="CUSTOMER_CONFIRMATION"&&!authorityVerified;
  const status=handoff?handoff.authority==="QUALIFIED_PROFESSIONAL"?"WAITING_PROFESSIONAL":"WAITING_HUMAN":questions.length>0||customerAuthorityWaiting?"WAITING_CUSTOMER":criticalBlock||!selectedAction?"BLOCKED":"READY";
  const evidenceRefs=[...new Set([...findings.flatMap(item=>item.evidenceRefs),...(authorityVerified&&input.authorityEvidence?[input.authorityEvidence.evidenceRef]:[])])].sort();
  const ruleRefs=[...new Set(findings.filter(item=>item.matched).map(item=>item.ruleCode))].sort();
  const reasonCodes=[...new Set([...blocking.flatMap(item=>item.reasonCodes),...(selectedAction?.reasonCodes??[]),...(lowConfidence?["LOW_CONFIDENCE"]:[]),...(unknownActionBlocked?["UNKNOWN_ACTION_TYPE_BLOCKED"]:[]),...(input.authorityEvidence&&!authorityVerified?["AUTHORITY_EVIDENCE_INVALID_OR_STALE"]:[]),"PLAYBOOK:"+playbookResult.playbook.code,"PLAYBOOK_STAGE:"+playbookResult.stage.code])].sort();
  if(input.previousDecisionFingerprint&&input.previousDecisionFingerprint!==inputFingerprint)reasonCodes.push("DECISION_INPUT_CHANGED");
  const aiExecutionAllowed=!!selectedAction&&status==="READY"&&!unknownActionBlocked&&canAiExecute(selectedAction);
  const authorizedSystemExecutionAllowed=!!selectedAction&&status==="READY"&&authority!=="AI_AUTONOMOUS"&&authorityVerified&&!unknownActionBlocked;
  const executionCommand=buildExecutionCommand({mode:input.executionMode??"DRY_RUN",caseId:input.context.caseId,caseVersion:input.context.caseVersion,inputFingerprint,computedAt:input.context.computedAt,status,action:selectedAction,aiExecutionAllowed,authorityEvidence:input.authorityEvidence});
  const decision:CaseOrchestratorDecision={runId:"V770-"+input.context.caseId+"-"+input.context.caseVersion+"-"+inputFingerprint,caseId:input.context.caseId,caseVersion:input.context.caseVersion,inputFingerprint,status,playbookCode:playbookResult.playbook.code,playbookStage:playbookResult.stage.code,nextPlaybookStage:playbookResult.stage.nextStage,selectedAction,customerQuestions:questions,reasonCodes:[...new Set(reasonCodes)].sort(),evidenceRefs,ruleRefs,customerExplanation:buildCustomerExplanation(selectedAction,findings,questions),internalExplanation:buildInternalExplanation(selectedAction,findings,context.contextFingerprint),handoff,aiExecutionAllowed,authorizedSystemExecutionAllowed,customerConfirmationRequired:authority==="CUSTOMER_CONFIRMATION"&&!authorityVerified,unknownActionBlocked,executionCommand,confidence:input.confidence,decidedAt:input.context.computedAt};
  assertDecisionContract(decision);return decision;
}
