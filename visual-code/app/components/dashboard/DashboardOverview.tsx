"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BadgeEuro,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  KeyRound,
  Sparkles,
} from "lucide-react";

import { useJourneys } from "@/hooks/useJourneys";
import GuimmiaOrchestrationCard from "@/components/guimmia/GuimmiaOrchestrationCard";
import GoalProgressCard from "@/components/property-journey/GoalProgressCard";
import { usePilotMemory } from "@/hooks/usePilotMemory";
import { buildPilotContext } from "@/lib/pilot-os";
import { markProductMilestone, trackProductEvent } from "@/lib/product/storage";
import {
  addPilotTimelineEvent,
  completePilotMission,
} from "@/lib/pilot-os/store";
import type { PilotContext } from "@/lib/pilot-os/types";
import { getOperationLabel, getRequiredDocuments } from "@/lib/property-journey/constants";
import { getMissingDocuments } from "@/lib/property-journey/scoring";
import type { PropertyJourney } from "@/lib/property-journey/types";

export default function DashboardOverview() {
  const searchParams = useSearchParams();
  const { hydrated, activeJourney } = useJourneys();
  const { hydrated: memoryHydrated, memory } = usePilotMemory(activeJourney?.id ?? null);

  if (!hydrated || !memoryHydrated) return <DashboardSkeleton />;
  if (!activeJourney || !memory) return <EmptyDashboard />;

  return (
    <ActiveDashboard
      journey={activeJourney}
      context={buildPilotContext(activeJourney, memory)}
      justCreated={searchParams.get("created") === activeJourney.id}
    />
  );
}

