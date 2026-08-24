"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  ChartNoAxesCombined,
  Check,
  CircleAlert,
  Clock3,
  Database,
  House,
  KeyRound,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import type {
  PropertyCondition,
  PropertyValuationError,
  PropertyValuationInput,
  PropertyValuationSuccess,
  ValuationOperation,
} from "@/lib/guimmia/openai/types";
import GuidedAddressSearch, {
  type GuidedAddressValue,
} from "@/components/property-wizard/GuidedAddressSearch";
import PropertyLocationMap from "@/components/property-wizard/PropertyLocationMap";

const initialForm: PropertyValuationInput = {
  operation: "SALE",
  property: {
    propertyType: "Appartamento",
    country: "Italia",
    city: "",
    province: "",
    postalCode: "",
    address: "",
    latitude: null,
    longitude: null,
    locationVerified: false,
    locationLabel: "",
    surfaceSqm: 80,
    rooms: 3,
    bedrooms: 2,
    bathrooms: 1,
    floor: null,
    yearBuilt: null,
    elevator: false,
    condition: "GOOD",
    energyClass: "",
    heating: "UNKNOWN",
    occupancy: "OWNER_OCCUPIED",
    monthlyCondominiumFees: null,
    outdoorSpace: false,
    parking: false,
    furnished: false,
    notes: "",
  },
  owner: {
    name: "",
    email: "",
    phone: "",
  },
  privacyAccepted: false,
  automatedAnalysisAccepted: false,
  website: "",
};

const steps = [
  { label: "Il tuo obiettivo", short: "Obiettivo" },
  { label: "Dove si trova", short: "Posizione" },
  { label: "Com’è fatto", short: "Immobile" },
  { label: "Ricevi la stima", short: "Risultato" },
];

const conditionLabels: Record<PropertyCondition, string> = {
  NEW: "Nuovo o in costruzione",
  RENOVATED: "Ristrutturato",
  GOOD: "Buono stato",
  TO_RENOVATE: "Da ristrutturare",
};

function money(value: number, period: "TOTAL" | "MONTH") {
  const formatted = new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
  return period === "MONTH" ? `${formatted}/mese` : formatted;
}

