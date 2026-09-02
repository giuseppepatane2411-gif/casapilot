import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bath,
  BedDouble,
  CalendarDays,
  Check,
  House,
  MapPin,
  Maximize2,
  MessageCircle,
  ShieldCheck,
  Users,
} from "lucide-react";

import PublicAgencyFooter from "@/components/agency/PublicAgencyFooter";
import PublicAgencyHeader from "@/components/agency/PublicAgencyHeader";
import JsonLd from "@/components/seo/JsonLd";
import { getAgencyListing, getListingMarket } from "@/lib/agency/listings";
import type { AgencyListing } from "@/lib/agency/types";
import { createPublicMetadata } from "@/lib/seo/metadata";
import { listingStructuredData } from "@/lib/seo/schema";

type Params = Promise<{ slug: string }>;

function price(listing: AgencyListing) {
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

function operationLabel(listing: AgencyListing) {
  const market = getListingMarket(listing);
  if (market === "buy") return "In vendita";
  if (market === "room") return "Stanza in affitto";
  if (market === "holiday") return "Affitto turistico";
  return "In affitto";
}

function roomTypeLabel(value: AgencyListing["room_type"]) {
  return {
    single: "Stanza singola",
    double: "Doppia uso singolo",
    shared: "Posto letto in stanza condivisa",
  }[value ?? "single"];
}

function occupantProfileLabel(value: "student" | "worker") {
  return value === "student" ? "Studenti e studentesse" : "Lavoratori e lavoratrici";
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { item, source } = await getAgencyListing(slug);
  if (!item) {
    return {
      title: "Immobile non disponibile",
      robots: { index: false, follow: false },
    };
  }

  const description = `${operationLabel(item)} a ${item.city}. ${item.description}`.slice(0, 155);

  const base = createPublicMetadata({
    title: item.title,
    description,
    path: `/immobili/${item.slug}`,
    noIndex: source === "demo",
  });

  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      type: "website",
      url: `/immobili/${item.slug}`,
      title: item.title,
      description,
      images: item.cover_image_url
        ? [{ url: item.cover_image_url, alt: item.title }]
        : undefined,
    },
    twitter: {
      ...base.twitter,
      images: item.cover_image_url ? [item.cover_image_url] : undefined,
    },
  };
}

