import "server-only";

import {
  brainKnowledgeCards,
  brainRules,
  brainWorkflows,
} from "@/lib/guimmia/brain/registry";
import {
  getOperationPlaybook,
  inferPlaybookStage,
} from "@/lib/guimmia/brain/case-orchestrator/playbooks";
import type { GuimmiaOperationType } from "@/lib/guimmia/brain/case-orchestrator/types";
import type {
  GuimmiaBrainKnowledgeReference,
  GuimmiaBrainRetrievalContext,
} from "@/lib/guimmia/openai/brain-types";
import {
  GUIMMIA_BRAIN_MAX_KNOWLEDGE_CARDS,
  GUIMMIA_BRAIN_MAX_RULES,
} from "@/lib/guimmia/openai/config";
import type { SiteOrchestrationRequest } from "@/lib/guimmia/site-orchestration/types";

const STOP_WORDS = new Set([
  "a",
  "ad",
  "al",
  "alla",
  "alle",
  "anche",
  "che",
  "chi",
  "come",
  "con",
  "cosa",
  "da",
  "dal",
  "dalla",
  "de",
  "dei",
  "del",
  "della",
  "di",
  "e",
  "gli",
  "ha",
  "ho",
  "i",
  "il",
  "in",
  "io",
  "la",
  "le",
  "lo",
  "mi",
  "nel",
  "nella",
  "non",
  "o",
  "per",
  "piu",
  "quale",
  "quali",
  "se",
  "si",
  "sono",
  "su",
  "un",
  "una",
  "uno",
  "vorrei",
]);

const workflowIds: Record<GuimmiaOperationType, string> = {
  SALE: "WF_SALE_PRIVATE_APARTMENT_V3",
  RENT_LONG_TERM: "WF_RENT_LONG_TERM_V2",
  RENT_TRANSITORY: "WF_RENT_TRANSITORY_V2",
  RENT_STUDENT: "WF_RENT_STUDENT_V2",
  RENT_TOURIST_SHORT: "WF_RENT_TOURIST_SHORT_V2",
};

const stagePhaseHints: Record<string, string[]> = {
  INTAKE: ["PHASE_01_CLIENT_MANDATE"],
  SERVICE_AND_MANDATE: ["PHASE_01_CLIENT_MANDATE"],
  TRANSITORY_REASON: ["PHASE_R03_RENTAL_DOCUMENT_DOSSIER"],
  STUDENT_EVIDENCE: ["PHASE_R03_RENTAL_DOCUMENT_DOSSIER"],
  TOURIST_COMPLIANCE: ["PHASE_R04_RENTAL_READINESS"],
  PROPERTY_READINESS: [
    "PHASE_02_OWNERSHIP_TITLE",
    "PHASE_03_DOCUMENT_DOSSIER",
    "PHASE_04_URBAN_CADASTRAL",
    "PHASE_05_ENCUMBRANCES_CONDO_TAX",
    "PHASE_R02_LETTING_AUTHORITY",
    "PHASE_R03_RENTAL_DOCUMENT_DOSSIER",
    "PHASE_R04_RENTAL_READINESS",
  ],
  LISTING: [
    "PHASE_07_MARKET_READINESS",
    "PHASE_08_PUBLISHING",
    "PHASE_R06_MARKET_READINESS",
    "PHASE_T06_TOURIST_MARKET",
  ],
  LEADS: ["PHASE_09_LEADS", "PHASE_R07_CANDIDATES"],
  VISITS: ["PHASE_10_VISITS", "PHASE_R07_CANDIDATES"],
  SCREENING: ["PHASE_R08_SCREENING"],
  SELECTION: ["PHASE_R08_SCREENING"],
  OFFER: ["PHASE_11_NEGOTIATION", "PHASE_12_OFFER"],
  CONTRACT: [
    "PHASE_12_OFFER",
    "PHASE_13_PRELIMINARY",
    "PHASE_R09_SIGN_REGISTER",
  ],
  CLOSING: ["PHASE_14_NOTARY_CLOSING"],
  HANDOVER: [
    "PHASE_15_ARCHIVE",
    "PHASE_R10_HANDOVER",
    "PHASE_T09_PAYOUT_ARCHIVE",
  ],
  BOOKING: ["PHASE_T07_BOOKING"],
  CHECK_IN: ["PHASE_T08_STAY"],
  STAY: ["PHASE_T08_STAY"],
  REPORTING: ["PHASE_T08_STAY"],
  CHECK_OUT: ["PHASE_T08_STAY", "PHASE_T09_PAYOUT_ARCHIVE"],
  TURNOVER: ["PHASE_T09_PAYOUT_ARCHIVE"],
};

function normalizedTokens(value: string) {
  return new Set(
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("it-IT")
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length >= 3 && !STOP_WORDS.has(token)),
  );
}

function overlapScore(query: Set<string>, value: string) {
  const haystack = normalizedTokens(value);
  let score = 0;
  for (const token of query) {
    if (haystack.has(token)) score += 1;
  }
  return score;
}

function operationWorkflow(operationType: GuimmiaOperationType) {
  const workflow = brainWorkflows.find(
    (item) => item.id === workflowIds[operationType],
  );
  if (!workflow) throw new Error("guimmia_brain_workflow_missing");
  return workflow;
}

function sourceLabels(
  values: Array<{ label: string; section?: string }>,
) {
  return values
    .map((source) =>
      source.section ? `${source.label} — ${source.section}` : source.label,
    )
    .filter(Boolean)
    .slice(0, 4);
}

