"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, MapPin, Ruler, Save, UserRound } from "lucide-react";

import { OCCUPANCY_OPTIONS } from "@/lib/property-journey/constants";
import { updateJourneyProperty } from "@/lib/property-journey/storage";
import type {
  OccupancyStatus,
  PropertyJourney,
} from "@/lib/property-journey/types";
import { addPilotTimelineEvent } from "@/lib/pilot-os/store";

type PropertyQuickDataProps = {
  journey: PropertyJourney;
};

export default function PropertyQuickData({
  journey,
}: PropertyQuickDataProps) {
  const [surface, setSurface] = useState(
    journey.property.surface?.toString() ?? "",
  );
  const [occupancy, setOccupancy] = useState<OccupancyStatus | "">(
    journey.property.occupancy ?? "",
  );
  const [address, setAddress] = useState(journey.property.address);
  const [postalCode, setPostalCode] = useState(journey.property.postalCode);
  const [province, setProvince] = useState(journey.property.province);
  const [saved, setSaved] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    updateJourneyProperty(journey.id, {
      surface: surface.trim() ? Number(surface) : null,
      occupancy: occupancy || null,
      address: address.trim(),
      postalCode: postalCode.trim(),
      province: province.trim(),
    });
    addPilotTimelineEvent(journey.id, {
      title: "Profilo immobile aggiornato",
      description:
        "Guimmia ha ricalcolato contesto, prontezza e prossime missioni.",
      type: "mission",
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  return (
    <section
      id="property-data"
      className="scroll-mt-24 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-600">Contesto Guimmia</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">
            Dati essenziali
          </h2>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <UserRound size={19} />
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        Completa questi dati: Guimmia aggiornerà immediatamente analisi e priorità.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <Field label="Superficie (m²)" icon={Ruler}>
          <input
            type="number"
            min="1"
            value={surface}
            onChange={(event) => setSurface(event.target.value)}
            placeholder="Es. 85"
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          />
        </Field>

        <Field label="Situazione" icon={UserRound}>
          <select
            value={occupancy}
            onChange={(event) =>
              setOccupancy(event.target.value as OccupancyStatus | "")
            }
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          >
            <option value="">Seleziona</option>
            {OCCUPANCY_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Indirizzo" icon={MapPin}>
          <input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="Via e numero civico"
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="CAP">
            <input
              value={postalCode}
              onChange={(event) => setPostalCode(event.target.value)}
              placeholder="Es. 20100"
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
            />
          </Field>
          <Field label="Provincia">
            <input
              value={province}
              onChange={(event) => setProvince(event.target.value)}
              placeholder="Es. MI"
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
            />
          </Field>
        </div>

        <button
          type="submit"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white hover:bg-blue-600"
        >
          {saved ? <CheckCircle2 size={17} /> : <Save size={17} />}
          {saved ? "Dati aggiornati" : "Aggiorna il contesto"}
        </button>
      </form>
    </section>
  );
}

type FieldProps = {
  label: string;
  icon?: typeof Ruler;
  children: React.ReactNode;
};

function Field({ label, icon: Icon, children }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-slate-400">
        {Icon && <Icon size={13} />}
        {label}
      </span>
      {children}
    </label>
  );
}

