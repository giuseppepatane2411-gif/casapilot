"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Home,
  LandPlot,
  MapPin,
  Plus,
  Store,
  Warehouse,
} from "lucide-react";

import { useJourneys } from "@/hooks/useJourneys";
import {
  getOperationLabel,
  getPropertyLabel,
} from "@/lib/property-journey/constants";
import type { PropertyType } from "@/lib/property-journey/types";

const propertyIcons: Record<PropertyType, LucideIcon> = {
  apartment: Building2,
  house: Home,
  commercial: Store,
  land: LandPlot,
  garage: Warehouse,
};

export default function PropertiesList() {
  const {
    hydrated,
    journeys,
    activeJourneyId,
    activateJourney,
  } = useJourneys();

  if (!hydrated) {
    return <div className="h-72 animate-pulse rounded-[28px] bg-slate-200/70" />;
  }

  return (
    <div className="space-y-7">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-blue-600">Le tue pratiche</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950 sm:text-4xl">
            I miei immobili
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Ogni immobile ha la propria checklist, il proprio punteggio e una missione attiva.
          </p>
        </div>

        <Link
          href="/dashboard/properties/new"
          className="inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:-translate-y-0.5 hover:bg-blue-700 sm:self-auto"
        >
          <Plus size={18} />
          Nuovo percorso
        </Link>
      </header>

      {journeys.length === 0 ? (
        <section className="rounded-[30px] border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm sm:p-12">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
            <Building2 size={28} />
          </span>
          <h2 className="mt-5 text-2xl font-bold text-slate-950">Nessun immobile ancora</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">
            Crea il primo percorso per vedere qui lo stato della pratica e le prossime attività.
          </p>
          <Link
            href="/dashboard/properties/new"
            className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white hover:bg-blue-600"
          >
            Crea il primo percorso
            <ArrowRight size={17} />
          </Link>
        </section>
      ) : (
        <section className="grid gap-5 lg:grid-cols-2">
          {journeys.map((journey) => {
            const Icon = propertyIcons[journey.property.type];
            const active = journey.id === activeJourneyId;

            return (
              <article
                key={journey.id}
                className={`overflow-hidden rounded-[28px] border bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                  active ? "border-blue-300 ring-4 ring-blue-50" : "border-slate-200"
                }`}
              >
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <Icon size={23} />
                    </span>
                    {active && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                        <CheckCircle2 size={13} />
                        Attivo
                      </span>
                    )}
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-950">{journey.property.name}</h2>
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                      {getOperationLabel(journey.operation)}
                    </span>
                  </div>

                  <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                    <MapPin size={15} />
                    {journey.property.city}, {journey.property.province}
                  </p>

                  <div className="mt-6 grid grid-cols-3 gap-3 rounded-2xl bg-slate-50 p-4 text-center">
                    <Stat label="Tipologia" value={getPropertyLabel(journey.property.type)} />
                    <Stat label="Avanzamento" value={`${journey.progress}%`} />
                    <Stat label="Health Score" value={`${journey.healthScore}/100`} />
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <Link
                      href={`/dashboard/properties/${journey.id}`}
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white hover:bg-blue-600"
                    >
                      Apri percorso
                      <ArrowRight size={16} />
                    </Link>
                    {!active && (
                      <button
                        type="button"
                        onClick={() => activateJourney(journey.id)}
                        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"
                      >
                        Imposta attivo
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}
