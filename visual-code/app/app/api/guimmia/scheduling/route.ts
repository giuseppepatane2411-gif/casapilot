import { NextResponse } from "next/server";

import {
  GUIMMIA_APPOINTMENT_LABELS,
  GUIMMIA_APPOINTMENT_TYPES,
  type GuimmiaAppointment,
  type GuimmiaAppointmentType,
  type GuimmiaAvailabilityWindow,
  type GuimmiaScheduleSnapshot,
} from "@/lib/guimmia/operations/scheduling-types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type AvailabilityRow = {
  id: string;
  draft_id: string;
  starts_at: string;
  ends_at: string;
  timezone: string;
  allowed_event_types: GuimmiaAppointmentType[];
  status: "ACTIVE" | "CANCELLED";
  source: GuimmiaAvailabilityWindow["source"];
};

type AppointmentRow = {
  id: string;
  draft_id: string;
  event_type: GuimmiaAppointmentType;
  starts_at: string;
  ends_at: string;
  timezone: string;
  status: GuimmiaAppointment["status"];
  source: GuimmiaAppointment["source"];
  title: string;
  owner_confirmation_required: true;
};

function access() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return url && key ? { url, key } : null;
}

async function rest<T>(path: string, init: RequestInit = {}) {
  const current = access();
  if (!current) throw new Error("supabase_not_configured");
  const response = await fetch(`${current.url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: current.key,
      Authorization: `Bearer ${current.key}`,
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!response.ok) {
    console.error("Guimmia scheduling database request failed", response.status);
    throw new Error(`supabase_http_${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return await response.json() as T;
}

function error(status: number, message: string) {
  return NextResponse.json(
    { ok: false, message },
    { status, headers: { "cache-control": "no-store" } },
  );
}

function clean(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function source(value: unknown) {
  return ["CHAT", "WEB", "VOICE", "PORTAL"].includes(String(value))
    ? value as GuimmiaAvailabilityWindow["source"]
    : "WEB";
}

function validTimezone(value: string) {
  try {
    new Intl.DateTimeFormat("it-IT", { timeZone: value }).format(new Date());
    return value;
  } catch {
    return "Europe/Rome";
  }
}

function interval(startsAtValue: unknown, endsAtValue: unknown) {
  const startsAt = new Date(clean(startsAtValue, 60));
  const endsAt = new Date(clean(endsAtValue, 60));
  const duration = endsAt.getTime() - startsAt.getTime();
  if (
    Number.isNaN(startsAt.getTime()) ||
    Number.isNaN(endsAt.getTime()) ||
    duration < 15 * 60_000 ||
    duration > 12 * 60 * 60_000 ||
    startsAt.getTime() < Date.now() - 5 * 60_000
  ) return null;
  return { startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() };
}

function availability(row: AvailabilityRow): GuimmiaAvailabilityWindow {
  return {
    id: row.id,
    draftId: row.draft_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    timezone: row.timezone,
    allowedEventTypes: row.allowed_event_types,
    status: row.status,
    source: row.source,
  };
}

function appointment(row: AppointmentRow): GuimmiaAppointment {
  return {
    id: row.id,
    draftId: row.draft_id,
    eventType: row.event_type,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    timezone: row.timezone,
    status: row.status,
    source: row.source,
    title: row.title,
    ownerConfirmationRequired: true,
  };
}

async function userId() {
  if (!isSupabaseConfigured() || !access()) return null;
  const client = await createClient();
  const { data } = await client.auth.getUser();
  return data.user?.id ?? null;
}

async function snapshot(ownerId: string, draftId: string): Promise<GuimmiaScheduleSnapshot> {
  const base = { user_id: `eq.${ownerId}`, draft_id: `eq.${draftId}`, order: "starts_at.asc" };
  const availabilityQuery = new URLSearchParams({
    select: "id,draft_id,starts_at,ends_at,timezone,allowed_event_types,status,source",
    ...base,
  });
  const appointmentQuery = new URLSearchParams({
    select: "id,draft_id,event_type,starts_at,ends_at,timezone,status,source,title,owner_confirmation_required",
    ...base,
  });
  const [windows, appointments] = await Promise.all([
    rest<AvailabilityRow[]>(`guimmia_availability_windows?${availabilityQuery}`),
    rest<AppointmentRow[]>(`guimmia_case_appointments?${appointmentQuery}`),
  ]);
  return {
    ok: true,
    availability: windows.map(availability),
    appointments: appointments.map(appointment),
  };
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return new Date(aStart).getTime() < new Date(bEnd).getTime() &&
    new Date(aEnd).getTime() > new Date(bStart).getTime();
}

async function slotAvailable(
  ownerId: string,
  draftId: string,
  eventType: GuimmiaAppointmentType,
  startsAt: string,
  endsAt: string,
  excludedAppointmentId?: string,
) {
  const current = await snapshot(ownerId, draftId);
  const insideWindow = current.availability.some(
    (window) =>
      window.status === "ACTIVE" &&
      window.allowedEventTypes.includes(eventType) &&
      new Date(startsAt).getTime() >= new Date(window.startsAt).getTime() &&
      new Date(endsAt).getTime() <= new Date(window.endsAt).getTime(),
  );
  const conflict = current.appointments.some(
    (item) =>
      item.id !== excludedAppointmentId &&
      item.status !== "CANCELLED" &&
      overlaps(startsAt, endsAt, item.startsAt, item.endsAt),
  );
  return insideWindow && !conflict;
}

export async function GET(request: Request) {
  const ownerId = await userId();
  if (!ownerId) return error(401, "Accedi per vedere l’agenda Guimmia.");
  const draftId = clean(new URL(request.url).searchParams.get("draftId"), 120);
  if (!draftId) return error(400, "Pratica non valida.");
  try {
    return NextResponse.json(await snapshot(ownerId, draftId), { headers: { "cache-control": "no-store" } });
  } catch {
    return error(503, "L’agenda Guimmia non è disponibile.");
  }
}

export async function POST(request: Request) {
  const ownerId = await userId();
  if (!ownerId) return error(401, "Accedi per modificare l’agenda Guimmia.");
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return error(400, "Richiesta agenda non valida.");
  }
  const action = clean(body.action, 40);

  try {
    if (action === "ADD_AVAILABILITY") {
      const draftId = clean(body.draftId, 120);
      const slot = interval(body.startsAt, body.endsAt);
      const eventType = GUIMMIA_APPOINTMENT_TYPES.includes(body.eventType as GuimmiaAppointmentType)
        ? body.eventType as GuimmiaAppointmentType
        : null;
      if (!draftId || !slot || !eventType) return error(400, "Controlla pratica, orario e tipo di appuntamento.");
      await rest("guimmia_availability_windows", {
        method: "POST",
        headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({
          user_id: ownerId,
          draft_id: draftId,
          starts_at: slot.startsAt,
          ends_at: slot.endsAt,
          timezone: validTimezone(clean(body.timezone, 80) || "Europe/Rome"),
          allowed_event_types: [eventType],
          status: "ACTIVE",
          source: source(body.source),
        }),
      });
      return NextResponse.json(await snapshot(ownerId, draftId));
    }

    if (action === "PROPOSE_APPOINTMENT") {
      const draftId = clean(body.draftId, 120);
      const slot = interval(body.startsAt, body.endsAt);
      const eventType = GUIMMIA_APPOINTMENT_TYPES.includes(body.eventType as GuimmiaAppointmentType)
        ? body.eventType as GuimmiaAppointmentType
        : null;
      if (!draftId || !slot || !eventType) return error(400, "Controlla pratica, orario e tipo di appuntamento.");
      if (!(await slotAvailable(ownerId, draftId, eventType, slot.startsAt, slot.endsAt))) {
        return error(409, "L’orario non rientra nella disponibilità del proprietario oppure è già occupato.");
      }
      await rest("guimmia_case_appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({
          user_id: ownerId,
          draft_id: draftId,
          event_type: eventType,
          starts_at: slot.startsAt,
          ends_at: slot.endsAt,
          timezone: validTimezone(clean(body.timezone, 80) || "Europe/Rome"),
          status: "PENDING_OWNER_CONFIRMATION",
          source: source(body.source),
          title: clean(body.title, 140) || GUIMMIA_APPOINTMENT_LABELS[eventType],
          owner_confirmation_required: true,
          automatic_booking_executed: false,
        }),
      });
      return NextResponse.json(await snapshot(ownerId, draftId));
    }

    if (action === "CONFIRM_APPOINTMENT" || action === "CANCEL_APPOINTMENT") {
      const appointmentId = clean(body.appointmentId, 80);
      if (!appointmentId) return error(400, "Appuntamento non valido.");
      const findQuery = new URLSearchParams({
        select: "id,draft_id,event_type,starts_at,ends_at,timezone,status,source,title,owner_confirmation_required",
        id: `eq.${appointmentId}`,
        user_id: `eq.${ownerId}`,
        limit: "1",
      });
      const found = await rest<AppointmentRow[]>(`guimmia_case_appointments?${findQuery}`);
      const current = found[0];
      if (!current) return error(404, "Appuntamento non trovato.");
      if (action === "CONFIRM_APPOINTMENT" && !(await slotAvailable(
        ownerId,
        current.draft_id,
        current.event_type,
        current.starts_at,
        current.ends_at,
        current.id,
      ))) return error(409, "La disponibilità non è più valida o l’orario è occupato.");
      const updateQuery = new URLSearchParams({ id: `eq.${appointmentId}`, user_id: `eq.${ownerId}` });
      await rest(`guimmia_case_appointments?${updateQuery}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({
          status: action === "CONFIRM_APPOINTMENT" ? "CONFIRMED" : "CANCELLED",
          confirmed_at: action === "CONFIRM_APPOINTMENT" ? new Date().toISOString() : null,
          confirmed_by: action === "CONFIRM_APPOINTMENT" ? ownerId : null,
        }),
      });
      return NextResponse.json(await snapshot(ownerId, current.draft_id));
    }

    return error(400, "Azione agenda non riconosciuta.");
  } catch (cause) {
    console.error("Guimmia scheduling mutation failed", cause);
    return error(503, "Non riesco ad aggiornare l’agenda in questo momento.");
  }
}
