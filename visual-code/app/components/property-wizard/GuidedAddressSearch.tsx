"use client";

import {
  CheckCircle2,
  ChevronDown,
  LoaderCircle,
  MapPinned,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export type GuidedAddressValue = {
  country: string;
  city: string;
  province: string;
  postalCode: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
};

type LocationSuggestion = GuidedAddressValue & {
  id: string;
  primary: string;
  secondary: string;
  kind: "address" | "street" | "city" | "postcode" | "place";
};

type LocationSearchResponse = {
  suggestions?: LocationSuggestion[];
  message?: string;
};

type GuidedAddressSearchProps = {
  value: GuidedAddressValue;
  onChange: (value: GuidedAddressValue, source: "municipality" | "address" | "postcode" | "manual") => void;
  countryOptions?: readonly string[];
  locationConfirmed?: boolean;
};

type SearchMode = "municipality" | "address" | "postcode";

const cache = new Map<string, LocationSuggestion[]>();

function normalize(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function mergeSelection(
  current: GuidedAddressValue,
  suggestion: LocationSuggestion,
  mode: SearchMode,
): GuidedAddressValue {
  if (mode === "municipality" || mode === "postcode") {
    return {
      ...current,
      country: suggestion.country || current.country || "Italia",
      city: suggestion.city || suggestion.primary || current.city,
      province: suggestion.province || current.province,
      postalCode: suggestion.postalCode || current.postalCode,
      latitude: suggestion.latitude ?? current.latitude,
      longitude: suggestion.longitude ?? current.longitude,
    };
  }

  return {
    ...current,
    country: suggestion.country || current.country || "Italia",
    city: suggestion.city || current.city,
    province: suggestion.province || current.province,
    postalCode: suggestion.postalCode || current.postalCode,
    address: suggestion.address || suggestion.primary || current.address,
    latitude: suggestion.latitude ?? current.latitude,
    longitude: suggestion.longitude ?? current.longitude,
  };
}

export default function GuidedAddressSearch({
  value,
  onChange,
  countryOptions,
  locationConfirmed = false,
}: GuidedAddressSearchProps) {
  const [cityQuery, setCityQuery] = useState(value.city);
  const [addressQuery, setAddressQuery] = useState(value.address);
  const [cityResults, setCityResults] = useState<LocationSuggestion[]>([]);
  const [addressResults, setAddressResults] = useState<LocationSuggestion[]>([]);
  const [cityOpen, setCityOpen] = useState(false);
  const [addressOpen, setAddressOpen] = useState(false);
  const [cityLoading, setCityLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [postcodeLoading, setPostcodeLoading] = useState(false);
  const [cityError, setCityError] = useState(false);
  const [addressError, setAddressError] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const cityRequest = useRef(0);
  const addressRequest = useRef(0);
  const postcodeRequest = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setCityQuery(value.city), 0);
    return () => window.clearTimeout(timer);
  }, [value.city]);
  useEffect(() => {
    const timer = window.setTimeout(() => setAddressQuery(value.address), 0);
    return () => window.clearTimeout(timer);
  }, [value.address]);

  const normalizedCity = useMemo(() => normalize(cityQuery), [cityQuery]);
  const normalizedAddress = useMemo(() => normalize(addressQuery), [addressQuery]);

  useEffect(() => {
    if (
      !cityOpen ||
      normalizedCity.length < 1 ||
      (normalizedCity === value.city && locationConfirmed)
    ) return;

    const key = `municipality:${normalizedCity.toLowerCase()}`;
    const cached = cache.get(key);
    if (cached) {
      const cachedTimer = window.setTimeout(() => {
        setCityResults(cached);
        setCityError(false);
      }, 0);
      return () => window.clearTimeout(cachedTimer);
    }

    const id = ++cityRequest.current;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setCityLoading(true);
      setCityError(false);
      try {
        const params = new URLSearchParams({ q: normalizedCity, mode: "municipality" });
        const response = await fetch(`/api/location-search?${params.toString()}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (!response.ok) throw new Error("municipality-search-failed");
        const payload = (await response.json()) as LocationSearchResponse;
        const suggestions = payload.suggestions ?? [];
        cache.set(key, suggestions);
        if (id !== cityRequest.current) return;
        setCityResults(suggestions);
      } catch {
        if (controller.signal.aborted || id !== cityRequest.current) return;
        setCityResults([]);
        setCityError(true);
      } finally {
        if (id === cityRequest.current) setCityLoading(false);
      }
    }, 280);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [cityOpen, locationConfirmed, normalizedCity, value.city]);

  useEffect(() => {
    if (
      !addressOpen ||
      normalizedAddress.length < 2 ||
      value.city.trim().length < 2 ||
      (normalizedAddress === value.address && locationConfirmed)
    ) {
      return;
    }

    const key = [
      "address",
      normalizedAddress.toLowerCase(),
      value.city.toLowerCase(),
      value.province.toLowerCase(),
      value.postalCode,
    ].join(":");
    const cached = cache.get(key);
    if (cached) {
      const cachedTimer = window.setTimeout(() => {
        setAddressResults(cached);
        setAddressError(false);
      }, 0);
      return () => window.clearTimeout(cachedTimer);
    }

    const id = ++addressRequest.current;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setAddressLoading(true);
      setAddressError(false);
      try {
        const params = new URLSearchParams({
          q: normalizedAddress,
          mode: "address",
          city: value.city,
          province: value.province,
          postcode: value.postalCode,
        });
        const response = await fetch(`/api/location-search?${params.toString()}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (!response.ok) throw new Error("address-search-failed");
        const payload = (await response.json()) as LocationSearchResponse;
        const suggestions = payload.suggestions ?? [];
        cache.set(key, suggestions);
        if (id !== addressRequest.current) return;
        setAddressResults(suggestions);
      } catch {
        if (controller.signal.aborted || id !== addressRequest.current) return;
        setAddressResults([]);
        setAddressError(true);
      } finally {
        if (id === addressRequest.current) setAddressLoading(false);
      }
    }, 320);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [
    addressOpen,
    locationConfirmed,
    normalizedAddress,
    value.address,
    value.city,
    value.postalCode,
    value.province,
  ]);

  async function lookupPostcode(postcode: string) {
    const normalizedPostcode = postcode.replace(/\D/g, "").slice(0, 5);
    const nextValue = { ...value, postalCode: normalizedPostcode };
    onChange(nextValue, "manual");
    if (normalizedPostcode.length !== 5) return;

    const id = ++postcodeRequest.current;
    setPostcodeLoading(true);
    try {
      const params = new URLSearchParams({ q: normalizedPostcode, mode: "postcode" });
      const response = await fetch(`/api/location-search?${params.toString()}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!response.ok) return;
      const payload = (await response.json()) as LocationSearchResponse;
      const suggestion = payload.suggestions?.[0];
      if (!suggestion || id !== postcodeRequest.current) return;
      const selected = mergeSelection(nextValue, suggestion, "postcode");
      setCityQuery(selected.city);
      onChange(selected, "postcode");
    } finally {
      if (id === postcodeRequest.current) setPostcodeLoading(false);
    }
  }

  function chooseMunicipality(suggestion: LocationSuggestion) {
    const selected = mergeSelection(value, suggestion, "municipality");
    setCityQuery(selected.city);
    setCityOpen(false);
    setCityResults([]);
    onChange(selected, "municipality");
  }

  function chooseAddress(suggestion: LocationSuggestion) {
    const selected = mergeSelection(value, suggestion, "address");
    setAddressQuery(selected.address);
    setAddressOpen(false);
    setAddressResults([]);
    onChange(selected, "address");
  }

  function useTypedCity() {
    const city = normalizedCity;
    if (!city) return;
    const selected = { ...value, city };
    setCityQuery(city);
    setCityOpen(false);
    onChange(selected, "manual");
  }

  function useTypedAddress() {
    const address = normalizedAddress;
    if (!address) return;
    const selected = { ...value, address };
    setAddressQuery(address);
    setAddressOpen(false);
    onChange(selected, "manual");
  }

  return (
    <section className="overflow-visible rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <MapPinned size={20} />
        </span>
        <div>
          <p className="font-bold text-slate-950">Troviamo l’immobile in due passaggi</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Prima scegli il Comune. Poi cerchiamo la via soltanto dentro quel Comune: i risultati sono più chiari e precisi.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        <div className="relative z-30">
          <div className="mb-2 flex items-center justify-between gap-3">
            <label htmlFor="municipality-search" className="text-sm font-bold text-slate-900">
              1. Comune
            </label>
            {value.city && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                <CheckCircle2 size={13} />
                Selezionato
              </span>
            )}
          </div>
          <div className="relative">
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="municipality-search"
              type="text"
              value={cityQuery}
              onChange={(event) => {
                setCityQuery(event.target.value);
                setCityOpen(true);
                setCityError(false);
              }}
              onFocus={() => setCityOpen(true)}
              placeholder="Es. Bologna"
              autoComplete="off"
              className="h-13 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-11 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
            {cityLoading ? (
              <LoaderCircle size={18} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-blue-600" />
            ) : cityQuery ? (
              <button
                type="button"
                onClick={() => {
                  setCityQuery("");
                  setCityResults([]);
                  setCityOpen(false);
                  onChange({ ...value, city: "", province: "", postalCode: "" }, "manual");
                }}
                aria-label="Cancella Comune"
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>

          {cityOpen && normalizedCity.length >= 1 && (normalizedCity !== value.city || !locationConfirmed) && (
            <SuggestionPanel
              results={cityResults}
              loading={cityLoading}
              error={cityError}
              emptyText="Nessun Comune trovato con questo nome."
              manualLabel={`Usa “${normalizedCity}” come Comune`}
              onChoose={chooseMunicipality}
              onManual={useTypedCity}
            />
          )}
        </div>

        <div className="relative z-20">
          <div className="mb-2 flex items-center justify-between gap-3">
            <label htmlFor="street-search" className="text-sm font-bold text-slate-900">
              2. Via e numero civico
            </label>
            {!value.city && <span className="text-xs font-semibold text-slate-400">Prima scegli il Comune</span>}
          </div>
          <div className="relative">
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="street-search"
              type="text"
              value={addressQuery}
              disabled={!value.city}
              onChange={(event) => {
                setAddressQuery(event.target.value);
                setAddressOpen(true);
                setAddressError(false);
              }}
              onFocus={() => setAddressOpen(true)}
              placeholder={value.city ? `Es. Via Etnea 100, ${value.city}` : "Seleziona prima il Comune"}
              autoComplete="off"
              className="h-13 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-11 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
            {addressLoading ? (
              <LoaderCircle size={18} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-blue-600" />
            ) : addressQuery ? (
              <button
                type="button"
                onClick={() => {
                  setAddressQuery("");
                  setAddressResults([]);
                  setAddressOpen(false);
                  onChange({ ...value, address: "" }, "manual");
                }}
                aria-label="Cancella indirizzo"
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>

          {addressOpen && value.city && normalizedAddress.length >= 2 && (normalizedAddress !== value.address || !locationConfirmed) && (
            <SuggestionPanel
              results={addressResults}
              loading={addressLoading}
              error={addressError}
              emptyText={`Nessun indirizzo trovato a ${value.city}.`}
              manualLabel={`Usa “${normalizedAddress}” come indirizzo`}
              onChoose={chooseAddress}
              onManual={useTypedAddress}
            />
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-bold text-slate-900">Provincia</span>
            <input
              type="text"
              value={value.province}
              onChange={(event) => onChange({ ...value, province: event.target.value }, "manual")}
              placeholder="BO o Bologna"
              className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>
          <label className="block">
            <span className="flex items-center justify-between gap-2 text-sm font-bold text-slate-900">
              CAP
              {postcodeLoading && <LoaderCircle size={14} className="animate-spin text-blue-600" />}
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={value.postalCode}
              onChange={(event) => void lookupPostcode(event.target.value)}
              placeholder="95100"
              className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={() => setManualOpen((current) => !current)}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-950"
        >
          <ChevronDown size={15} className={`transition-transform ${manualOpen ? "rotate-180" : ""}`} />
          {manualOpen ? "Nascondi dati aggiuntivi" : "Correggi Paese o inserisci tutto manualmente"}
        </button>

        {manualOpen && (
          <div className="rounded-2xl bg-slate-50 p-4">
            <label className="block">
              <span className="text-sm font-bold text-slate-900">Paese</span>
              {countryOptions?.length ? (
                <select
                  value={value.country}
                  onChange={(event) => onChange({ ...value, country: event.target.value }, "manual")}
                  className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">Scegli il Paese</option>
                  {countryOptions.map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={value.country}
                  onChange={(event) => onChange({ ...value, country: event.target.value }, "manual")}
                  placeholder="Italia"
                  className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              )}
            </label>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Se un suggerimento non compare, puoi comunque usare il Comune e l’indirizzo che hai scritto. La mappa ti permetterà di indicare il punto esatto.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function SuggestionPanel({
  results,
  loading,
  error,
  emptyText,
  manualLabel,
  onChoose,
  onManual,
}: {
  results: LocationSuggestion[];
  loading: boolean;
  error: boolean;
  emptyText: string;
  manualLabel: string;
  onChoose: (suggestion: LocationSuggestion) => void;
  onManual: () => void;
}) {
  return (
    <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15">
      {loading && results.length === 0 ? (
        <div className="flex items-center gap-2 px-4 py-4 text-sm text-slate-500">
          <LoaderCircle size={16} className="animate-spin text-blue-600" />
          Sto cercando…
        </div>
      ) : results.length > 0 ? (
        <div className="max-h-72 overflow-y-auto p-1.5">
          {results.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onChoose(suggestion)}
              className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <MapPinned size={15} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-slate-950">{suggestion.primary}</span>
                {suggestion.secondary && (
                  <span className="mt-0.5 block truncate text-xs text-slate-500">{suggestion.secondary}</span>
                )}
              </span>
            </button>
          ))}
          <div className="my-1 h-px bg-slate-100" />
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={onManual}
            className="w-full rounded-xl px-3 py-2.5 text-left text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            {manualLabel}
          </button>
        </div>
      ) : (
        <div className="p-3">
          <p className={`px-1 text-sm ${error ? "text-amber-700" : "text-slate-500"}`}>
            {error ? "La ricerca non risponde. Puoi continuare manualmente." : emptyText}
          </p>
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={onManual}
            className="mt-2 w-full rounded-xl bg-slate-50 px-3 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            {manualLabel}
          </button>
        </div>
      )}
    </div>
  );
}
