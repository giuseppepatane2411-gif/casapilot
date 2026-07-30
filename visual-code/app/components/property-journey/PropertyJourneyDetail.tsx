"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Clock3,
  FileText,
  Home,
  LandPlot,
  MapPin,
  Ruler,
  ShieldCheck,
  Sparkles,
  Store,
  Target,
  Warehouse,
} from "lucide-react";

import { useJourneys } from "@/hooks/useJourneys";
import { usePilotMemory } from "@/hooks/usePilotMemory";
import { buildPilotContext } from "@/lib/pilot-os";
import type { PilotContext } from "@/lib/pilot-os/types";
import {
  getOccupancyLabel,
  getOperationLabel,
  getPropertyLabel,
  getRequiredDocuments,
} from "@/lib/property-journey/constants";
import { getMissingDocuments } from "@/lib/property-journey/scoring";
import { updateJourneyDocuments } from "@/lib/property-journey/storage";
import type {
  DocumentKey,
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

type PropertyJourneyDetailProps = {
  journeyId: string;
};

export default function PropertyJourneyDetail({
  journeyId,
}: PropertyJourneyDetailProps) {
  const {
    hydrated,
    journeys,
    activeJourneyId,
    activateJourney,
  } = useJourneys();
  const { hydrated: memoryHydrated, memory } = usePilotMemory(journeyId);
  const journey = journeys.find((item) => item.id === journeyId) ?? null;

  if (!hydrated || !memoryHydrated) {
    return <div className="h-96 animate-pulse rounded-[30px] bg-slate-200/70" />;
  }

  if (!journey || !memory) {
    return (
      <section className="rounded-[30px] border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-slate-950">Percorso non trovato</h1>
        <p className="mt-3 text-sm text-slate-500">
          Questa pratica non è presente nel browser oppure è stata rimossa.
        </p>
        <Link
          href="/dashboard/properties"
          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white hover:bg-blue-600"
        >
          Torna agli immobili
          <ArrowRight size={16} />
        </Link>
      </section>
    );
  }

  const context = buildPilotContext(journey, memory);

  return (
    <JourneyContent
      journey={journey}
      context={context}
      active={journey.id === activeJourneyId}
      onActivate={() => activateJourney(journey.id)}
    />
  );
}

function JourneyContent({
  journey,
  context,
  active,
  onActivate,
}: {
  journey: PropertyJourney;
  context: PilotContext;
  active: boolean;
  onActivate: () => void;
}) {
  const PropertyIcon = propertyIcons[journey.property.type];
  const requiredDocuments = getRequiredDocuments(
    journey.operation,
    journey.property.type,
  );
  const missingDocuments = getMissingDocuments(journey);
  const mission = context.mission;

  function toggleDocument(documentId: DocumentKey) {
    const documents = journey.documents.includes(documentId)
      ? journey.documents.filter((item) => item !== documentId)
      : [...journey.documents, documentId];

    updateJourneyDocuments(journey.id, documents);
  }

  return (
    <div className="space-y-7">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <Link
            href="/dashboard/properties"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-950"
          >
            <ArrowLeft size={17} />
            I miei immobili
          </Link>
          <div className="mt-5 flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <PropertyIcon size={25} />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-bold text-slate-950 sm:text-4xl">{journey.property.name}</h1>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                  {getOperationLabel(journey.operation)}
                </span>
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                <MapPin size={15} />
                {journey.property.address}, {journey.property.city} ({journey.property.province})
              </p>
            </div>
          </div>
        </div>

        {!active && (
          <button
            type="button"
            onClick={onActivate}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Imposta come percorso attivo
          </button>
        )}
      </header>

      <section className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-600/15 sm:p-8">
        <div aria-hidden="true" className="absolute -right-16 -top-20 h-56 w-56 rounded-full border border-white/10" />
        <div className="relative grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-blue-100">
              <Sparkles size={16} />
              Prossima missione
            </p>
            <h2 className="mt-4 text-2xl font-bold sm:text-3xl">{mission.title}.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100">{mission.description}</p>
            <div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                <Clock3 size={14} />
                {mission.estimatedMinutes} minuti
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                <Sparkles size={14} />
                +{mission.scoreGain} punti
              </span>
            </div>
          </div>
          <Link
            href={mission.href}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-bold text-blue-700 shadow-lg hover:bg-blue-50"
          >
            {mission.actionLabel}
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-600">Dati immobile</p>
                <h2 className="mt-1 text-2xl font-bold text-slate-950">Riepilogo della pratica</h2>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                <Target size={20} />
              </span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Info label="Obiettivo" value={getOperationLabel(journey.operation)} />
              <Info label="Tipologia" value={getPropertyLabel(journey.property.type)} />
              <Info label="Superficie" value={journey.property.surface ? `${journey.property.surface} m²` : "Non indicata"} icon={Ruler} />
              <Info label="Situazione" value={getOccupancyLabel(journey.property.occupancy)} />
              <Info label="Comune" value={`${journey.property.city}, ${journey.property.province}`} icon={MapPin} />
              <Info label="Paese" value={journey.property.country} />
            </div>
          </article>

          <article id="documents" className="scroll-mt-28 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-semibold text-blue-600">Documenti</p>
                <h2 className="mt-1 text-2xl font-bold text-slate-950">Checklist personalizzata</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Seleziona un documento quando è disponibile. Punteggio, avanzamento e missione si aggiornano subito.
                </p>
              </div>
              <span className="text-sm font-bold text-slate-500">
                {journey.documents.length} di {requiredDocuments.length}
              </span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {requiredDocuments.map((document) => {
                const selected = journey.documents.includes(document.id);

                return (
                  <button
                    key={document.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleDocument(document.id)}
                    className={`flex min-h-28 items-start gap-3 rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 ${
                      selected
                        ? "border-emerald-300 bg-emerald-50/70"
                        : "border-slate-200 bg-white hover:border-blue-200 hover:shadow-md"
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        selected ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {selected ? <Check size={18} strokeWidth={2.8} /> : <FileText size={18} />}
                    </span>
                    <span>
                      <span className="block font-bold text-slate-950">{document.title}</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">{document.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">
              La checklist è uno strumento organizzativo iniziale e non sostituisce la verifica di un professionista abilitato.
            </p>
          </article>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <section className="rounded-[28px] bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/10">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              <ShieldCheck size={16} />
              Health Score
            </p>
            <p className="mt-4 text-5xl font-bold tracking-[-0.06em]">
              {journey.healthScore}
              <span className="ml-1 text-sm text-slate-400">/100</span>
            </p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-blue-500" style={{ width: `${journey.healthScore}%` }} />
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              {missingDocuments.length > 0
                ? `Puoi migliorarlo recuperando ${missingDocuments.length} documenti della checklist.`
                : "La documentazione iniziale risulta completa."}
            </p>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-blue-600">Avanzamento</p>
            <div className="mt-3 flex items-end justify-between">
              <p className="text-3xl font-bold text-slate-950">{journey.progress}%</p>
              <p className="text-right text-xs leading-5 text-slate-500">
                {journey.completedActivities}/{journey.totalActivities}
                <br />attività
              </p>
            </div>
            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-blue-600" style={{ width: `${journey.progress}%` }} />
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}

type InfoProps = {
  label: string;
  value: string;
  icon?: LucideIcon;
};

function Info({ label, value, icon: Icon }: InfoProps) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.09em] text-slate-400">
        {Icon && <Icon size={14} />}
        {label}
      </p>
      <p className="mt-2 font-bold text-slate-950">{value}</p>
    </div>
  );
}
