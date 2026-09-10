import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/seo/metadata";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Le pagine HTML private restano scansionabili affinche i crawler
      // possano leggere il loro meta robots noindex. Qui blocchiamo soltanto
      // gli endpoint che non producono contenuti destinati ai motori di ricerca.
      disallow: ["/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
