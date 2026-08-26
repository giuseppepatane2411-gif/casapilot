import type {
  GuimmiaAppointmentType,
  GuimmiaScheduleProposal,
  GuimmiaScheduleSnapshot,
} from "@/lib/guimmia/operations/scheduling-types";

type ScheduleError = { ok: false; message: string };

async function parsed<T>(response: Response) {
  const value = (await response.json()) as T | ScheduleError;
  if (!response.ok || !(value as { ok?: boolean }).ok) {
    throw new Error(
      (value as ScheduleError).message ||
        "Guimmia non è riuscita ad aggiornare l’agenda.",
    );
  }
  return value as T;
}

export function looksLikeGuimmiaSchedulingMessage(message: string) {
  return /\b(disponibil|appuntament|prenot|visita|notaio|geometr|check[ -]?(?:in|out)|luned|marted|mercoled|gioved|venerd|sabato|domenica|ore\s+\d{1,2})/i.test(
    message,
  );
}

export async function interpretGuimmiaSchedule(input: {
  message: string;
  draftId: string;
  timezone: string;
}) {
  const response = await fetch("/api/guimmia/scheduling/interpret", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    cache: "no-store",
  });
  return parsed<{ ok: true; proposal: GuimmiaScheduleProposal }>(response);
}

export async function listGuimmiaSchedule(draftId: string) {
  const response = await fetch(
    `/api/guimmia/scheduling?draftId=${encodeURIComponent(draftId)}`,
    { cache: "no-store" },
  );
  return parsed<GuimmiaScheduleSnapshot>(response);
}

export async function mutateGuimmiaSchedule(input:
  | {
      action: "ADD_AVAILABILITY";
      draftId: string;
      startsAt: string;
      endsAt: string;
      timezone: string;
      eventType: GuimmiaAppointmentType;
      source: "CHAT" | "WEB" | "VOICE" | "PORTAL";
    }
  | {
      action: "PROPOSE_APPOINTMENT";
      draftId: string;
      startsAt: string;
      endsAt: string;
      timezone: string;
      eventType: GuimmiaAppointmentType;
      title: string;
      source: "CHAT" | "WEB" | "VOICE" | "PORTAL";
    }
  | { action: "CONFIRM_APPOINTMENT" | "CANCEL_APPOINTMENT"; appointmentId: string }
) {
  const response = await fetch("/api/guimmia/scheduling", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    cache: "no-store",
  });
  return parsed<GuimmiaScheduleSnapshot>(response);
}