export default function PropertyValuationExperience() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<PropertyValuationInput>(initialForm);
  const [pending, setPending] = useState(false);
  const [response, setResponse] = useState<PropertyValuationSuccess | null>(null);
  const [failure, setFailure] = useState<PropertyValuationError | null>(null);

  const progress = useMemo(() => ((step + 1) / steps.length) * 100, [step]);

  const setProperty = <K extends keyof PropertyValuationInput["property"]>(
    key: K,
    value: PropertyValuationInput["property"][K],
  ) => {
    setForm((current) => ({
      ...current,
      property: { ...current.property, [key]: value },
    }));
  };

  const setOwner = <K extends keyof PropertyValuationInput["owner"]>(
    key: K,
    value: PropertyValuationInput["owner"][K],
  ) => {
    setForm((current) => ({
      ...current,
      owner: { ...current.owner, [key]: value },
    }));
  };

  const canContinue =
    step === 0
      ? Boolean(form.operation && form.property.propertyType)
      : step === 1
      ? Boolean(
          form.property.city.trim() &&
            form.property.province.trim() &&
            form.property.latitude !== null &&
            form.property.longitude !== null &&
            form.property.locationVerified,
        )
      : step === 2
        ? form.property.surfaceSqm >= 10 &&
          form.property.rooms >= 1 &&
          form.property.bedrooms >= 0 &&
          form.property.bathrooms >= 0
        : Boolean(
            form.owner.name.trim() &&
              form.owner.email.includes("@") &&
              form.owner.phone.trim() &&
              form.privacyAccepted &&
              form.automatedAnalysisAccepted,
          );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canContinue || pending) return;

    setPending(true);
    setFailure(null);

    try {
      const request = await fetch("/api/guimmia/valuation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = (await request.json()) as
        | PropertyValuationSuccess
        | PropertyValuationError;

      if (!request.ok || !payload.ok) {
        setFailure(payload as PropertyValuationError);
        return;
      }

      setResponse(payload);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setFailure({
        ok: false,
        error: "valuation_failed",
        message: "Connessione non disponibile. Riprova tra poco.",
      });
    } finally {
      setPending(false);
    }
  };

  if (response) {
    return (
      <ValuationResult
        response={response}
        onReset={() => {
          setResponse(null);
          setFailure(null);
          setStep(0);
          setForm(initialForm);
        }}
      />
    );
  }

  return (
    <div className="mx-auto min-w-0 max-w-5xl">
      <header className="mx-auto max-w-3xl text-center">
        <p className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-blue-700">
          <Sparkles size={15} aria-hidden="true" /> Stima immobiliare online Guimmia
        </p>
        <h1 className="mt-5 text-4xl font-black leading-[1.02] tracking-[-0.05em] text-slate-950 sm:text-5xl lg:text-6xl">
          Quanto può valere il tuo immobile?
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
          Ricevi una fascia indicativa per vendere o affittare, costruita confrontando
          zona, caratteristiche e dati pubblici di mercato.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs font-extrabold text-slate-700 sm:text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2">
            <Clock3 size={15} className="text-blue-600" aria-hidden="true" /> Circa 3 minuti
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2">
            <Check size={15} className="text-emerald-600" aria-hidden="true" /> Gratuita e senza impegno
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2">
            <ShieldCheck size={15} className="text-blue-600" aria-hidden="true" /> Prezzo deciso dal proprietario
          </span>
        </div>
      </header>

      <form
        onSubmit={submit}
        className="mx-auto mt-10 min-w-0 max-w-4xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]"
      >
        <div className="border-b border-slate-100 px-5 py-5 sm:px-8">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-black text-slate-950">
              Passaggio {step + 1} di {steps.length}
            </p>
            <p className="text-sm font-bold text-blue-600">{steps[step].label}</p>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-3 grid grid-cols-4 text-center text-[10px] font-bold text-slate-400 sm:text-xs">
            {steps.map((item, index) => (
              <span key={item.short} className={index <= step ? "text-blue-600" : ""}>
                {item.short}
              </span>
            ))}
          </div>
        </div>

        <div className="p-5 sm:p-8">
          {step === 0 ? (
            <FirstStep form={form} setForm={setForm} setProperty={setProperty} />
          ) : null}
          {step === 1 ? (
            <LocationStep form={form} setForm={setForm} />
          ) : null}
          {step === 2 ? (
            <SecondStep form={form} setProperty={setProperty} />
          ) : null}
          {step === 3 ? (
            <ThirdStep
              form={form}
              setForm={setForm}
              setOwner={setOwner}
              failure={failure}
            />
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <button
            type="button"
            onClick={() => {
              setFailure(null);
              setStep((current) => Math.max(0, current - 1));
            }}
            disabled={step === 0 || pending}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-black text-slate-600 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-30 sm:w-auto"
          >
            <ArrowLeft size={17} aria-hidden="true" /> Indietro
          </button>

          {step < steps.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))}
              disabled={!canContinue}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
            >
              Continua <ArrowRight size={17} aria-hidden="true" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!canContinue || pending}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
            >
              {pending ? (
                <>
                  <LoaderCircle className="animate-spin" size={18} aria-hidden="true" />
                  Guimmia confronta i dati…
                </>
              ) : (
                <>
                  <Sparkles size={18} aria-hidden="true" /> Calcola la mia stima
                </>
              )}
            </button>
          )}
        </div>
      </form>

      <section className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-3" aria-label="Metodo di valutazione Guimmia">
        {[
          [Database, "Riferimento territoriale", "Quotazioni OMI disponibili per zona, tipologia e stato."],
          [ChartNoAxesCombined, "Mercato attuale", "Annunci comparabili selezionati nella stessa microzona."],
          [Building2, "Caratteristiche reali", "Superficie, condizioni, piano, dotazioni e altri correttivi."],
        ].map(([Icon, title, description]) => {
          const MethodIcon = Icon as typeof Database;
          return (
            <article key={title as string} className="rounded-2xl border border-slate-200 bg-white p-5">
              <MethodIcon size={21} className="text-blue-600" aria-hidden="true" />
              <h2 className="mt-3 font-black text-slate-950">{title as string}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">{description as string}</p>
            </article>
          );
        })}
      </section>
    </div>
  );
}

