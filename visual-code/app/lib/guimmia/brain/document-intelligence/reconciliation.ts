export interface ClaimComparable {
  id: string;
  factPath: string;
  normalizedValue: unknown;
  sourceRank: number;
  verified: boolean;
  documentVersionId?: string;
}

export interface ReconciliationResult {
  factPath: string;
  status: "CONSISTENT" | "CONFLICT" | "INSUFFICIENT";
  claimIds: string[];
  distinctValues: unknown[];
  recommendedDecision: "AUTO_ACCEPT" | "REVIEW" | "AGENT_REQUIRED";
}

function stableKey(value: unknown) {
  if (value === undefined) return "__undefined__";
  return JSON.stringify(value, Object.keys((value && typeof value === "object" && !Array.isArray(value)) ? value as Record<string, unknown> : {}).sort());
}

export function reconcileClaims(factPath: string, claims: ClaimComparable[]): ReconciliationResult {
  const scoped = claims.filter(c => c.factPath === factPath);
  if (!scoped.length) return { factPath, status: "INSUFFICIENT", claimIds: [], distinctValues: [], recommendedDecision: "REVIEW" };
  const distinct = new Map<string, unknown>();
  for (const c of scoped) distinct.set(stableKey(c.normalizedValue), c.normalizedValue);
  if (distinct.size === 1) {
    const verified = scoped.some(c => c.verified);
    return { factPath, status: "CONSISTENT", claimIds: scoped.map(c=>c.id), distinctValues: [...distinct.values()], recommendedDecision: verified ? "AUTO_ACCEPT" : "REVIEW" };
  }
  const maxRank = Math.max(...scoped.map(c => c.sourceRank));
  const top = scoped.filter(c => c.sourceRank === maxRank);
  const topDistinct = new Set(top.map(c => stableKey(c.normalizedValue)));
  return { factPath, status: "CONFLICT", claimIds: scoped.map(c=>c.id), distinctValues: [...distinct.values()], recommendedDecision: topDistinct.size > 1 ? "AGENT_REQUIRED" : "REVIEW" };
}