export function retrieveGuimmiaBrainContext(
  question: string,
  request: SiteOrchestrationRequest & {
    operationType: GuimmiaOperationType;
  },
): GuimmiaBrainRetrievalContext {
  const operationType = request.operationType;
  const workflow = operationWorkflow(operationType);
  const playbook = getOperationPlaybook(operationType);
  const stage = inferPlaybookStage(
    playbook,
    request.progress?.currentPhase ?? "INTAKE",
  );
  const workflowPhases = new Set(workflow.steps.map((step) => step.phase));
  const workflowRuleIds = new Set(
    workflow.steps.flatMap((step) => step.ruleIds),
  );
  const currentPhases = new Set(stagePhaseHints[stage.code] ?? []);
  const queryTokens = normalizedTokens(
    [
      question,
      operationType,
      stage.code,
      stage.title,
      request.property?.type,
      ...(request.property?.documents ?? []),
    ]
      .filter(Boolean)
      .join(" "),
  );

  const rankedRules = brainRules
    .filter(
      (rule) =>
        rule.active &&
        (workflowPhases.has(rule.phase) || workflowRuleIds.has(rule.id)),
    )
    .map((rule) => {
      const searchable = [
        rule.id,
        rule.module,
        rule.phase,
        rule.title,
        rule.description,
        rule.outcome.message,
        ...(rule.outcome.suggestedActions ?? []),
        ...(rule.outcome.requiredFacts ?? []),
      ].join(" ");
      const score =
        overlapScore(queryTokens, searchable) * 5 +
        (currentPhases.has(rule.phase) ? 30 : 0) +
        (workflowRuleIds.has(rule.id) ? 10 : 0) +
        (rule.severity === "blocking" || rule.severity === "critical" ? 2 : 0);
      return { rule, score };
    })
    .sort((left, right) => right.score - left.score || left.rule.id.localeCompare(right.rule.id));

  const selectedRules = rankedRules
    .filter((item, index) => item.score > 0 || index < 4)
    .slice(0, GUIMMIA_BRAIN_MAX_RULES)
    .map(({ rule }) => ({
      code: rule.id,
      module: rule.module,
      phase: rule.phase,
      title: rule.title,
      description: rule.description,
      decisionLevel: rule.decisionLevel,
      severity: rule.severity,
      outcome: {
        message: rule.outcome.message,
        blockProgress: rule.outcome.blockProgress === true,
        suggestedActions: (rule.outcome.suggestedActions ?? []).slice(0, 4),
        escalationTo: rule.outcome.escalationTo ?? null,
      },
      sourceLabels: sourceLabels(rule.sourceRefs),
    }));

  const selectedModules = new Set(selectedRules.map((rule) => rule.module));
  const selectedCards = brainKnowledgeCards
    .map((card) => {
      const searchable = [
        card.code,
        card.module,
        card.title,
        card.summary,
        ...card.trigger,
        ...card.requiredFacts,
        ...card.checks,
        ...card.redFlags,
        ...card.actions,
      ].join(" ");
      const score =
        overlapScore(queryTokens, searchable) * 4 +
        (selectedModules.has(card.module) ? 14 : 0) +
        (card.legalVerificationRequired ? 1 : 0);
      return { card, score };
    })
    .sort((left, right) => right.score - left.score || left.card.code.localeCompare(right.card.code))
    .filter((item, index) => item.score > 0 || index < 3)
    .slice(0, GUIMMIA_BRAIN_MAX_KNOWLEDGE_CARDS)
    .map(({ card }) => ({
      code: card.code,
      module: card.module,
      title: card.title,
      summary: card.summary,
      stability: card.stability,
      decisionLevel: card.defaultDecisionLevel,
      requiredFacts: card.requiredFacts.slice(0, 6),
      checks: card.checks.slice(0, 6),
      redFlags: card.redFlags.slice(0, 6),
      actions: card.actions.slice(0, 6),
      escalation: (card.escalation ?? []).slice(0, 4),
      legalVerificationRequired: card.legalVerificationRequired,
      sourceLabels: sourceLabels(card.sourceRefs),
    }));

  const references: GuimmiaBrainKnowledgeReference[] = [
    {
      type: "WORKFLOW",
      code: workflow.id,
      title: `${workflow.title}: ${stage.title}`,
      module: "CASE_ORCHESTRATOR",
      humanReviewRequired: false,
    },
    ...selectedRules.map((rule) => ({
      type: "RULE" as const,
      code: rule.code,
      title: rule.title,
      module: rule.module,
      decisionLevel: rule.decisionLevel,
      humanReviewRequired: ["AGENT_REQUIRED", "PROFESSIONAL_REQUIRED"].includes(
        rule.decisionLevel,
      ),
    })),
    ...selectedCards.map((card) => ({
      type: "CARD" as const,
      code: card.code,
      title: card.title,
      module: card.module,
      decisionLevel: card.decisionLevel,
      stability: card.stability,
      humanReviewRequired:
        card.legalVerificationRequired ||
        ["AGENT_REQUIRED", "PROFESSIONAL_REQUIRED"].includes(
          card.decisionLevel,
        ),
    })),
  ];

  return {
    brainVersion: "77.4.0",
    operationType,
    workflow: {
      code: workflow.id,
      title: workflow.title,
      version: workflow.version,
    },
    stage: {
      code: stage.code,
      title: stage.title,
      gate: stage.gate,
      requiredFactPaths: stage.requiredFactPaths,
    },
    rules: selectedRules,
    cards: selectedCards,
    references,
    catalogStats: {
      totalRules: brainRules.filter((rule) => rule.active).length,
      totalKnowledgeCards: brainKnowledgeCards.length,
      totalWorkflows: brainWorkflows.length,
      rulesSelected: selectedRules.length,
      cardsSelected: selectedCards.length,
    },
  };
}
