"use client";

import {
  buildPropertyJourney,
  normalizePropertyJourney,
  parsePropertyJourney,
} from "@/lib/property-journey/model";
import {
  deleteJourney,
  readActiveJourneyId,
  readJourneys,
  replaceJourneys,
  upsertJourney,
} from "@/lib/property-journey/storage";
import type {
  DocumentKey,
  OperationType,
  PropertyJourney,
  WizardData,
} from "@/lib/property-journey/types";

const JOURNEY_API = "/api/owner/journeys";

type JourneyListPayload = {
  journeys?: unknown;
  userId?: unknown;
  message?: unknown;
};

type JourneyPayload = {
  journey?: unknown;
  userId?: unknown;
  message?: unknown;
};

function messageFromPayload(payload: unknown, fallback: string) {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }
  return fallback;
}

async function responsePayload(response: Response) {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

async function request(input: string, init?: RequestInit) {
  const response = await fetch(input, {
    ...init,
    cache: "no-store",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const payload = await responsePayload(response);

  if (!response.ok) {
    throw new Error(
      messageFromPayload(
        payload,
        response.status === 401
          ? "La sessione è scaduta. Accedi di nuovo e riprova."
          : "Guimmia non riesce a raggiungere l’archivio in questo momento.",
      ),
    );
  }

  return payload;
}

function parseJourneyPayload(payload: unknown) {
  const parsed = payload as JourneyPayload | null;
  const journey = parsePropertyJourney(parsed?.journey);
  if (!journey) {
    throw new Error("Guimmia ha ricevuto una pratica non valida dal server.");
  }
  return journey;
}

function localJourney(journeyId: string) {
  const journey = readJourneys().find((item) => item.id === journeyId);
  if (!journey) {
    throw new Error("Immobile non trovato. Ricarica la pagina e riprova.");
  }
  return journey;
}

export async function loadCloudJourneys() {
  const payload = (await request(JOURNEY_API)) as JourneyListPayload;
  if (!Array.isArray(payload.journeys)) {
    throw new Error("Guimmia non ha ricevuto un elenco immobili valido.");
  }

  const journeys = payload.journeys
    .map(parsePropertyJourney)
    .filter((journey): journey is PropertyJourney => Boolean(journey));
  const storedActiveId = readActiveJourneyId();
  replaceJourneys(journeys, storedActiveId);
  return journeys;
}

export async function createCloudJourney(
  data: WizardData,
  journeyId?: string,
  conversationId?: string,
) {
  const draftJourney = buildPropertyJourney(data, { id: journeyId });
  const payload = await request(JOURNEY_API, {
    method: "POST",
    body: JSON.stringify({ journey: draftJourney, conversationId }),
  });
  const journey = parseJourneyPayload(payload);
  upsertJourney(journey);
  return journey;
}

export async function saveCloudJourney(journey: PropertyJourney) {
  const nextJourney = normalizePropertyJourney({
    ...journey,
    updatedAt: new Date().toISOString(),
  });
  const payload = await request(JOURNEY_API, {
    method: "PATCH",
    body: JSON.stringify({ journey: nextJourney }),
  });
  const savedJourney = parseJourneyPayload(payload);
  upsertJourney(savedJourney);
  return savedJourney;
}

export async function updateCloudJourneyDocuments(
  journeyId: string,
  documents: DocumentKey[],
) {
  const journey = localJourney(journeyId);
  return saveCloudJourney({
    ...journey,
    documents: [...new Set(documents)],
  });
}

export async function updateCloudJourneyOperation(
  journeyId: string,
  operation: OperationType,
) {
  const journey = localJourney(journeyId);
  return saveCloudJourney({ ...journey, operation });
}

export async function updateCloudJourneyProperty(
  journeyId: string,
  property: Partial<PropertyJourney["property"]>,
) {
  const journey = localJourney(journeyId);
  return saveCloudJourney({
    ...journey,
    property: {
      ...journey.property,
      ...property,
    },
  });
}

export async function importCloudJourneys(journeys: PropertyJourney[]) {
  const imported: PropertyJourney[] = [];
  for (const candidate of journeys) {
    const journey = parsePropertyJourney(candidate);
    if (!journey) continue;
    const payload = await request(JOURNEY_API, {
      method: "POST",
      body: JSON.stringify({ journey }),
    });
    imported.push(parseJourneyPayload(payload));
  }

  if (imported.length === 0 && journeys.length > 0) {
    throw new Error("Il backup non contiene pratiche compatibili.");
  }

  replaceJourneys(imported, imported[0]?.id ?? null);
  return imported;
}

export async function deleteCloudJourney(journeyId: string) {
  await request(`${JOURNEY_API}?id=${encodeURIComponent(journeyId)}`, {
    method: "DELETE",
  });
  return deleteJourney(journeyId);
}
