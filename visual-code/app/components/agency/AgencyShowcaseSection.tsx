import Link from "next/link";
import ListingCard from "@/components/agency/ListingCard";
import { getAgencyListings } from "@/lib/agency/listings";

export default async function AgencyShowcaseSection() {
  const { items } = await getAgencyListings({ limit: 3 });

  return (
    <section className="bg-slate-50 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[.16em] text-blue-600">Vetrina Guimmia</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-.04em] text-slate-950 sm:text-4xl">
              Immobili in vendita e in affitto
            </h2>
            <p className="mt-3 max-w-2xl text-slate-600">
              Cerca l'immobile giusto oppure affidati a Guimmia per gestire il tuo percorso immobiliare.
            </p>
          </div>
          <Link href="/immobili" className="font-black text-blue-600 hover:underline">Vedi tutti gli immobili →</Link>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
        </div>
      </div>
    </section>
  );
}
