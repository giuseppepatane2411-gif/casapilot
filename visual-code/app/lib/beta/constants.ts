import type {
  BetaMilestone,
  BetaScenario,
  BetaUsefulArea,
} from "@/lib/beta/types";

export const BETA_STATE_STORAGE_KEY = "casapilot-beta-state-v2";
export const LEGACY_BETA_STATE_STORAGE_KEY = "casapilot-beta-state-v1";
export const BETA_STATE_CHANGE_EVENT = "casapilot:beta-state-changed";

export const DEMO_JOURNEY_IDS: Record<BetaScenario, string> = {
  sale: "casapilot-demo-sale-v2",
  rent: "casapilot-demo-rent-v2",
  inheritance: "casapilot-demo-inheritance-v2",
};

export const BETA_MILESTONES: Array<{
  id: BetaMilestone;
  title: string;
  description: string;
}> = [
  {
    id: "journey-created",
    title: "Apri una pratica",
    description: "Scegli uno scenario oppure configura un immobile reale.",
  },
  {
    id: "pilot-opened",
    title: "Raggiungi il momento wow",
    description: "Verifica che la missione principale sia chiara in pochi secondi.",
  },
  {
    id: "mission-completed",
    title: "Completa una missione",
    description: "Controlla che punteggio, priorità e timeline cambino davvero.",
  },
  {
    id: "vault-used",
    title: "Prova l’archivio locale",
    description: "Allega un file di prova: resta soltanto su questo dispositivo.",
  },
  {
    id: "feedback-shared",
    title: "Condividi il verdetto",
    description: "Dicci cosa è stato utile e cosa non merita di essere costruito.",
  },
];

export const BETA_USEFUL_AREAS: Array<{
  id: BetaUsefulArea;
  label: string;
}> = [
  { id: "mission", label: "Missione di oggi" },
  { id: "documents", label: "Checklist documenti" },
  { id: "vault", label: "Archivio locale" },
  { id: "pilot", label: "Pilot OS" },
  { id: "dashboard", label: "Dashboard" },
  { id: "wizard", label: "Creazione del percorso" },
  { id: "other", label: "Altro" },
];
