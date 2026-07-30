"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  Building2,
  ChevronDown,
  CircleGauge,
  Sparkles,
} from "lucide-react";

import MissionCommandCenter from "@/components/pilot-os/MissionCommandCenter";
import PilotChat from "@/components/pilot-os/PilotChat";
import PilotReadinessCard from "@/components/pilot-os/PilotReadinessCard";
import PilotRecommendations from "@/components/pilot-os/PilotRecommendations";
import PilotTimeline from "@/components/pilot-os/PilotTimeline";
import PropertyQuickData from "@/components/pilot-os/PropertyQuickData";
import { useJourneys } from "@/hooks/useJourneys";
import { usePilotMemory } from "@/hooks/usePilotMemory";
import { markBetaMilestone, trackBetaEvent } from "@/lib/beta/storage";
import { buildPilotContext } from "@/lib/pilot-os";

export default function PilotOSWorkspace() {
  const {
    hydrated: journeysHydrated,
    journeys,
    activeJourney,
    activateJourney,
  } = useJourneys();
  const activeJourneyId = activeJourney?.id ?? null;
  const { hydrated: memoryHydrated, memory } = usePilotMemory(activeJourneyId);

  useEffect(() => {
    if (!activeJourneyId) return;
    markBetaMilestone("pilot-opened");
    trackBetaEvent("pilot-opened", { journeyId: activeJourneyId });
  }, [activeJourneyId]);

  if (!journeysHydrated || !memoryHydrated) {
    return <PilotSkeleton />;
  }

  if (!activeJourney || !memory) {
    return <EmptyPilot />;
  }

  const context = buildPilotContext(activeJourney, memory);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/10 sm:p-8">
        <div
          aria-hidden="true"
          className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-600/30 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -left-16 bottom-[-120px] h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl"
        />

        <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold">
              <BrainCircuit size={14} />
              Pilot OS · Beta Zero-Cost
            </span>
            <h1 className="mt-6 max-w-4xl text-3xl font-bold tracking-[-0.05em] sm:text-5xl">
              Pilot non mostra dati.
              <span className="block text-blue-400">Ti dice cosa fare adesso.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Ha analizzato {context.knownFacts} informazioni, individuato {context.risks.length} attenzioni e ordinato {context.missionQueue.length} missioni per {activeJourney.property.name}.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
            <label className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              Immobile analizzato
            </label>
            <div className="relative mt-2">
              <Building2
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
              />
              <select
                value={activeJourney.id}
                onChange={(event) => activateJourney(event.target.value)}
                className="min-h-12 w-full appearance-none rounded-2xl border border-white/10 bg-slate-900/80 py-2 pl-10 pr-10 text-sm font-bold text-white outline-none focus:border-blue-400"
              >
                {journeys.map((journey) => (
                  <option key={journey.id} value={journey.id}>
                    {journey.property.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
                  <CircleGauge size={13} />
                  Health Score
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {activeJourney.healthScore}
                  <span className="text-xs text-slate-400">/100</span>
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
                  <Sparkles size={13} />
                  Prontezza
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {context.readiness.overall}
                  <span className="text-xs text-slate-400">%</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="space-y-6">
          <MissionCommandCenter context={context} />
          <PilotChat key={activeJourney.id} context={context} />
        </div>

        <aside className="space-y-6">
          <PilotReadinessCard context={context} />
          <PropertyQuickData key={activeJourney.id} journey={activeJourney} />
          <PilotTimeline events={context.timeline} />
        </aside>
      </section>

      <PilotRecommendations
        journeyId={activeJourney.id}
        recommendations={context.recommendations}
      />
    </div>
  );
}

function PilotSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-72 animate-pulse rounded-[32px] bg-slate-200" />
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="h-[620px] animate-pulse rounded-[30px] bg-slate-100" />
        <div className="h-[620px] animate-pulse rounded-[30px] bg-slate-100" />
      </div>
    </div>
  );
}

function EmptyPilot() {
  return (
    <section className="rounded-[30px] border border-slate-200 bg-white p-8 text-center shadow-sm">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <Bot size={26} />
      </span>
      <h1 className="mt-5 text-3xl font-bold text-slate-950">
        Pilot aspetta il suo primo immobile.
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
        Crea un percorso immobiliare: Pilot organizzerà missioni, memoria, rischi e suggerimenti intorno ai dati reali della pratica.
      </p>
      <Link
        href="/dashboard/properties/new"
        className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700"
      >
        Crea il primo percorso
        <ArrowRight size={17} />
      </Link>
    </section>
  );
}
