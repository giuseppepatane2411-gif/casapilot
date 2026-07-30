"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Check,
  ChevronRight,
  Clock3,
  FileCheck2,
  FileText,
  Home,
  LandPlot,
  MapPin,
  Plus,
  Sparkles,
  Store,
  Warehouse,
} from "lucide-react";

import PilotCard from "@/components/dashboard/PilotCard";
import { useJourneys } from "@/hooks/useJourneys";
import { usePilotMemory } from "@/hooks/usePilotMemory";
import { buildPilotContext } from "@/lib/pilot-os";
import type { PilotContext } from "@/lib/pilot-os/types";
import {
  getOperationLabel,
  getRequiredDocuments,
} from "@/lib/property-journey/constants";
import { getMissingDocuments } from "@/lib/property-journey/scoring";
import type {
  PropertyJourney,
  PropertyType,
} from "@/lib/property-journey/types";

const propertyIcons: Record<PropertyType, LucideIcon> = {
  apartment: Building2,
  house: Home,
  commercial: Store,
  land: LandPlot,
  garage: Warehouse,
};

export default function DashboardOverview() {
  const { hydrated, activeJourney } = useJourneys();
  const { hydrated: memoryHydrated, memory } = usePilotMemory(
    activeJourney?.id ?? null,
  );

  if (!hydrated || !memoryHydrated) return <DashboardSkeleton />;
  if (!activeJourney || !memory) return <EmptyDashboard />;

  const context = buildPilotContext(activeJourney, memory);
  return <ActiveDashboard journey={activeJourney} context={context} />;
}

