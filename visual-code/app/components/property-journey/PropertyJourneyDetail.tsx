"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  FileText,
  Home,
  LandPlot,
  MapPin,
  Ruler,
  Store,
  Warehouse,
} from "lucide-react";

import { useJourneys } from "@/hooks/useJourneys";
import PropertyManagementPanel from "@/components/property-journey/PropertyManagementPanel";
import PropertyLocationMap from "@/components/property-wizard/PropertyLocationMap";
import {
  getOccupancyLabel,
  getOperationLabel,
  getPropertyLabel,
  getRequiredDocuments,
} from "@/lib/property-journey/constants";
import { getMissingDocuments } from "@/lib/property-journey/scoring";
import type { PropertyType } from "@/lib/property-journey/types";

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

export default function PropertyJourneyDetail({ journeyId }: PropertyJourneyDetailProps) {
  const { hydrated, journeys, activeJourneyId, activateJourney } = useJourneys();
  const journey = journeys.find((item) => item.id === journeyId) ?? null;

  if (!hydrated) {
    return <div className="h-96 animate-pulse rounded-[30px] bg-slate-200/70" />;
  }

  if (!journey) {
    return (
      <section className="rounded-[30px] border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-slate-950">Immobile non trovato</h1>
        <p className="mt-3 text-sm text-slate-500">
          Questo immobile non è presente nel browser oppure è stato rimosso.
        </p>
        <Link
          href="/dashboard/properties"
          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white hover:bg-blue-600"
        >
          Torna ai miei immobili
          <ArrowRight size={16} />
        </Link>
      </section>
    );
  }

  const PropertyIcon = propertyIcons[journey.property.type];
  const active = activeJourneyId === journey.id;
  const requiredDocuments = getRequiredDocuments(journey.operation, journey.property.type);
  const missingDocuments = getMissingDocuments(journey);
  const availableDocuments = Math.max(0, requiredDocuments.length - missingDocuments.length);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <Link
          href="/dashboard/properties"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-950"
        >
          <ArrowLeft size={17} />
          I miei immobili
        </Link>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <PropertyIcon size={25} />
            </span>
            <div>
              <h1 className="text-3xl font-bold text-slate-950 sm:text-4xl">{journey.property.name}</h1>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                <MapPin size={15} />
                {journey.property.city}, {journey.property.province}
              </p>
            </div>
          </div>

          {!active && (
            <button
              type="button"
              onClick={() => activateJourney(journey.id)}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Usa questo immobile
            </button>
          )}
        </div>
      </header>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div>
          <p className="text-sm font-semibold text-blue-600">Informazioni dell’immobile</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">Quello che CasaPilot sa già</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Questi dati servono a personalizzare documenti e prossimi passi.
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Info label="Obiettivo" value={getOperationLabel(journey.operation)} />
          <Info label="Tipologia" value={getPropertyLabel(journey.property.type)} />
          <Info label="Superficie" value={journey.property.surface ? `${journey.property.surface} m²` : "Non indicata"} icon={Ruler} />
          <Info label="Situazione" value={getOccupancyLabel(journey.property.occupancy)} />
          <Info label="Comune" value={`${journey.property.city}, ${journey.property.province}`} icon={MapPin} />
          <Info label="Indirizzo" value={journey.property.address || "Non indicato"} />
          <Info label="Foglio" value={journey.property.cadastralSheet || "Non indicato"} />
          <Info label="Particella / mappale" value={journey.property.cadastralParcel || "Non indicata"} />
          <Info label="Subalterno" value={journey.property.cadastralSubaltern || "Non indicato"} />
          <Info
            label="Posizione mappa"
            value={journey.property.locationVerified ? "Confermata" : journey.property.latitude !== null ? "Da verificare" : "Non indicata"}
            icon={MapPin}
          />
        </div>
      </section>

      {(journey.property.latitude !== null && journey.property.longitude !== null) && (
        <PropertyLocationMap
          latitude={journey.property.latitude ?? null}
          longitude={journey.property.longitude ?? null}
          verified={journey.property.locationVerified}
          locationLabel={journey.property.locationLabel}
          searchQuery={[
            journey.property.address,
            journey.property.postalCode,
            journey.property.city,
            journey.property.province,
            journey.property.country,
          ]
            .filter(Boolean)
            .join(", ")}
          onChange={() => undefined}
          compact
          readOnly
        />
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/dashboard"
          onClick={() => activateJourney(journey.id)}
          className="group rounded-[26px] bg-slate-950 p-5 text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-700"
        >
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400 group-hover:text-blue-100">Percorso</p>
          <p className="mt-2 text-xl font-bold">Continua dal prossimo passo</p>
          <p className="mt-2 text-sm leading-6 text-slate-300 group-hover:text-blue-100">
            CasaPilot ti mostra una sola priorità alla volta.
          </p>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold">
            Vai al percorso
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </span>
        </Link>

        <Link
          href="/dashboard/documents"
          onClick={() => activateJourney(journey.id)}
          className="group rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <FileText size={18} />
          </span>
          <p className="mt-4 text-xl font-bold text-slate-950">Documenti</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {availableDocuments} di {requiredDocuments.length} disponibili · {missingDocuments.length} da recuperare.
          </p>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-600">
            Apri documenti
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
      </section>

      <PropertyManagementPanel journey={journey} />
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
