"use client";

import { useEffect, useMemo, useState } from "react";

import { listGuimmiaDocuments } from "@/lib/guimmia/operations/document-client";
import type { GuimmiaDocumentRecord } from "@/lib/guimmia/operations/document-types";
import type {
  GuimmiaCaseRoomDraft,
  GuimmiaCaseRoomNextAction,
  GuimmiaCaseRoomPanel,
  GuimmiaCaseTimelineEvent,
} from "@/lib/guimmia/operations/case-room-types";
import { listGuimmiaSchedule } from "@/lib/guimmia/operations/scheduling-client";
import {
  GUIMMIA_APPOINTMENT_LABELS,
  type GuimmiaScheduleSnapshot,
} from "@/lib/guimmia/operations/scheduling-types";

const emptySchedule: GuimmiaScheduleSnapshot = {
  ok: true,
  availability: [],
  appointments: [],
};

function relativeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Adesso";
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function coreFacts(draft: GuimmiaCaseRoomDraft) {
  return [
    draft.objective,
    draft.operationType,
    draft.propertyType,
    draft.country,
    draft.city,
    draft.locationVerified ? "verified" : "",
    draft.surface,
    draft.condition,
  ].filter(Boolean).length;
}

function nextAction(input: {
  draft: GuimmiaCaseRoomDraft;
  documents: GuimmiaDocumentRecord[];
  schedule: GuimmiaScheduleSnapshot;
}): GuimmiaCaseRoomNextAction {
  const { draft, documents, schedule } = input;
  const pendingDocuments = documents.filter(
    (document) => document.status === "PENDING_CONFIRMATION",
  );
  const pendingAppointments = schedule.appointments.filter(
    (appointment) => appointment.status === "PENDING_OWNER_CONFIRMATION",
  );

  if (!draft.objective) {
    return {
      code: "DESCRIBE_GOAL",
      title: "Racconta a Guimmia cosa vuoi ottenere",
      explanation: "Basta una frase: Guimmia trasformerà il racconto nella prima bozza della pratica.",
      panel: "CASE_ROOM",
      prompt: "Voglio iniziare una nuova pratica immobiliare. Guidami tu con una domanda alla volta.",
      authority: "GUIMMIA",
    };
  }
  if (!draft.propertyType || !draft.city || !draft.surface || !draft.condition) {
    return {
      code: "COMPLETE_PROPERTY",
      title: "Completa i dati essenziali dell’immobile",
      explanation: "Guimmia ha già salvato ciò che ha capito e ti chiederà soltanto i dati ancora mancanti.",
      panel: "PROPERTY",
      prompt: "Dimmi qual è il primo dato essenziale che manca nella mia scheda.",
      authority: "CUSTOMER",
    };
  }
  if (!draft.locationVerified) {
    return {
      code: "CONFIRM_LOCATION",
      title: "Conferma la posizione sulla scheda",
      explanation: "La località deve essere verificata prima che Guimmia la usi per valutazioni e documenti.",
      panel: "PROPERTY",
      authority: "CUSTOMER",
    };
  }
  if (pendingDocuments.length > 0) {
    return {
      code: "REVIEW_DOCUMENT",
      title: `Controlla ${pendingDocuments.length === 1 ? "il documento organizzato" : `${pendingDocuments.length} documenti organizzati`}`,
      explanation: "Guimmia ha proposto cartella e destinatari. Serve la tua conferma prima dell’archiviazione.",
      panel: "DOCUMENTS",
      authority: "CUSTOMER",
    };
  }
  if (draft.status !== "confirmed") {
    return {
      code: "CONFIRM_PROPERTY",
      title: "Approva la scheda preparata da Guimmia",
      explanation: "I dati sono pronti, ma restano modificabili finché non li confermi.",
      panel: "PROPERTY",
      authority: "CUSTOMER",
    };
  }
  if (documents.length === 0) {
    return {
      code: "UPLOAD_DOCUMENT",
      title: "Aggiungi il primo documento",
      explanation: "Guimmia lo leggerà, lo rinominerà e proporrà la cartella corretta senza inviarlo a nessuno.",
      panel: "DOCUMENTS",
      authority: "CUSTOMER",
    };
  }
  if (schedule.availability.filter((item) => item.status === "ACTIVE").length === 0) {
    return {
      code: "DECLARE_AVAILABILITY",
      title: "Dichiara quando sei disponibile",
      explanation: "Guimmia userà soltanto queste fasce per proporre visite e appuntamenti.",
      panel: "AGENDA",
      prompt: "Sono disponibile per le visite. Aiutami a inserire giorni e orari.",
      authority: "CUSTOMER",
    };
  }
  if (pendingAppointments.length > 0) {
    return {
      code: "CONFIRM_APPOINTMENT",
      title: "Controlla la proposta di appuntamento",
      explanation: "L’orario è compatibile, ma nessun appuntamento diventa definitivo senza conferma.",
      panel: "AGENDA",
      authority: "CUSTOMER",
    };
  }
  return {
    code: "ASK_NEXT_MOVE",
    title: "Chiedi a Guimmia la prossima mossa",
    explanation: "La base operativa è pronta: il cervello può ora guidare il passaggio successivo della pratica.",
    panel: "CASE_ROOM",
    prompt: "Analizza la mia pratica e dimmi qual è la prossima mossa più utile e sicura.",
    authority: "GUIMMIA",
  };
}

