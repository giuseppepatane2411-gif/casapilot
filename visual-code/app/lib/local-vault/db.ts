import type { LocalVaultDocument, LocalVaultStats } from "@/lib/local-vault/types";
import type { DocumentKey } from "@/lib/property-journey/types";

const DB_NAME = "casapilot-local-vault-v1";
const DB_VERSION = 1;
const STORE_NAME = "documents";
export const LOCAL_VAULT_CHANGE_EVENT = "casapilot:local-vault-changed";
export const MAX_LOCAL_FILE_SIZE = 15 * 1024 * 1024;
export const ACCEPTED_LOCAL_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

function isBrowser() {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `vault-${crypto.randomUUID()}`;
  }
  return `vault-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (!isBrowser()) {
      reject(new Error("L’archivio locale non è disponibile in questo browser."));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("journeyId", "journeyId", { unique: false });
        store.createIndex("documentKey", "documentKey", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Impossibile aprire l’archivio locale."));
  });
}

function emitChange() {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(LOCAL_VAULT_CHANGE_EVENT));
}

export async function listLocalVaultDocuments(journeyId?: string | null) {
  const database = await openDatabase();

  try {
    return await new Promise<LocalVaultDocument[]>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = journeyId
        ? store.index("journeyId").getAll(journeyId)
        : store.getAll();

      request.onsuccess = () => {
        const documents = (request.result as LocalVaultDocument[]).sort((a, b) =>
          b.uploadedAt.localeCompare(a.uploadedAt),
        );
        resolve(documents);
      };
      request.onerror = () => reject(request.error ?? new Error("Impossibile leggere i file locali."));
    });
  } finally {
    database.close();
  }
}

export async function addLocalVaultDocument(input: {
  journeyId: string;
  documentKey: DocumentKey;
  file: File;
}) {
  if (input.file.size > MAX_LOCAL_FILE_SIZE) {
    throw new Error("Il file supera il limite di 15 MB previsto per la beta.");
  }

  if (
    input.file.type &&
    !ACCEPTED_LOCAL_FILE_TYPES.includes(input.file.type)
  ) {
    throw new Error("Formato non supportato. Usa PDF, JPG, PNG o WEBP.");
  }

  const document: LocalVaultDocument = {
    id: createId(),
    journeyId: input.journeyId,
    documentKey: input.documentKey,
    name: input.file.name,
    mimeType: input.file.type || "application/octet-stream",
    size: input.file.size,
    uploadedAt: new Date().toISOString(),
    file: input.file,
  };

  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put(document);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Impossibile salvare il file."));
      transaction.onabort = () => reject(transaction.error ?? new Error("Salvataggio annullato."));
    });
  } finally {
    database.close();
  }

  emitChange();
  return document;
}

export async function deleteLocalVaultDocument(documentId: string) {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).delete(documentId);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Impossibile eliminare il file."));
      transaction.onabort = () => reject(transaction.error ?? new Error("Eliminazione annullata."));
    });
  } finally {
    database.close();
  }
  emitChange();
}

export async function clearLocalVault() {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).clear();
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Impossibile svuotare l’archivio."));
    });
  } finally {
    database.close();
  }
  emitChange();
}

export async function getLocalVaultStats(): Promise<LocalVaultStats> {
  const documents = await listLocalVaultDocuments();
  let usageBytes: number | null = null;
  let quotaBytes: number | null = null;

  if (typeof navigator !== "undefined" && navigator.storage?.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      usageBytes = typeof estimate.usage === "number" ? estimate.usage : null;
      quotaBytes = typeof estimate.quota === "number" ? estimate.quota : null;
    } catch {
      // Il contatore dei file resta comunque disponibile.
    }
  }

  return {
    count: documents.length,
    totalBytes: documents.reduce((total, document) => total + document.size, 0),
    usageBytes,
    quotaBytes,
  };
}

export function subscribeToLocalVaultChanges(callback: () => void) {
  if (!isBrowser()) return () => undefined;
  window.addEventListener(LOCAL_VAULT_CHANGE_EVENT, callback);
  return () => window.removeEventListener(LOCAL_VAULT_CHANGE_EVENT, callback);
}
