import type { MetadataRoute } from "next";

import { getAgencyListings } from "@/lib/agency/listings";
import { absoluteUrl, SITE_URL } from "@/lib/seo/metadata";

export const revalidate = 3600;

const publicRoutes: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/immobili", changeFrequency: "daily", priority: 0.9 },
  { path: "/vendere", changeFrequency: "monthly", priority: 0.8 },
  { path: "/affittare", changeFrequency: "monthly", priority: 0.8 },
  { path: "/valuta-immobile", changeFrequency: "monthly", priority: 0.8 },
  { path: "/servizi", changeFrequency: "monthly", priority: 0.7 },
  { path: "/prezzi", changeFrequency: "monthly", priority: 0.7 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
];

function publishedDate(value: string | null) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = publicRoutes.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency,
    priority,
  }));

  const listings = await getAgencyListings({ limit: 500 });
  if (listings.source !== "supabase") return staticEntries;

  const listingEntries: MetadataRoute.Sitemap = listings.items
    .filter((listing) => Boolean(listing.slug))
    .map((listing) => ({
      url: `${SITE_URL}/immobili/${listing.slug}`,
      lastModified: publishedDate(listing.published_at),
      changeFrequency: "weekly",
      priority: listing.featured ? 0.8 : 0.7,
      images: listing.cover_image_url
        ? [absoluteUrl(listing.cover_image_url)]
        : undefined,
    }));

  return [...staticEntries, ...listingEntries];
}
