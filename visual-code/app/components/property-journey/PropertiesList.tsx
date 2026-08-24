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
import { getOperationLabel, getPropertyLabel } from "@/lib/property-journey/constants";
import type { PropertyType } from "@/lib/property-journey/types";

const propertyIcons: Record<PropertyType, LucideIcon> = {
  apartment: Building2,
  house: Home,
  commercial: Store,
  land: LandPlot,
  garage: Warehouse,
};

export default function PropertiesList() {
  const { hydrated, journeys, activeJourneyId, activateJourney } = useJourneys();

  if (!hydrated) {
    return <div className="h-72 animate-pulse rounded-[28px] bg-slate-200/70" />;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-blue-600">I miei immobili</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950 sm:text-4xl">
            Tutti gli immobili che stai seguendo.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Scegli un immobile per vedere i suoi dati. Ogni pratica resta separata, così trovi subito ciò che ti serve.
          </p>
        </div>

        <Link
          href="/dashboard/properties/new"
          className="inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 sm:self-auto"
        >
          <Plus size={18} />
          Crea il tuo immobile
        </Link>
      </header>

      {journeys.length === 0 ? (
        <section className="rounded-[30px] border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm sm:p-12">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
            <Building2 size={28} />
          </span>
          <h2 className="mt-5 text-2xl font-bold text-slate-950">Crea il tuo primo immobile</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">
            Bastano poche informazioni. Poi Guimmia preparerà il tuo percorso.
          </p>
          <Link
            href="/dashboard/properties/new"
            className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white hover:bg-blue-600"
          >
            Inizia
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
                className={`rounded-[28px] border bg-white p-5 shadow-sm transition-all sm:p-6 ${
                  active ? "border-blue-300 ring-4 ring-blue-50" : "border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <Icon size={22} />
                  </span>
                  {active && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                      <CheckCircle2 size={13} />
                      Immobile attivo
                    </span>
                  )}
                </div>

                <h2 className="mt-5 text-xl font-bold text-slate-950">{journey.property.name}</h2>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                  <MapPin size={15} />
                  {journey.property.city}, {journey.property.province}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {getPropertyLabel(journey.property.type)} · {getOperationLabel(journey.operation)}
                </p>

                <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                  <Link
                    href={`/dashboard/properties/${journey.id}`}
                    onClick={() => activateJourney(journey.id)}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white hover:bg-blue-600"
                  >
                    Vedi l’immobile
                    <ArrowRight size={16} />
                  </Link>
                  {!active && (
                    <button
                      type="button"
                      onClick={() => activateJourney(journey.id)}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Usa questa
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
