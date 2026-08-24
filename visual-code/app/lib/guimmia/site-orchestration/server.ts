import "server-only";

import {
  GUIMMIA_ORCHESTRATOR_VERSION,
  getOperationPlaybook,
  orchestrateGuimmiaCase,
  type CaseContextInput,
  type CaseDecisionStatus,
  type GuimmiaOperationType,
} from "@/lib/guimmia/brain/case-orchestrator";
import {
  OPERATION_LABELS,
} from "@/lib/guimmia/site-orchestration/operation";
import type {
  SiteCustomerQuestion,
  SiteOrchestrationRequest,
  SiteOrchestrationResponse,
} from "@/lib/guimmia/site-orchestration/types";

const operationOptions = [
  { value: "SALE", label: "Vendere o comprare" },
  { value: "RENT_LONG_TERM", label: "Affitto a lungo termine" },
  { value: "RENT_TRANSITORY", label: "Affitto transitorio" },
  { value: "RENT_STUDENT", label: "Affitto a studenti" },
  { value: "RENT_TOURIST_SHORT", label: "Affitto turistico breve" },
];

const statusLabels: Record<CaseDecisionStatus, string> = {
  READY: "Pronto per il prossimo passo",
  BLOCKED: "In attesa di elementi necessari",
  WAITING_CUSTOMER: "Serve una risposta del cliente",
  WAITING_HUMAN: "Controllo Guimmia necessario",
  WAITING_PROFESSIONAL: "Verifica professionale necessaria",
};

function routeQuestion(): SiteCustomerQuestion {
  return {
    id: "operation-type",
    prompt: "Quale percorso immobiliare vuoi avviare?",
    whyItMatters:
      "Ogni operazione ha documenti, controlli e passaggi differenti.",
    options: operationOptions,
  };
}

function waitingForRoute(): SiteOrchestrationResponse {
  return {
    ok: true,
    integrationVersion: "77.2.0",
    engineVersion: GUIMMIA_ORCHESTRATOR_VERSION,
    mode: "DRY_RUN",
    operationType: null,
    operationLabel: "Percorso da definire",
    status: "WAITING_CUSTOMER",
    statusLabel: statusLabels.WAITING_CUSTOMER,
    stage: {
      title: "Scelta del percorso",
    },
    nextAction: {
      title: "Definire il tipo di operazione",
      owner: "CUSTOMER",
      ctaLabel: "Scegli il percorso",
      href: "/dashboard/properties/new",
    },
    customerQuestions: [routeQuestion()],
    customerExplanation:
      "Prima di iniziare Guimmia deve distinguere con precisione vendita e diversi tipi di affitto.",
    handoff: null,
    safety: {
      executionPerformed: false,
      humanAuthorityPreserved: true,
      internalReasonCodesExposed: false,
    },
  };
}

function status(value: boolean) {
  return value ? "READY" : "MISSING";
}

function buildFacts(
  request: SiteOrchestrationRequest,
  identityConfirmed: boolean,
) {
  const documents = new Set(request.property?.documents ?? []);
  const hasCoreTechnicalDossier =
    documents.has("ownership") &&
    documents.has("cadastralPlan") &&
    documents.has("cadastralSurvey");

  return {
    "operation.type": request.operationType,
    "customer.identity.status": status(identityConfirmed),
    "customer.intent.status": status(Boolean(request.operationType)),
    "property.link.status": status(
      Boolean(request.property?.id || request.caseId),
    ),
    "service.model.status": status(Boolean(request.serviceModel)),
    "fixed.compensation.disclosure.status": "MISSING",
    "mandate.status": "MISSING",
    "property.ownership.evidence.status": status(
      documents.has("ownership"),
    ),
    "technical.dossier.status": status(hasCoreTechnicalDossier),
    "legal.ruleset.status": "MISSING",
    "property.readiness.status": status(
      Boolean(request.property?.locationVerified && hasCoreTechnicalDossier),
    ),
    "rental.authority.status": status(documents.has("rentalAuthority")),
    "rental.contract.profile.status": status(documents.has("leaseTemplate")),
    "transitory.reason.status": status(
      documents.has("transitoryReasonEvidence"),
    ),
    "transitory.evidence.status": status(
      documents.has("transitoryReasonEvidence"),
    ),
    "rental.duration.status": status(
      documents.has("transitoryReasonEvidence"),
    ),
    "student.enrollment.status": status(documents.has("studentEnrollment")),
    "student.course.period.status": status(
      documents.has("studentEnrollment"),
    ),
    "guarantor.or.income.status": status(documents.has("guarantorEvidence")),
    "student.contract.profile.status": status(documents.has("leaseTemplate")),
    "tourist.unit.compliance.status": status(
      documents.has("touristUnitCompliance"),
    ),
    "tourist.local.ruleset.status": status(documents.has("touristLocalRules")),
    "tourist.reporting.profile.status": status(
      documents.has("touristGuestReporting"),
    ),
    "listing.draft.status": "MISSING",
    "listing.human_approval.status": "MISSING",
    "listing.channel_authorization.status": "MISSING",
  } satisfies Record<string, unknown>;
}