export default async function ListingDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const { item: listing, source } = await getAgencyListing(slug);
  if (!listing) notFound();

  const isRoom = getListingMarket(listing) === "room";
  const visitMessage = encodeURIComponent(
    `Vorrei informazioni e organizzare una visita per “${listing.title}” a ${listing.city}. Riferimento annuncio: ${listing.slug}.`,
  );

  return (
    <>
      {source === "supabase" ? <JsonLd data={listingStructuredData(listing)} /> : null}
      <PublicAgencyHeader />
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-10">
            <Link
              href="/immobili"
              className="inline-flex items-center gap-2 text-sm font-black text-slate-600 transition hover:text-blue-700"
            >
              <ArrowLeft size={17} aria-hidden="true" /> Torna alla vetrina
            </Link>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(330px,.55fr)] lg:px-10 lg:py-12">
          <div className="min-w-0">
            <div className="relative aspect-[16/10] overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-950 via-blue-900 to-blue-600 shadow-xl">
              {listing.cover_image_url ? (
                // The listing source can be a customer-configured Supabase or portal URL.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={listing.cover_image_url}
                  alt={listing.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-white/80">
                  <House size={88} strokeWidth={1.2} aria-hidden="true" />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950/70 to-transparent" />
              <div className="absolute left-5 top-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-slate-950 shadow">
                  {operationLabel(listing)}
                </span>
                {listing.visibility_tier === "top" ? (
                  <span className="rounded-full bg-blue-600 px-4 py-2 text-xs font-black text-white shadow">
                    TOP
                  </span>
                ) : null}
                {source === "demo" ? (
                  <span className="rounded-full bg-amber-100 px-4 py-2 text-xs font-black text-amber-900 shadow">
                    Esempio
                  </span>
                ) : null}
              </div>
            </div>

            <article className="mt-7 rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <p className="flex items-center gap-2 text-sm font-black text-blue-700">
                <MapPin size={17} aria-hidden="true" />
                {listing.city}{listing.zone ? ` · ${listing.zone}` : ""}
                {listing.province ? ` · ${listing.province}` : ""}
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-[-0.045em] sm:text-5xl">
                {listing.title}
              </h1>
              <p className="mt-5 text-3xl font-black text-slate-950">{price(listing)}</p>

              <div className="mt-6 flex flex-wrap gap-3 border-y border-slate-100 py-5 text-sm font-bold text-slate-700">
                {(listing.room_surface_sqm || listing.surface_sqm) ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2">
                    <Maximize2 size={17} aria-hidden="true" />
                    {listing.room_surface_sqm || listing.surface_sqm} m²
                    {isRoom ? " stanza" : ""}
                  </span>
                ) : null}
                {listing.rooms ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2">
                    <House size={17} aria-hidden="true" /> {listing.rooms} locali
                  </span>
                ) : null}
                {listing.bedrooms ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2">
                    <BedDouble size={17} aria-hidden="true" /> {listing.bedrooms} camere
                  </span>
                ) : null}
                {listing.bathrooms ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2">
                    <Bath size={17} aria-hidden="true" /> {listing.bathrooms} bagni
                  </span>
                ) : null}
              </div>

              <h2 className="mt-7 text-xl font-black">Descrizione</h2>
              <p className="mt-3 whitespace-pre-line text-base leading-8 text-slate-600">
                {listing.description}
              </p>

              {listing.features.length ? (
                <div className="mt-7">
                  <h2 className="text-xl font-black">Caratteristiche</h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {listing.features.map((feature) => (
                      <span key={feature} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700">
                        <Check size={15} className="text-blue-600" aria-hidden="true" /> {feature}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </article>

            {isRoom ? (
              <section className="mt-7 rounded-[30px] border border-blue-200 bg-blue-50 p-6 sm:p-8">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                  Stanza e convivenza
                </p>
                <h2 className="mt-2 text-2xl font-black">Informazioni chiare prima del contatto</h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <RoomFact icon={BedDouble} label="Soluzione" value={roomTypeLabel(listing.room_type)} />
                  <RoomFact
                    icon={Bath}
                    label="Bagno"
                    value={listing.private_bathroom ? "Bagno privato" : "Bagno condiviso"}
                  />
                  <RoomFact
                    icon={Users}
                    label="Casa attuale"
                    value={listing.current_household_summary || `${listing.current_roommates_count ?? 0} coinquilini presenti`}
                  />
                  <RoomFact
                    icon={CalendarDays}
                    label="Disponibilità"
                    value={listing.available_from ? new Intl.DateTimeFormat("it-IT", { dateStyle: "long" }).format(new Date(`${listing.available_from}T12:00:00`)) : "Da concordare"}
                  />
                  <RoomFact
                    icon={Check}
                    label="Spese"
                    value={listing.expenses_included ? "Spese incluse nel canone" : "Spese escluse dal canone"}
                  />
                </div>

                {listing.accepted_occupant_profiles?.length ? (
                  <div className="mt-5 rounded-2xl border border-blue-100 bg-white p-5">
                    <p className="text-sm font-black text-slate-950">Profili previsti dall’annuncio</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {listing.accepted_occupant_profiles.map(occupantProfileLabel).join(" · ")}
                    </p>
                  </div>
                ) : null}

                <div className="mt-5 flex items-start gap-3 rounded-2xl border border-blue-200 bg-white/80 p-5 text-sm leading-6 text-slate-600">
                  <ShieldCheck className="mt-0.5 shrink-0 text-blue-700" size={19} aria-hidden="true" />
                  <p>
                    Le informazioni personali o di compatibilità non vengono usate per
                    esclusioni automatiche. Guimmia organizza le richieste; la valutazione
                    finale resta umana e deve rispettare le regole applicabili.
                  </p>
                </div>
              </section>
            ) : null}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_22px_60px_rgba(15,23,42,.1)]">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                Parla con Guimmia
              </p>
              <h2 className="mt-2 text-2xl font-black">Vuoi saperne di più o visitarlo?</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                La chat partirà già da questo annuncio. Guimmia raccoglierà la tua richiesta
                e ti guiderà verso il prossimo passaggio utile.
              </p>
              <Link
                href={`/dashboard/pilot?message=${visitMessage}`}
                className="mt-6 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
              >
                <MessageCircle size={18} aria-hidden="true" /> Chiedi informazioni
              </Link>
              <Link
                href={`/dashboard/pilot?message=${visitMessage}`}
                className="mt-3 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 text-sm font-black text-slate-800 transition hover:bg-slate-50"
              >
                Organizza una visita <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <p className="mt-4 text-xs leading-5 text-slate-500">
                Nessun appuntamento viene confermato automaticamente: Guimmia verifica
                disponibilità e richiede la conferma delle persone coinvolte.
              </p>
            </div>
          </aside>
        </section>
      </main>
      <PublicAgencyFooter />
    </>
  );
}

function RoomFact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BedDouble;
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-2xl border border-blue-100 bg-white p-5">
      <Icon size={20} className="text-blue-700" aria-hidden="true" />
      <p className="mt-3 text-xs font-black uppercase tracking-[0.1em] text-slate-400">{label}</p>
      <p className="mt-1 font-black text-slate-950">{value}</p>
    </article>
  );
}
