"use client";

import { useCallback, useEffect, useState } from "react";

import {
  addLocalVaultDocument,
  deleteLocalVaultDocument,
  getLocalVaultStats,
  listLocalVaultDocuments,
  subscribeToLocalVaultChanges,
} from "@/lib/local-vault/db";
import type { LocalVaultDocument, LocalVaultStats } from "@/lib/local-vault/types";
import type { DocumentKey } from "@/lib/property-journey/types";

const EMPTY_STATS: LocalVaultStats = {
  count: 0,
  totalBytes: 0,
  usageBytes: null,
  quotaBytes: null,
};

export function useLocalVault(journeyId?: string | null) {
  const [documents, setDocuments] = useState<LocalVaultDocument[]>([]);
  const [stats, setStats] = useState<LocalVaultStats>(EMPTY_STATS);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [nextDocuments, nextStats] = await Promise.all([
        listLocalVaultDocuments(journeyId),
        getLocalVaultStats(),
      ]);
      setDocuments(nextDocuments);
      setStats(nextStats);
      setError(null);
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Archivio locale non disponibile.",
      );
    } finally {
      setHydrated(true);
    }
  }, [journeyId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    const unsubscribe = subscribeToLocalVaultChanges(() => void refresh());

    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, [refresh]);

  async function add(input: {
    journeyId: string;
    documentKey: DocumentKey;
    file: File;
  }) {
    const document = await addLocalVaultDocument(input);
    await refresh();
    return document;
  }

  async function remove(documentId: string) {
    await deleteLocalVaultDocument(documentId);
    await refresh();
  }

  return {
    hydrated,
    documents,
    stats,
    error,
    refresh,
    add,
    remove,
  };
}
