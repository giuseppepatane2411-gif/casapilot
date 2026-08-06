import type {
  ProfessionalIdentity,
  ServiceOffering,
} from "./types";
import { getServicePolicy } from "./service-policy";

export interface ReadinessCheck {
  id: string;
  label: string;
  complete: boolean;
  blocking: boolean;
  href: string;
}

export function offeringReadiness(
  offering: ServiceOffering,
  identity: ProfessionalIdentity,
) {
  const policy = getServicePolicy(offering.serviceId);
  const availableVerificationTypes = new Set(
    identity.verificationItems
      .filter((item) => item.status === "verified")
      .map((item) => item.type),
  );

  const requiredVerificationComplete = policy.requirements
    .filter((requirement) => requirement.required)
    .every((requirement) =>
      requirement.acceptedVerificationTypes.some((type) =>
        availableVerificationTypes.has(type),
      ),
    );

  const checks: ReadinessCheck[] = [
    {
      id: "delivery",
      label: "Modalità di erogazione",
      complete: offering.deliveryModes.length > 0,
      blocking: true,
      href: "",
    },
    {
      id: "coverage",
      label: "Copertura geografica o online",
      complete:
        offering.remoteExecutionLevel === "fully_remote" ||
        offering.useGeneralAreas ||
        offering.areas.length > 0,
      blocking: true,
      href: "",
    },
    {
      id: "remote",
      label: "Piano di presenza e gestione a distanza",
      complete: Boolean(
        offering.remoteExecutionLevel &&
          offering.ownerPresenceRequirement &&
          offering.remoteFeasibility &&
          offering.documentHandling &&
          offering.signatureMode &&
          (offering.remoteWorkflowSteps?.length ?? 0) > 0,
      ),
      blocking: true,
      href: "",
    },
    {
      id: "urgency",
      label: "Urgenze accettate",
      complete: offering.acceptedUrgencies.length > 0,
      blocking: true,
      href: "",
    },
    {
      id: "property_types",
      label: "Tipologie di immobili",
      complete: offering.propertyTypes.length > 0,
      blocking: true,
      href: "",
    },
    {
      id: "capacity",
      label: "Capacità settimanale",
      complete: offering.weeklyCapacity > 0,
      blocking: true,
      href: "",
    },
    {
      id: "pricing",
      label: "Indicazione economica",
      complete:
        offering.pricingMode === "after_inspection" ||
        typeof offering.priceMin === "number",
      blocking: false,
      href: "",
    },
    {
      id: "verification",
      label: policy.regulated
        ? "Requisiti professionali obbligatori"
        : "Verifiche del profilo",
      complete: policy.regulated
        ? requiredVerificationComplete
        : identity.verificationItems.length > 0,
      blocking: policy.regulated,
      href: "/professionista/profilo",
    },
  ];

  const blockingComplete = checks
    .filter((check) => check.blocking)
    .every((check) => check.complete);
  const score = Math.round(
    (checks.filter((check) => check.complete).length / checks.length) * 100,
  );

  return {
    score,
    checks,
    readyForActivation: blockingComplete,
    missingBlocking: checks.filter(
      (check) => check.blocking && !check.complete,
    ),
  };
}

export function profileReadiness(
  identity: ProfessionalIdentity | null,
  offerings: ServiceOffering[],
) {
  if (!identity) {
    return {
      score: 0,
      activeOfferings: 0,
      checks: [
        {
          id: "identity",
          label: "Profilo professionale",
          complete: false,
          blocking: true,
          href: "/professionista/onboarding",
        },
      ] satisfies ReadinessCheck[],
    };
  }

  const activeOrPending = offerings.filter((offering) =>
    ["active", "limited", "pending_verification"].includes(
      offering.activationStatus,
    ),
  );

  const checks: ReadinessCheck[] = [
    {
      id: "identity",
      label: "Identità professionale",
      complete:
        identity.displayName.trim().length > 0 &&
        identity.profession.trim().length > 0,
      blocking: true,
      href: "/professionista/profilo",
    },
    {
      id: "bio",
      label: "Presentazione",
      complete: identity.bio.trim().length >= 40,
      blocking: false,
      href: "/professionista/profilo",
    },
    {
      id: "coverage",
      label: "Aree generali o disponibilità online",
      complete:
        identity.generalAreas.length > 0 || identity.onlineAvailable,
      blocking: true,
      href: "/professionista/profilo",
    },
    {
      id: "languages",
      label: "Lingue di comunicazione",
      complete: identity.remoteCapabilities.languageSkills.length > 0,
      blocking: true,
      href: "/professionista/profilo",
    },
    {
      id: "services",
      label: "Almeno un servizio configurato",
      complete: activeOrPending.length > 0,
      blocking: true,
      href: "/professionista/servizi",
    },
    {
      id: "verification",
      label: "Almeno una verifica",
      complete: identity.verificationItems.length > 0,
      blocking: false,
      href: "/professionista/profilo",
    },
  ];

  return {
    score: Math.round(
      (checks.filter((check) => check.complete).length / checks.length) * 100,
    ),
    activeOfferings: activeOrPending.length,
    checks,
  };
}