function FirstStep({
  form,
  setForm,
  setProperty,
}: {
  form: PropertyValuationInput;
  setForm: React.Dispatch<React.SetStateAction<PropertyValuationInput>>;
  setProperty: <K extends keyof PropertyValuationInput["property"]>(
    key: K,
    value: PropertyValuationInput["property"][K],
  ) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-black tracking-[-0.03em] text-slate-950">
        Per cosa vuoi conoscere il valore?
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Guimmia preparerà una fascia di vendita oppure un canone mensile indicativo.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {(
          [
            ["SALE", House, "Vendere", "Fascia complessiva di posizionamento"],
            ["RENT_LONG_TERM", KeyRound, "Affittare", "Canone mensile indicativo"],
          ] as const
        ).map(([value, Icon, title, description]) => (
          <button
            key={value}
            type="button"
            onClick={() =>
              setForm((current) => ({
                ...current,
                operation: value as ValuationOperation,
              }))
            }
            className={`rounded-2xl border p-5 text-left transition ${
              form.operation === value
                ? "border-blue-600 bg-blue-50 ring-4 ring-blue-50"
                : "border-slate-200 hover:border-blue-200"
            }`}
          >
            <Icon
              size={24}
              className={form.operation === value ? "text-blue-600" : "text-slate-500"}
              aria-hidden="true"
            />
            <span className="mt-4 block text-lg font-black text-slate-950">{title}</span>
            <span className="mt-1 block text-sm leading-6 text-slate-600">{description}</span>
          </button>
        ))}
      </div>

      <div className="mt-8">
        <SelectField
          label="Che tipo di immobile è?"
          value={form.property.propertyType}
          onChange={(value) => setProperty("propertyType", value)}
          options={[
            "Appartamento",
            "Attico",
            "Villa",
            "Casa indipendente",
            "Villetta a schiera",
            "Loft",
            "Locale commerciale",
            "Terreno",
          ]}
        />
      </div>

      <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
        In questo passaggio non stai scegliendo il prezzo: stai indicando a Guimmia
        quale mercato deve analizzare.
      </div>
    </div>
  );
}

