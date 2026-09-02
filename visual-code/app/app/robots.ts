import type { MetadataRoute } from "next";

const siteUrl = "https://guimmia.com";

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
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
