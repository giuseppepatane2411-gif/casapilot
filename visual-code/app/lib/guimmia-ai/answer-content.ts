import type { GuimmiaAIConversation, GuimmiaAIMessage } from "./types";

type AnswerReference = { type: string; code: string; title: string };
export type AnswerMetadata = {
  title: string;
  reply: string;
  nextAction: string;
  missingDocuments: string[];
  warnings: string[];
  followUpQuestions: string[];
  references: AnswerReference[];
  humanReviewRequired: boolean;
  handoffReason: string;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function textList(value: unknown, limit: number) {
  return Array.isArray(value) ? value.map(text).filter(Boolean).slice(0, limit) : [];
}

export function answerMetadata(message: GuimmiaAIMessage): AnswerMetadata {
  const metadata = message.metadata ?? {};
  const references = Array.isArray(metadata.references)
    ? metadata.references.flatMap((item): AnswerReference[] => {
        if (!item || typeof item !== "object" || Array.isArray(item)) return [];
        const source = item as Record<string, unknown>;
        const title = text(source.title);
        const code = text(source.code);
        return title && code ? [{ title, code, type: text(source.type) || "RIFERIMENTO" }] : [];
      }).slice(0, 8)
    : [];
  return {
    title: text(metadata.answerTitle),
    reply: text(metadata.answerReply) || message.content,
    nextAction: text(metadata.nextAction),
    missingDocuments: textList(metadata.missingDocuments, 8),
    warnings: textList(metadata.warnings, 5),
    followUpQuestions: textList(metadata.followUpQuestions, 3),
    references,
    humanReviewRequired: metadata.humanReviewRequired === true,
    handoffReason: text(metadata.handoffReason),
  };
}

const professionalNote = "Contenuto informativo di Guimmia. Bozze, controlli e decisioni immobiliari richiedono le verifiche di un professionista qualificato; questo testo non certifica la conformità di un immobile o la validità di un contratto.";

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Data non disponibile" : date.toLocaleString("it-IT", { timeZone: "Europe/Rome" }) + " (ora italiana)";
}

export function answerText(message: GuimmiaAIMessage, notSaved = false) {
  const answer = answerMetadata(message);
  const sections = ["Guimmia", dateLabel(message.created_at)];
  if (notSaved) sections.push("Copia della risposta visibile: salvataggio nell’account non ancora confermato.");
  sections.push(answer.title, answer.reply);
  if (answer.nextAction) sections.push("PROSSIMO PASSO\n" + answer.nextAction);
  if (answer.missingDocuments.length) sections.push("DOCUMENTI O DATI DA VERIFICARE\n" + answer.missingDocuments.map((item) => "• " + item).join("\n"));
  if (answer.followUpQuestions.length) sections.push("PER PRECISARE IL CASO\n" + answer.followUpQuestions.map((item, i) => `${i + 1}. ${item}`).join("\n"));
  if (answer.warnings.length) sections.push("ATTENZIONE\n" + answer.warnings.map((item) => "• " + item).join("\n"));
  if (answer.humanReviewRequired) sections.push("Verifica professionale consigliata.");
  if (answer.handoffReason) sections.push(answer.handoffReason);
  if (answer.references.length) sections.push("RIFERIMENTI DELLA BASE GUIMMIA\n" + answer.references.map((item) => `• ${item.title} · ${item.code}`).join("\n"));
  sections.push(professionalNote);
  return sections.filter(Boolean).join("\n\n");
}

export function conversationText(conversation: GuimmiaAIConversation, messages: GuimmiaAIMessage[], pendingMessageId?: string) {
  const ownedMessages = messages.filter((item) => item.conversation_id === conversation.id);
  const sections = ["GUIMMIA — CONVERSAZIONE", conversation.title, `Creata: ${dateLabel(conversation.created_at)}`];
  for (const message of ownedMessages) {
    sections.push(message.role === "user"
      ? `TU · ${dateLabel(message.created_at)}\n\n${message.content}`
      : answerText(message, message.id === pendingMessageId));
  }
  if (ownedMessages.at(-1)?.role === "user") sections.push("La risposta all’ultima domanda non è ancora presente in questa conversazione.");
  return sections.join("\n\n────────────────────────\n\n") + "\n";
}

export function exportFileName(title: string) {
  const slug = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70).replace(/-+$/g, "");
  return `guimmia-${slug || "conversazione"}.txt`;
}

// Only user-requested local text downloads; no HTML, remote upload or model call.
export function downloadText(content: string, fileName: string) {
  const blob = new Blob(["\uFEFF", content.replace(/\r?\n/g, "\r\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.hidden = true;
  document.body.appendChild(anchor);
  try { anchor.click(); }
  finally {
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
