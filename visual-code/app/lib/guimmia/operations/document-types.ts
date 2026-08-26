export const GUIMMIA_DOCUMENT_CATEGORIES = [
  "IDENTITA_PARTI",
  "TITOLARITA_PROVENIENZA",
  "CATASTO_PLANIMETRIE",
  "URBANISTICA_EDILIZIA",
  "ENERGIA_APE",
  "CONDOMINIO",
  "FISCALE_FINANZIARIO",
  "INCARICO_MEDIAZIONE",
  "CONTRATTI_PROPOSTE",
  "LOCAZIONE",
  "TURISTICO_OSPITI",
  "RELAZIONI_TECNICHE",
  "ALTRO_DA_VERIFICARE",
] as const;

export type GuimmiaDocumentCategory =
  (typeof GUIMMIA_DOCUMENT_CATEGORIES)[number];

export const GUIMMIA_DOCUMENT_FOLDERS = [
  "01_IDENTITA_E_PARTI",
  "02_PROVENIENZA_E_TITOLARITA",
  "03_CATASTO_E_PLANIMETRIE",
  "04_URBANISTICA_EDILIZIA",
  "05_ENERGIA_APE",
  "06_CONDOMINIO",
  "07_FISCALE_E_FINANZIARIO",
  "08_INCARICO_E_MEDIAZIONE",
  "09_CONTRATTI_E_PROPOSTE",
  "10_LOCAZIONE",
  "11_TURISTICO_E_OSPITI",
  "12_RELAZIONI_TECNICHE",
  "99_DA_VERIFICARE",
] as const;

export type GuimmiaDocumentFolder =
  (typeof GUIMMIA_DOCUMENT_FOLDERS)[number];

export const GUIMMIA_DOCUMENT_RECIPIENTS = [
  "AGENZIA_GUIMMIA",
  "NOTAIO",
  "GEOMETRA",
  "PROPRIETARIO",
  "CONDUTTORE",
  "COMMERCIALISTA",
  "AMMINISTRATORE_CONDOMINIO",
  "OSPITE",
  "ALTRO_PROFESSIONISTA",
] as const;

export type GuimmiaDocumentRecipient =
  (typeof GUIMMIA_DOCUMENT_RECIPIENTS)[number];

export const GUIMMIA_DOCUMENT_TYPES = [
  "DOCUMENTO_IDENTITA",
  "CODICE_FISCALE",
  "ATTO_PROVENIENZA",
  "VISURA_CATASTALE",
  "PLANIMETRIA_CATASTALE",
  "TITOLO_URBANISTICO",
  "CERTIFICATO_DESTINAZIONE_URBANISTICA",
  "APE",
  "DOCUMENTO_CONDOMINIALE",
  "DOCUMENTO_FISCALE_FINANZIARIO",
  "INCARICO_MEDIAZIONE",
  "PROPOSTA_O_CONTRATTO",
  "CONTRATTO_LOCAZIONE",
  "DOCUMENTO_TURISTICO",
  "RELAZIONE_TECNICA",
  "ALTRO_O_NON_RICONOSCIUTO",
] as const;

export type GuimmiaDocumentType = (typeof GUIMMIA_DOCUMENT_TYPES)[number];
export type GuimmiaDocumentQuality = "GOOD" | "PARTIAL" | "UNREADABLE";
export type GuimmiaDocumentStatus =
  | "PENDING_CONFIRMATION"
  | "ARCHIVED"
  | "NEEDS_REVIEW"
  | "REJECTED";

export const GUIMMIA_DOCUMENT_CATEGORY_LABELS: Record<
  GuimmiaDocumentCategory,
  string
> = {
  IDENTITA_PARTI: "Identità e parti",
  TITOLARITA_PROVENIENZA: "Provenienza e titolarità",
  CATASTO_PLANIMETRIE: "Catasto e planimetrie",
  URBANISTICA_EDILIZIA: "Urbanistica ed edilizia",
  ENERGIA_APE: "Energia e APE",
  CONDOMINIO: "Condominio",
  FISCALE_FINANZIARIO: "Fiscale e finanziario",
  INCARICO_MEDIAZIONE: "Incarico e mediazione",
  CONTRATTI_PROPOSTE: "Contratti e proposte",
  LOCAZIONE: "Locazione",
  TURISTICO_OSPITI: "Turistico e ospiti",
  RELAZIONI_TECNICHE: "Relazioni tecniche",
  ALTRO_DA_VERIFICARE: "Da verificare",
};

export const GUIMMIA_DOCUMENT_FOLDER_LABELS: Record<
  GuimmiaDocumentFolder,
  string
> = {
  "01_IDENTITA_E_PARTI": "01 · Identità e parti",
  "02_PROVENIENZA_E_TITOLARITA": "02 · Provenienza e titolarità",
  "03_CATASTO_E_PLANIMETRIE": "03 · Catasto e planimetrie",
  "04_URBANISTICA_EDILIZIA": "04 · Urbanistica ed edilizia",
  "05_ENERGIA_APE": "05 · Energia e APE",
  "06_CONDOMINIO": "06 · Condominio",
  "07_FISCALE_E_FINANZIARIO": "07 · Fiscale e finanziario",
  "08_INCARICO_E_MEDIAZIONE": "08 · Incarico e mediazione",
  "09_CONTRATTI_E_PROPOSTE": "09 · Contratti e proposte",
  "10_LOCAZIONE": "10 · Locazione",
  "11_TURISTICO_E_OSPITI": "11 · Turistico e ospiti",
  "12_RELAZIONI_TECNICHE": "12 · Relazioni tecniche",
  "99_DA_VERIFICARE": "99 · Da verificare",
};

export const GUIMMIA_DOCUMENT_RECIPIENT_LABELS: Record<
  GuimmiaDocumentRecipient,
  string
> = {
  AGENZIA_GUIMMIA: "Guimmia",
  NOTAIO: "Notaio",
  GEOMETRA: "Geometra",
  PROPRIETARIO: "Proprietario",
  CONDUTTORE: "Conduttore",
  COMMERCIALISTA: "Commercialista",
  AMMINISTRATORE_CONDOMINIO: "Amministratore di condominio",
  OSPITE: "Ospite",
  ALTRO_PROFESSIONISTA: "Altro professionista",
};

export type GuimmiaDocumentRecord = {
  id: string;
  draftId: string;
  originalName: string;
  suggestedName: string;
  mimeType: string;
  sizeBytes: number;
  documentType: GuimmiaDocumentType;
  category: GuimmiaDocumentCategory;
  folderCode: GuimmiaDocumentFolder;
  recipientRoles: GuimmiaDocumentRecipient[];
  quality: GuimmiaDocumentQuality;
  summary: string;
  warnings: string[];
  missingFollowups: string[];
  confidence: number;
  status: GuimmiaDocumentStatus;
  createdAt: string;
  confirmedAt: string | null;
  sendStatus: "NOT_SENT";
};

export type GuimmiaDocumentListSuccess = {
  ok: true;
  documents: GuimmiaDocumentRecord[];
};

export type GuimmiaDocumentAnalysisSuccess = {
  ok: true;
  document: GuimmiaDocumentRecord;
  assistantMessage: string;
  model: "gpt-5.6-luna";
  auditSaved: boolean;
  safety: {
    humanConfirmationRequired: true;
    legalValidityCertified: false;
    documentSent: false;
    privateStorage: true;
  };
};

export type GuimmiaDocumentError = {
  ok: false;
  error: string;
  message: string;
};
