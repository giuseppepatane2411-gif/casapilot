"use client";

import { useEffect, useMemo, useState } from "react";

import {
  listGuimmiaSchedule,
  mutateGuimmiaSchedule,
} from "@/lib/guimmia/operations/scheduling-client";
import {
  GUIMMIA_APPOINTMENT_LABELS,
  GUIMMIA_APPOINTMENT_TYPES,
  type GuimmiaAppointmentType,
  type GuimmiaScheduleProposal,
  type GuimmiaScheduleSnapshot,
} from "@/lib/guimmia/operations/scheduling-types";

const emptySnapshot: GuimmiaScheduleSnapshot = {
  ok: true,
  availability: [],
  appointments: [],
};

function formatDate(value: string, timezone: string) {
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone,
  }).format(new Date(value));
}

export default function GuimmiaAgendaWorkspace({
  draftId,
  proposal,
  onProposalHandled,
  onStatus,
}: {
  draftId: string;
  proposal: GuimmiaScheduleProposal | null;
  onProposalHandled: () => void;
  onStatus: (message: string) => void;
}) {
  const timezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Rome",
    [],
  );
  const [snapshot, setSnapshot] = useState<GuimmiaScheduleSnapshot>(emptySnapshot);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [eventType, setEventType] = useState<GuimmiaAppointmentType>("VISITA_IMMOBILE");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void listGuimmiaSchedule(draftId)
      .then((result) => {
        if (active) setSnapshot(result);
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : "Agenda non disponibile.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [draftId]);

  const run = async (task: ReturnType<typeof mutateGuimmiaSchedule>, message: string) => {
    setWorking(true);
    setError("");
    try {
      setSnapshot(await task);
      onStatus(message);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Agenda non aggiornata.");
    } finally {
      setWorking(false);
    }
  };

  const addAvailability = () => run(
    mutateGuimmiaSchedule({
      action: "ADD_AVAILABILITY",
      draftId,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
      timezone,
      eventType,
      source: "WEB",
    }),
    "Disponibilità salvata. Guimmia potrà proporre appuntamenti soltanto dentro questa fascia.",
  );

  const acceptProposal = async () => {
    if (!proposal?.startsAt || !proposal.endsAt || !proposal.eventType) return;
    const action = proposal.intent === "DECLARE_AVAILABILITY" ? "ADD_AVAILABILITY" : "PROPOSE_APPOINTMENT";
    const task = action === "ADD_AVAILABILITY"
      ? mutateGuimmiaSchedule({
          action,
          draftId,
          startsAt: proposal.startsAt,
          endsAt: proposal.endsAt,
          timezone: proposal.timezone,
          eventType: proposal.eventType,
          source: "CHAT",
        })
      : mutateGuimmiaSchedule({
          action,
          draftId,
          startsAt: proposal.startsAt,
          endsAt: proposal.endsAt,
          timezone: proposal.timezone,
          eventType: proposal.eventType,
          title: GUIMMIA_APPOINTMENT_LABELS[proposal.eventType],
          source: "CHAT",
        });
    await run(
      task,
      action === "ADD_AVAILABILITY"
        ? "Disponibilità estratta dalla chat e salvata dopo la tua conferma."
        : "Appuntamento inserito come proposta. Il proprietario deve ancora confermarlo.",
    );
    onProposalHandled();
  };

  return (
    <div className="mt-5 space-y-4">
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
        <p className="text-sm font-bold text-slate-900">Agenda unica Guimmia</p>
        <p className="mt-1 text-xs leading-5 text-slate-600">
          Proprietario, chat e futuro assistente vocale useranno queste stesse disponibilità. Nessun doppio calendario.
        </p>
      </div>

      {proposal ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-amber-700">Proposta letta dalla chat</p>
          <p className="mt-2 text-sm leading-6 text-slate-800">{proposal.assistantMessage}</p>
          {proposal.startsAt && proposal.endsAt && proposal.eventType ? (
            <div className="mt-2 text-xs text-slate-600">
              {GUIMMIA_APPOINTMENT_LABELS[proposal.eventType]} · {formatDate(proposal.startsAt, proposal.timezone)} – {formatDate(proposal.endsAt, proposal.timezone)}
            </div>
          ) : null}
          <div className="mt-3 flex gap-2">
            <button type="button" disabled={working || proposal.requiresClarification} onClick={() => void acceptProposal()} className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white disabled:bg-slate-300">Conferma proposta</button>
            <button type="button" onClick={onProposalHandled} className="rounded-xl border border-amber-300 px-3 py-2 text-xs font-bold text-amber-800">Scarta</button>
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 p-4">
        <p className="text-sm font-bold text-slate-900">Aggiungi disponibilità</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">Indica quando il proprietario può ricevere questo tipo di appuntamento.</p>
        <div className="mt-4 grid gap-3">
          <label className="grid gap-1 text-xs font-semibold text-slate-700">
            Tipo
            <select value={eventType} onChange={(event) => setEventType(event.target.value as GuimmiaAppointmentType)} className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 font-normal">
              {GUIMMIA_APPOINTMENT_TYPES.map((type) => <option key={type} value={type}>{GUIMMIA_APPOINTMENT_LABELS[type]}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1 text-xs font-semibold text-slate-700">Da<input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className="min-h-10 min-w-0 rounded-xl border border-slate-200 px-2 font-normal" /></label>
            <label className="grid gap-1 text-xs font-semibold text-slate-700">A<input type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} className="min-h-10 min-w-0 rounded-xl border border-slate-200 px-2 font-normal" /></label>
          </div>
          <button type="button" disabled={working || !startsAt || !endsAt} onClick={() => void addAvailability()} className="rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-bold text-white disabled:bg-slate-300">Salva disponibilità</button>
        </div>
      </div>

      {error ? <p className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p> : null}
      {loading ? <p className="text-sm text-slate-500">Carico l’agenda…</p> : null}

      {snapshot.availability.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Disponibilità</p>
          <div className="space-y-2">
            {snapshot.availability.filter((item) => item.status === "ACTIVE").map((item) => (
              <div key={item.id} className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-700">
                <strong>{item.allowedEventTypes.map((type) => GUIMMIA_APPOINTMENT_LABELS[type]).join(", ")}</strong><br />
                {formatDate(item.startsAt, item.timezone)} – {formatDate(item.endsAt, item.timezone)}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {snapshot.appointments.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Appuntamenti</p>
          <div className="space-y-2">
            {snapshot.appointments.filter((item) => item.status !== "CANCELLED").map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 p-3 text-xs leading-5 text-slate-700">
                <strong>{item.title}</strong><br />
                {formatDate(item.startsAt, item.timezone)} – {formatDate(item.endsAt, item.timezone)}
                <div className="mt-2 flex gap-2">
                  {item.status === "PENDING_OWNER_CONFIRMATION" ? <button type="button" disabled={working} onClick={() => void run(mutateGuimmiaSchedule({ action: "CONFIRM_APPOINTMENT", appointmentId: item.id }), "Appuntamento confermato dal proprietario." )} className="rounded-lg bg-emerald-600 px-2.5 py-1.5 font-bold text-white">Conferma</button> : <span className="rounded-full bg-emerald-100 px-2 py-1 font-bold text-emerald-700">Confermato</span>}
                  <button type="button" disabled={working} onClick={() => void run(mutateGuimmiaSchedule({ action: "CANCEL_APPOINTMENT", appointmentId: item.id }), "Appuntamento annullato." )} className="rounded-lg border border-slate-200 px-2.5 py-1.5 font-bold">Annulla</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <p className="rounded-xl bg-slate-50 p-3 text-[11px] leading-5 text-slate-500">
        In questa fase Guimmia e l’assistente vocale possono soltanto proporre orari compatibili. La conferma del proprietario resta obbligatoria.
      </p>
    </div>
  );
}
