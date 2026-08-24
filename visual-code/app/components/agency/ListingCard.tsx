"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Bath,
  BedDouble,
  Heart,
  MapPin,
  Maximize2,
} from "lucide-react";

import type { AgencyListing } from "@/lib/agency/types";

const FAVORITES_KEY = "guimmia_public_favorites_v1";

export function listingPrice(x: AgencyListing) {
  const value = new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(x.price_cents / 100);
  if (x.operation === "sale") return value;
  if (x.rent_period === "day") return `${value}/notte`;
  if (x.rent_period === "week") return `${value}/settimana`;
  return `${value}/mese`;
}

function listingOperationLabel(listing: AgencyListing) {
  if (listing.operation === "sale") return "In vendita";
  if (listing.rent_period === "day" || listing.rent_period === "week") {
    return "Affitto turistico";
  }
  return "In affitto";
}

export default function ListingCard({
  listing,
  preview = false,
}: {
  listing: AgencyListing;
  preview?: boolean;
}) {
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? "[]") as unknown;
      setFavorite(Array.isArray(stored) && stored.includes(listing.id));
    } catch {
      setFavorite(false);
    }
  }, [listing.id]);

  function toggleFavorite() {
    try {
      const stored = JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? "[]") as unknown;
      const ids = Array.isArray(stored)
        ? stored.filter((value): value is string => typeof value === "string")
        : [];
      const next = favorite
        ? ids.filter((id) => id !== listing.id)
        : Array.from(new Set([...ids, listing.id]));
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      setFavorite(!favorite);
    } catch {
      setFavorite(!favorite);
    }
  }

  return (
    <article className="group relative overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_16px_45px_rgba(15,23,42,.08)] transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_22px_58px_rgba(15,23,42,.13)]">
      <button
        type="button"
        onClick={toggleFavorite}
        aria-pressed={favorite}
        aria-label={favorite ? "Rimuovi dai preferiti" : "Salva nei preferiti"}
        className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-slate-800 shadow-lg backdrop-blur transition hover:scale-105 hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
      >
        <Heart
          size={20}
          fill={favorite ? "currentColor" : "none"}
          className={favorite ? "text-rose-600" : ""}
          aria-hidden="true"
        />
      </button>

      <Link href={`/immobili/${listing.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-950 via-blue-900 to-blue-600">
          {listing.cover_image_url ? (
            <img
              src={listing.cover_image_url}
              alt={listing.title}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-7xl text-white/80">⌂</div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/45 to-transparent" />
          <div className="absolute left-4 top-4 flex max-w-[calc(100%-76px)] flex-wrap gap-2">
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-900 shadow">
              {listingOperationLabel(listing)}
            </span>
            {listing.visibility_tier === "top" ? (
              <span className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-black text-white shadow">
                TOP
              </span>
            ) : null}
            {preview ? (
              <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-black text-amber-900 shadow">
                Esempio
              </span>
            ) : null}
          </div>
        </div>

        <div className="p-5">
          <p className="flex items-center gap-1.5 text-sm font-extrabold text-blue-600">
            <MapPin size={15} aria-hidden="true" />
            {listing.city}{listing.zone ? ` · ${listing.zone}` : ""}
          </p>
          <h2 className="mt-2 line-clamp-2 text-xl font-black tracking-[-0.025em] text-slate-950">
            {listing.title}
          </h2>
          <p className="mt-3 text-2xl font-black text-slate-950">{listingPrice(listing)}</p>

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-y border-slate-100 py-3 text-xs font-bold text-slate-600">
            {listing.surface_sqm ? (
              <span className="inline-flex items-center gap-1.5">
                <Maximize2 size={15} aria-hidden="true" /> {listing.surface_sqm} m²
              </span>
            ) : null}
            {listing.bedrooms ? (
              <span className="inline-flex items-center gap-1.5">
                <BedDouble size={16} aria-hidden="true" /> {listing.bedrooms} camere
              </span>
            ) : listing.rooms ? (
              <span>{listing.rooms} locali</span>
            ) : null}
            {listing.bathrooms ? (
              <span className="inline-flex items-center gap-1.5">
                <Bath size={15} aria-hidden="true" /> {listing.bathrooms} bagni
              </span>
            ) : null}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-500">
              {listing.energy_class ? `Classe energetica ${listing.energy_class}` : "Scheda immobile"}
            </span>
            <span className="inline-flex items-center gap-1 text-sm font-black text-slate-950 transition group-hover:text-blue-600">
              Dettagli <ArrowUpRight size={16} aria-hidden="true" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