function mapCta(actionType: string, stageCode: string) {
  const routes: Record<string, { label: string; href: string }> = {
    REQUEST_MISSING_INFORMATION: {
      label: "Rispondi a Guimmia",
      href: "/dashboard/pilot#pilot-chat",
    },
    PREPARE_PROPERTY_DOSSIER: {
      label: "Apri i documenti",
      href: "/dashboard/documents",
    },
    PREPARE_LISTING_DRAFT: {
      label: "Prepara l’annuncio",
      href: "/dashboard/pilot#pilot-chat",
    },
    PROPOSE_AVAILABLE_SLOTS: {
      label: "Gestisci disponibilità",
      href: "/dashboard/settings/communication",
    },
  };

  if (
    actionType === "REQUEST_MISSING_INFORMATION" &&
    [
      "PROPERTY_READINESS",
      "TRANSITORY_REASON",
      "STUDENT_EVIDENCE",
      "TOURIST_COMPLIANCE",
    ].includes(stageCode)
  ) {
    return {
      label: "Apri la checklist corretta",
      href: "/dashboard/documents",
    };
  }

  return (
    routes[actionType] ?? {
      label: "Continua con Guimmia",
      href: "/dashboard/pilot#pilot-chat",
    }
  );
}

function cleanRequest(request: SiteOrchestrationRequest) {
  const version = Number(request.caseVersion ?? 1);
  const confidence = Number(request.confidence ?? 0.9);

  return {
    caseVersion:
      Number.isInteger(version) && version > 0 ? version : 1,
    confidence:
      Number.isFinite(confidence) && confidence >= 0 && confidence <= 1
        ? confidence
        : 0.9,
  };
}

export function orchestrateSiteCase(
  request: SiteOrchestrationRequest,
  options: { identityConfirmed: boolean },
): SiteOrchestrationResponse {
  if (!request.operationType) return waitingForRoute();

  const normalized = cleanRequest(request);
  const computedAt = new Date().toISOString();
  const context: CaseContextInput = {
    caseId: request.caseId,
    caseVersion: normalized.caseVersion,
    operatingAgencyCode: "GUIMMIA",
    operationType: request.operationType,
    serviceModel: request.serviceModel ?? "COMPLETA",
    customerRole: request.customerRole ?? "UNCONFIRMED",
    propertyId: request.property?.id,
    currentPhase: request.progress?.currentPhase ?? "INTAKE",
    internalOwnerId: "GUIMMIA_INTAKE_QUEUE",
    facts: buildFacts(request, options.identityConfirmed),
    evidence: [],
    computedAt,
  };

  const decision = orchestrateGuimmiaCase({
    context,
    previouslySelectedActionCodes:
      request.progress?.completedActionCodes ?? [],
    executionMode: "DRY_RUN",
    confidence: normalized.confidence,
  });
  const cta = decision.selectedAction
    ? mapCta(decision.selectedAction.actionType, decision.playbookStage)
    : null;
  const playbook = getOperationPlaybook(request.operationType);
  const playbookStage = playbook.stages.find(
    (stage) => stage.code === decision.playbookStage,
  );

  return {
    ok: true,
    integrationVersion: "77.2.0",
    engineVersion: GUIMMIA_ORCHESTRATOR_VERSION,
    mode: "DRY_RUN",
    operationType: request.operationType as GuimmiaOperationType,
    operationLabel: OPERATION_LABELS[request.operationType],
    status: decision.status,
    statusLabel: statusLabels[decision.status],
    stage: {
      title: playbookStage?.title ?? "Verifica del percorso in corso",
    },
    nextAction:
      decision.selectedAction && cta
        ? {
            title: decision.selectedAction.title,
            owner: decision.selectedAction.ownerType,
            ctaLabel: cta.label,
            href: cta.href,
          }
        : null,
    customerQuestions: decision.customerQuestions.map((question, index) => ({
      id: `question-${index + 1}`,
      prompt: question.prompt,
      whyItMatters: question.whyItMatters,
    })),
    customerExplanation: decision.customerExplanation,
    handoff: decision.handoff
      ? {
          required: true,
          destination:
            decision.handoff.requestedOwnerType === "PROFESSIONAL"
              ? "PROFESSIONAL"
              : "GUIMMIA",
          dueAt: decision.handoff.dueAt,
        }
      : null,
    safety: {
      executionPerformed: false,
      humanAuthorityPreserved: true,
      internalReasonCodesExposed: false,
    },
  };
}
