import type { Metadata } from "next";
import PublicAgencyHeader from "@/components/agency/PublicAgencyHeader";
import PublicAgencyFooter from "@/components/agency/PublicAgencyFooter";
import ListingCard from "@/components/agency/ListingCard";
import Hero from "@/components/home/Hero";
import { getAgencyListings, getDemoListings } from "@/lib/agency/listings";
import type { ListingMarket } from "@/lib/agency/types";

export const metadata: Metadata = {
  title: "Immobili in vendita e in affitto | Guimmia",
  description: "La vetrina immobiliare Guimmia: vendita, affitto e guida intelligente durante tutto il percorso.",
};

type Params = Promise<Record<string, string | string[] | undefined>>;
const one = (x: string | string[] | undefined) => Array.isArray(x) ? (x[0] ?? "") : (x ?? "");
const num = (x: string) => { const n = Number(x); return Number.isFinite(n) && n > 0 ? n : undefined; };

export default async function ImmobiliPage({ searchParams }: { searchParams: Params }) {
  const sp = await searchParams;
  const marketRaw = one(sp.mercato);
  const legacyOperation = one(sp.operazione);
  const market: "" | ListingMarket =
    marketRaw === "buy" || marketRaw === "rent" || marketRaw === "room" || marketRaw === "holiday"
      ? marketRaw
      : legacyOperation === "sale"
        ? "buy"
        : legacyOperation === "rent"
          ? "rent"
          : "";
  const values = {
    mercato: market,
    citta: one(sp.citta),
    tipologia: one(sp.tipologia),
    min: one(sp.min),
    max: one(sp.max),
    locali: one(sp.locali),
  };

  const result = await getAgencyListings({
    market,
    city: values.citta,
    propertyType: values.tipologia,
    minPrice: num(values.min),
    maxPrice: num(values.max),
    minRooms: num(values.locali),
  });
  const pageCopy = {
    buy: {
      title: "Case in vendita",
      description: "Scopri gli immobili da acquistare e trova quello giusto per il tuo prossimo passo.",
    },
    rent: {
      title: "Case in affitto",
      description: "Esplora le proposte in affitto e organizza la tua visita con Guimmia.",
    },
    room: {
      title: "Stanze in affitto",
      description: "Confronta stanze, caratteristiche della casa e informazioni utili sulla convivenza.",
    },
    holiday: {
      title: "Case per le vacanze",
      description: "Trova soggiorni e case vacanza e consulta subito le informazioni più importanti.",
    },
    all: {
      title: "Trova la casa giusta per te",
      description: "Immobili in vendita, in affitto e per le vacanze, in un’unica vetrina.",
    },
  }[market || "all"];
  const featuredListing = result.items[0] ?? getDemoListings({ limit: 1 })[0];
  const featuredPreview = result.source === "demo" || result.items.length === 0;

  return (
    <>
      <PublicAgencyHeader />
      <main className="min-h-screen bg-slate-50">
        <Hero featuredListing={featuredListing} preview={featuredPreview} />

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-8">
            <p className="text-sm font-black uppercase tracking-[.16em] text-blue-600">
              Vetrina immobili
            </p>
            <h2 className="mt-3 max-w-4xl text-3xl font-black tracking-[-.04em] text-slate-950 sm:text-5xl">
              {pageCopy.title}
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
              {pageCopy.description}
            </p>
          </div>
          {result.source === "demo" ? (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">
              Anteprima dimostrativa: questi annunci mostrano come funzionerà la vetrina. Gli immobili reali appariranno dopo la loro pubblicazione.
            </div>
          ) : null}
          <div className="mb-6">
            <p className="text-sm font-black text-slate-400">{result.items.length} immobili trovati</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {result.items.map((x) => (
              <ListingCard key={x.id} listing={x} preview={result.source === "demo"} />
            ))}
          </div>
          {result.items.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-12 text-center">
              <h2 className="text-2xl font-black text-slate-950">Nessun immobile con questi filtri</h2>
              <p className="mt-2 text-slate-600">Modifica la ricerca oppure torna presto.</p>
            </div>
          ) : null}
        </section>
      </main>
      <PublicAgencyFooter />
    </>
  );
}
