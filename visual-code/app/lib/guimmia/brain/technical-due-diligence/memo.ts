import type { AgentTechnicalMemo, GateStatus, TechnicalFinding } from "./types";
import type { GateImpact } from "../types";

export function buildAgentTechnicalMemo(caseId: string, findings: TechnicalFinding[], gates: Record<GateImpact, GateStatus>): AgentTechnicalMemo {
  const open = findings.filter(f=>["OPEN","IN_REVIEW","STALE"].includes(f.status));
  const overall: GateStatus = Object.values(gates).includes("BLOCKED") ? "BLOCKED" :
    Object.values(gates).some(x=>x==="REVIEW_REQUIRED" || x==="STALE") ? "REVIEW_REQUIRED" : "READY";
  return {
    caseId,
    generatedAt: new Date().toISOString(),
    overallStatus: overall,
    keyFacts: [],
    openFindings: open.map(f=>`${f.code}: ${f.title}`),
    professionalActions: open.filter(f=>f.decisionLevel==="PROFESSIONAL_REQUIRED").map(f=>`Tecnico/professionista: ${f.title}`),
    gateSummary: gates,
    disclaimer: "Memo operativo interno. Guimmia non certifica conformità urbanistica/catastale, sanabilità, tolleranze o commerciabilità.",
  };
}
