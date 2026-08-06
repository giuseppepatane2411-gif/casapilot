import type { LeadRequest } from "./types";

export function calculateLeadScore(input: Pick<LeadRequest,"location"|"answers"|"urgency"|"budget"|"notes">) {
  let score = 30;
  if (input.location.trim().length > 3) score += 15;
  const values = Object.values(input.answers);
  score += Math.min(values.filter((value) => Array.isArray(value) ? value.length > 0 : String(value).trim().length > 0).length * 7, 28);
  if (input.urgency && input.urgency !== "Non ho una scadenza") score += 10;
  if (input.budget && input.budget !== "Da definire") score += 10;
  if (input.notes.trim().length > 20) score += 7;
  return Math.min(score, 100);
}

const email = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const phone = /(?:\+?39[\s.-]?)?(?:3\d{2}|0\d{1,3})[\s.-]?\d{3,4}[\s.-]?\d{3,4}/g;
const links = /(?:https?:\/\/|www\.)\S+/gi;
const whatsapp = /\b(?:whatsapp|wa\.me|telegram)\b/gi;

export function redactContactData(text: string) {
  let redacted = false;
  const replace = () => { redacted = true; return "[recapito protetto]"; };
  const body = text.replace(email, replace).replace(phone, replace).replace(links, replace).replace(whatsapp, replace);
  return { body, redacted };
}

export function leadQualityLabel(score: number) {
  if (score >= 80) return "Lead molto completa";
  if (score >= 60) return "Lead qualificata";
  return "Da approfondire";
}
