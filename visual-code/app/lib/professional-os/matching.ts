import type {
  LeadRequest,
  MatchEvaluation,
  ProfessionalIdentity,
  ServiceOffering,
} from "./types";
import { getServicePolicy } from "./service-policy";
import { communicationCompatible } from "@/lib/remote-layer/policy";
import { getRemoteServicePolicy } from "@/lib/remote-layer/service-policy";

function normalise(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function locationCompatible(
  lead: LeadRequest,
  identity: ProfessionalIdentity,
  offering: ServiceOffering,
) {
  if (
    offering.deliveryModes.includes("online") &&
    (offering.remoteExecutionLevel === "fully_remote" ||
      offering.remoteFeasibility === "fully_remote")
  ) {
    return true;
  }

  const areas = offering.useGeneralAreas
    ? identity.generalAreas
    : offering.areas;
  const location = normalise(lead.approximateLocation);
  return areas.some((area) => {
    const candidate = normalise(area);
    return (
      candidate.length > 0 &&
      (location.includes(candidate) || candidate.includes(location))
    );
  });
}

function budgetCompatible(
  lead: LeadRequest,
  offering: ServiceOffering,
) {
  if (
    offering.pricingMode === "after_inspection" ||
    typeof offering.priceMin !== "number" ||
    typeof lead.budgetMax !== "number"
  ) {
    return true;
  }
  return offering.priceMin <= lead.budgetMax;
}

function requiredVerificationComplete(
  identity: ProfessionalIdentity,
  serviceId: string,
) {
  const policy = getServicePolicy(serviceId);
  const verifiedTypes = new Set(
    identity.verificationItems
      .filter((item) => item.status === "verified")
      .map((item) => item.type),
  );
  return policy.requirements
    .filter((requirement) => requirement.required)
    .every((requirement) =>
      requirement.acceptedVerificationTypes.some((type) =>
        verifiedTypes.has(type),
      ),
    );
}

function requestedCapabilityIds(lead: LeadRequest) {
  return Object.values(lead.answers)
    .flatMap((value) => (Array.isArray(value) ? value : [String(value)]))
    .map(normalise);
}

function ownerCanAttend(lead: LeadRequest) {
  return (
    lead.presenceAvailability === "available" ||
    lead.presenceAvailability === "specific_dates"
  );
}

function remoteEvaluation(
  lead: LeadRequest,
  offering: ServiceOffering,
) {
  const policy = getRemoteServicePolicy(lead.serviceId);
  const blockers: string[] = [];
  const reasons: string[] = [];
  const warnings: string[] = [];
  let score = 0;
  const canAttend = ownerCanAttend(lead);

  if (
    policy.ownerPresenceRequirement === "required" &&
    !canAttend &&
    !(offering.delegationSupported && policy.delegationSupported)
  ) {
    blockers.push(
      "Il proprietario non può essere presente e non risulta disponibile una soluzione tramite delega",
    );
  }

  if (
    policy.inspectionRequired &&
    !canAttend &&
    !lead.localContactAvailable &&
    !offering.localContactSufficient &&
    !offering.delegationSupported
  ) {
    blockers.push("Non è definito come consentire l'accesso all'immobile");
  }

  if (!canAttend) {
    if (
      offering.remoteFeasibility === "fully_remote" ||
      offering.remoteExecutionLevel === "fully_remote"
    ) {
      score += 8;
      reasons.push("Servizio completamente gestibile a distanza");
    } else if (
      offering.remoteFeasibility === "mostly_remote" ||
      offering.remoteExecutionLevel === "mostly_remote"
    ) {
      score += 6;
      reasons.push("Servizio in gran parte gestibile a distanza");
    } else if (lead.localContactAvailable) {
      score += 4;
      reasons.push(
        lead.localContactRole
          ? `Referente locale disponibile: ${lead.localContactRole}`
          : "Referente locale disponibile",
      );
    } else if (offering.delegationSupported) {
      score += 4;
      reasons.push("Il professionista può lavorare tramite delega");
    } else {
      warnings.push("Il coordinamento dell'accesso deve essere definito");
    }

    if (offering.photoReportAvailable) {
      score += 3;
      reasons.push("Report fotografico disponibile");
    }
    if (lead.videoCallPreferred && offering.videoCallAvailable) {
      score += 3;
      reasons.push("Videochiamata disponibile");
    }
  }

  return { blockers, reasons, warnings, score };
}

function languageScore(
  language: ProfessionalIdentity["languageSkills"][number],
) {
  const cefr = language.cefr;
  if (cefr === "native" || language.level === "native") return 7;
  if (cefr === "C2" || cefr === "C1" || language.level === "advanced") return 6;
  if (cefr === "B2" || cefr === "B1" || language.level === "intermediate") return 4;
  return 2;
}

export function evaluateMatch(
  lead: LeadRequest,
  identity: ProfessionalIdentity,
  offering?: ServiceOffering,
): MatchEvaluation {
  const hardBlockers: string[] = [];
  const positiveReasons: string[] = [];
  const warnings: string[] = [];
  let score = 0;

  if (!offering || offering.serviceId !== lead.serviceId) {
    return {
      leadId: lead.id,
      professionalId: identity.id,
      offeringId: offering?.id,
      decision: "blocked",
      score: 0,
      hardBlockers: ["Il servizio non è configurato"],
      positiveReasons,
      warnings,
      evaluatedAt: new Date().toISOString(),
    };
  }

  if (!["active", "limited"].includes(offering.activationStatus)) {
    hardBlockers.push(
      offering.activationStatus === "pending_verification"
        ? "Servizio ancora in verifica"
        : "Servizio non attivo",
    );
  } else {
    score += offering.activationStatus === "active" ? 14 : 8;
    positiveReasons.push(
      offering.activationStatus === "active"
        ? "Servizio pienamente attivo"
        : "Servizio con disponibilità limitata",
    );
  }

  if (identity.pauseAllLeads) {
    hardBlockers.push("Ricezione di tutte le lead sospesa");
  }

  if (
    offering.autoPauseWhenFull &&
    offering.currentWeekAssigned >= offering.weeklyCapacity
  ) {
    hardBlockers.push("Capacità settimanale esaurita");
  } else {
    const remaining = Math.max(
      offering.weeklyCapacity - offering.currentWeekAssigned,
      0,
    );
    score += Math.min(8, remaining);
    positiveReasons.push(`${remaining} posti disponibili questa settimana`);
  }

  if (lead.qualityScore < offering.minimumLeadQuality) {
    hardBlockers.push(
      `Qualità lead ${lead.qualityScore}/100 sotto la soglia ${offering.minimumLeadQuality}/100`,
    );
  } else {
    score += Math.min(16, Math.round(lead.qualityScore / 6.25));
    positiveReasons.push(`Qualità lead compatibile: ${lead.qualityScore}/100`);
  }

  if (!offering.acceptedUrgencies.includes(lead.urgency)) {
    hardBlockers.push("Urgenza non accettata");
  } else {
    score += 10;
    positiveReasons.push("Urgenza accettata");
  }

  if (!offering.propertyTypes.includes(lead.propertyType)) {
    hardBlockers.push("Tipologia di immobile non coperta");
  } else {
    score += 8;
    positiveReasons.push("Tipologia di immobile coperta");
  }

  if (!locationCompatible(lead, identity, offering)) {
    hardBlockers.push("Zona non coperta");
  } else {
    score += 16;
    positiveReasons.push(
      offering.remoteFeasibility === "fully_remote"
        ? "La zona non limita questo servizio remoto"
        : "Zona geografica coperta",
    );
  }

  const remote = remoteEvaluation(lead, offering);
  score += remote.score;
  hardBlockers.push(...remote.blockers);
  positiveReasons.push(...remote.reasons);
  warnings.push(...remote.warnings);

  const professionalLanguages = identity.remoteCapabilities.languageSkills.map(
    (skill) => skill.language,
  );
  const communication = communicationCompatible({
    ownerLanguage: lead.ownerLanguage,
    professionalLanguages,
    translationEnabled: lead.translationEnabled,
    communicationPreference: lead.communicationPreference,
  });

  if (communication.blocker) {
    hardBlockers.push(communication.reason);
  } else {
    score += communication.scoreBonus;
    positiveReasons.push(communication.reason);
    if (!communication.direct) {
      warnings.push(
        lead.translationEnabled
          ? "Per contenuti legali o economici deve essere controllato anche l'originale"
          : "La modalità di comunicazione deve essere concordata",
      );
    } else {
      const skill = identity.remoteCapabilities.languageSkills.find(
        (item) => item.language === lead.ownerLanguage,
      );
      if (skill) score += Math.max(0, languageScore(skill) - 4);
    }
  }

  if (identity.remoteCapabilities.internationalClientExperience) {
    score += 3;
    positiveReasons.push("Esperienza con clienti che gestiscono immobili da lontano");
  }

  if (!budgetCompatible(lead, offering)) {
    hardBlockers.push("Prezzo minimo superiore al budget massimo");
  } else if (
    typeof lead.budgetMax === "number" &&
    typeof offering.priceMin === "number"
  ) {
    score += 7;
    positiveReasons.push("Fascia economica compatibile");
  } else {
    warnings.push("Compatibilità economica da confermare");
  }

  const servicePolicy = getServicePolicy(lead.serviceId);
  if (
    servicePolicy.regulated &&
    !requiredVerificationComplete(identity, lead.serviceId)
  ) {
    hardBlockers.push("Requisiti professionali obbligatori non verificati");
  } else if (servicePolicy.regulated) {
    score += 8;
    positiveReasons.push("Requisiti professionali verificati");
  } else if (identity.verificationStatus === "verified") {
    score += 5;
    positiveReasons.push("Profilo verificato");
  }

  const requested = requestedCapabilityIds(lead);
  const matchedCapabilities = offering.capabilities.filter((capability) => {
    const current = normalise(capability);
    return requested.some(
      (item) => current.includes(item) || item.includes(current),
    );
  }).length;

  if (matchedCapabilities > 0) {
    score += Math.min(8, matchedCapabilities * 2);
    positiveReasons.push(`${matchedCapabilities} competenze specifiche coerenti`);
  }

  if (offering.responseSlaHours <= 6) {
    score += 5;
    positiveReasons.push("Risposta rapida prevista");
  } else if (offering.responseSlaHours <= 24) {
    score += 3;
  }

  const cappedScore = Math.min(score, 100);
  const decision =
    hardBlockers.length > 0
      ? "blocked"
      : cappedScore >= 72
        ? "eligible"
        : "reserve";

  return {
    leadId: lead.id,
    professionalId: identity.id,
    offeringId: offering.id,
    decision,
    score: hardBlockers.length > 0 ? Math.min(cappedScore, 59) : cappedScore,
    hardBlockers,
    positiveReasons,
    warnings,
    evaluatedAt: new Date().toISOString(),
  };
}

export function rankLeads(
  leads: LeadRequest[],
  identity: ProfessionalIdentity,
  offerings: ServiceOffering[],
) {
  return leads
    .map((lead) => {
      const offering = offerings.find(
        (item) => item.serviceId === lead.serviceId,
      );
      return { lead, match: evaluateMatch(lead, identity, offering) };
    })
    .filter(({ match }) => match.decision !== "blocked")
    .sort((a, b) => b.match.score - a.match.score);
}

export function buildDistributionWaves(
  evaluations: MatchEvaluation[],
  maxProfessionals = 3,
) {
  const eligible = evaluations
    .filter((evaluation) => evaluation.decision === "eligible")
    .sort((a, b) => b.score - a.score);
  const reserve = evaluations
    .filter((evaluation) => evaluation.decision === "reserve")
    .sort((a, b) => b.score - a.score);

  return {
    wave1: eligible.slice(0, maxProfessionals),
    wave2: [...eligible.slice(maxProfessionals), ...reserve].slice(
      0,
      maxProfessionals,
    ),
  };
}
