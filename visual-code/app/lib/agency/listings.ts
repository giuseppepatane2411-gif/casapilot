import "server-only";
import type {
  AgencyListing,
  ListingMarket,
  Operation,
} from "@/lib/agency/types";

type Filters = {
  operation?: "" | Operation;
  market?: "" | ListingMarket;
  city?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  minRooms?: number;
  limit?: number;
};

const DEMO: AgencyListing[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    slug: "attico-terrazza-catania",
    operation: "sale",
    property_type: "Attico",
    title: "Attico luminoso con grande terrazza",
    description: "Una scheda dimostrativa della nuova vetrina immobiliare Guimmia.",
    price_cents: 28500000,
    rent_period: null,
    city: "Catania",
    province: "CT",
    zone: "Centro",
    bedrooms: 3,
    bathrooms: 2,
    rooms: 5,
    surface_sqm: 142,
    floor: "6",
    elevator: true,
    energy_class: "D",
    features: ["Terrazza", "Ascensore", "Luminoso"],
    cover_image_url: "/images/guimmia/listing-attico-catania.webp",
    visibility_tier: "top",
    featured: true,
    published_at: new Date().toISOString(),
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    slug: "bilocale-navigli-milano",
    operation: "rent",
    property_type: "Appartamento",
    title: "Bilocale arredato vicino ai Navigli",
    description: "Bilocale moderno e pronto da abitare, demo della sezione affitti.",
    price_cents: 145000,
    rent_period: "month",
    city: "Milano",
    province: "MI",
    zone: "Navigli",
    bedrooms: 1,
    bathrooms: 1,
    rooms: 2,
    surface_sqm: 58,
    floor: "2",
    elevator: true,
    energy_class: "C",
    features: ["Arredato", "Balcone", "Ascensore"],
    cover_image_url: "/images/guimmia/listing-bilocale-milano.webp",
    visibility_tier: "standard",
    featured: true,
    published_at: new Date().toISOString(),
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    slug: "villa-giardino-palermo",
    operation: "sale",
    property_type: "Villa",
    title: "Villa indipendente con giardino",
    description: "Spazi esterni, tre camere e zona giorno aperta sul giardino.",
    price_cents: 34900000,
    rent_period: null,
    city: "Palermo",
    province: "PA",
    zone: "Residenziale",
    bedrooms: 3,
    bathrooms: 2,
    rooms: 6,
    surface_sqm: 168,
    floor: "Terra",
    elevator: false,
    energy_class: "B",
    features: ["Giardino", "Posto auto", "Indipendente"],
    cover_image_url: "/images/guimmia/listing-villa-palermo.webp",
    visibility_tier: "standard",
    featured: false,
    published_at: new Date().toISOString(),
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    slug: "casa-oceano-tenerife",
    operation: "rent",
    property_type: "Casa vacanze",
    title: "Casa sull’oceano con terrazza e piscina",
    description:
      "Una proposta dimostrativa dedicata al percorso di affitto turistico Guimmia.",
    price_cents: 16500,
    rent_period: "day",
    city: "Tenerife",
    province: "SC",
    zone: "Costa sud",
    bedrooms: 2,
    bathrooms: 2,
    rooms: 3,
    surface_sqm: 94,
    floor: "Terra",
    elevator: false,
    energy_class: "B",
    features: ["Vista oceano", "Piscina", "Terrazza"],
    cover_image_url: "/images/guimmia/listing-vacanza-tenerife.webp",
    visibility_tier: "top",
    featured: true,
    published_at: new Date().toISOString(),
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    slug: "stanza-singola-bologna-centro",
    operation: "rent",
    listing_kind: "room",
    property_type: "Stanza",
    title: "Stanza singola arredata in appartamento condiviso",
    description:
      "Stanza dimostrativa con informazioni chiare sulla casa e sulla convivenza.",
    price_cents: 52000,
    rent_period: "month",
    city: "Bologna",
    province: "BO",
    zone: "Centro",
    bedrooms: 1,
    bathrooms: 1,
    rooms: 4,
    surface_sqm: 96,
    room_type: "single",
    room_surface_sqm: 16,
    private_bathroom: false,
    current_roommates_count: 2,
    current_household_summary: "Casa condivisa con una studentessa e un lavoratore",
    accepted_occupant_profiles: ["student", "worker"],
    available_from: "2026-09-01",
    expenses_included: false,
    floor: "3",
    elevator: true,
    energy_class: "D",
    features: ["Arredata", "Wi-Fi", "Spazi comuni"],
    cover_image_url: "/images/guimmia/listing-bilocale-milano.webp",
    visibility_tier: "standard",
    featured: false,
    published_at: new Date().toISOString(),
  },
];

