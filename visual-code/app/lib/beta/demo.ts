import { DEMO_JOURNEY_IDS } from "@/lib/beta/constants";
import {
  attachJourneyToActiveSession,
  markDemoCreated,
  trackBetaEvent,
} from "@/lib/beta/storage";
import type { BetaScenario } from "@/lib/beta/types";
import {
  addPilotTimelineEvent,
  createPilotMessage,
  savePilotMessages,
} from "@/lib/pilot-os/store";
import { calculateJourneyMetrics } from "@/lib/property-journey/scoring";
import {
  readJourneys,
  setActiveJourneyId,
  upsertJourney,
} from "@/lib/property-journey/storage";
import type {
  PropertyJourney,
  WizardData,
} from "@/lib/property-journey/types";

export type DemoScenarioDefinition = {
  id: BetaScenario;
  eyebrow: string;
  title: string;
  description: string;
  outcome: string;
  duration: string;
  data: WizardData;
  assistantMessage: string;
  timeline: Array<{
    id: string;
    title: string;
    description: string;
    type: "created" | "document";
  }>;
};

export const DEMO_SCENARIOS: DemoScenarioDefinition[] = [
  {
    id: "sale",
    eyebrow: "Vendita",
    title: "Voglio vendere un appartamento",
    description:
      "Scopri come Pilot ordina documenti, rischi e prima missione prima di pubblicare l’annuncio.",
    outcome: "Prima missione in meno di 60 secondi",
    duration: "3 minuti",
    data: {
      operation: "sale",
      propertyType: "apartment",
      propertyName: "Appartamento demo a Milano",
      surface: "82",
      occupancy: "owner",
      country: "Italia",
      city: "Milano",
      province: "MI",
      address: "Via della Beta 24",
      postalCode: "20121",
      documents: ["ownership", "cadastralSurvey", "condominium"],
    },
    assistantMessage:
      "Ho analizzato la vendita. La priorità è recuperare la planimetria catastale: aumenta subito la prontezza e riduce il rischio di scoprire difformità troppo tardi.",
    timeline: [
      {
        id: "sale-created",
        title: "Percorso vendita creato",
        description: "CasaPilot ha ordinato dati e documenti iniziali.",
        type: "created",
      },
      {
        id: "sale-survey",
        title: "Visura catastale disponibile",
        description: "I principali dati catastali risultano già raccolti.",
        type: "document",
      },
    ],
  },
  {
    id: "rent",
    eyebrow: "Affitto",
    title: "Voglio mettere a reddito un immobile",
    description:
      "Prova un percorso che parte dalla documentazione e arriva alla preparazione del contratto.",
    outcome: "Checklist diversa dalla vendita",
    duration: "3 minuti",
    data: {
      operation: "rent",
      propertyType: "apartment",
      propertyName: "Bilocale demo a Torino",
      surface: "58",
      occupancy: "free",
      country: "Italia",
      city: "Torino",
      province: "TO",
      address: "Corso Test 18",
      postalCode: "10121",
      documents: ["ownership", "cadastralPlan", "energyCertificate"],
    },
    assistantMessage:
      "La pratica è già ben avviata. Ora conviene preparare una bozza del contratto coerente con la durata e il profilo dell’inquilino, prima di pubblicare l’annuncio.",
    timeline: [
      {
        id: "rent-created",
        title: "Percorso affitto creato",
        description: "Pilot ha adattato la checklist alla locazione.",
        type: "created",
      },
      {
        id: "rent-ape",
        title: "APE disponibile",
        description: "La classe energetica può essere indicata nell’annuncio.",
        type: "document",
      },
    ],
  },
  {
    id: "inheritance",
    eyebrow: "Immobile ereditato",
    title: "Ho ereditato una casa e non so da dove iniziare",
    description:
      "Guarda come CasaPilot trasforma una situazione confusa in una sequenza di verifiche comprensibili.",
    outcome: "Riduzione della confusione iniziale",
    duration: "4 minuti",
    data: {
      operation: "sale",
      propertyType: "house",
      propertyName: "Casa ereditata demo a Catania",
      surface: "126",
      occupancy: "other",
      country: "Italia",
      city: "Catania",
      province: "CT",
      address: "Via Esempio 7",
      postalCode: "95124",
      documents: ["ownership"],
    },
    assistantMessage:
      "Partiamo senza sovraccaricarti: la prima verifica utile è la visura catastale aggiornata. Ci aiuterà a controllare intestazione e identificativi prima di affrontare gli altri documenti.",
    timeline: [
      {
        id: "inheritance-created",
        title: "Pratica ereditata organizzata",
        description: "Pilot ha trasformato i dati iniziali in una sequenza di priorità.",
        type: "created",
      },
      {
        id: "inheritance-origin",
        title: "Provenienza indicata",
        description: "L’atto o la successione risultano disponibili come punto di partenza.",
        type: "document",
      },
    ],
  },
];

function buildDemoJourney(scenario: DemoScenarioDefinition): PropertyJourney {
  const now = new Date().toISOString();
  const data = scenario.data;

  return {
    version: 1,
    id: DEMO_JOURNEY_IDS[scenario.id],
    status: "active",
    createdAt: now,
    updatedAt: now,
    operation: data.operation === "rent" ? "rent" : "sale",
    property: {
      type: data.propertyType || "apartment",
      name: data.propertyName,
      surface: data.surface ? Number(data.surface) : null,
      occupancy: data.occupancy || null,
      country: data.country,
      city: data.city,
      province: data.province,
      address: data.address,
      postalCode: data.postalCode,
    },
    documents: data.documents,
    ...calculateJourneyMetrics(data),
  };
}

function seedDemoPilotMemory(scenario: DemoScenarioDefinition) {
  const journeyId = DEMO_JOURNEY_IDS[scenario.id];

  for (const event of scenario.timeline) {
    addPilotTimelineEvent(journeyId, event);
  }

  savePilotMessages(journeyId, [
    createPilotMessage("assistant", scenario.assistantMessage),
  ]);
}

export function seedDemoScenario(scenarioId: BetaScenario) {
  const scenario =
    DEMO_SCENARIOS.find((item) => item.id === scenarioId) ?? DEMO_SCENARIOS[0];
  const journeyId = DEMO_JOURNEY_IDS[scenario.id];
  const existing = readJourneys().find((journey) => journey.id === journeyId);

  if (existing) {
    setActiveJourneyId(existing.id);
    seedDemoPilotMemory(scenario);
    markDemoCreated(existing.id);
    attachJourneyToActiveSession(existing.id);
    trackBetaEvent("scenario-opened", {
      journeyId: existing.id,
      metadata: { scenario: scenario.id },
    });
    return existing;
  }

  const journey = buildDemoJourney(scenario);
  upsertJourney(journey);
  seedDemoPilotMemory(scenario);
  markDemoCreated(journey.id);
  attachJourneyToActiveSession(journey.id);
  trackBetaEvent("scenario-opened", {
    journeyId: journey.id,
    metadata: { scenario: scenario.id },
  });
  return journey;
}

export function seedDemoJourney() {
  return seedDemoScenario("sale");
}
