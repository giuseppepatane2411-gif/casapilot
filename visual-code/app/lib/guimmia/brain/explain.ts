import type { PhaseEvaluation, RuleHit } from "./types";

export function explainHit(hit: RuleHit) {
  return {
    code: hit.outcome.code,
    title: hit.title,
    decisionLevel: hit.decisionLevel,
    severity: hit.severity,
    message: hit.outcome.message,
    blockProgress: Boolean(hit.outcome.blockProgress),
    actions: hit.outcome.suggestedActions ?? [],
    escalationTo: hit.outcome.escalationTo ?? null,
    factsRead: hit.trace.factsRead,
    sources: hit.sourceRefs.map((ref) => ({
      label: ref.label,
      pages: ref.pages ?? null,
      section: ref.section ?? null,
      sourceKind: ref.sourceKind,
      normativeAuthority: ref.normativeAuthority,
    })),
  };
}

export function explainPhase(evaluation: PhaseEvaluation) {
  return {
    phase: evaluation.phase,
    readiness: evaluation.readiness,
    summary: evaluation.summary,
    blockers: evaluation.blockers.map(explainHit),
    reviews: evaluation.reviews.map(explainHit),
    info: evaluation.info.map(explainHit),
  };
}
