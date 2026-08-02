import { getRequiredDocuments } from "@/lib/property-journey/constants";
import { getMissingDocuments } from "@/lib/property-journey/scoring";
import type { PilotContext } from "@/lib/pilot-os/types";

function normalize(value: string) {
  return value
    .toLocaleLowerCase("it-IT")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatList(items: string[]) {
  if (items.length === 0) return "nessuno";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} e ${items.at(-1)}`;
}

export function buildPilotWelcome(context: PilotContext) {
  return `Ho analizzato ${context.knownFacts} informazioni su ${context.journey.property.name}. La priorità adesso è “${context.mission.title}”. Posso spiegarti cosa manca, perché è importante oppure aiutarti a scegliere il prossimo passo.`;
}

export function answerPilotQuestion(
  question: string,
  context: PilotContext,
): string {
  const normalized = normalize(question);
  const missingDocuments = getMissingDocuments(context.journey);
  const requiredDocuments = getRequiredDocuments(
    context.journey.operation,
    context.journey.property.type,
  );

  if (
    normalized.includes("document") ||
    normalized.includes("manca") ||
    normalized.includes("checklist")
  ) {
    if (missingDocuments.length === 0) {
      return "La checklist documentale iniziale è completa. Il passo più utile ora è preparare il materiale dell’annuncio e rivedere la strategia prima della pubblicazione.";
    }

    return `Nel fascicolo risultano disponibili ${context.journey.documents.length} documenti su ${requiredDocuments.length}. Mancano: ${formatList(
      missingDocuments.map((document) => document.title),
    )}. Partirei da ${missingDocuments[0].title.toLowerCase()}, perché ha la priorità più alta.`;
  }

  if (
    normalized.includes("score") ||
    normalized.includes("punteggio") ||
    normalized.includes("salute")
  ) {
    return `Il percorso verso l’obiettivo è al ${context.goalProgress.overall}% e la prontezza attuale è ${context.readiness.overall}%. Il prossimo passo è “${context.mission.title}”: completandolo puoi avanzare di circa ${context.mission.scoreGain} punti percentuali nel percorso.`;
  }

  if (
    normalized.includes("risch") ||
    normalized.includes("proble") ||
    normalized.includes("bloc")
  ) {
    if (context.risks.length === 0) {
      return "Non vedo blocchi evidenti nella base attuale. Continuerei comunque con una missione alla volta e farei verificare i documenti decisivi da un professionista abilitato.";
    }

    return `Vedo ${context.risks.length} punti da tenere sotto controllo: ${formatList(
      context.risks.map((risk) => risk.title),
    )}. Il più importante è “${context.risks[0].title}”.`;
  }

  if (
    normalized.includes("prossim") ||
    normalized.includes("oggi") ||
    normalized.includes("fare") ||
    normalized.includes("iniz")
  ) {
    return `Oggi farei una cosa sola: ${context.mission.title.toLowerCase()}. Richiede circa ${context.mission.estimatedMinutes} minuti. È la priorità perché ${context.mission.reason.toLowerCase()}`;
  }

  if (
    normalized.includes("annuncio") ||
    normalized.includes("foto") ||
    normalized.includes("pubblic")
  ) {
    if (context.readiness.documents < 70) {
      return `Non pubblicherei ancora. La prontezza documentale è al ${context.readiness.documents}%: prima completerei i documenti principali, poi preparerei fotografie e punti di forza dell’immobile.`;
    }

    return "La base è abbastanza solida per iniziare a preparare l’annuncio. Raccogli fotografie, superficie, distribuzione degli spazi, stato dell’immobile e almeno tre punti di forza concreti. La pubblicazione dovrebbe arrivare dopo l’ultimo controllo dei documenti.";
  }

  if (
    normalized.includes("riass") ||
    normalized.includes("stato") ||
    normalized.includes("situazione")
  ) {
    return `${context.summary} La prontezza complessiva è ${context.readiness.overall}% (${context.readiness.label.toLowerCase()}). Sono presenti ${context.risks.length} attenzioni operative e ${context.missionQueue.length} missioni ancora aperte.`;
  }

  return `Per ${context.journey.property.name} terrei il focus su “${context.mission.title}”. Posso aiutarti soprattutto su documenti mancanti, avanzamento verso l’obiettivo, rischi, preparazione dell’annuncio e prossimo passo operativo.`;
}

export const PILOT_QUICK_QUESTIONS = [
  "Cosa devo fare oggi?",
  "Quali documenti mancano?",
  "Cosa blocca il percorso?",
  "Siamo pronti per l’annuncio?",
];
