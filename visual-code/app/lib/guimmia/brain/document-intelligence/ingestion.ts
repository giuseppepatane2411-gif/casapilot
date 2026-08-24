import type { CaseDocumentVersionSnapshot } from "./types";

export interface IngestionDecision {
  action: "ACCEPT" | "EXACT_DUPLICATE" | "POSSIBLE_DUPLICATE" | "REVIEW";
  matchedVersionIds: string[];
  reason: string;
}

export function assessIncomingDocument(candidate: Pick<CaseDocumentVersionSnapshot,"sha256"|"perceptualFingerprint"|"quality">, existing: CaseDocumentVersionSnapshot[]): IngestionDecision {
  if (candidate.quality === "UNREADABLE") return { action: "REVIEW", matchedVersionIds: [], reason: "UNREADABLE" };
  if (candidate.sha256) {
    const exact = existing.filter(d => d.sha256 && d.sha256 === candidate.sha256);
    if (exact.length) return { action: "EXACT_DUPLICATE", matchedVersionIds: exact.map(d=>d.id), reason: "SHA256_MATCH" };
  }
  if (candidate.perceptualFingerprint) {
    const similar = existing.filter(d => d.perceptualFingerprint && d.perceptualFingerprint === candidate.perceptualFingerprint);
    if (similar.length) return { action: "POSSIBLE_DUPLICATE", matchedVersionIds: similar.map(d=>d.id), reason: "CONTENT_FINGERPRINT_MATCH" };
  }
  return { action: "ACCEPT", matchedVersionIds: [], reason: "NEW_VERSION" };
}