export function getListingMarket(listing: AgencyListing): ListingMarket {
  if (listing.operation === "sale") return "buy";
  if (listing.listing_kind === "room" || listing.property_type === "Stanza") {
    return "room";
  }
  return listing.rent_period === "day" || listing.rent_period === "week"
    ? "holiday"
    : "rent";
}

function config() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

function demoFiltered(filters: Filters) {
  return DEMO.filter((x) => {
    if (filters.market && getListingMarket(x) !== filters.market) return false;
    if (filters.operation && x.operation !== filters.operation) return false;
    if (filters.city && !x.city.toLowerCase().includes(filters.city.toLowerCase())) return false;
    if (filters.propertyType && x.property_type !== filters.propertyType) return false;
    if (filters.minPrice && x.price_cents < filters.minPrice * 100) return false;
    if (filters.maxPrice && x.price_cents > filters.maxPrice * 100) return false;
    if (filters.minRooms && (x.rooms ?? 0) < filters.minRooms) return false;
    return true;
  }).slice(0, filters.limit ?? 24);
}

export function getDemoListings(filters: Filters = {}) {
  return demoFiltered(filters);
}

export async function getAgencyListings(filters: Filters = {}) {
  const { url, key } = config();
  if (!url || !key) return { items: demoFiltered(filters), source: "demo" as const };

  const q = new URLSearchParams();
  q.set("select", "id,slug,operation,listing_kind,property_type,title,description,price_cents,rent_period,city,province,zone,bedrooms,bathrooms,rooms,surface_sqm,room_type,room_surface_sqm,private_bathroom,current_roommates_count,current_household_summary,accepted_occupant_profiles,available_from,expenses_included,floor,elevator,energy_class,features,cover_image_url,visibility_tier,featured,published_at");
  q.set("status", "eq.published");
  q.set("order", "featured.desc,visibility_tier.desc,published_at.desc");
  q.set("limit", String(filters.limit ?? 24));
  if (filters.market === "buy") {
    q.set("operation", "eq.sale");
  } else if (filters.market === "rent") {
    q.set("operation", "eq.rent");
    q.set("or", "(rent_period.eq.month,rent_period.is.null)");
  } else if (filters.market === "holiday") {
    q.set("operation", "eq.rent");
    q.set("rent_period", "in.(day,week)");
  } else if (filters.market === "room") {
    q.set("operation", "eq.rent");
    q.set("listing_kind", "eq.room");
  } else if (filters.operation) {
    q.set("operation", `eq.${filters.operation}`);
  }
  if (filters.city) q.set("city", `ilike.*${filters.city}*`);
  if (filters.propertyType) q.set("property_type", `eq.${filters.propertyType}`);
  if (filters.minPrice) q.set("price_cents", `gte.${Math.round(filters.minPrice * 100)}`);
  if (filters.maxPrice) q.append("price_cents", `lte.${Math.round(filters.maxPrice * 100)}`);
  if (filters.minRooms) q.set("rooms", `gte.${filters.minRooms}`);

  try {
    const r = await fetch(`${url}/rest/v1/agency_listings?${q}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: 60 },
    });
    if (!r.ok) return { items: demoFiltered(filters), source: "demo" as const };
    const items = (await r.json()) as AgencyListing[];
    return {
      items: items.map((x) => ({
        ...x,
        features: Array.isArray(x.features) ? x.features : [],
        accepted_occupant_profiles: Array.isArray(x.accepted_occupant_profiles)
          ? x.accepted_occupant_profiles
          : [],
      })),
      source: "supabase" as const,
    };
  } catch {
    return { items: demoFiltered(filters), source: "demo" as const };
  }
}

export async function getAgencyListing(slug: string) {
  const { url, key } = config();
  if (!url || !key) return { item: DEMO.find((x) => x.slug === slug) ?? null, source: "demo" as const };

  const q = new URLSearchParams({
    select: "*",
    slug: `eq.${slug}`,
    status: "eq.published",
    limit: "1",
  });

  try {
    const r = await fetch(`${url}/rest/v1/agency_listings?${q}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: 60 },
    });
    if (!r.ok) return { item: DEMO.find((x) => x.slug === slug) ?? null, source: "demo" as const };
    const rows = (await r.json()) as AgencyListing[];
    const item = rows[0] ?? DEMO.find((x) => x.slug === slug) ?? null;
    return {
      item: item ? { ...item, features: Array.isArray(item.features) ? item.features : [] } : null,
      source: rows[0] ? ("supabase" as const) : ("demo" as const),
    };
  } catch {
    return { item: DEMO.find((x) => x.slug === slug) ?? null, source: "demo" as const };
  }
}
