import type { Metadata } from "next";
import PublicAgencyHeader from "@/components/agency/PublicAgencyHeader";
import PublicAgencyFooter from "@/components/agency/PublicAgencyFooter";
import ListingCard from "@/components/agency/ListingCard";
import ListingFilters from "@/components/agency/ListingFilters";
import { getAgencyListings } from "@/lib/agency/listings";
import type { Operation } from "@/lib/agency/types";

export const metadata: Metadata = {
  title: "Immobili in vendita e in affitto | Guimmia",
  description: "La vetrina immobiliare Guimmia: vendita, affitto e guida intelligente durante tutto il percorso.",
};

type Params = Promise<Record<string, string | string[] | undefined>>;
const one = (x: string | string[] | undefined) => Array.isArray(x) ? (x[0] ?? "") : (x ?? "");
const num = (x: string) => { const n = Number(x); return Number.isFinite(n) && n > 0 ? n : undefined; };

export default async function ImmobiliPage({ searchParams }: { searchParams: Params }) {
  const sp = await searchParams;
  const opRaw = one(sp.operazione);
  const operation: "" | Operation = opRaw === "sale" || opRaw === "rent" ? opRaw : "";
  const values = {
    operazione: operation,
    citta: one(sp.citta),
    tipologia: one(sp.tipologia),
    min: one(sp.min),
    max: one(sp.max),
    locali: one(sp.locali),
  };

  const result = await getAgencyListings({
    operation,
    city: values.citta,
    propertyType: values.tipologia,
    minPrice: num(values.min),
    maxPrice: num(values.max),
    minRooms: num(values.locali),
  });

  return (
    <>
      <PublicAgencyHeader />
      <main className="min-h-screen bg-slate-50">
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <p className="text-sm font-black uppercase tracking-[.16em] text-blue-600">Vetrina immobiliare</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-[-.05em] text-slate-950 sm:text-6xl">
              Trova casa con una guida intelligente al tuo fianco.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              Esplora vendita e affitto. Guimmia ti aiuta a capire la scheda, chiedere informazioni, organizzare una visita e affrontare il prossimo passo.
            </p>
            <div className="mt-8"><ListingFilters values={values} /></div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {result.source === "demo" ? (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">
              Modalità demo: esegui la migration Supabase V77 per usare gli annunci reali.
            </div>
          ) : null}
          <div className="mb-6">
            <p className="text-sm font-black text-slate-400">{result.items.length} immobili trovati</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {result.items.map((x) => <ListingCard key={x.id} listing={x} />)}
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