function LocationStep({
  form,
  setForm,
}: {
  form: PropertyValuationInput;
  setForm: React.Dispatch<React.SetStateAction<PropertyValuationInput>>;
}) {
  const addressValue: GuidedAddressValue = {
    country: form.property.country || "Italia",
    city: form.property.city,
    province: form.property.province,
    postalCode: form.property.postalCode || "",
    address: form.property.address || "",
    latitude: form.property.latitude ?? null,
    longitude: form.property.longitude ?? null,
  };

  function applyAddress(selection: GuidedAddressValue) {
    setForm((current) => ({
      ...current,
      property: {
        ...current.property,
        country: selection.country || "Italia",
        city: selection.city,
        province: selection.province,
        postalCode: selection.postalCode,
        address: selection.address,
        latitude: selection.latitude,
        longitude: selection.longitude,
        locationVerified: false,
        locationLabel: "",
      },
    }));
  }

  return (
    <div>
      <h2 className="text-2xl font-black tracking-[-0.03em] text-slate-950">
        Dove si trova l’immobile?
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        La posizione esatta ci permette di distinguere Comune, quartiere e microzona.
      </p>

      <div className="mt-6 space-y-5">
        <GuidedAddressSearch value={addressValue} onChange={applyAddress} />

        <PropertyLocationMap
          latitude={form.property.latitude ?? null}
          longitude={form.property.longitude ?? null}
          verified={form.property.locationVerified === true}
          locationLabel={form.property.locationLabel || ""}
          compact
          searchQuery={[
            form.property.address,
            form.property.postalCode,
            form.property.city,
            form.property.province,
            form.property.country || "Italia",
          ]
            .filter(Boolean)
            .join(", ")}
          onChange={({ latitude, longitude, verified, locationLabel }) => {
            setForm((current) => ({
              ...current,
              property: {
                ...current.property,
                latitude,
                longitude,
                locationVerified: verified,
                locationLabel,
              },
            }));
          }}
        />

        <div
          className={`flex items-start gap-3 rounded-2xl border p-4 text-sm leading-6 ${
            form.property.locationVerified
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-amber-200 bg-amber-50 text-amber-900"
          }`}
        >
          {form.property.locationVerified ? (
            <ShieldCheck className="mt-0.5 shrink-0" size={19} aria-hidden="true" />
          ) : (
            <CircleAlert className="mt-0.5 shrink-0" size={19} aria-hidden="true" />
          )}
          <div>
            <p className="font-black">
              {form.property.locationVerified
                ? "Posizione dell’immobile confermata"
                : "Conferma la posizione per continuare"}
            </p>
            <p className="mt-1">
              {form.property.locationVerified
                ? "Guimmia userà questo punto per cercare confronti realmente vicini."
                : "Scegli Comune e via, trova il punto sulla mappa e premi “Conferma questo punto”."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SecondStep({
  form,
  setProperty,
}: {
  form: PropertyValuationInput;
  setProperty: <K extends keyof PropertyValuationInput["property"]>(
    key: K,
    value: PropertyValuationInput["property"][K],
  ) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-black tracking-[-0.03em] text-slate-950">
        Descrivi le caratteristiche principali
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Più i dati sono precisi, più Guimmia può restringere la fascia indicativa.
      </p>

      <div className="mt-7 grid min-w-0 gap-5 sm:grid-cols-2 2xl:grid-cols-3">
        <NumberField label="Superficie m²" value={form.property.surfaceSqm} min={10} onChange={(value) => setProperty("surfaceSqm", value === "" ? 0 : value)} />
        <NumberField label="Locali" value={form.property.rooms} min={1} onChange={(value) => setProperty("rooms", value === "" ? 0 : value)} />
        <NumberField label="Camere" value={form.property.bedrooms} min={0} onChange={(value) => setProperty("bedrooms", value === "" ? -1 : value)} />
        <NumberField label="Bagni" value={form.property.bathrooms} min={0} onChange={(value) => setProperty("bathrooms", value === "" ? -1 : value)} />
        <NumberField
          label="Piano"
          value={form.property.floor ?? ""}
          min={-5}
          allowEmpty
          onChange={(value) => setProperty("floor", value === "" ? null : value)}
        />
        <NumberField
          label="Anno di costruzione"
          value={form.property.yearBuilt ?? ""}
          min={1500}
          allowEmpty
          onChange={(value) => setProperty("yearBuilt", value === "" ? null : value)}
        />
        <SelectField
          label="Stato"
          value={form.property.condition}
          onChange={(value) => setProperty("condition", value as PropertyCondition)}
          options={Object.entries(conditionLabels).map(([value, label]) => ({ value, label }))}
        />
        <SelectField
          label="Classe energetica"
          value={form.property.energyClass ?? ""}
          onChange={(value) => setProperty("energyClass", value)}
          options={[
            { value: "", label: "Non la conosco" },
            "A4",
            "A3",
            "A2",
            "A1",
            "B",
            "C",
            "D",
            "E",
            "F",
            "G",
          ]}
        />
        <SelectField
          label="Riscaldamento"
          value={form.property.heating}
          onChange={(value) =>
            setProperty(
              "heating",
              value as PropertyValuationInput["property"]["heating"],
            )
          }
          options={[
            { value: "UNKNOWN", label: "Non lo so" },
            { value: "AUTONOMOUS", label: "Autonomo" },
            { value: "CENTRAL", label: "Centralizzato" },
            { value: "HEAT_PUMP", label: "Pompa di calore" },
            { value: "NONE", label: "Assente" },
          ]}
        />
        <SelectField
          label="Situazione attuale"
          value={form.property.occupancy}
          onChange={(value) =>
            setProperty(
              "occupancy",
              value as PropertyValuationInput["property"]["occupancy"],
            )
          }
          options={[
            { value: "OWNER_OCCUPIED", label: "Abitato dal proprietario" },
            { value: "VACANT", label: "Libero" },
            { value: "TENANTED", label: "Locato" },
          ]}
        />
        <NumberField
          label="Spese condominiali €/mese"
          value={form.property.monthlyCondominiumFees ?? ""}
          min={0}
          allowEmpty
          onChange={(value) =>
            setProperty("monthlyCondominiumFees", value === "" ? null : value)
          }
        />
      </div>

      <fieldset className="mt-7">
        <legend className="text-sm font-black text-slate-800">Dotazioni</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <CheckField label="Ascensore" checked={form.property.elevator} onChange={(value) => setProperty("elevator", value)} />
          <CheckField label="Balcone, terrazzo o giardino" checked={form.property.outdoorSpace} onChange={(value) => setProperty("outdoorSpace", value)} />
          <CheckField label="Posto auto o garage" checked={form.property.parking} onChange={(value) => setProperty("parking", value)} />
          <CheckField label="Arredato" checked={form.property.furnished} onChange={(value) => setProperty("furnished", value)} />
        </div>
      </fieldset>

      <label className="mt-7 grid gap-2 text-sm font-black text-slate-800">
        Altre informazioni utili
        <textarea
          value={form.property.notes ?? ""}
          onChange={(event) => setProperty("notes", event.target.value)}
          maxLength={1000}
          rows={4}
          placeholder="Vista, esposizione, lavori recenti, spese condominiali o caratteristiche particolari…"
          className="resize-none rounded-2xl border border-slate-200 px-4 py-3 font-normal leading-6 text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-50"
        />
      </label>
    </div>
  );
}

function ThirdStep({
  form,
  setForm,
  setOwner,
  failure,
}: {
  form: PropertyValuationInput;
  setForm: React.Dispatch<React.SetStateAction<PropertyValuationInput>>;
  setOwner: <K extends keyof PropertyValuationInput["owner"]>(
    key: K,
    value: PropertyValuationInput["owner"][K],
  ) => void;
  failure: PropertyValuationError | null;
}) {
  return (
    <div>
      <h2 className="text-2xl font-black tracking-[-0.03em] text-slate-950">
        A chi colleghiamo questa richiesta?
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        La stima apparirà subito. I tuoi recapiti permettono a Guimmia di salvare la
        richiesta e ricontattarti solo secondo il consenso espresso.
      </p>

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <TextField label="Nome e cognome" value={form.owner.name} onChange={(value) => setOwner("name", value)} autoComplete="name" required />
        <TextField label="Email" type="email" value={form.owner.email} onChange={(value) => setOwner("email", value)} autoComplete="email" required />
        <TextField label="Telefono" type="tel" value={form.owner.phone} onChange={(value) => setOwner("phone", value)} autoComplete="tel" required wide />
      </div>

      <div className="sr-only" aria-hidden="true">
        <label>
          Sito
          <input
            tabIndex={-1}
            autoComplete="off"
            value={form.website ?? ""}
            onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))}
          />
        </label>
      </div>

      <div className="mt-7 space-y-3">
        <ConsentField
          checked={form.privacyAccepted}
          onChange={(value) => setForm((current) => ({ ...current, privacyAccepted: value }))}
        >
          Acconsento al trattamento dei dati per ricevere la stima e per essere ricontattato da Guimmia. *
        </ConsentField>
        <ConsentField
          checked={form.automatedAnalysisAccepted}
          onChange={(value) => setForm((current) => ({ ...current, automatedAnalysisAccepted: value }))}
        >
          Acconsento all’analisi automatizzata dei soli dati dell’immobile. So che il risultato è indicativo e non stabilisce il prezzo finale. *
        </ConsentField>
      </div>

      {failure ? (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900" role="alert">
          <CircleAlert className="mt-0.5 shrink-0" size={19} aria-hidden="true" />
          <div>
            <p className="font-black">La stima non è stata completata</p>
            <p className="mt-1">{failure.message}</p>
            {failure.leadSaved ? (
              <p className="mt-1 font-bold">La richiesta è comunque stata registrata.</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ValuationResult({
  response,
  onReset,
}: {
  response: PropertyValuationSuccess;
  onReset: () => void;
}) {
  const confidence = {
    LOW: "Bassa",
    MEDIUM: "Media",
    HIGH: "Alta",
  }[response.result.confidence];
  const qualityLabel = {
    LIMITED: "Limitata",
    USEFUL: "Utile",
    STRONG: "Solida",
  }[response.quality.grade];

  return (
    <div className="overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.1)]">
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-7 text-white sm:p-10 lg:p-12">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-emerald-200">
              <Check size={15} aria-hidden="true" /> Analisi preliminare completata
            </p>
            <h1 className="mt-5 text-3xl font-black tracking-[-0.04em] sm:text-5xl">
              La stima indicativa del tuo immobile
            </h1>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm backdrop-blur">
            <p className="font-black">Affidabilità {confidence}</p>
            <p className="mt-1 text-xs text-slate-300">
              Qualità dati {qualityLabel} · {response.quality.score}/100
            </p>
          </div>
        </div>

        <div className="mt-9 grid gap-3 sm:grid-cols-3">
          <RangeCard label="Limite prudente" value={money(response.result.range.low, response.result.period)} />
          <RangeCard label="Valore indicativo" value={money(response.result.range.suggested, response.result.period)} featured />
          <RangeCard label="Limite superiore" value={money(response.result.range.high, response.result.period)} />
        </div>

        <p className="mt-7 max-w-4xl text-base leading-8 text-slate-200">
          {response.result.summary}
        </p>
      </div>

      <ValuationMethodEvidence response={response} />

      <MarketEvidence response={response} />

      <div className="grid gap-8 p-6 sm:p-9 lg:grid-cols-2 lg:p-12">
        <ResultList title="Cosa incide sulla stima" items={response.result.factors} tone="blue" />
        <ResultList title="Limiti da considerare" items={response.result.cautions} tone="amber" />
        <ResultList title="Dati che migliorerebbero la precisione" items={response.result.missingData} tone="slate" />
        <ResultList title="Prossimi passi consigliati" items={response.result.nextSteps} tone="emerald" />
      </div>

      {!response.leadSaved ? (
        <div className="mx-6 mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 sm:mx-9 lg:mx-12">
          La fascia è visibile, ma la richiesta non è stata salvata nel database. Non
          proseguire con dati reali finché il collegamento Supabase non è stato verificato.
        </div>
      ) : null}

      <div className="border-t border-slate-200 bg-slate-50 p-6 sm:p-9 lg:px-12">
        <div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.12em] text-slate-500">Metodo utilizzato</h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">{response.result.methodology}</p>
            <p className="mt-3 max-w-4xl text-sm font-bold leading-6 text-slate-800">{response.result.disclaimer}</p>
          </div>
        </div>

        {response.sources.length ? (
          <div className="mt-6">
            <h2 className="text-sm font-black text-slate-800">Fonti pubbliche consultate</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {response.sources.map((source) => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="max-w-full truncate rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-blue-700 transition hover:border-blue-300"
                >
                  {source.title}
                </a>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-sm font-black text-slate-800 transition hover:bg-slate-100"
          >
            <RefreshCw size={17} aria-hidden="true" /> Nuova stima
          </button>
          <a
            href={response.continuationUrl}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-black text-white transition hover:bg-blue-700"
          >
            Continua il percorso con Guimmia <ArrowRight size={17} aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  );
}

function ValuationMethodEvidence({
  response,
}: {
  response: PropertyValuationSuccess;
}) {
  const benchmark = response.result.officialBenchmark;
  const evidence = response.result.marketEvidence;
  const unit =
    benchmark.unit === "EUR_SQM_MONTH" ? "€/m² al mese" : "€/m²";
  const observedUnit =
    evidence.observedUnit === "EUR_SQM_MONTH" ? "€/m² al mese" : "€/m²";

  return (
    <section className="border-b border-slate-200 bg-white p-6 sm:p-9 lg:p-12">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
        Come nasce la stima
      </p>
      <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-950">
        Tre riferimenti, tenuti distinti
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
        Guimmia non tratta una singola cifra come verità: confronta il riferimento
        territoriale, il mercato visibile e le caratteristiche dichiarate.
      </p>

      <div className="mt-7 grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-start justify-between gap-3">
            <Database size={21} className="text-blue-600" aria-hidden="true" />
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
                benchmark.available
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {benchmark.available ? "Disponibile" : "Non verificata"}
            </span>
          </div>
          <h3 className="mt-4 font-black text-slate-950">Fascia OMI ufficiale</h3>
          {benchmark.available ? (
            <>
              <p className="mt-2 text-xl font-black text-blue-700">
                {benchmark.low.toLocaleString("it-IT")}–
                {benchmark.high.toLocaleString("it-IT")} {unit}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {benchmark.zone} · {benchmark.referencePeriod}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Nessun valore puntuale è stato attribuito senza una fonte ufficiale
              verificabile.
            </p>
          )}
          <p className="mt-3 text-xs leading-5 text-slate-500">{benchmark.note}</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <ChartNoAxesCombined size={21} className="text-blue-600" aria-hidden="true" />
          <h3 className="mt-4 font-black text-slate-950">Mercato online osservato</h3>
          {evidence.observedMedian > 0 ? (
            <p className="mt-2 text-xl font-black text-blue-700">
              {evidence.observedMedian.toLocaleString("it-IT")} {observedUnit}
            </p>
          ) : (
            <p className="mt-2 text-sm font-bold text-amber-700">Campione insufficiente</p>
          )}
          <p className="mt-3 text-xs leading-5 text-slate-500">
            {evidence.comparableSignals.length} comparabili mostrati. Sono prezzi
            richiesti negli annunci, non prezzi finali di compravendita.
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <Building2 size={21} className="text-blue-600" aria-hidden="true" />
          <h3 className="mt-4 font-black text-slate-950">Correttivi dell’immobile</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {response.result.valuationMethod.surfaceBasis}
          </p>
          {response.result.valuationMethod.appliedFactors.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {response.result.valuationMethod.appliedFactors.slice(0, 5).map((factor) => (
                <span
                  key={factor}
                  className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600"
                >
                  {factor}
                </span>
              ))}
            </div>
          ) : null}
          <p className="mt-3 text-xs leading-5 text-slate-500">
            {response.result.valuationMethod.note}
          </p>
        </article>
      </div>
    </section>
  );
}

function MarketEvidence({ response }: { response: PropertyValuationSuccess }) {
  const evidence = response.result.marketEvidence;
  const unit = evidence.observedUnit === "EUR_SQM_MONTH" ? "€/m² al mese" : "€/m²";
  const similarityLabel = { HIGH: "Alta", MEDIUM: "Media", LOW: "Bassa" } as const;

  return (
    <section className="border-b border-slate-200 bg-blue-50/60 p-6 sm:p-9 lg:p-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
            Evidenze di mercato
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-950">
            I segnali usati per orientare la fascia
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {evidence.evidenceSummary}
          </p>
        </div>
        {evidence.observedMedian > 0 ? (
          <div className="shrink-0 rounded-2xl border border-blue-200 bg-white px-5 py-4">
            <p className="text-xs font-black uppercase tracking-[0.1em] text-slate-500">
              Riferimento osservato
            </p>
            <p className="mt-1 text-2xl font-black text-blue-700">
              {evidence.observedMedian.toLocaleString("it-IT")} {unit}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {evidence.observedLow.toLocaleString("it-IT")}–{evidence.observedHigh.toLocaleString("it-IT")} {unit}
            </p>
          </div>
        ) : null}
      </div>

      {evidence.comparableSignals.length ? (
        <div className="mt-7 grid gap-3 lg:grid-cols-2">
          {evidence.comparableSignals.map((item, index) => (
            <article key={`${item.label}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-slate-950">{item.label}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">{item.location}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600">
                  Somiglianza {similarityLabel[item.similarity]}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-700">
                <strong>{money(item.askingPrice, response.result.period)}</strong>
                <span>{item.surfaceSqm.toLocaleString("it-IT")} m²</span>
                <span>{item.pricePerSqm.toLocaleString("it-IT")} {unit}</span>
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">{item.note}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          Non sono stati trovati abbastanza annunci comparabili da mostrare. La fascia è
          stata mantenuta prudente e richiede controllo umano.
        </div>
      )}

      {response.quality.notes.length ? (
        <p className="mt-5 text-xs leading-5 text-slate-500">
          Qualità della prova: {response.quality.notes.join(" ")}
        </p>
      ) : null}
    </section>
  );
}

function RangeCard({ label, value, featured = false }: { label: string; value: string; featured?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${featured ? "border-blue-300 bg-blue-500/20" : "border-white/15 bg-white/5"}`}>
      <p className="text-xs font-black uppercase tracking-[0.1em] text-slate-300">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-[-0.03em] sm:text-3xl">{value}</p>
    </div>
  );
}

function ResultList({ title, items, tone }: { title: string; items: string[]; tone: "blue" | "amber" | "slate" | "emerald" }) {
  const toneClass = {
    blue: "bg-blue-100 text-blue-700",
    amber: "bg-amber-100 text-amber-700",
    slate: "bg-slate-200 text-slate-700",
    emerald: "bg-emerald-100 text-emerald-700",
  }[tone];
  return (
    <section>
      <h2 className="text-xl font-black tracking-[-0.02em] text-slate-950">{title}</h2>
      {items.length ? (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm leading-6 text-slate-600">
              <span className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${toneClass}`}>
                <Check size={12} aria-hidden="true" />
              </span>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-500">Nessun elemento segnalato.</p>
      )}
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
  required = false,
  wide = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  wide?: boolean;
}) {
  return (
    <label className={`grid min-w-0 gap-2 text-sm font-black text-slate-800 ${wide ? "sm:col-span-2" : ""}`}>
      {label}{required ? " *" : ""}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className="min-h-12 w-full min-w-0 rounded-xl border border-slate-200 px-4 font-normal text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-50"
      />
    </label>
  );
}

function numberDraft(value: number | string, min: number) {
  if (value === "") return "";
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= min ? String(value) : "";
}

function NumberField({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: number | string;
  min: number;
  allowEmpty?: boolean;
  onChange: (value: number | "") => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [draft, setDraft] = useState(() => numberDraft(value, min));

  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setDraft(numberDraft(value, min));
    }
  }, [min, value]);

  return (
    <label className="grid min-w-0 gap-2 text-sm font-black text-slate-800">
      {label}
      <input
        ref={inputRef}
        type="number"
        value={draft}
        min={min}
        onChange={(event) => {
          const nextValue = event.target.value;
          setDraft(nextValue);
          if (nextValue === "") {
            onChange("");
            return;
          }
          const parsed = Number(nextValue);
          if (Number.isFinite(parsed)) onChange(parsed);
        }}
        onFocus={(event) => event.currentTarget.select()}
        aria-label={label}
        className="min-h-12 w-full min-w-0 rounded-xl border border-slate-200 px-4 font-normal text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-50"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<string | { value: string; label: string }>;
}) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-black text-slate-800">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 font-normal text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-50"
      >
        {options.map((option) => {
          const item = typeof option === "string" ? { value: option, label: option } : option;
          return <option key={item.value || "empty"} value={item.value}>{item.label}</option>;
        })}
      </select>
    </label>
  );
}

function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm font-bold transition ${checked ? "border-blue-500 bg-blue-50 text-blue-900" : "border-slate-200 text-slate-700 hover:border-blue-200"}`}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-blue-600" />
      {label}
    </label>
  );
}

function ConsentField({ checked, onChange, children }: { checked: boolean; onChange: (checked: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-blue-600" />
      <span>{children}</span>
    </label>
  );
}
