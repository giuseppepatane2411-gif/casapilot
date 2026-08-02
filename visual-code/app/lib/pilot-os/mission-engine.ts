import { getRequiredDocuments } from "@/lib/property-journey/constants";
import { getGoalPhaseWeights } from "@/lib/property-journey/progress-model";
import { getMissingDocuments } from "@/lib/property-journey/scoring";
import type { PropertyJourney } from "@/lib/property-journey/types";
import { DOCUMENT_PRIORITY, DOCUMENT_TIME_MINUTES } from "@/lib/pilot-os/knowledge";
import type {
  JourneyPilotMemory,
  PilotMission,
  PilotPriority,
} from "@/lib/pilot-os/types";

function priorityFromValue(value: number): PilotPriority {
  if (value >= 95) return "critical";
  if (value >= 80) return "high";
  if (value >= 60) return "medium";
  return "low";
}

function calculateDocumentScoreGain(
  journey: PropertyJourney,
  documentWeight: number,
) {
  const required = getRequiredDocuments(
    journey.operation,
    journey.property.type,
  );
  const totalWeight = required.reduce(
    (sum, document) => sum + document.weight,
    0,
  );
  const phaseWeight = getGoalPhaseWeights(journey.operation).documents;

  return totalWeight
    ? Math.max(
        1,
        Math.round((documentWeight / totalWeight) * phaseWeight * 0.9),
      )
    : 0;
}

function buildProfileMissions(journey: PropertyJourney): PilotMission[] {
  const missions: PilotMission[] = [];
  const href = `/dashboard/properties/${journey.id}#manage-property`;

  if (!journey.property.surface) {
    missions.push({
      id: "profile-surface",
      title: "Aggiungi la superficie dell’immobile",
      description:
        "Indica i metri quadrati per rendere più precisi percorso, annuncio e confronti futuri.",
      reason:
        "La superficie è uno dei dati essenziali per descrivere correttamente l’immobile.",
      estimatedMinutes: 2,
      scoreGain: 2,
      priority: "high",
      category: "profile",
      href,
      completed: false,
      actionLabel: "Completa il dato",
    });
  }

  if (!journey.property.occupancy) {
    missions.push({
      id: "profile-occupancy",
      title: "Indica la situazione dell’immobile",
      description:
        "Specifica se è libero, abitato dal proprietario o occupato da un inquilino.",
      reason:
        "La situazione attuale può cambiare documenti, tempi e strategia del percorso.",
      estimatedMinutes: 2,
      scoreGain: 1,
      priority: "high",
      category: "profile",
      href,
      completed: false,
      actionLabel: "Completa il dato",
    });
  }

  if (!journey.property.address || !journey.property.postalCode) {
    missions.push({
      id: "profile-location",
      title: "Completa l’indirizzo dell’immobile",
      description:
        "Aggiungi indirizzo e CAP per rendere la scheda utilizzabile nelle fasi successive.",
      reason:
        "Una posizione completa migliora documenti, annunci e servizi territoriali.",
      estimatedMinutes: 3,
      scoreGain: 2,
      priority: "high",
      category: "profile",
      href,
      completed: false,
      actionLabel: "Completa l’indirizzo",
    });
  }

  if (!journey.property.locationVerified) {
    missions.push({
      id: "profile-location-verified",
      title: "Conferma il punto esatto sulla mappa",
      description:
        "Controlla il segnaposto e conferma la posizione reale dell’immobile.",
      reason:
        "La posizione verificata sarà utile per annunci, servizi locali e future integrazioni.",
      estimatedMinutes: 2,
      scoreGain: 2,
      priority: "high",
      category: "profile",
      href,
      completed: false,
      actionLabel: "Verifica la posizione",
    });
  }

  return missions;
}