function ActiveDashboard({
  journey,
  context,
  justCreated,
}: {
  journey: PropertyJourney;
  context: PilotContext;
  justCreated: boolean;
}) {
  const mission = context.mission;
  const nextMission = context.missionQueue[1] ?? null;
  const currentPhaseIndex = Math.max(
    1,
    context.goalProgress.phases.findIndex(
      (phase) => phase.id === context.goalProgress.currentPhaseId,
    ) + 1,
  );
  const requiredDocuments = getRequiredDocuments(journey.operation, journey.property.type);
  const missingDocuments = getMissingDocuments(journey);
  const availableDocuments = Math.max(0, requiredDocuments.length - missingDocuments.length);

  function completeManualMission() {
    if (!mission.canCompleteManually) return;

    completePilotMission(journey.id, mission.id);
    addPilotTimelineEvent(journey.id, {
      id: `mission-${mission.id}`,
      title: "Fase aggiornata",
      description: mission.title,
      type: "mission",
    });
    markProductMilestone("mission-completed");
    trackProductEvent("mission-completed", {
      journeyId: journey.id,
      metadata: { missionId: mission.id },
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {justCreated && (
        <section className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white">
              <Sparkles size={18} />
            </span>
            <div>
              <p className="font-bold text-emerald-950">Il tuo percorso è pronto.</p>
              <p className="mt-1 text-sm leading-6 text-emerald-800">
                Non devi imparare Guimmia: completa il passo evidenziato e il successivo comparirà da solo.
              </p>
            </div>
          </div>
        </section>
      )}

      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">Percorso</p>
          <h1 className="mt-1 text-3xl font-bold tracking-[-0.045em] text-slate-950 sm:text-4xl">
            Una cosa alla volta.
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
            Guimmia tiene il resto in ordine mentre tu pensi solo al prossimo passo.
          </p>
        </div>
        <Link
          href={`/dashboard/properties/${journey.id}`}
          className="inline-flex min-h-11 items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 sm:self-auto"
        >
          <Building2 size={16} />
          <span className="max-w-52 truncate">{journey.property.name}</span>
        </Link>
      </header>

      <GoalProgressCard progress={context.goalProgress} />

      <GuimmiaOrchestrationCard
        journey={journey}
        currentPhase={context.goalProgress.currentPhaseId}
      />

      <section className="overflow-hidden rounded-[30px] border border-blue-200 bg-white shadow-xl shadow-blue-600/[0.06]">
        <div className="flex items-center justify-between gap-4 bg-blue-600 px-5 py-4 text-white sm:px-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-100">Attività operativa</p>
            <p className="mt-1 text-sm font-semibold text-white/90">Fase {currentPhaseIndex} di {context.goalProgress.phases.length}</p>
          </div>
          <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">
            ~ {mission.estimatedMinutes} min
          </span>
        </div>

        <div className="p-5 sm:p-8">
          <h2 className="max-w-3xl text-2xl font-bold tracking-[-0.035em] text-slate-950 sm:text-3xl">
            {mission.title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            {mission.description}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">Perché adesso</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{mission.reason}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-emerald-700">Quando hai finito</p>
              <p className="mt-2 text-sm leading-6 text-emerald-800">
                Torna qui: Guimmia aggiornerà il percorso e ti mostrerà automaticamente cosa viene dopo.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            {mission.canCompleteManually ? (
              <button
                type="button"
                onClick={completeManualMission}
                className="group inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-7 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-blue-700"
              >
                <CheckCircle2 size={18} />
                {mission.actionLabel}
              </button>
            ) : (
              <Link
                href={mission.href}
                className="group inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-7 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-blue-700"
              >
                {mission.actionLabel || "Inizia questo passo"}
                <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}
            <p className="flex items-center gap-2 text-xs leading-5 text-slate-400">
              <Clock3 size={14} />
              Puoi interrompere e riprendere quando vuoi.
            </p>
          </div>
        </div>
      </section>

      {nextMission && (
        <section className="flex items-center gap-4 rounded-[22px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
            <ArrowRight size={17} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">Dopo</p>
            <p className="mt-1 truncate text-sm font-bold text-slate-900">{nextMission.title}</p>
          </div>
        </section>
      )}

      <details className="group rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 text-sm font-bold text-slate-700 [&::-webkit-details-marker]:hidden">
          <span>Vedi il riepilogo della pratica</span>
          <ChevronDown size={17} className="text-slate-400 transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t border-slate-100 p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <DetailCard label="Obiettivo" value={getOperationLabel(journey.operation)} />
            <DetailCard label="Documenti" value={`${availableDocuments}/${requiredDocuments.length} disponibili`} />
            <DetailCard label="Verso l’obiettivo" value={`${context.goalProgress.overall}%`} />
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Link
              href="/dashboard/documents"
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              <FileText size={16} />
              Vedi documenti
            </Link>
            <Link
              href={`/dashboard/properties/${journey.id}`}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              <Building2 size={16} />
              Vedi dati dell’immobile
            </Link>
          </div>
        </div>
      </details>
    </div>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <p className="mt-1 font-bold text-slate-950">{value}</p>
    </div>
  );
}

function EmptyDashboard() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 py-2 sm:py-6">
      <section className="text-center">
        <p className="text-sm font-semibold text-blue-600">Benvenuto in Guimmia</p>
        <h1 className="mx-auto mt-2 max-w-3xl text-3xl font-bold tracking-[-0.045em] text-slate-950 sm:text-5xl">
          Cosa vuoi fare con il tuo immobile?
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-500 sm:text-base">
          Scegli l’obiettivo. Ti faremo poche domande e poi ti guideremo un passo alla volta.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <GoalCard
          href="/dashboard/properties/new?goal=sale"
          icon={BadgeEuro}
          title="Voglio vendere"
          text="Prepara l’immobile e i documenti senza chiederti da dove iniziare."
        />
        <GoalCard
          href="/dashboard/properties/new?goal=rent"
          icon={KeyRound}
          title="Voglio affittare"
          text="Organizza ciò che serve e segui il prossimo passo suggerito."
        />
      </section>

      <section className="rounded-[22px] border border-slate-200 bg-white px-5 py-4 text-center shadow-sm">
        <p className="text-sm font-semibold text-slate-600">
          1. Raccontaci l’immobile <span className="mx-2 text-slate-300">→</span> 2. Guimmia prepara il percorso <span className="mx-2 text-slate-300">→</span> 3. Segui un passo alla volta
        </p>
      </section>

      <p className="text-center text-xs leading-5 text-slate-400">
        Puoi correggere i dati o cambiare obiettivo in qualsiasi momento.
      </p>
    </div>
  );
}

function GoalCard({
  href,
  icon: Icon,
  title,
  text,
}: {
  href: string;
  icon: typeof BadgeEuro;
  title: string;
  text: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg sm:p-7"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
        <Icon size={22} />
      </span>
      <h2 className="mt-5 text-2xl font-bold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
      <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-blue-600">
        Inizia
        <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="h-20 animate-pulse rounded-[24px] bg-slate-200/70" />
      <div className="h-80 animate-pulse rounded-[30px] bg-slate-200/70" />
      <div className="h-20 animate-pulse rounded-[22px] bg-slate-100" />
    </div>
  );
}