function timeline(input: {
  draft: GuimmiaCaseRoomDraft;
  documents: GuimmiaDocumentRecord[];
  schedule: GuimmiaScheduleSnapshot;
}) {
  const events: GuimmiaCaseTimelineEvent[] = [
    {
      id: `draft-${input.draft.updatedAt}`,
      label: "Scheda sincronizzata",
      detail: input.draft.propertyType
        ? `${input.draft.propertyType}${input.draft.city ? ` · ${input.draft.city}` : ""}`
        : "Guimmia ha aperto la pratica e attende il primo racconto.",
      at: input.draft.updatedAt,
      tone: "BLUE",
    },
    ...input.documents.map((document) => ({
      id: `document-${document.id}`,
      label:
        document.status === "ARCHIVED"
          ? "Documento archiviato"
          : "Documento organizzato",
      detail: document.suggestedName,
      at: document.confirmedAt ?? document.createdAt,
      tone: document.status === "ARCHIVED" ? "GREEN" as const : "AMBER" as const,
    })),
    ...input.schedule.appointments
      .filter((appointment) => appointment.status !== "CANCELLED")
      .map((appointment) => ({
        id: `appointment-${appointment.id}`,
        label:
          appointment.status === "CONFIRMED"
            ? "Appuntamento confermato"
            : "Appuntamento proposto",
        detail: GUIMMIA_APPOINTMENT_LABELS[appointment.eventType],
        at: appointment.startsAt,
        tone: appointment.status === "CONFIRMED" ? "GREEN" as const : "AMBER" as const,
      })),
  ];
  return events
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 5);
}