function buildDocumentMissions(journey: PropertyJourney): PilotMission[] {
  const documentMissions: PilotMission[] = getMissingDocuments(journey)
    .sort((a, b) => DOCUMENT_PRIORITY[b.id] - DOCUMENT_PRIORITY[a.id])
    .map((document) => {
      const priorityValue = DOCUMENT_PRIORITY[document.id];

      return {
        id: `document-${document.id}`,
        title: `Recupera ${document.shortTitle}`,
        description: `${document.description} Appena lo hai, Pilot aggiornerà immediatamente il percorso.`,
        reason:
          priorityValue >= 90
            ? "È un documento fondamentale per identificare e verificare correttamente l’immobile."
            : "Completarlo riduce i blocchi nelle fasi successive del percorso.",
        estimatedMinutes: DOCUMENT_TIME_MINUTES[document.id],
        scoreGain: calculateDocumentScoreGain(journey, document.weight),
        priority: priorityFromValue(priorityValue),
        category: "documents" as const,
        href: `/dashboard/properties/${journey.id}#documents`,
        documentId: document.id,
        completed: false,
        actionLabel: "Segna come disponibile",
      };
    });

  const hasCadastralSurvey = journey.documents.includes("cadastralSurvey");
  const missingCadastralReferences =
    !journey.property.cadastralSheet ||
    !journey.property.cadastralParcel ||
    !journey.property.cadastralSubaltern;

  if (hasCadastralSurvey && missingCadastralReferences) {
    documentMissions.push({
      id: "verification-cadastral-references",
      title: "Riporta i riferimenti della visura",
      description:
        "Dalla visura inserisci foglio, particella o mappale e subalterno nella scheda dell’immobile.",
      reason:
        "Collegare i riferimenti catastali ai documenti riduce errori e ambiguità nel fascicolo.",
      estimatedMinutes: 3,
      scoreGain: 4,
      priority: "medium",
      category: "verification",
      href: `/dashboard/properties/${journey.id}#manage-property`,
      completed: false,
      actionLabel: "Completa i dati catastali",
    });
  }

  return documentMissions;
}

function manualMission(
  mission: Omit<PilotMission, "completed" | "canCompleteManually">,
): PilotMission {
  return {
    ...mission,
    completed: false,
    canCompleteManually: true,
  };
}

