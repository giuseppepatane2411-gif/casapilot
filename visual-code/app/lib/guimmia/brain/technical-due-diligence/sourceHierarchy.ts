import type { SourceDomain, TechnicalSource, TechnicalSourceKind, TechnicalValue } from "./types";

/**
 * Il rank serve a ordinare la review, NON a decretare automaticamente la verità.
 * Fonti di domini diversi non si "battono" a vicenda: catasto, urbanistica e stato fisico
 * sono livelli informativi distinti e possono richiedere interpretazione professionale.
 */
export const TECHNICAL_SOURCE_RANK: Record<TechnicalSourceKind, number> = {
  PROFESSIONAL_SIGNED_REPORT: 100,
  MUNICIPAL_RECORD: 95,
  URBAN_TITLE: 92,
  AGIBILITY_RECORD: 90,
  CADASTRAL_HISTORICAL: 85,
  CADASTRAL_CURRENT: 82,
  TITLE_DEED: 78,
  PROFESSIONAL_OBSERVATION: 75,
  OFFICIAL_EXTERNAL_SOURCE: 70,
  OWNER_DECLARATION: 30,
  AI_INFERENCE: 10,
};

export function sameDomain(a: TechnicalSource, b: TechnicalSource): boolean {
  return a.domain === b.domain;
}

export function reviewOrder(values: TechnicalValue[]): TechnicalValue[] {
  return [...values].sort((a,b) => TECHNICAL_SOURCE_RANK[b.source.kind] - TECHNICAL_SOURCE_RANK[a.source.kind]);
}

export function canAutoResolveConflict(a: TechnicalValue, b: TechnicalValue): boolean {
  if (!sameDomain(a.source, b.source)) return false;
  if (a.source.kind === "AI_INFERENCE" || b.source.kind === "AI_INFERENCE") return false;
  if (a.source.verifiedByProfessional !== b.source.verifiedByProfessional) return false;
  return false; // V76.5: nessun conflitto tecnico sostanziale viene auto-risolto.
}

export const DOMAIN_GUIDANCE: Record<SourceDomain, string> = {
  IDENTITY: "Identificativi dell'unità e del bene oggetto di verifica.",
  CADASTRE: "Dati catastali e planimetrici: informativi, non sostitutivi della verifica urbanistica.",
  URBAN: "Titoli, pratiche e documentazione amministrativa urbanistico-edilizia.",
  PHYSICAL_STATE: "Stato fisico rilevato/dichiarato; richiede sopralluogo professionale quando decisivo.",
  AGIBILITY: "Documentazione relativa all'agibilità e al relativo ambito.",
  USE: "Destinazione d'uso dichiarata, catastale e urbanisticamente autorizzata.",
  PROTECTED_PROPERTY: "Vincoli e discipline di tutela da instradare a verifica competente.",
  TRANSFER_FORMALITIES: "Profili documentali/formali della circolazione dell'immobile.",
};
