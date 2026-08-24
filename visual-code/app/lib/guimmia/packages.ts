export const SELL_PACKAGES = [
  {
    id: "sell_start",
    name: "Start",
    price: 299,
    highlighted: false,
    summary: "Per chi vuole essere autonomo con gli strumenti giusti.",
    features: [
      "Percorso guidato Guimmia",
      "Checklist immobile e documenti",
      "Preparazione annuncio con AI",
      "Vetrina Guimmia",
      "Assistenza Guimmia 24/7",
    ],
  },
  {
    id: "sell_smart",
    name: "Smart",
    price: 599,
    highlighted: true,
    summary: "Il pacchetto principale per vendere con Guimmia.",
    features: [
      "Tutto Start",
      "Distribuzione portali prevista dal piano",
      "Lead centralizzati",
      "Agenda visite",
      "Supporto offerte e negoziazione",
      "Documenti e contratti nel workflow",
      "Assistenza Guimmia 24/7",
    ],
  },
  {
    id: "sell_complete",
    name: "Complete",
    price: 999,
    highlighted: false,
    summary: "Massimo accompagnamento digitale durante l'operazione.",
    features: [
      "Tutto Smart",
      "Top Annuncio Guimmia",
      "Priorità operativa",
      "Revisione umana dove prevista",
      "Supporto avanzato fino alle fasi finali",
    ],
  },
] as const;

export const RENT_PACKAGES = [
  {
    id: "rent_start",
    name: "Start",
    price: 149,
    highlighted: false,
    summary: "Pubblicazione e percorso guidato per la locazione.",
  },
  {
    id: "rent_smart",
    name: "Smart",
    price: 299,
    highlighted: true,
    summary: "Annuncio, richieste, visite e documenti in un unico flusso.",
  },
  {
    id: "rent_complete",
    name: "Complete",
    price: 449,
    highlighted: false,
    summary: "Accompagnamento avanzato fino al contratto.",
  },
] as const;
