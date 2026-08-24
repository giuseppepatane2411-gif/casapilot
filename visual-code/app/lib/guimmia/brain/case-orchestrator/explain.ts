
import{redactCustomerText}from"./redaction";import type{CaseCandidateAction,CaseRuleFinding,CustomerQuestion}from"./types";
export function buildCustomerExplanation(action:CaseCandidateAction|undefined,findings:CaseRuleFinding[],questions:CustomerQuestion[]):string{
  if(questions.length>0)return"Per far avanzare la tua pratica Guimmia ha bisogno di "+questions.length+" informazion"+(questions.length===1?"e":"i")+" specific"+(questions.length===1?"a":"he")+". Ti spieghiamo perche ciascuna e necessaria.";
  if(!action)return"La pratica e in controllo: Guimmia non eseguira azioni finche non esiste un passo sicuro e verificato.";
  if(action.authority==="QUALIFIED_PROFESSIONAL")return"La prossima verifica richiede un professionista qualificato. Guimmia prepara e organizza il passaggio.";
  if(action.authority==="GUIMMIA_HUMAN")return"La prossima decisione richiede il responsabile umano di Guimmia.";
  if(action.authority==="CUSTOMER_CONFIRMATION")return"Guimmia ha preparato il prossimo passo, che sara eseguito soltanto dopo la tua conferma.";
  return redactCustomerText("Guimmia puo preparare automaticamente il prossimo passo: "+action.title+". Contesto e motivazione restano tracciati nel tuo Case.");
}
export function buildInternalExplanation(action:CaseCandidateAction|undefined,findings:CaseRuleFinding[],contextFingerprint:string):string{
  const matched=findings.filter(item=>item.matched).map(item=>item.ruleCode).sort();
  return"context="+contextFingerprint+";action="+(action?.code??"NONE")+";matched="+(matched.join(",")||"NONE");
}
