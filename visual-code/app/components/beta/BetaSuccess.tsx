"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import {
  ArrowRight,
  CheckCircle2,
  CircleGauge,
  Clock3,
  FileCheck2,
  Sparkles,
} from "lucide-react";

import BetaFeedbackForm from "@/components/beta/BetaFeedbackForm";
import { useJourneys } from "@/hooks/useJourneys";
import { usePilotMemory } from "@/hooks/usePilotMemory";
import {
  attachJourneyToActiveSession,
  markBetaMilestone,
  trackBetaEvent,
} from "@/lib/beta/storage";
import { buildPilotContext } from "@/lib/pilot-os";
import { getRequiredDocuments } from "@/lib/property-journey/constants";

export default function BetaSuccess() {
  const searchParams = useSearchParams();
  const requestedJourneyId = searchParams.get("journey");
  const { hydrated, journeys, activeJourney } = useJourneys();
  const journey =
    journeys.find((item) => item.id === requestedJourneyId) ?? activeJourney;
  const journeyId = journey?.id ?? null;
  const { hydrated: memoryHydrated, memory } = usePilotMemory(journeyId);

  useEffect(() => {
    if (!journeyId) return;
    markBetaMilestone("journey-created");
    attachJourneyToActiveSession(journeyId);
    trackBetaEvent("journey-created", { journeyId });
  }, [journeyId]);

  if (!hydrated || !memoryHydrated) {
    return <div className="h-[620px] animate-pulse rounded-[30px] bg-slate-200" />;
  }

  if (!journey || !memory) {
    return (
      <section className="rounded-[30px] border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-slate-950">Pratica non trovata</h1>
        <p className="mt-2 text-sm text-slate-500">Torna al Beta Lab e crea un nuovo percorso.</p>
        <Link href="/dashboard/beta" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white">
          Torna al Beta Lab
          <ArrowRight size={17} />
        </Link>
      </section>
    );
  }

  const context = buildPilotContext(journey, memory);
  const requiredDocuments = getRequiredDocuments(
    journey.operation,
    journey.property.type,
  );

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-emerald-600 to-teal-700 p-6 text-white shadow-xl shadow-emerald-600/15 sm:p-9">
        <div aria-hidden="true" className="absolute -right-24 -top-28 h-72 w-72 rounded-full border border-white/10" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <div>
            <span className="flex h-13 w-13 items-center justify-center rounded-2xl bg-white/15">
              <CheckCircle2 size={26} />
            </span>
            <p className="mt-5 text-sm font-semibold text-emerald-100">Percorso creato con successo</p>
            <h1 className="mt-2 max-w-3xl text-3xl font-bold tracking-[-0.05em] sm:text-5xl">
              CasaPilot sa già qual è la prima cosa da fare.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-emerald-100 sm:text-base">
              Non devi studiare tutta la pratica insieme. Pilot ha ordinato dati e documenti e ha scelto una sola priorità per {journey.property.name}.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Metric icon={CircleGauge} label="Health Score" value={`${journey.healthScore}/100`} />
            <Metric icon={FileCheck2} label="Documenti" value={`${journey.documents.length}/${requiredDocuments.length}`} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <article className="rounded-[30px] border border-blue-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="flex items-center gap-2 text-sm font-bold text-blue-700">
            <Sparkles size={17} />
            La tua prima missione
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-slate-950">
            {context.mission.title}
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-500">{context.mission.description}</p>
          <div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold text-slate-600">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2">
              <Clock3 size={14} />
              {context.mission.estimatedMinutes} minuti
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-blue-700">
              <Sparkles size={14} />
              +{context.mission.scoreGain} punti
            </span>
          </div>
          <Link
            href="/dashboard/pilot"
            className="mt-7 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 sm:w-auto"
          >
            Inizia con Pilot OS
            <ArrowRight size={17} />
          </Link>
        </article>

        <article className="rounded-[30px] bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/10 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Test rapido</p>
          <h2 className="mt-3 text-2xl font-bold">Prima impressione</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Dopo aver visto la missione, annota subito la tua reazione. È il momento in cui il feedback è più sincero.
          </p>
          <div className="mt-6 space-y-3">
            <TestPoint number="1" text="La missione è comprensibile senza spiegazioni?" />
            <TestPoint number="2" text="Capisci perché viene prima delle altre?" />
            <TestPoint number="3" text="Sapresti cosa fare cliccando il pulsante?" />
          </div>
          <Link
            href="/dashboard/feedback"
            className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-bold text-slate-950 hover:bg-blue-50"
          >
            Lascia il feedback
            <ArrowRight size={17} />
          </Link>
        </article>
      </section>

      <section>
        <div className="mb-4">
          <p className="text-sm font-semibold text-violet-700">Facoltativo</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">Valuta subito il percorso</h2>
        </div>
        <BetaFeedbackForm defaultJourneyId={journey.id} compact />
      </section>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CircleGauge;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
      <p className="flex items-center gap-2 text-xs font-semibold text-emerald-100">
        <Icon size={14} />
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function TestPoint({ number, text }: { number: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-white/5 p-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-xs font-bold text-blue-300">
        {number}
      </span>
      <p className="text-sm leading-6 text-slate-200">{text}</p>
    </div>
  );
}
