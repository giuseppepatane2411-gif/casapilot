import type { RiskItem, TechnicalFinding } from "./types";

export function findingsToRiskRegister(findings: TechnicalFinding[]): RiskItem[] {
  return findings
    .filter(f=>["OPEN","IN_REVIEW","STALE"].includes(f.status))
    .map(f=>({
      code: `RISK_${f.code}`,
      title: f.title,
      severity: f.severity,
      status: f.status==="STALE" ? "STALE" : "OPEN",
      gateImpact: f.gateImpact,
      ownerRole: f.professionalRole==="TECHNICIAN" ? "TECHNICIAN" : f.professionalRole==="NOTARY" ? "NOTARY" : "AGENT",
      findingIds: [f.code],
    }));
}

export function openCriticalRiskCount(items: RiskItem[]) {
  return items.filter(x=>x.severity==="critical" && x.status==="OPEN").length;
}
