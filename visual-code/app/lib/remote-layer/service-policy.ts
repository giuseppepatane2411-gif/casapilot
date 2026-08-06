import { findService } from "@/lib/professionals/catalog";
import type {
  DocumentHandlingMode,
  RemoteFeasibility,
  RemoteOperationPlan,
  RemoteWorkflowStep,
  ServiceRemoteConfiguration,
  SignatureMode,
} from "./types";

interface RemoteServicePolicy {
  feasibility: RemoteFeasibility;
  inspectionRequired: boolean;
  ownerPresenceRequirement: "never" | "sometimes" | "required";
  localContactSufficient: boolean;
  delegationSupported: boolean;
  photoReportRecommended: boolean;
  videoCallRecommended: boolean;
  documentHandling: DocumentHandlingMode;
  signatureMode: SignatureMode;
  ownerActions: string[];
  steps: RemoteWorkflowStep[];
}

const BASE_STEPS: RemoteWorkflowStep[] = [
  {
    id: "confirm_request",
    title: "Conferma della richiesta",
    description: "Pilot riassume obiettivo, immobile, scadenza e documenti disponibili.",
    responsible: "pilot",
    ownerPresenceRequired: false,
    canUseDelegation: false,
  },
  {
    id: "professional_review",
    title: "Revisione del professionista",
    description: "Il professionista controlla i dati e segnala ciò che manca.",
    responsible: "professional",
    ownerPresenceRequired: false,
    canUseDelegation: false,
  },
];

function categoryDefault(categoryId: string): Omit<RemoteServicePolicy, "steps"> {
  if (categoryId === "legale-notarile-fiscale") {
    return {
      feasibility: "mostly_remote",
      inspectionRequired: false,
      ownerPresenceRequirement: "sometimes",
      localContactSufficient: true,
      delegationSupported: true,
      photoReportRecommended: false,
      videoCallRecommended: true,
      documentHandling: "digital_and_originals",
      signatureMode: "delegation_possible",
      ownerActions: ["Caricare i documenti disponibili", "Confermare identità e titolarità"],
    };
  }

  if (categoryId === "finanza-assicurazioni-amministrazione") {
    return {
      feasibility: "mostly_remote",
      inspectionRequired: false,
      ownerPresenceRequirement: "never",
      localContactSufficient: true,
      delegationSupported: true,
      photoReportRecommended: false,
      videoCallRecommended: true,
      documentHandling: "digital",
      signatureMode: "digital_possible",
      ownerActions: ["Caricare i documenti economici richiesti"],
    };
  }

  if (categoryId === "documenti-conformita") {
    return {
      feasibility: "remote_coordination",
      inspectionRequired: true,
      ownerPresenceRequirement: "sometimes",
      localContactSufficient: true,
      delegationSupported: true,
      photoReportRecommended: true,
      videoCallRecommended: true,
      documentHandling: "digital_and_originals",
      signatureMode: "delegation_possible",
      ownerActions: ["Fornire accesso all'immobile", "Caricare i documenti disponibili"],
    };
  }

  if (categoryId === "vendita-intermediazione" || categoryId === "affitto-gestione") {
    return {
      feasibility: "remote_coordination",
      inspectionRequired: true,
      ownerPresenceRequirement: "sometimes",
      localContactSufficient: true,
      delegationSupported: true,
      photoReportRecommended: true,
      videoCallRecommended: true,
      documentHandling: "digital_and_originals",
      signatureMode: "digital_possible",
      ownerActions: ["Confermare le decisioni principali", "Garantire accesso all'immobile"],
    };
  }

  if (categoryId === "presentazione-valorizzazione") {
    return {
      feasibility: "remote_coordination",
      inspectionRequired: true,
      ownerPresenceRequirement: "never",
      localContactSufficient: true,
      delegationSupported: false,
      photoReportRecommended: true,
      videoCallRecommended: false,
      documentHandling: "not_applicable",
      signatureMode: "not_required",
      ownerActions: ["Garantire accesso all'immobile"],
    };
  }

  return {
    feasibility: "local_only",
    inspectionRequired: true,
    ownerPresenceRequirement: "sometimes",
    localContactSufficient: true,
    delegationSupported: true,
    photoReportRecommended: true,
    videoCallRecommended: false,
    documentHandling: "not_applicable",
    signatureMode: "not_required",
    ownerActions: ["Garantire accesso all'immobile", "Approvare il preventivo e le varianti"],
  };
}

