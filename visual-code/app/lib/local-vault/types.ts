import type { DocumentKey } from "@/lib/property-journey/types";

export type LocalVaultDocument = {
  id: string;
  journeyId: string;
  documentKey: DocumentKey;
  name: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  file: Blob;
};

export type LocalVaultStats = {
  count: number;
  totalBytes: number;
  quotaBytes: number | null;
  usageBytes: number | null;
};
