import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Guimmia – La tua guida immobiliare intelligente.",
    short_name: "Guimmia",
    description:
      "Assistente specializzato in vendita, acquisto, affitto, documenti, annunci e contratti immobiliari.",
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
