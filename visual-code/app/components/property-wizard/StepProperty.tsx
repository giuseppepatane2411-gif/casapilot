import type { LucideIcon } from "lucide-react";
import {
  Building2,
  BedDouble,
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
  room: BedDouble,
};

export default function StepProperty({
  data,
  onChange,
}: StepPropertyProps) {
  const isRoomRental = data.operation === "rent_room" || data.propertyType === "room";

  function updateRoom<K extends keyof WizardData["roomRental"]>(
    field: K,
    value: WizardData["roomRental"][K],
  ) {
    onChange("roomRental", {
      ...data.roomRental,
      [field]: value,
    });
  }

  function toggleOccupantProfile(profile: "student" | "worker") {
    const selected = data.roomRental.acceptedOccupantProfiles;
    updateRoom(
      "acceptedOccupantProfiles",
      selected.includes(profile)
        ? selected.filter((item) => item !== profile)
        : [...selected, profile],
    );
  }

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

      {isRoomRental && (
        <section className="rounded-[26px] border border-blue-200 bg-blue-50/60 p-5 sm:p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.13em] text-blue-700">
              Dettagli della stanza e della convivenza
            </p>
            <h3 className="mt-2 text-xl font-bold text-slate-950">
              Informazioni utili a chi cerca una stanza
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Questi dati permettono a Guimmia di creare un annuncio ordinato e di
              proporre candidati compatibili, senza decisioni automatiche sulla persona.
            </p>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label>
              <span className="text-sm font-bold text-slate-900">Tipo di stanza</span>
              <select
                value={data.roomRental.roomType}
                onChange={(event) =>
                  updateRoom(
                    "roomType",
                    event.target.value as WizardData["roomRental"]["roomType"],
                  )
                }
                className="mt-2 h-13 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">Seleziona</option>
                <option value="single">Singola</option>
                <option value="double">Doppia uso singolo</option>
                <option value="shared">Posto letto in doppia</option>
              </select>
            </label>

            <label>
              <span className="text-sm font-bold text-slate-900">Superficie stanza</span>
              <div className="relative mt-2">
                <input
                  type="number"
                  min="4"
                  inputMode="numeric"
                  value={data.roomRental.roomSurface}
                  onChange={(event) => updateRoom("roomSurface", event.target.value)}
                  placeholder="14"
                  className="h-13 w-full rounded-2xl border border-slate-200 bg-white px-4 pr-12 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">m²</span>
              </div>
            </label>

            <label>
              <span className="text-sm font-bold text-slate-900">Coinquilini già presenti</span>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                value={data.roomRental.currentRoommates}
                onChange={(event) => updateRoom("currentRoommates", event.target.value)}
                className="mt-2 h-13 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label>
              <span className="text-sm font-bold text-slate-900">Composizione attuale della casa</span>
              <select
                value={data.roomRental.householdComposition}
                onChange={(event) =>
                  updateRoom(
                    "householdComposition",
                    event.target.value as WizardData["roomRental"]["householdComposition"],
                  )
                }
                className="mt-2 h-13 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="not_specified">Da indicare</option>
                <option value="none">Nessun coinquilino</option>
                <option value="men">Coinquilini uomini</option>
                <option value="women">Coinquiline donne</option>
                <option value="mixed">Casa mista</option>
              </select>
            </label>

            <label>
              <span className="text-sm font-bold text-slate-900">Disponibile dal</span>
              <input
                type="date"
                value={data.roomRental.availableFrom}
                onChange={(event) => updateRoom("availableFrom", event.target.value)}
                className="mt-2 h-13 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label>
              <span className="text-sm font-bold text-slate-900">
                Preferenza di convivenza dichiarata
              </span>
              <select
                value={data.roomRental.genderPreference}
                onChange={(event) =>
                  updateRoom(
                    "genderPreference",
                    event.target.value as WizardData["roomRental"]["genderPreference"],
                  )
                }
                className="mt-2 h-13 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="none">Nessuna preferenza</option>
                <option value="men">Preferenza uomini</option>
                <option value="women">Preferenza donne</option>
              </select>
              <span className="mt-2 block text-xs leading-5 text-slate-500">
                Dato privato: non viene pubblicato né usato per esclusioni automatiche;
                richiede sempre verifica umana.
              </span>
            </label>
          </div>

          <fieldset className="mt-6">
            <legend className="text-sm font-bold text-slate-900">
              Profili compatibili con la convivenza
            </legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {([
                ["student", "Studente o studentessa"],
                ["worker", "Lavoratore o lavoratrice"],
              ] as const).map(([value, label]) => {
                const selected = data.roomRental.acceptedOccupantProfiles.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleOccupantProfile(value)}
                    className={`flex min-h-13 items-center gap-3 rounded-2xl border px-4 text-left text-sm font-bold transition ${
                      selected
                        ? "border-blue-500 bg-white text-blue-800"
                        : "border-slate-200 bg-white/70 text-slate-700 hover:border-blue-200"
                    }`}
                  >
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full border ${selected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 text-transparent"}`}>
                      <Check size={13} strokeWidth={3} />
                    </span>
                    {label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {([
              ["privateBathroom", "Bagno privato"],
              ["roomFurnished", "Stanza arredata"],
              ["expensesIncluded", "Spese incluse"],
            ] as const).map(([field, label]) => (
              <label key={field} className="flex min-h-13 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={data.roomRental[field]}
                  onChange={(event) => updateRoom(field, event.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                {label}
              </label>
            ))}
          </div>

          <label className="mt-6 block">
            <span className="text-sm font-bold text-slate-900">Note sulla convivenza</span>
            <textarea
              rows={3}
              maxLength={600}
              value={data.roomRental.compatibilityNotes}
              onChange={(event) => updateRoom("compatibilityNotes", event.target.value)}
              placeholder="Orari della casa, animali, abitudini o altre informazioni utili…"
              className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>
        </section>
      )}

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