function buildExecutionMissions(journey: PropertyJourney): PilotMission[] {
  if (journey.operation === "sale") {
    return [
      manualMission({
        id: "strategy-review",
        title: "Definisci prezzo e strategia di vendita",
        description:
          "Stabilisci il prezzo di partenza, il margine di trattativa e il modo in cui vuoi proporre l’immobile.",
        reason:
          "Una strategia chiara evita di pubblicare senza sapere come gestire prezzo e negoziazione.",
        estimatedMinutes: 15,
        scoreGain: 9,
        priority: "medium",
        category: "strategy",
        href: "/dashboard/pilot#pilot-chat",
        actionLabel: "Segna strategia definita",
      }),
      manualMission({
        id: "marketing-material",
        title: "Prepara il materiale per l’annuncio",
        description:
          "Raccogli fotografie, planimetria, punti di forza e informazioni essenziali da mostrare agli interessati.",
        reason:
          "Un annuncio completo nasce da materiale ordinato prima della pubblicazione.",
        estimatedMinutes: 25,
        scoreGain: 9,
        priority: "medium",
        category: "marketing",
        href: `/dashboard/properties/${journey.id}`,
        actionLabel: "Segna materiale pronto",
      }),
      manualMission({
        id: "sale-publish-listing",
        title: "Pubblica o distribuisci l’annuncio",
        description:
          "Porta l’immobile sui canali scelti e conserva una versione coerente delle informazioni pubblicate.",
        reason:
          "La fase commerciale inizia quando l’immobile è realmente visibile ai potenziali acquirenti.",
        estimatedMinutes: 20,
        scoreGain: 7,
        priority: "medium",
        category: "market",
        href: "/dashboard/pilot#pilot-chat",
        actionLabel: "Segna annuncio pubblicato",
      }),
      manualMission({
        id: "sale-manage-visits",
        title: "Organizza richieste e visite",
        description:
          "Raccogli i contatti, pianifica le visite e annota i riscontri ricevuti.",
        reason:
          "Un processo ordinato rende più semplice confrontare interesse reale e qualità delle richieste.",
        estimatedMinutes: 15,
        scoreGain: 7,
        priority: "medium",
        category: "market",
        href: "/dashboard/pilot#pilot-chat",
        actionLabel: "Segna fase visite completata",
      }),
      manualMission({
        id: "sale-review-offer",
        title: "Valuta la proposta ricevuta",
        description:
          "Controlla prezzo, condizioni, tempi e sostenibilità della proposta prima di accettarla.",
        reason:
          "Il valore di una proposta non dipende soltanto dalla cifra offerta.",
        estimatedMinutes: 20,
        scoreGain: 9,
        priority: "high",
        category: "closing",
        href: "/dashboard/pilot#pilot-chat",
        actionLabel: "Segna proposta valutata",
      }),
      manualMission({
        id: "sale-close-transaction",
        title: "Completa i passaggi conclusivi della vendita",
        description:
          "Coordina documenti, accordi e professionisti fino alla conclusione della compravendita.",
        reason:
          "La vendita è realmente completata solo quando anche i passaggi finali sono chiusi.",
        estimatedMinutes: 30,
        scoreGain: 9,
        priority: "high",
        category: "closing",
        href: "/dashboard/pilot#pilot-chat",
        actionLabel: "Segna vendita conclusa",
      }),
    ];
  }

  return [
    manualMission({
      id: "strategy-review",
      title: "Definisci tipo di locazione e canone",
      description:
        "Scegli durata, formula contrattuale, canone, deposito e condizioni principali.",
      reason:
        "La strategia di locazione determina annuncio, documenti e profilo dell’inquilino da cercare.",
      estimatedMinutes: 15,
      scoreGain: 10,
      priority: "medium",
      category: "strategy",
      href: "/dashboard/pilot#pilot-chat",
      actionLabel: "Segna strategia definita",
    }),
    manualMission({
      id: "marketing-material",
      title: "Prepara annuncio e criteri di selezione",
      description:
        "Raccogli fotografie, informazioni, condizioni e criteri con cui valuterai i candidati.",
      reason:
        "Un annuncio chiaro riduce richieste non adatte e rende più semplice confrontare i candidati.",
      estimatedMinutes: 25,
      scoreGain: 10,
      priority: "medium",
      category: "marketing",
      href: `/dashboard/properties/${journey.id}`,
      actionLabel: "Segna materiale pronto",
    }),
    manualMission({
      id: "rent-publish-listing",
      title: "Pubblica o distribuisci l’annuncio",
      description:
        "Porta l’immobile sui canali scelti mantenendo condizioni e informazioni coerenti.",
      reason:
        "La ricerca dell’inquilino inizia quando l’annuncio è realmente disponibile.",
      estimatedMinutes: 20,
      scoreGain: 8,
      priority: "medium",
      category: "market",
      href: "/dashboard/pilot#pilot-chat",
      actionLabel: "Segna annuncio pubblicato",
    }),
    manualMission({
      id: "rent-screen-applicants",
      title: "Valuta richieste e candidati",
      description:
        "Organizza visite e raccogli le informazioni necessarie per una prima valutazione.",
      reason:
        "Una selezione ordinata aiuta a ridurre rischi e decisioni affrettate.",
      estimatedMinutes: 20,
      scoreGain: 7,
      priority: "high",
      category: "market",
      href: "/dashboard/pilot#pilot-chat",
      actionLabel: "Segna candidati valutati",
    }),
    manualMission({
      id: "rent-select-tenant",
      title: "Scegli l’inquilino e conferma le condizioni",
      description:
        "Confronta i candidati e definisci con quello scelto condizioni, date e garanzie.",
      reason:
        "La scelta finale deve essere coerente con il tipo di locazione e con le condizioni stabilite.",
      estimatedMinutes: 20,
      scoreGain: 10,
      priority: "high",
      category: "closing",
      href: "/dashboard/pilot#pilot-chat",
      actionLabel: "Segna inquilino scelto",
    }),
    manualMission({
      id: "rent-sign-and-handover",
      title: "Firma, registra e consegna l’immobile",
      description:
        "Completa contratto, registrazione, verbale, chiavi e passaggi iniziali della locazione.",
      reason:
        "La locazione è operativa solo quando contratto e consegna sono stati completati.",
      estimatedMinutes: 30,
      scoreGain: 10,
      priority: "high",
      category: "closing",
      href: "/dashboard/pilot#pilot-chat",
      actionLabel: "Segna locazione avviata",
    }),
  ];
}

export function generateMissionQueue(
  journey: PropertyJourney,
  memory: JourneyPilotMemory,
): PilotMission[] {
  const phaseOrderedCandidates = [
    ...buildProfileMissions(journey),
    ...buildDocumentMissions(journey),
    ...buildExecutionMissions(journey),
  ];

  return phaseOrderedCandidates.filter(
    (mission) => !memory.completedMissionIds.includes(mission.id),
  );
}

export function generateMission(
  journey: PropertyJourney,
  memory: JourneyPilotMemory,
): PilotMission {
  const mission = generateMissionQueue(journey, memory)[0];

  if (mission) return mission;

  return {
    id: "journey-complete",
    title:
      journey.operation === "sale"
        ? "Percorso di vendita completato"
        : "Percorso di affitto completato",
    description:
      "Hai segnato come completate tutte le fasi previste per questo obiettivo.",
    reason:
      "Dati, documenti, preparazione e passaggi operativi risultano completati nel percorso.",
    estimatedMinutes: 1,
    scoreGain: 0,
    priority: "low",
    category: "closing",
    href: "/dashboard/pilot#pilot-chat",
    completed: true,
    actionLabel: "Apri Pilot",
  };
}
