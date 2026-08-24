import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Check,
  Home,
  LandPlot,
  Store,
  Warehouse,
} from "lucide-react";

import {
  OCCUPANCY_OPTIONS,
  PROPERTY_OPTIONS,
} from "@/lib/property-journey/constants";
import type {
  OccupancyStatus,
  PropertyType,
  WizardData,
} from "@/lib/property-journey/types";

type StepPropertyProps = {
  data: WizardData;
  onChange: <K extends keyof WizardData>(field: K, value: WizardData[K]) => void;
};

const propertyIcons: Record<PropertyType, LucideIcon> = {
  apartment: Building2,
  house: Home,
  commercial: Store,
  land: LandPlot,
  garage: Warehouse,
};

export default function StepProperty({
  data,
  onChange,
}: StepPropertyProps) {
  return (
    <div className="space-y-8">
      <div>
        <p className="mb-3 text-sm font-bold text-slate-900">Tipologia immobile</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {PROPERTY_OPTIONS.map((option) => {
            const Icon = propertyIcons[option.id];
            const selected = data.propertyType === option.id;

            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange("propertyType", option.id)}
                className={`relative rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 ${
                  selected
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 bg-white hover:border-blue-200 hover:shadow-md"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      selected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Icon size={19} />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-bold text-slate-950">{option.title}</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">
                      {option.description}
                    </span>
                  </span>
                </div>

                {selected && (
                  <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">
                    <Check size={13} strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="text-sm font-bold text-slate-900">
            Nome del percorso <span className="font-medium text-slate-400">(facoltativo)</span>
          </span>
          <input
            type="text"
            value={data.propertyName}
            onChange={(event) => onChange("propertyName", event.target.value)}
            placeholder="Es. Appartamento in Via Etnea"
            className="mt-2 h-13 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
          <span className="mt-2 block text-xs text-slate-500">
            Se lo lasci vuoto, Guimmia creerà automaticamente un nome.
          </span>
        </label>

        <label>
          <span className="text-sm font-bold text-slate-900">Superficie indicativa</span>
          <div className="relative mt-2">
            <input
              type="number"
              min="1"
              inputMode="numeric"
              value={data.surface}
              onChange={(event) => onChange("surface", event.target.value)}
              placeholder="85"
              className="h-13 w-full rounded-2xl border border-slate-200 bg-white px-4 pr-12 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
              m²
            </span>
          </div>
        </label>

        <label>
          <span className="text-sm font-bold text-slate-900">Situazione attuale</span>
          <select
            value={data.occupancy}
            onChange={(event) =>
              onChange("occupancy", event.target.value as OccupancyStatus | "")
            }
            className="mt-2 h-13 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option value="">Seleziona una situazione</option>
            {OCCUPANCY_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
