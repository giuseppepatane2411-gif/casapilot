import type {
  GuimmiaBrainRequestKind,
  GuimmiaBrainError,
  GuimmiaBrainRequest,
  GuimmiaBrainSuccess,
} from "@/lib/guimmia/openai/brain-types";

export function classifyGuimmiaBrainRequest(
  text: string,
): GuimmiaBrainRequestKind {
  const value = text.toLocaleLowerCase("it-IT");
  if (/(messaggio|email|e-mail|scriv|rispond|comunicaz|lettera)/.test(value)) {
    return "COMMUNICATION_DRAFT";
  }
  if (/(document|visura|planimetr|rogito|atto|ape|conform|catast|manca)/.test(value)) {
    return "DOCUMENT_CHECK";
  }
  if (/(prossim|passaggio|cosa devo fare|come proced|adesso|ora cosa)/.test(value)) {
    return "NEXT_ACTION";
  }
  return "GUIDANCE";
}

export function formatGuimmiaBrainAnswer(result: GuimmiaBrainSuccess) {
  const { answer } = result;
  const sections = [answer.reply];

  if (answer.missingDocuments.length) {
    sections.push(`Documenti o dati da verificare: ${answer.missingDocuments.join(", ")}.`);
  }
  if (answer.nextAction) {
    sections.push(`Prossimo passo: ${answer.nextAction}`);
  }
  if (answer.followUpQuestions.length) {
    sections.push(answer.followUpQuestions.join("\n"));
  }
  if (answer.warnings.length) {
    sections.push(`Attenzione: ${answer.warnings.join(" ")}`);
  }
  if (answer.handoffRequired && answer.handoffReason) {
    sections.push(`Controllo umano previsto: ${answer.handoffReason}`);
  }

  return sections.filter(Boolean).join("\n\n");
}

export async function requestGuimmiaBrain(
  input: GuimmiaBrainRequest,
): Promise<GuimmiaBrainSuccess> {
  const response = await fetch("/api/guimmia/brain", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
    cache: "no-store",
  });
  const payload = (await response.json()) as
    | GuimmiaBrainSuccess
    | GuimmiaBrainError;

  if (!response.ok || !payload.ok) {
    throw new Error(payload.ok ? "brain_guidance_failed" : payload.error);
  }

  return payload;
}
