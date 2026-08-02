export const ACCOUNT_TERMS_VERSION = "2026-08-01";
export const ACCOUNT_PRIVACY_VERSION = "2026-08-01";

export const PROFESSIONS = [
  "Agente immobiliare",
  "Geometra",
  "Architetto",
  "Ingegnere",
  "Notaio",
  "Avvocato",
  "Consulente del credito",
  "Certificatore energetico",
  "Amministratore di condominio",
  "Impresa edile",
  "Impresa di traslochi",
  "Fotografo immobiliare",
  "Home stager",
  "Altro professionista",
] as const;

export const PROFESSIONAL_STATUS_COPY = {
  draft: {
    label: "Profilo da completare",
    description:
      "Completa i dati essenziali e invia il profilo quando sei pronto per la verifica.",
    tone: "slate",
  },
  submitted: {
    label: "Richiesta inviata",
    description:
      "La richiesta è stata ricevuta. Ti avviseremo quando inizierà la verifica.",
    tone: "blue",
  },
  under_review: {
    label: "Verifica in corso",
    description:
      "I dati professionali e le abilitazioni dichiarate sono in fase di controllo.",
    tone: "amber",
  },
  changes_requested: {
    label: "Dati da correggere",
    description:
      "Sono necessarie alcune modifiche prima di poter completare la verifica.",
    tone: "rose",
  },
  verified: {
    label: "Professionista verificato",
    description:
      "Il profilo ha superato i controlli previsti ed è idoneo alla pubblicazione.",
    tone: "emerald",
  },
  suspended: {
    label: "Profilo sospeso",
    description:
      "La visibilità pubblica del profilo è temporaneamente sospesa.",
    tone: "rose",
  },
} as const;
