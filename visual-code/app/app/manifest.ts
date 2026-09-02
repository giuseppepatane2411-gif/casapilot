import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Guimmia – Agenzia immobiliare digitale",
    short_name: "Guimmia",
    description:
      "Vendita e affitto, dalla preparazione dell’annuncio fino alla negoziazione e ai contratti.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0b63f6",
    lang: "it-IT",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
