"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Loader2, MapPin, Search } from "lucide-react";

export type LocationSelection = {
  primary: string;
  secondary: string;
  city: string;
  province: string;
  postalCode: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
};

type Suggestion = LocationSelection & { id: string; kind: string };

export default function ItalianAddressAutocomplete({
  label,
  value,
  onChange,
  onSelect,
  mode = "address",
  city = "",
  province = "",
  postcode = "",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (selection: LocationSelection) => void;
  mode?: "address" | "municipality";
  city?: string;
  province?: string;
  postcode?: string;
  placeholder?: string;
}) {
  const listId = useId();
  const requestRef = useRef(0);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const currentRequest = ++requestRef.current;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: query, mode });
        if (city) params.set("city", city);
        if (province) params.set("province", province);
        if (postcode) params.set("postcode", postcode);
        const response = await fetch(`/api/location-search?${params.toString()}`, { cache: "no-store" });
        const payload = (await response.json()) as { suggestions?: Suggestion[] };
        if (currentRequest === requestRef.current) {
          setSuggestions(payload.suggestions ?? []);
          setOpen(true);
        }
      } catch {
        if (currentRequest === requestRef.current) setSuggestions([]);
      } finally {
        if (currentRequest === requestRef.current) setLoading(false);
      }
    }, 280);

    return () => window.clearTimeout(timer);
  }, [value, mode, city, province, postcode]);

  function choose(item: Suggestion) {
    onChange(item.primary);
    onSelect(item);
    setOpen(false);
  }

  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <span className="relative mt-2 block">
        <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={value}
          onChange={(event) => { onChange(event.target.value); setOpen(true); }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder ?? (mode === "address" ? "Inizia a scrivere via e numero civico" : "Inizia a scrivere il Comune")}
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls={listId}
          className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-11 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />
        {loading && <Loader2 size={17} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-blue-600" />}

        {open && suggestions.length > 0 && (
          <span id={listId} role="listbox" className="absolute z-40 mt-2 block max-h-72 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
            {suggestions.map((item) => (
              <button
                key={item.id}
                type="button"
                role="option"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(item)}
                className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-blue-50"
              >
                <MapPin size={17} className="mt-0.5 shrink-0 text-blue-600" />
                <span>
                  <span className="block text-sm font-bold text-slate-900">{item.primary}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-slate-500">{item.secondary}</span>
                </span>
              </button>
            ))}
          </span>
        )}
      </span>
    </label>
  );
}