const FULLY_REMOTE_IDS = new Set([
  "visura-catastale",
  "planimetria-catastale",
  "ispezione-ipotecaria",
  "analisi-mercato",
  "valutazione-immobiliare",
  "contratto-locazione",
  "consulenza-legale",
  "consulenza-fiscale",
  "consulenza-mutuo",
  "confronto-assicurazioni",
]);

const OWNER_PRESENCE_IDS = new Set([
  "atto-notarile",
  "rogito",
  "firma-notarile",
]);

const PHYSICAL_LOCAL_IDS = new Set([
  "pulizia-profonda",
  "sgombero",
  "trasloco",
  "ristrutturazione-completa",
  "impianto-elettrico",
  "impianto-idraulico",
  "riparazione-tetto",
  "tinteggiatura",
]);

export function getRemoteServicePolicy(serviceId: string): RemoteServicePolicy {
  const service = findService(serviceId);
  const base = categoryDefault(service?.categoryId ?? "");

  if (FULLY_REMOTE_IDS.has(serviceId)) {
    return {
      ...base,
      feasibility: "fully_remote",
      inspectionRequired: false,
      ownerPresenceRequirement: "never",
      localContactSufficient: true,
      photoReportRecommended: false,
      documentHandling: "digital",
      signatureMode: "digital_possible",
      steps: [
        ...BASE_STEPS,
        {
          id: "digital_execution",
          title: "Esecuzione digitale",
          description: "Il professionista svolge la procedura senza accesso fisico all'immobile.",
          responsible: "professional",
          ownerPresenceRequired: false,
          canUseDelegation: true,
        },
        {
          id: "delivery",
          title: "Consegna e spiegazione",
          description: "Documento o risultato vengono consegnati con spiegazione di Pilot.",
          responsible: "pilot",
          ownerPresenceRequired: false,
          canUseDelegation: false,
        },
      ],
    };
  }

  if (OWNER_PRESENCE_IDS.has(serviceId)) {
    return {
      ...base,
      feasibility: "mostly_remote",
      ownerPresenceRequirement: "required",
      signatureMode: "in_person_required",
      localContactSufficient: false,
      steps: [
        ...BASE_STEPS,
        {
          id: "identity_check",
          title: "Verifica identità e documenti",
          description: "La documentazione viene controllata prima dell'appuntamento.",
          responsible: "professional",
          ownerPresenceRequired: false,
          canUseDelegation: true,
        },
        {
          id: "signature",
          title: "Firma o presenza personale",
          description: "Il professionista conferma se è possibile utilizzare una procura.",
          responsible: "owner",
          ownerPresenceRequired: true,
          canUseDelegation: true,
        },
      ],
    };
  }

  if (PHYSICAL_LOCAL_IDS.has(serviceId)) {
    return {
      ...base,
      feasibility: "remote_coordination",
      ownerPresenceRequirement: "never",
      localContactSufficient: true,
      steps: [
        ...BASE_STEPS,
        {
          id: "access",
          title: "Accesso all'immobile",
          description: "Il proprietario o un referente locale organizza chiavi e accesso.",
          responsible: "local_contact",
          ownerPresenceRequired: false,
          canUseDelegation: true,
        },
        {
          id: "work",
          title: "Intervento sul posto",
          description: "Il professionista esegue il lavoro e documenta l'avanzamento.",
          responsible: "professional",
          ownerPresenceRequired: false,
          canUseDelegation: true,
        },
        {
          id: "report",
          title: "Report finale",
          description: "Foto, note e risultato vengono condivisi dentro CasaPilot.",
          responsible: "professional",
          ownerPresenceRequired: false,
          canUseDelegation: false,
        },
      ],
    };
  }

  return {
    ...base,
    steps: [
      ...BASE_STEPS,
      {
        id: "inspection",
        title: base.inspectionRequired ? "Sopralluogo o accesso" : "Analisi della pratica",
        description: base.inspectionRequired
          ? "Il professionista accede all'immobile; il proprietario può essere sostituito da un referente locale quando consentito."
          : "Il professionista analizza documenti e informazioni disponibili.",
        responsible: "professional",
        ownerPresenceRequired: base.ownerPresenceRequirement === "required",
        canUseDelegation: base.delegationSupported,
      },
      {
        id: "result",
        title: "Consegna del risultato",
        description: "Pilot riepiloga il risultato e indica la decisione successiva.",
        responsible: "pilot",
        ownerPresenceRequired: false,
        canUseDelegation: false,
      },
    ],
  };
}