export default function GuimmiaLivingCaseRoom({
  draft,
  refreshToken,
  onOpenPanel,
  onPrompt,
  onUploadDocument,
}: {
  draft: GuimmiaCaseRoomDraft;
  refreshToken: number;
  onOpenPanel: (panel: GuimmiaCaseRoomPanel) => void;
  onPrompt: (prompt: string) => void;
  onUploadDocument: () => void;
}) {
  const [documents, setDocuments] = useState<GuimmiaDocumentRecord[]>([]);
  const [schedule, setSchedule] = useState<GuimmiaScheduleSnapshot>(emptySchedule);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void Promise.all([
      listGuimmiaDocuments(draft.id),
      listGuimmiaSchedule(draft.id),
    ])
      .then(([documentResult, scheduleResult]) => {
        if (!active) return;
        setDocuments(documentResult.documents);
        setSchedule(scheduleResult);
        setError("");
      })
      .catch(() => {
        if (active) setError("La stanza resta disponibile, ma alcuni dati operativi non sono raggiungibili.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [draft.id, draft.updatedAt, refreshToken]);

  const activeAvailability = schedule.availability.filter(
    (item) => item.status === "ACTIVE",
  );
  const activeAppointments = schedule.appointments.filter(
    (item) => item.status !== "CANCELLED",
  );
  const pendingDocuments = documents.filter(
    (document) => document.status === "PENDING_CONFIRMATION",
  );
  const pendingAppointments = activeAppointments.filter(
    (appointment) => appointment.status === "PENDING_OWNER_CONFIRMATION",
  );
  const confirmedDocuments = documents.filter(
    (document) => document.status === "ARCHIVED",
  );
  const readiness = Math.min(
    100,
    Math.round(
      (coreFacts(draft) / 8) * 50 +
        (documents.length > 0 ? 8 : 0) +
        Math.min(17, confirmedDocuments.length * 5) +
        (activeAvailability.length > 0 ? 10 : 0) +
        (activeAppointments.some((item) => item.status === "CONFIRMED") ? 5 : 0) +
        (draft.status === "confirmed" ? 10 : 0),
    ),
  );
  const action = useMemo(
    () => nextAction({ draft, documents, schedule }),
    [draft, documents, schedule],
  );
  const events = useMemo(
    () => timeline({ draft, documents, schedule }),
    [draft, documents, schedule],
  );
  const confirmations = [
    ...(!draft.locationVerified && draft.city ? ["Posizione immobile"] : []),
    ...(pendingDocuments.length > 0
      ? [`${pendingDocuments.length} ${pendingDocuments.length === 1 ? "documento" : "documenti"}`]
      : []),
    ...(pendingAppointments.length > 0
      ? [`${pendingAppointments.length} ${pendingAppointments.length === 1 ? "appuntamento" : "appuntamenti"}`]
      : []),
    ...(draft.status !== "confirmed" && coreFacts(draft) === 8
      ? ["Scheda immobile"]
      : []),
  ];
  const phase =
    coreFacts(draft) < 5
      ? "Raccolta intelligente"
      : documents.length === 0
        ? "Costruzione fascicolo"
        : activeAvailability.length === 0
          ? "Preparazione operativa"
          : "Pratica in movimento";

  const executeAction = () => {
    if (action.code === "UPLOAD_DOCUMENT") {
      onUploadDocument();
      return;
    }
    if (action.prompt) {
      onPrompt(action.prompt);
      return;
    }
    onOpenPanel(action.panel);
  };

  return (
    <div className="mt-5 space-y-4">
      <section className="overflow-hidden rounded-3xl bg-slate-950 text-white shadow-lg shadow-blue-100">
        <div className="relative p-5">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-blue-600/30 blur-2xl" />
          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-300">Stanza viva della pratica</p>
                <h2 className="mt-2 text-xl font-semibold">{phase}</h2>
                <p className="mt-1 text-xs leading-5 text-slate-300">Una sola regia per conversazione, scheda, fascicolo e appuntamenti.</p>
              </div>
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-blue-500 bg-slate-900 text-lg font-bold">
                {readiness}%
              </div>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-300 transition-all" style={{ width: `${readiness}%` }} />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-700">Prossima mossa</p>
          <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-slate-600">{action.authority === "CUSTOMER" ? "Serve la tua scelta" : "Guimmia ti guida"}</span>
        </div>
        <h3 className="mt-2 text-base font-bold text-slate-950">{action.title}</h3>
        <p className="mt-1 text-xs leading-5 text-slate-600">{action.explanation}</p>
        <button type="button" onClick={executeAction} className="mt-3 min-h-10 w-full rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700">
          Procedi con Guimmia
        </button>
      </section>

      <section className="grid grid-cols-3 gap-2">
        <button type="button" onClick={() => onOpenPanel("PROPERTY")} className="rounded-2xl border border-slate-200 p-3 text-left hover:border-blue-300 hover:bg-blue-50">
          <strong className="block text-lg text-slate-950">{coreFacts(draft)}/8</strong>
          <span className="text-[11px] text-slate-500">Dati essenziali</span>
        </button>
        <button type="button" onClick={() => onOpenPanel("DOCUMENTS")} className="rounded-2xl border border-slate-200 p-3 text-left hover:border-blue-300 hover:bg-blue-50">
          <strong className="block text-lg text-slate-950">{confirmedDocuments.length}</strong>
          <span className="text-[11px] text-slate-500">Nel fascicolo</span>
        </button>
        <button type="button" onClick={() => onOpenPanel("AGENDA")} className="rounded-2xl border border-slate-200 p-3 text-left hover:border-blue-300 hover:bg-blue-50">
          <strong className="block text-lg text-slate-950">{activeAppointments.length}</strong>
          <span className="text-[11px] text-slate-500">Appuntamenti</span>
        </button>
      </section>

      <section className="rounded-2xl border border-slate-200 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold text-slate-900">Guimmia ha capito</p>
          <button type="button" onClick={() => onOpenPanel("PROPERTY")} className="text-[11px] font-bold text-blue-700">Controlla</button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {[draft.objective, draft.propertyType, draft.city, draft.surface ? `${draft.surface} m²` : "", draft.condition]
            .filter(Boolean)
            .map((fact) => <span key={fact} className="rounded-full bg-slate-100 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700">{fact}</span>)}
          {coreFacts(draft) === 0 ? <span className="text-xs leading-5 text-slate-500">Scrivi il tuo racconto nella chat: qui appariranno i fatti estratti automaticamente.</span> : null}
        </div>
      </section>

      {confirmations.length > 0 ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-bold text-amber-900">In attesa della tua conferma</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {confirmations.map((item) => <span key={item} className="rounded-full bg-white px-2.5 py-1.5 text-[11px] font-semibold text-amber-800">{item}</span>)}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 p-4">
        <p className="text-xs font-bold text-slate-900">Diario della pratica</p>
        <div className="mt-3 space-y-3">
          {events.map((event) => (
            <div key={event.id} className="flex gap-3">
              <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${event.tone === "GREEN" ? "bg-emerald-500" : event.tone === "AMBER" ? "bg-amber-500" : event.tone === "BLUE" ? "bg-blue-500" : "bg-slate-400"}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-xs font-bold text-slate-800">{event.label}</p>
                  <span className="shrink-0 text-[9px] text-slate-400">{relativeDate(event.at)}</span>
                </div>
                <p className="mt-0.5 truncate text-[11px] text-slate-500">{event.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {loading ? <p className="text-center text-xs text-slate-400">Sincronizzo la stanza della pratica…</p> : null}
      {error ? <p className="rounded-xl bg-red-50 p-3 text-xs leading-5 text-red-700">{error}</p> : null}
      <p className="rounded-xl bg-slate-50 p-3 text-[11px] leading-5 text-slate-500">
        Guimmia prepara e propone. Prezzi, validità documentale, invii, firme e appuntamenti definitivi restano sotto controllo umano.
      </p>
    </div>
  );
}
