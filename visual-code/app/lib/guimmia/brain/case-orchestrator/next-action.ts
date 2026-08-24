
import{normalizeActionAuthority}from"./authority";
import type{CaseCandidateAction,CaseRuleFinding}from"./types";

const priorityScore={CRITICAL:400,HIGH:300,NORMAL:200,LOW:100}as const;
const authorityScore={AI_AUTONOMOUS:40,CUSTOMER_CONFIRMATION:30,GUIMMIA_HUMAN:20,QUALIFIED_PROFESSIONAL:10}as const;

export function activeBlockingFindings(findings:CaseRuleFinding[]):CaseRuleFinding[]{return findings.filter(item=>item.matched&&(item.severity==="blocking"||item.severity==="critical"))}

export function rankCandidateActions(actions:CaseCandidateAction[],blockingCodes:string[],previouslySelectedActionCodes:string[]=[]):CaseCandidateAction[]{
  const blocked=new Set(blockingCodes);
  const previous=new Set(previouslySelectedActionCodes);
  const resolutionScore=(action:CaseCandidateAction)=>(action.resolves??[]).filter(code=>blocked.has(code)).length*500;
  return actions.map(normalizeActionAuthority).filter(action=>!action.dependsOn.some(code=>blocked.has(code))).filter(action=>action.safeToRepeat||!previous.has(action.code)).sort((a,b)=>resolutionScore(b)-resolutionScore(a)||priorityScore[b.priority]-priorityScore[a.priority]||authorityScore[b.authority]-authorityScore[a.authority]||a.code.localeCompare(b.code));
}

export function selectNextBestAction(actions:CaseCandidateAction[],findings:CaseRuleFinding[],previouslySelectedActionCodes:string[]=[]):CaseCandidateAction|undefined{
  const active=activeBlockingFindings(findings);
  const codes=active.flatMap(item=>[item.ruleCode,...item.reasonCodes]);
  return rankCandidateActions(actions,codes,previouslySelectedActionCodes)[0];
}
