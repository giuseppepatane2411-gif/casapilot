import type {
  BrainContext,
  BrainRule,
  PhaseEvaluation,
  RuleCondition,
  RuleHit,
  RuleTrace,
} from "./types";

export function getPath(input: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, input);
}

function factsReadForCondition(condition: RuleCondition, facts: Record<string, unknown>, out: Record<string, unknown> = {}) {
  if ("path" in condition) out[condition.path] = getPath(facts, condition.path);
  if (condition.op === "all" || condition.op === "any") {
    for (const child of condition.conditions) factsReadForCondition(child, facts, out);
  }
  if (condition.op === "not") factsReadForCondition(condition.condition, facts, out);
  return out;
}

export function evaluateCondition(condition: RuleCondition, facts: Record<string, unknown>): boolean {
  switch (condition.op) {
    case "eq": return getPath(facts, condition.path) === condition.value;
    case "neq": return getPath(facts, condition.path) !== condition.value;
    case "in": return condition.values.includes(getPath(facts, condition.path));
    case "not_in": return !condition.values.includes(getPath(facts, condition.path));
    case "exists": return getPath(facts, condition.path) !== undefined && getPath(facts, condition.path) !== null;
    case "truthy": return Boolean(getPath(facts, condition.path));
    case "falsy": return !Boolean(getPath(facts, condition.path));
    case "gt": return Number(getPath(facts, condition.path)) > condition.value;
    case "gte": return Number(getPath(facts, condition.path)) >= condition.value;
    case "lt": return Number(getPath(facts, condition.path)) < condition.value;
    case "lte": return Number(getPath(facts, condition.path)) <= condition.value;
    case "all": return condition.conditions.every((child) => evaluateCondition(child, facts));
    case "any": return condition.conditions.some((child) => evaluateCondition(child, facts));
    case "not": return !evaluateCondition(condition.condition, facts);
  }
}

function dynamicRuleIsFresh(rule: BrainRule, context: BrainContext): boolean {
  if (rule.stability !== "DYNAMIC") return true;
  const policy = rule.freshnessPolicy;
  if (!policy?.required || !policy.rulesetKey) return false;
  const ruleset = context.legalRulesets?.[policy.rulesetKey];
  if (!ruleset || ruleset.status !== "CURRENT" || !ruleset.verifiedAt) return false;
  if (!policy.maxAgeDays) return true;
  const now = new Date(context.now ?? new Date().toISOString()).getTime();
  const verified = new Date(ruleset.verifiedAt).getTime();
  return Number.isFinite(verified) && (now - verified) / 86400000 <= policy.maxAgeDays;
}

function requiredEvidenceIsPresent(rule: BrainRule, context: BrainContext): boolean {
  const policy = rule.evidencePolicy;
  if (!policy?.requireVerifiedEvidence) return true;
  const factRecords = context.factRecords ?? [];
  const required = policy.requiredFactPaths ?? [];
  return required.every((path) => {
    const fact = factRecords.find((item) => item.path === path);
    if (!fact?.evidence?.length) return false;
    return fact.evidence.some((ev) => {
      if (!ev.verified) return false;
      if (policy.acceptedProvenance?.length && !policy.acceptedProvenance.includes(ev.provenance)) return false;
      return true;
    });
  });
}

export function evaluateRule(rule: BrainRule, context: BrainContext): { hit?: RuleHit; trace: RuleTrace } {
  const trace: RuleTrace = {
    ruleId: rule.id,
    matched: false,
    skipped: false,
    evaluatedCondition: rule.condition,
    factsRead: factsReadForCondition(rule.condition, context.facts),
  };

  if (!rule.active) {
    trace.skipped = true;
    trace.skipReason = "RULE_INACTIVE";
    return { trace };
  }

  // V76.2: prima si verifica se la regola è realmente applicabile al caso.
  // Freshness ed evidence guard non devono bloccare una pratica per una regola
  // dinamica/condizionale che non è stata attivata dai fatti.
  const matched = evaluateCondition(rule.condition, context.facts);
  trace.matched = matched;
  if (!matched) return { trace };

  if (!dynamicRuleIsFresh(rule, context)) {
    trace.skipped = true;
    trace.skipReason = "DYNAMIC_RULESET_NOT_CURRENT";
    return {
      trace,
      hit: {
        ruleId: `${rule.id}__LEGAL_FRESHNESS_GUARD`,
        module: rule.module,
        phase: rule.phase,
        title: `Verifica normativa richiesta — ${rule.title}`,
        decisionLevel: "AGENT_REQUIRED",
        severity: "blocking",
        outcome: {
          code: "LEGAL_RULESET_REVIEW_REQUIRED",
          message: "La regola dipende da normativa variabile e non può essere applicata finché il relativo ruleset non è verificato come corrente su fonti ufficiali.",
          blockProgress: true,
          suggestedActions: ["Aggiornare il ruleset normativo da fonti ufficiali", "Registrare data e responsabile della verifica"],
          escalationTo: "AGENT",
        },
        trace,
        sourceRefs: rule.sourceRefs,
      },
    };
  }

  if (!requiredEvidenceIsPresent(rule, context)) {
    trace.skipped = true;
    trace.skipReason = "VERIFIED_EVIDENCE_MISSING";
    return {
      trace,
      hit: {
        ruleId: `${rule.id}__EVIDENCE_GUARD`,
        module: rule.module,
        phase: rule.phase,
        title: `Evidenza verificata richiesta — ${rule.title}`,
        decisionLevel: "REVIEW",
        severity: "blocking",
        outcome: {
          code: "VERIFIED_EVIDENCE_REQUIRED",
          message: "La regola richiede evidenza verificata prima di poter produrre una conclusione operativa.",
          blockProgress: true,
          requiredFacts: rule.evidencePolicy?.requiredFactPaths,
        },
        trace,
        sourceRefs: rule.sourceRefs,
      },
    };
  }

  return {
    trace,
    hit: {
      ruleId: rule.id,
      module: rule.module,
      phase: rule.phase,
      title: rule.title,
      decisionLevel: rule.decisionLevel,
      severity: rule.severity,
      outcome: rule.outcome,
      trace,
      sourceRefs: rule.sourceRefs,
    },
  };
}

export function evaluatePhase(phase: string, rules: BrainRule[], context: BrainContext): PhaseEvaluation {
  const phaseRules = rules.filter((rule) => rule.phase === phase && rule.active);
  const hits = phaseRules.map((rule) => evaluateRule(rule, context).hit).filter(Boolean) as RuleHit[];
  const blockers = hits.filter((hit) => hit.outcome.blockProgress || hit.severity === "blocking" || hit.severity === "critical");
  const reviews = hits.filter((hit) => hit.decisionLevel === "REVIEW" || hit.decisionLevel === "AGENT_REQUIRED" || hit.decisionLevel === "PROFESSIONAL_REQUIRED");
  const info = hits.filter((hit) => !blockers.includes(hit) && !reviews.includes(hit));

  let readiness: PhaseEvaluation["readiness"] = "READY";
  if (blockers.length) readiness = "BLOCKED";
  else if (reviews.length) readiness = "REVIEW_REQUIRED";

  return {
    phase,
    readiness,
    hits,
    blockers,
    reviews,
    info,
    summary: {
      totalRules: phaseRules.length,
      matchedRules: hits.length,
      blockingRules: blockers.length,
      reviewRules: reviews.length,
    },
  };
}
