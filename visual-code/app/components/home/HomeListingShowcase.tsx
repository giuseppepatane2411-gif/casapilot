import Link from "next/link";
import { ArrowRight } from "lucide-react";

import ListingCard from "@/components/agency/ListingCard";
import type { AgencyListing } from "@/lib/agency/types";

const marketLinks = [
  { href: "/immobili", label: "Tutti" },
  { href: "/immobili?mercato=buy", label: "In vendita" },
  { href: "/immobili?mercato=rent", label: "In affitto" },
  { href: "/immobili?mercato=holiday", label: "Per le vacanze" },
];

export default function HomeListingShowcase({
  listings,
  preview,
}: {
  listings: AgencyListing[];
  preview: boolean;
}) {
  return (
    <section className="bg-white py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-blue-600">
              Vetrina immobiliare
            </p>
            <h2 className="mt-3 max-w-3xl text-4xl font-black tracking-[-0.045em] text-slate-950 sm:text-5xl">
              Scopri gli immobili Guimmia
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Case da acquistare, affittare o vivere per qualche giorno. Tutte in un’unica vetrina semplice da esplorare.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {marketLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {preview && (
          <p className="mt-7 inline-flex rounded-full bg-amber-50 px-4 py-2 text-xs font-bold text-amber-800">
            Anteprima grafica: gli annunci mostrati sono esempi e non immobili realmente disponibili.
          </p>
        )}

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} preview={preview} />
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/immobili"
            className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-slate-950 px-7 text-sm font-black text-white transition hover:bg-blue-600"
          >
            Vedi tutti gli immobili
            <ArrowRight size={17} className="transition group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
