export const GUIMMIA_APPOINTMENT_TYPES = [
  "VISITA_IMMOBILE",
  "SOPRALLUOGO_GEOMETRA",
  "APPUNTAMENTO_NOTAIO",
  "FOTO_VIDEO",
  "CONSEGNA_CHIAVI",
  "CHECK_IN",
  "CHECK_OUT",
  "ALTRO",
] as const;

export type GuimmiaAppointmentType =
  (typeof GUIMMIA_APPOINTMENT_TYPES)[number];

export const GUIMMIA_APPOINTMENT_LABELS: Record<
  GuimmiaAppointmentType,
  string
> = {
  VISITA_IMMOBILE: "Visita all’immobile",
  SOPRALLUOGO_GEOMETRA: "Sopralluogo del geometra",
  APPUNTAMENTO_NOTAIO: "Appuntamento con il notaio",
  FOTO_VIDEO: "Servizio foto e video",
  CONSEGNA_CHIAVI: "Consegna chiavi",
  CHECK_IN: "Check-in",
  CHECK_OUT: "Check-out",
  ALTRO: "Altro appuntamento",
};

export type GuimmiaAvailabilityWindow = {
  id: string;
  draftId: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  allowedEventTypes: GuimmiaAppointmentType[];
  status: "ACTIVE" | "CANCELLED";
  source: "CHAT" | "WEB" | "VOICE" | "PORTAL";
};

export type GuimmiaAppointment = {
  id: string;
  draftId: string;
  eventType: GuimmiaAppointmentType;
  startsAt: string;
  endsAt: string;
  timezone: string;
  status: "PENDING_OWNER_CONFIRMATION" | "CONFIRMED" | "CANCELLED";
  source: "CHAT" | "WEB" | "VOICE" | "PORTAL";
  title: string;
  ownerConfirmationRequired: true;
};

export type GuimmiaScheduleProposal = {
  intent: "DECLARE_AVAILABILITY" | "REQUEST_APPOINTMENT" | "NONE";
  eventType: GuimmiaAppointmentType | null;
  startsAt: string | null;
  endsAt: string | null;
  timezone: string;
  requiresClarification: boolean;
  assistantMessage: string;
  confidence: number;
};

export type GuimmiaScheduleSnapshot = {
  ok: true;
  availability: GuimmiaAvailabilityWindow[];
  appointments: GuimmiaAppointment[];
};
