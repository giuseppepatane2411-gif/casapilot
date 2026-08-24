import type { SiteOrchestrationResponse } from "@/lib/guimmia/site-orchestration/types";

const STORAGE_KEY = "guimmia_v772_public_case_decisions";
const MAX_CASES = 20;

type DecisionCache = Record<
  string,
  { decision: SiteOrchestrationResponse; savedAt: string }
>;

function readCache(): DecisionCache {
  if (typeof window === "undefined") return {};

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "{}",
    ) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as DecisionCache)
      : {};
  } catch {
    return {};
  }
}

export function readCachedSiteDecision(caseId: string) {
  const cached = readCache()[caseId]?.decision;
  return cached?.ok && cached.integrationVersion === "77.2.0"
    ? cached
    : null;
}

export function cacheSiteDecision(
  caseId: string,
  decision: SiteOrchestrationResponse,
) {
  if (typeof window === "undefined") return;

  const current = readCache();
  const next: DecisionCache = {
    ...current,
    [caseId]: { decision, savedAt: new Date().toISOString() },
  };
  const trimmed = Object.fromEntries(
    Object.entries(next)
      .sort(([, left], [, right]) => right.savedAt.localeCompare(left.savedAt))
      .slice(0, MAX_CASES),
  );

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // La cache migliora la continuità, ma non deve mai bloccare il percorso.
  }
}
