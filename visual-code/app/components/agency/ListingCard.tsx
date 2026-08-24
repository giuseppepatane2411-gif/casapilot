import Link from "next/link";
import type { AgencyListing } from "@/lib/agency/types";

export function listingPrice(x: AgencyListing) {
  const value = new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(x.price_cents / 100);
  return x.operation === "rent" ? `${value}/mese` : value;
}

export default function ListingCard({ listing }: { listing: AgencyListing }) {
  return (
    <article className="group overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_16px_45px_rgba(15,23,42,.08)] transition hover:-translate-y-1 hover:shadow-[0_22px_58px_rgba(15,23,42,.13)]">
      <Link href={`/immobili/${listing.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-950 via-blue-900 to-blue-600">
          {listing.cover_image_url ? (
            <img src={listing.cover_image_url} alt={listing.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
          ) : (
            <div className="flex h-full items-center justify-center text-7xl text-white/80">⌂</div>
          )}
          <div className="absolute left-4 top-4 flex gap-2">
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-900 shadow">
              {listing.operation === "sale" ? "In vendita" : "In affitto"}
            </span>
            {listing.visibility_tier === "top" ? (
              <span className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-black text-white shadow">TOP</span>
            ) : null}
          </div>
        </div>

        <div className="p-5">
          <p className="text-sm font-extrabold text-blue-600">
            {listing.city}{listing.zone ? ` · ${listing.zone}` : ""}
          </p>
          <h2 className="mt-2 line-clamp-2 text-xl font-black tracking-[-0.025em] text-slate-950">
            {listing.title}
          </h2>
          <p className="mt-3 text-2xl font-black text-slate-950">{listingPrice(listing)}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
            {listing.surface_sqm ? <span className="rounded-full bg-slate-100 px-3 py-1.5">{listing.surface_sqm} m²</span> : null}
            {listing.rooms ? <span className="rounded-full bg-slate-100 px-3 py-1.5">{listing.rooms} locali</span> : null}
            {listing.bathrooms ? <span className="rounded-full bg-slate-100 px-3 py-1.5">{listing.bathrooms} bagni</span> : null}
          </div>
        </div>
      </Link>
    </article>
  );
}
