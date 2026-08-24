import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bath,
  BedDouble,
  Building2,
  KeyRound,
  MapPin,
  Maximize2,
  Search,
} from "lucide-react";

import type { AgencyListing } from "@/lib/agency/types";

const markets = [
  { id: "buy", label: "Comprare", icon: Building2 },
  { id: "rent", label: "Affittare", icon: KeyRound },
  { id: "holiday", label: "Vacanze", icon: MapPin },
] as const;

function featuredPrice(listing: AgencyListing) {
  const value = new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(listing.price_cents / 100);

  if (listing.operation === "sale") return value;
  if (listing.rent_period === "day") return `${value}/notte`;
  if (listing.rent_period === "week") return `${value}/settimana`;
  return `${value}/mese`;
}

export default function Hero({
  featuredListing,
  preview,
}: {
  featuredListing: AgencyListing;
  preview: boolean;
}) {
  return (
    <section className="px-3 pt-3 sm:px-5 sm:pt-5">
      <div className="relative mx-auto overflow-hidden rounded-[28px] bg-slate-950 sm:rounded-[38px]">
        <Image
          src="/images/guimmia/home-hero-agency.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[62%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-slate-950/20" />

        <div className="relative z-10 mx-auto grid min-h-[680px] max-w-7xl items-center gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-12 xl:grid-cols-[minmax(0,1fr)_390px] xl:gap-14">
          <div>
            <p className="inline-flex rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white backdrop-blur sm:text-sm">
              Guimmia, la tua guida immobiliare intelligente
            </p>

            <h1 className="mt-6 max-w-4xl text-[44px] font-black leading-[0.96] tracking-[-0.055em] text-white sm:text-6xl lg:text-[68px] xl:text-[76px]">
              Trova casa.
              <span className="block text-blue-200">Oppure affidaci la tua.</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg sm:leading-8">
              Immobili in vendita, in affitto e per le vacanze. Guimmia ti accompagna dalla ricerca alla negoziazione e alla contrattualistica.
            </p>

            <form
              action="/immobili"
              className="mt-8 max-w-4xl rounded-[26px] bg-white p-3 shadow-[0_28px_80px_rgba(15,23,42,0.38)] sm:p-4"
            >
              <fieldset>
                <legend className="sr-only">Cosa stai cercando?</legend>
                <div className="grid grid-cols-3 gap-1 rounded-2xl bg-slate-100 p-1.5 sm:inline-grid sm:min-w-[430px]">
                  {markets.map(({ id, label, icon: Icon }, index) => (
                    <div key={id} className="relative">
                      <input
                        id={`home-market-${id}`}
                        type="radio"
                        name="mercato"
                        value={id}
                        defaultChecked={index === 0}
                        className="peer sr-only"
                      />
                      <label
                        htmlFor={`home-market-${id}`}
                        className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-2 text-xs font-extrabold text-slate-600 transition hover:text-slate-950 peer-checked:bg-slate-950 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-blue-600 peer-focus-visible:ring-offset-2 sm:px-4 sm:text-sm"
                      >
                        <Icon size={16} aria-hidden="true" />
                        {label}
                      </label>
                    </div>
                  ))}
                </div>
              </fieldset>

              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-[1.25fr_.85fr_.65fr_auto]">
                <label className="flex min-h-14 items-center gap-3 rounded-2xl border border-slate-200 px-4 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 sm:col-span-2 lg:col-span-1">
                  <MapPin className="shrink-0 text-blue-600" size={19} aria-hidden="true" />
                  <span className="sr-only">Città o località</span>
                  <input
                    name="citta"
                    placeholder="Città o località"
                    className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400"
                  />
                </label>

                <label className="sr-only" htmlFor="home-property-type">
                  Tipologia di immobile
                </label>
                <select
                  id="home-property-type"
                  name="tipologia"
                  defaultValue=""
                  className="min-h-14 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Tutte le tipologie</option>
                  <option>Appartamento</option>
                  <option>Attico</option>
                  <option>Villa</option>
                  <option>Casa indipendente</option>
                  <option>Terreno</option>
                  <option>Locale commerciale</option>
                </select>

                <label className="flex min-h-14 items-center rounded-2xl border border-slate-200 px-4 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100">
                  <span className="sr-only">Prezzo massimo</span>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    name="max"
                    placeholder="Prezzo max"
                    className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400"
                  />
                </label>

                <button className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700">
                  <Search size={18} aria-hidden="true" />
                  Cerca
                </button>
              </div>
            </form>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <span className="text-sm font-semibold text-white/70">Sei proprietario?</span>
              <Link
                href="/valuta-immobile"
                className="inline-flex items-center gap-2 text-sm font-extrabold text-white transition hover:text-blue-200"
              >
                Valuta il tuo immobile <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link
                href="/vendere"
                className="inline-flex items-center gap-2 text-sm font-extrabold text-white transition hover:text-blue-200 sm:ml-3"
              >
                Vendi con Guimmia <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <Link
            href={`/immobili/${featuredListing.slug}`}
            className="group overflow-hidden rounded-[28px] border border-white/20 bg-white p-2 shadow-[0_28px_80px_rgba(15,23,42,0.45)] transition hover:-translate-y-1"
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-[21px] bg-slate-200">
              {featuredListing.cover_image_url ? (
                <Image
                  src={featuredListing.cover_image_url}
                  alt={featuredListing.title}
                  fill
                  sizes="(min-width: 1024px) 390px, 90vw"
                  className="object-cover transition duration-500 group-hover:scale-[1.035]"
                />
              ) : null}
              <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
                <span className="rounded-full bg-slate-950/90 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.08em] text-white backdrop-blur">
                  Immobile in evidenza
                </span>
                {preview ? (
                  <span className="rounded-full bg-amber-100 px-3 py-1.5 text-[11px] font-black text-amber-900 shadow">
                    Esempio
                  </span>
                ) : null}
              </div>
            </div>

            <div className="p-4 pb-5">
              <p className="flex items-center gap-1.5 text-xs font-extrabold text-blue-600">
                <MapPin size={14} aria-hidden="true" />
                {featuredListing.city}{featuredListing.zone ? ` · ${featuredListing.zone}` : ""}
              </p>
              <h2 className="mt-2 text-xl font-black leading-tight tracking-[-0.025em] text-slate-950">
                {featuredListing.title}
              </h2>
              <p className="mt-3 text-2xl font-black text-slate-950">
                {featuredPrice(featuredListing)}
              </p>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-100 pt-4 text-xs font-bold text-slate-600">
                {featuredListing.surface_sqm ? (
                  <span className="inline-flex items-center gap-1.5"><Maximize2 size={15} /> {featuredListing.surface_sqm} m²</span>
                ) : null}
                {featuredListing.bedrooms ? (
                  <span className="inline-flex items-center gap-1.5"><BedDouble size={15} /> {featuredListing.bedrooms}</span>
                ) : null}
                {featuredListing.bathrooms ? (
                  <span className="inline-flex items-center gap-1.5"><Bath size={15} /> {featuredListing.bathrooms}</span>
                ) : null}
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
