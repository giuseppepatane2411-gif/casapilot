import PublicAgencyHeader from "@/components/agency/PublicAgencyHeader";
import PublicAgencyFooter from "@/components/agency/PublicAgencyFooter";
import { SELL_PACKAGES, RENT_PACKAGES } from "@/lib/guimmia/packages";
import { createPublicMetadata } from "@/lib/seo/metadata";

export const metadata = createPublicMetadata({
  title: "Prezzi dei servizi immobiliari",
  description:
    "Consulta i prezzi dei servizi Guimmia per vendere o affittare casa con un percorso digitale chiaro e costi definiti.",
  path: "/prezzi",
});

type PricePackage = {
  id: string;
  name: string;
  price: number;
  highlighted: boolean;
  summary: string;
  features?: readonly string[];
};

function Cards({ items }: { items: readonly PricePackage[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {items.map((p) => (
        <article key={p.id} className={`rounded-[30px] border p-7 ${p.highlighted ? "border-blue-600 bg-slate-950 text-white shadow-[0_22px_65px_rgba(15,23,42,.18)]" : "border-slate-200 bg-white text-slate-950"}`}>
          {p.highlighted ? <span className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-black text-white">CONSIGLIATO</span> : null}
          <h3 className="mt-5 text-2xl font-black">{p.name}</h3>
          <p className="mt-2 text-sm opacity-70">{p.summary}</p>
          <p className="mt-6 text-5xl font-black">{p.price} €</p>
          {p.features ? (
            <ul className="mt-6 space-y-3 text-sm font-semibold">
              {p.features.map((f) => <li key={f}>✓ {f}</li>)}
            </ul>
          ) : null}
        </article>
      ))}
    </div>
  );
}

export default function PrezziPage() {
  return (
    <>
      <PublicAgencyHeader />
      <main className="bg-slate-50">
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <p className="text-sm font-black uppercase tracking-[.16em] text-blue-600">Prezzo fisso</p>
          <h1 className="mt-4 max-w-5xl text-5xl font-black tracking-[-.055em] text-slate-950 sm:text-7xl">Sai quanto spendi prima di iniziare.</h1>
          <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-600">Nessuna percentuale sul valore della casa. Paghi il servizio Guimmia scelto.</p>

          <h2 className="mt-14 text-3xl font-black text-slate-950">Vendita</h2>
          <div className="mt-6"><Cards items={SELL_PACKAGES} /></div>

          <h2 className="mt-16 text-3xl font-black text-slate-950">Affitto</h2>
          <div className="mt-6"><Cards items={RENT_PACKAGES} /></div>

          <p className="mt-8 text-sm leading-6 text-slate-500">I servizi professionali esterni restano separati salvo diversa indicazione nel pacchetto acquistato.</p>
        </section>
      </main>
      <PublicAgencyFooter />
    </>
  );
}