export function mergeRemoteConfiguration(
  serviceId: string,
  configuration?: Partial<ServiceRemoteConfiguration>,
): ServiceRemoteConfiguration {
  const policy = getRemoteServicePolicy(serviceId);
  return {
    remoteExecutionLevel:
      configuration?.remoteExecutionLevel ??
      (policy.feasibility === "fully_remote"
        ? "fully_remote"
        : policy.feasibility === "mostly_remote"
          ? "mostly_remote"
          : policy.feasibility === "remote_coordination"
            ? "consultation_only"
            : "none"),
    ownerPresenceRequirement:
      configuration?.ownerPresenceRequirement ?? policy.ownerPresenceRequirement,
    inspectionRequired: configuration?.inspectionRequired ?? policy.inspectionRequired,
    delegationSupported: configuration?.delegationSupported ?? policy.delegationSupported,
    photoReportAvailable:
      configuration?.photoReportAvailable ?? policy.photoReportRecommended,
    videoCallAvailable:
      configuration?.videoCallAvailable ?? policy.videoCallRecommended,
    remoteFeasibility: configuration?.remoteFeasibility ?? policy.feasibility,
    documentHandling: configuration?.documentHandling ?? policy.documentHandling,
    signatureMode: configuration?.signatureMode ?? policy.signatureMode,
    localContactSufficient:
      configuration?.localContactSufficient ?? policy.localContactSufficient,
    ownerActionRequired: configuration?.ownerActionRequired ?? policy.ownerActions,
    workflowSteps: configuration?.workflowSteps ?? policy.steps,
    reportFrequency: configuration?.reportFrequency ?? "on_milestone",
  };
}

export function buildRemoteOperationPlan({
  leadId,
  serviceId,
  ownerCanAttend,
  localContactAvailable,
  delegationAvailable,
}: {
  leadId: string;
  serviceId: string;
  ownerCanAttend: boolean;
  localContactAvailable: boolean;
  delegationAvailable: boolean;
}): RemoteOperationPlan {
  const policy = getRemoteServicePolicy(serviceId);
  const warnings: string[] = [];

  if (
    policy.ownerPresenceRequirement === "required" &&
    !ownerCanAttend &&
    !(delegationAvailable && policy.delegationSupported)
  ) {
    warnings.push(
      "Il servizio può richiedere presenza personale oppure una procura valida.",
    );
  }

  if (
    policy.inspectionRequired &&
    !ownerCanAttend &&
    !localContactAvailable &&
    !policy.localContactSufficient
  ) {
    warnings.push("Serve definire chi consentirà l'accesso all'immobile.");
  }

  return {
    leadId,
    serviceId,
    feasibility: policy.feasibility,
    summary:
      policy.feasibility === "fully_remote"
        ? "Il servizio può essere gestito completamente a distanza."
        : policy.feasibility === "mostly_remote"
          ? "La maggior parte del servizio può essere gestita a distanza."
          : policy.feasibility === "remote_coordination"
            ? "Il proprietario può coordinare il servizio a distanza, ma è previsto un intervento sul posto."
            : "Il servizio richiede principalmente attività sul posto.",
    ownerPresenceNeeded: policy.ownerPresenceRequirement === "required",
    localContactUseful: policy.inspectionRequired,
    delegationPossible: policy.delegationSupported,
    inspectionRequired: policy.inspectionRequired,
    signatureMode: policy.signatureMode,
    documentHandling: policy.documentHandling,
    steps: policy.steps,
    warnings,
  };
}