function ActiveDashboard({
  journey,
  context,
}: {
  journey: PropertyJourney;
  context: PilotContext;
}) {
  const mission = context.mission;
  const requiredDocuments = getRequiredDocuments(
    journey.operation,
    journey.property.type,
  );
  const missingDocuments = getMissingDocuments(journey);
  const availableDocuments = requiredDocuments.length - missingDocuments.length;
  const PropertyIcon = propertyIcons[journey.property.type];

  const recentActivities = context.timeline.slice(0, 4).map((event) => ({
    title: event.title,
    description: event.description,
    time: formatDate(event.date),
  }));

  return (
    <div className="space-y-7">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
            <Sparkles size={14} />
            Percorso attivo
          </div>
          <h1 className="text-3xl font-bold tracking-[-0.045em] text-slate-950 sm:text-4xl">
            Buongiorno, Giuseppe.
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
            La preparazione di {journey.property.name} è al {journey.progress}%. Concentrati su una sola missione alla volta.
          </p>
        </div>

        <Link
          href="/dashboard/properties/new"
          className="inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:-translate-y-0.5 hover:bg-blue-700 sm:self-auto"
        >
          <Plus size={18} />
          Nuovo percorso
        </Link>
      </section>

      <section className="relative overflow-hidden rounded-[30px] border border-blue-200 bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-600/15 sm:p-8">
        <div aria-hidden="true" className="absolute -right-20 -top-20 h-64 w-64 rounded-full border border-white/10" />
        <div aria-hidden="true" className="absolute -right-8 top-4 h-40 w-40 rounded-full border border-white/10" />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-100">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15">
                <Sparkles size={16} />
              </span>
              Missione di oggi
            </div>
            <h2 className="mt-5 max-w-2xl text-2xl font-bold tracking-[-0.04em] sm:text-3xl">
              {mission.title}.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">
              {mission.description}
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs font-semibold">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                <Clock3 size={14} />
                {mission.estimatedMinutes} minuti
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                <Sparkles size={14} />
                +{mission.scoreGain} Health Score
              </span>
            </div>
          </div>

          <Link
            href={mission.href}
            className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-bold text-blue-700 shadow-lg hover:-translate-y-0.5 hover:bg-blue-50"
          >
            Inizia la missione
            <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.75fr)]">
        <div className="space-y-6">
          <article className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5 sm:p-7">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                <div className="flex min-w-0 gap-4">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <PropertyIcon size={25} />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">
                        {journey.property.name}
                      </h2>
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                        {getOperationLabel(journey.operation)}
                      </span>
                    </div>
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                      <MapPin size={15} />
                      {journey.property.city}, {journey.property.province}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/dashboard/properties/${journey.id}`}
                  className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-xl border border-slate-200 px-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Apri percorso
                  <ChevronRight size={16} />
                </Link>
              </div>
            </div>

            <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_220px]">
              <div>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">Avanzamento generale</p>
                    <p className="mt-1 text-3xl font-bold text-slate-950">{journey.progress}%</p>
                  </div>
                  <p className="text-right text-xs leading-5 text-slate-500">
                    {journey.completedActivities} di {journey.totalActivities} attività
                    <br />
                    completate
                  </p>
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-blue-600" style={{ width: `${journey.progress}%` }} />
                </div>

                <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                      <FileText size={18} />
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">Prossimo passo</p>
                      <p className="mt-1 font-semibold text-slate-900">{mission.title}</p>
                    </div>
                  </div>
                  <Link
                    href={mission.href}
                    className="mt-4 inline-flex min-h-10 items-center gap-1 rounded-xl bg-white px-3.5 text-sm font-bold text-blue-700 shadow-sm hover:bg-blue-50 sm:mt-0"
                  >
                    Continua
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-3xl bg-slate-950 p-5 text-white">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Health Score</p>
                  <div className="mt-4 flex items-end gap-1">
                    <span className="text-5xl font-bold tracking-[-0.06em]">{journey.healthScore}</span>
                    <span className="pb-1.5 text-sm text-slate-400">/100</span>
                  </div>
                </div>
                <div className="mt-8">
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${journey.healthScore}%` }} />
                  </div>
                  <p className="mt-3 text-xs leading-5 text-slate-300">
                    {missingDocuments.length > 0
                      ? `Mancano ${missingDocuments.length} documenti della checklist iniziale.`
                      : "La checklist iniziale è completa."}
                  </p>
                </div>
              </div>
            </div>
          </article>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-semibold text-blue-600">Cronologia</p>
                <h2 className="mt-1 text-xl font-bold text-slate-950">Attività recenti</h2>
              </div>
              <Link href={`/dashboard/properties/${journey.id}`} className="text-sm font-bold text-slate-500 hover:text-blue-600">
                Apri la pratica
              </Link>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {recentActivities.slice(0, 4).map((activity, index) => (
                <div key={`${activity.title}-${index}`} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check size={17} strokeWidth={2.5} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{activity.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{activity.description}</p>
                    <p className="mt-2 text-xs font-medium text-slate-400">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <PilotCard
            message={`Per ${journey.property.name} ti consiglio di concentrarti su: ${mission.title.toLowerCase()}.`}
            suggestion={
              missingDocuments.length > 0
                ? "Aggiorna la checklist appena recuperi un documento: il punteggio cambierà automaticamente."
                : "La documentazione iniziale è in ordine. Possiamo passare alla preparazione dell’annuncio."
            }
          />

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-600">Documenti</p>
                <h2 className="mt-1 text-xl font-bold text-slate-950">Stato pratica</h2>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <FileCheck2 size={20} />
              </span>
            </div>

            <div className="mt-6 space-y-4">
              <DocumentStatus label="Disponibili" value={availableDocuments} detail="Segnati nella checklist" status="success" />
              <DocumentStatus label="Mancanti" value={missingDocuments.length} detail="Da recuperare" status="danger" />
              <DocumentStatus label="Totale" value={requiredDocuments.length} detail="Checklist personalizzata" status="neutral" />
            </div>

            <Link
              href={`/dashboard/properties/${journey.id}#documents`}
              className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Aggiorna la checklist
              <ArrowRight size={16} />
            </Link>
          </section>
        </div>
      </section>
    </div>
  );
}

function EmptyDashboard() {
  return (
    <div className="space-y-7">
      <section>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
          <Sparkles size={14} />
          Dashboard personale
        </div>
        <h1 className="text-3xl font-bold tracking-[-0.045em] text-slate-950 sm:text-4xl">Buongiorno, Giuseppe.</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
          Non hai ancora una pratica attiva. Inizia con poche informazioni: Pilot costruirà il percorso intorno al tuo immobile.
        </p>
      </section>

      <section className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-600/15 sm:p-9">
        <div aria-hidden="true" className="absolute -right-20 -top-20 h-64 w-64 rounded-full border border-white/10" />
        <div className="relative max-w-3xl">
          <p className="flex items-center gap-2 text-sm font-semibold text-blue-100">
            <Sparkles size={16} />
            La tua prima missione
          </p>
          <h2 className="mt-5 text-3xl font-bold sm:text-4xl">Crea il tuo primo percorso immobiliare.</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">
            Scegli se vuoi vendere o affittare, descrivi l’immobile e indica i documenti che possiedi già. Servono meno di tre minuti.
          </p>
          <Link
            href="/dashboard/properties/new"
            className="group mt-7 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-white px-5 text-sm font-bold text-blue-700 shadow-lg hover:-translate-y-0.5 hover:bg-blue-50"
          >
            Inizia adesso
            <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <p className="text-sm font-semibold text-blue-600">Come funziona</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">Un percorso, non cento cose insieme.</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              [Building2, "Descrivi l’immobile", "Inserisci solo i dati essenziali."],
              [FileText, "Segna i documenti", "Indica ciò che hai già disponibile."],
              [Sparkles, "Segui Pilot", "Ricevi una missione chiara alla volta."],
            ].map(([Icon, title, description]) => {
              const CardIcon = Icon as LucideIcon;
              return (
                <article key={title as string} className="rounded-2xl bg-slate-50 p-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                    <CardIcon size={19} />
                  </span>
                  <h3 className="mt-4 font-bold text-slate-950">{title as string}</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{description as string}</p>
                </article>
              );
            })}
          </div>
        </div>
        <PilotCard />
      </section>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-label="Caricamento dashboard">
      <div className="h-24 animate-pulse rounded-3xl bg-slate-200/70" />
      <div className="h-64 animate-pulse rounded-[30px] bg-slate-200/70" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-80 animate-pulse rounded-[28px] bg-slate-200/70" />
        <div className="h-80 animate-pulse rounded-[28px] bg-slate-200/70" />
      </div>
    </div>
  );
}

type DocumentStatusProps = {
  label: string;
  value: number;
  detail: string;
  status: "success" | "danger" | "neutral";
};

function DocumentStatus({ label, value, detail, status }: DocumentStatusProps) {
  const styles = {
    success: "bg-emerald-100 text-emerald-700",
    danger: "bg-rose-100 text-rose-700",
    neutral: "bg-slate-100 text-slate-700",
  };

  return (
    <div className="flex items-center gap-3">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${styles[status]}`}>
        {value}
      </span>
      <div>
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">{detail}</p>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
