"use client";

import {
  BarChart3,
  CheckCircle2,
  Clock3,
  Download,
  FileDown,
  FolderLock,
  MessageSquareText,
  Target,
  Users,
} from "lucide-react";

import { useBetaState } from "@/hooks/useBetaState";
import { BETA_USEFUL_AREAS } from "@/lib/beta/constants";
import type { BetaFeedbackEntry, BetaTestSession } from "@/lib/beta/types";

export default function BetaFeedbackInsights() {
  const { hydrated, state } = useBetaState();

  if (!hydrated || !state) {
    return <div className="h-64 animate-pulse rounded-[28px] bg-slate-100" />;
  }

  const feedback = state.feedback;
  const sessions = state.sessions;
  const events = state.events;
  const averageClarity = feedback.length
    ? feedback.reduce((sum, entry) => sum + entry.clarity, 0) / feedback.length
    : 0;
  const yesCount = feedback.filter((entry) => entry.willingness === "yes").length;
  const maybeCount = feedback.filter((entry) => entry.willingness === "maybe").length;
  const completion = Math.min(100, Math.round((feedback.length / 5) * 100));

  const usefulAreaCounts = BETA_USEFUL_AREAS.map((area) => ({
    ...area,
    count: feedback.filter((entry) => entry.usefulArea === area.id).length,
  })).sort((a, b) => b.count - a.count);
  const topArea = usefulAreaCounts[0];

  const sessionsWithPilot = sessions.filter((session) =>
    events.some(
      (event) => event.sessionId === session.id && event.type === "pilot-opened",
    ),
  );
  const sessionsWithMission = sessions.filter((session) =>
    events.some(
      (event) => event.sessionId === session.id && event.type === "mission-completed",
    ),
  );
  const sessionsWithVault = sessions.filter((session) =>
    events.some(
      (event) => event.sessionId === session.id && event.type === "vault-file-added",
    ),
  );
  const averageTimeToPilot = calculateAverageTimeToPilot(sessions, events);

  function exportCsv() {
    const headers = [
      "data",
      "chiarezza",
      "parte_utile",
      "pagherebbe",
      "parte_confusa",
      "commento",
      "pratica",
      "condiviso",
    ];
    const rows = feedback.map((entry) => [
      entry.createdAt,
      entry.clarity,
      entry.usefulArea,
      entry.willingness,
      entry.confusingPart,
      entry.comment,
      entry.journeyId ?? "",
      entry.sharedAt ?? "",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsvCell).join(","))
      .join("\n");
    downloadBlob(
      csv,
      "text/csv;charset=utf-8",
      `casapilot-feedback-${new Date().toISOString().slice(0, 10)}.csv`,
    );
  }

  function exportTestReport() {
    const report = {
      product: "CasaPilot",
      release: "beta-zero-cost-v2-test-flight",
      exportedAt: new Date().toISOString(),
      summary: {
        sessionsStarted: sessions.length,
        pilotReached: sessionsWithPilot.length,
        missionCompleted: sessionsWithMission.length,
        vaultUsed: sessionsWithVault.length,
        feedbackCollected: feedback.length,
        averageClarity: Number(averageClarity.toFixed(2)),
        willingToPayYes: yesCount,
        willingToPayMaybe: maybeCount,
        averageSecondsToPilot: averageTimeToPilot,
      },
      sessions,
      events,
      feedback,
    };

    downloadBlob(
      JSON.stringify(report, null, 2),
      "application/json;charset=utf-8",
      `casapilot-test-report-${new Date().toISOString().slice(0, 10)}.json`,
    );
  }

  if (sessions.length === 0 && feedback.length === 0) return null;

  return (
    <section className="space-y-6 rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-blue-600">
            <BarChart3 size={17} />
            Dati salvati soltanto in questo browser
          </p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">Test Flight Insights</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Non contiamo semplicemente i clic: misuriamo quante persone raggiungono il valore, completano un’azione e lasciano un verdetto.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={exportCsv}
            disabled={feedback.length === 0}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:border-blue-200 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download size={17} />
            Feedback CSV
          </button>
          <button
            type="button"
            onClick={exportTestReport}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white hover:bg-blue-600"
          >
            <FileDown size={17} />
            Report completo
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <InsightMetric
          icon={Users}
          label="Sessioni avviate"
          value={String(sessions.length)}
          detail="test locali"
        />
        <InsightMetric
          icon={Target}
          label="Pilot raggiunto"
          value={`${sessionsWithPilot.length}/${sessions.length}`}
          detail="momento di valore"
        />
        <InsightMetric
          icon={CheckCircle2}
          label="Missione completata"
          value={`${sessionsWithMission.length}/${sessions.length}`}
          detail="azione reale"
        />
        <InsightMetric
          icon={FolderLock}
          label="Archivio provato"
          value={`${sessionsWithVault.length}/${sessions.length}`}
          detail="file locale"
        />
        <InsightMetric
          icon={Clock3}
          label="Tempo al valore"
          value={averageTimeToPilot === null ? "—" : formatDuration(averageTimeToPilot)}
          detail="media fino a Pilot"
          smallValue
        />
      </div>

      <div className="rounded-[24px] bg-slate-950 p-5 text-white sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Funnel dei primi tester</p>
            <h3 className="mt-2 text-xl font-bold">Dove perdiamo valore?</h3>
          </div>
          <p className="text-xs text-slate-400">Obiettivo iniziale: 5 feedback completi</p>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-5">
          <FunnelStep label="Avvio" value={sessions.length} base={sessions.length} />
          <FunnelStep label="Pilot" value={sessionsWithPilot.length} base={sessions.length} />
          <FunnelStep label="Missione" value={sessionsWithMission.length} base={sessions.length} />
          <FunnelStep label="Archivio" value={sessionsWithVault.length} base={sessions.length} />
          <FunnelStep label="Feedback" value={feedback.length} base={sessions.length} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InsightMetric
          icon={MessageSquareText}
          label="Feedback raccolti"
          value={`${feedback.length}/5`}
          detail={`${completion}% prima soglia`}
        />
        <InsightMetric
          icon={CheckCircle2}
          label="Chiarezza media"
          value={feedback.length ? averageClarity.toFixed(1) : "—"}
          detail="su 5"
        />
        <InsightMetric
          icon={Target}
          label="Pagherebbero"
          value={`${yesCount}`}
          detail={`${maybeCount} hanno risposto forse`}
        />
        <InsightMetric
          icon={BarChart3}
          label="Parte più citata"
          value={topArea?.count ? topArea.label : "—"}
          detail={topArea?.count ? `${topArea.count} preferenze` : "nessun dato"}
          smallValue
        />
      </div>

      {feedback.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-950">Ultimi verdetti</h3>
          <div className="mt-3 space-y-3">
            {feedback.slice(0, 5).map((entry) => (
              <FeedbackRow key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function InsightMetric({
  icon: Icon,
  label,
  value,
  detail,
  smallValue = false,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  detail: string;
  smallValue?: boolean;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
        <Icon size={17} />
      </span>
      <p className="mt-4 text-xs font-bold uppercase tracking-[0.08em] text-slate-400">{label}</p>
      <p className={`mt-1 font-bold text-slate-950 ${smallValue ? "text-lg leading-6" : "text-3xl"}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </article>
  );
}

function FunnelStep({ label, value, base }: { label: string; value: number; base: number }) {
  const percentage = base ? Math.round((value / base) * 100) : 0;
  return (
    <div className="rounded-2xl bg-white/5 p-4">
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-blue-400" style={{ width: `${percentage}%` }} />
      </div>
      <p className="mt-2 text-[11px] text-slate-400">{percentage}%</p>
    </div>
  );
}

function FeedbackRow({ entry }: { entry: BetaFeedbackEntry }) {
  const usefulLabel =
    BETA_USEFUL_AREAS.find((area) => area.id === entry.usefulArea)?.label ??
    entry.usefulArea;
  const willingness =
    entry.willingness === "yes"
      ? "Sì"
      : entry.willingness === "maybe"
        ? "Forse"
        : "No";

  return (
    <article className="grid gap-3 rounded-2xl border border-slate-200 p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">
        {entry.clarity}/5
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold text-slate-950">{usefulLabel}</p>
        <p className="mt-1 truncate text-xs text-slate-500">
          {entry.comment || entry.confusingPart || "Nessun commento testuale"}
        </p>
      </div>
      <div className="text-left sm:text-right">
        <p className="text-xs font-bold text-slate-700">Pagherebbe: {willingness}</p>
        <p className="mt-1 text-[11px] text-slate-400">
          {new Date(entry.createdAt).toLocaleDateString("it-IT")}
        </p>
      </div>
    </article>
  );
}

function calculateAverageTimeToPilot(
  sessions: BetaTestSession[],
  events: Array<{ sessionId: string | null; type: string; createdAt: string }>,
) {
  const values = sessions
    .map((session) => {
      const pilotEvent = events
        .filter(
          (event) =>
            event.sessionId === session.id && event.type === "pilot-opened",
        )
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
      if (!pilotEvent) return null;
      return Math.max(
        0,
        Math.round(
          (new Date(pilotEvent.createdAt).getTime() -
            new Date(session.startedAt).getTime()) /
            1000,
        ),
      );
    })
    .filter((value): value is number => value !== null);

  if (!values.length) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder ? `${minutes}m ${remainder}s` : `${minutes}m`;
}

function downloadBlob(content: string, type: string, filename: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeCsvCell(value: unknown) {
  const text = String(value ?? "").replaceAll('"', '""');
  return `"${text}"`;
}
