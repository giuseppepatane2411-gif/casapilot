"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Building2, ChevronDown } from "lucide-react";

import MissionCommandCenter from "@/components/pilot-os/MissionCommandCenter";
import PilotChat from "@/components/pilot-os/PilotChat";
import PilotReadinessCard from "@/components/pilot-os/PilotReadinessCard";
import PilotRecommendations from "@/components/pilot-os/PilotRecommendations";
import PilotTimeline from "@/components/pilot-os/PilotTimeline";
import PropertyQuickData from "@/components/pilot-os/PropertyQuickData";
import { useJourneys } from "@/hooks/useJourneys";
import { usePilotMemory } from "@/hooks/usePilotMemory";
import { markProductMilestone, trackProductEvent } from "@/lib/product/storage";
import { buildPilotContext } from "@/lib/pilot-os";

export default function PilotOSWorkspace() {
  const { hydrated: journeysHydrated, journeys, activeJourney, activateJourney } = useJourneys();
  const activeJourneyId = activeJourney?.id ?? null;
  const { hydrated: memoryHydrated, memory } = usePilotMemory(activeJourneyId);

  useEffect(() => {
    if (!activeJourneyId) return;
    markProductMilestone("pilot-opened");
    trackProductEvent("pilot-opened", { journeyId: activeJourneyId });
  }, [activeJourneyId]);

  if (!journeysHydrated || !memoryHydrated) return <PilotSkeleton />;
  if (!activeJourney || !memory) return <EmptyPilot />;

  const context = buildPilotContext(activeJourney, memory);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">ia</p>
          <h1 className="mt-1 text-3xl font-bold tracking-[-0.04em] text-slate-950 sm:text-4xl">
            Chiedi quello che non è chiaro.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Scrivi come parleresti a una persona. Guimmia userà ciò che sa del tuo immobile per orientarti.
          </p>
        </div>

        {journeys.length > 1 && (
          <div className="relative w-full sm:w-64">
            <Building2 size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={activeJourney.id}
              onChange={(event) => activateJourney(event.target.value)}
              className="min-h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-9 text-sm font-bold text-slate-900 outline-none focus:border-blue-400"
            >
              {journeys.map((journey) => (
                <option key={journey.id} value={journey.id}>{journey.property.name}</option>
              ))}
            </select>
            <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        )}
      </header>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        <span className="font-bold">Guimmia sta guardando:</span> {activeJourney.property.name}
      </div>

      <PilotChat key={activeJourney.id} context={context} />

      <details className="group rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 text-sm font-bold text-slate-700 [&::-webkit-details-marker]:hidden">
          <span>Vedi analisi e strumenti avanzati</span>
          <ChevronDown size={17} className="text-slate-400 transition-transform group-open:rotate-180" />
        </summary>
        <div className="space-y-5 border-t border-slate-100 p-4 sm:p-5">
          <MissionCommandCenter context={context} />
          <div className="grid gap-4 lg:grid-cols-2">
            <PilotReadinessCard context={context} />
            <PropertyQuickData key={activeJourney.id} journey={activeJourney} />
          </div>
          <PilotRecommendations journeyId={activeJourney.id} recommendations={context.recommendations} />
          <PilotTimeline events={context.timeline} />
        </div>
      </details>
    </div>
  );
}

function PilotSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="h-28 animate-pulse rounded-[24px] bg-slate-200" />
      <div className="h-[520px] animate-pulse rounded-[30px] bg-slate-100" />
    </div>
  );
}

function EmptyPilot() {
  return (
    <section className="mx-auto max-w-3xl rounded-[30px] border border-slate-200 bg-white p-8 text-center shadow-sm">
      <h1 className="text-3xl font-bold text-slate-950">Prima raccontaci del tuo immobile.</h1>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
        Appena avremo le informazioni essenziali, Guimmia potrà aiutarti con dubbi, documenti e prossimi passi.
      </p>
      <Link
        href="/dashboard/properties/new"
        className="mt-6 inline-flex min-h-12 items-center rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700"
      >
        Inizia
      </Link>
    </section>
  );
}

