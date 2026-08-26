"use client";

import { useEffect, useMemo, useState } from "react";

import {
  listGuimmiaDocuments,
  reviewGuimmiaDocument,
} from "@/lib/guimmia/operations/document-client";
import {
  GUIMMIA_DOCUMENT_CATEGORY_LABELS,
  GUIMMIA_DOCUMENT_CATEGORIES,
  GUIMMIA_DOCUMENT_FOLDER_LABELS,
  GUIMMIA_DOCUMENT_FOLDERS,
  GUIMMIA_DOCUMENT_RECIPIENT_LABELS,
  GUIMMIA_DOCUMENT_RECIPIENTS,
  type GuimmiaDocumentCategory,
  type GuimmiaDocumentFolder,
  type GuimmiaDocumentRecipient,
  type GuimmiaDocumentRecord,
} from "@/lib/guimmia/operations/document-types";

type ReviewDraft = {
  category: GuimmiaDocumentCategory;
  folderCode: GuimmiaDocumentFolder;
  recipientRoles: GuimmiaDocumentRecipient[];
};

export default function GuimmiaDocumentWorkspace({
  draftId,
  refreshToken,
  onStatus,
}: {
  draftId: string;
  refreshToken: number;
  onStatus: (message: string) => void;
}) {
  const [documents, setDocuments] = useState<GuimmiaDocumentRecord[]>([]);
  const [reviews, setReviews] = useState<Record<string, ReviewDraft>>({});
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void listGuimmiaDocuments(draftId)
      .then((result) => {
        if (!active) return;
        setDocuments(result.documents);
        setReviews(
          Object.fromEntries(
            result.documents.map((document) => [
              document.id,
              {
                category: document.category,
                folderCode: document.folderCode,
                recipientRoles: document.recipientRoles,
              },
            ]),
          ),
        );
        setError("");
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : "Archivio non disponibile.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [draftId, refreshToken]);

  const archived = useMemo(
    () => documents.filter((document) => document.status === "ARCHIVED"),
    [documents],
  );
  const notaryCount = archived.filter((document) =>
    document.recipientRoles.includes("NOTAIO"),
  ).length;
  const surveyorCount = archived.filter((document) =>
    document.recipientRoles.includes("GEOMETRA"),
  ).length;

  const updateReview = (id: string, patch: Partial<ReviewDraft>) => {
    setReviews((current) => ({
      ...current,
      [id]: { ...current[id], ...patch },
    }));
  };

  const toggleRecipient = (id: string, recipient: GuimmiaDocumentRecipient) => {
    const current = reviews[id]?.recipientRoles ?? [];
    updateReview(id, {
      recipientRoles: current.includes(recipient)
        ? current.filter((item) => item !== recipient)
        : [...current, recipient].slice(0, 5),
    });
  };

  const review = async (document: GuimmiaDocumentRecord, action: "CONFIRM" | "REJECT") => {
    setWorkingId(document.id);
    setError("");
    try {
      const selection = reviews[document.id];
      const result = await reviewGuimmiaDocument({
        documentId: document.id,
        action,
        ...(selection ?? {}),
      });
      setDocuments((current) =>
        action === "REJECT"
          ? current.filter((item) => item.id !== document.id)
          : current.map((item) => item.id === document.id ? result.document : item),
      );
      onStatus(result.assistantMessage);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Revisione non riuscita.");
    } finally {
      setWorkingId("");
    }
  };

  return (
    <div className="mt-5 space-y-4">
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
        <p className="text-sm font-bold text-slate-900">Fascicolo preparato da Guimmia</p>
        <p className="mt-1 text-xs leading-5 text-slate-600">
          OpenAI legge e propone cartella e destinatari. Tu confermi prima che il documento entri nel fascicolo.
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-xl bg-white p-2"><strong className="block text-base text-blue-700">{archived.length}</strong>Archiviati</div>
          <div className="rounded-xl bg-white p-2"><strong className="block text-base text-blue-700">{notaryCount}</strong>Per notaio</div>
          <div className="rounded-xl bg-white p-2"><strong className="block text-base text-blue-700">{surveyorCount}</strong>Per geometra</div>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
        Nessun documento viene approvato, certificato o inviato automaticamente. La cartella è privata e la validità resta da verificare.
      </div>

      {error ? <p className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p> : null}
      {loading ? <p className="text-sm text-slate-500">Carico il fascicolo…</p> : null}
      {!loading && documents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-center">
          <p className="text-sm font-semibold text-slate-800">Nessun documento caricato</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Usa la graffetta nella chat: Guimmia lo leggerà e preparerà qui la proposta.</p>
        </div>
      ) : null}

      {documents.map((document) => {
        const selection = reviews[document.id] ?? {
          category: document.category,
          folderCode: document.folderCode,
          recipientRoles: document.recipientRoles,
        };
        const pending = document.status === "PENDING_CONFIRMATION";
        return (
          <article key={document.id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">{document.suggestedName}</p>
                <p className="mt-1 text-xs text-slate-500">{Math.max(1, Math.round(document.sizeBytes / 1024))} KB · affidabilità {Math.round(document.confidence * 100)}%</p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${pending ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                {pending ? "Da confermare" : "Archiviato"}
              </span>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-600">{document.summary}</p>

            {pending ? (
              <div className="mt-4 grid gap-3">
                <label className="grid gap-1 text-xs font-semibold text-slate-700">
                  Categoria
                  <select value={selection.category} onChange={(event) => updateReview(document.id, { category: event.target.value as GuimmiaDocumentCategory })} className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 font-normal">
                    {GUIMMIA_DOCUMENT_CATEGORIES.map((category) => <option key={category} value={category}>{GUIMMIA_DOCUMENT_CATEGORY_LABELS[category]}</option>)}
                  </select>
                </label>
                <label className="grid gap-1 text-xs font-semibold text-slate-700">
                  Cartella logica
                  <select value={selection.folderCode} onChange={(event) => updateReview(document.id, { folderCode: event.target.value as GuimmiaDocumentFolder })} className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 font-normal">
                    {GUIMMIA_DOCUMENT_FOLDERS.map((folder) => <option key={folder} value={folder}>{GUIMMIA_DOCUMENT_FOLDER_LABELS[folder]}</option>)}
                  </select>
                </label>
                <fieldset>
                  <legend className="text-xs font-semibold text-slate-700">Prepara per</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {GUIMMIA_DOCUMENT_RECIPIENTS.map((recipient) => (
                      <button key={recipient} type="button" onClick={() => toggleRecipient(document.id, recipient)} className={`rounded-full border px-2.5 py-1.5 text-[11px] font-semibold ${selection.recipientRoles.includes(recipient) ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600"}`}>
                        {GUIMMIA_DOCUMENT_RECIPIENT_LABELS[recipient]}
                      </button>
                    ))}
                  </div>
                </fieldset>
                {(document.warnings.length > 0 || document.missingFollowups.length > 0) ? (
                  <div className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                    {[...document.warnings, ...document.missingFollowups].join(" ")}
                  </div>
                ) : null}
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" disabled={workingId === document.id || selection.recipientRoles.length === 0} onClick={() => void review(document, "CONFIRM")} className="rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-bold text-white disabled:bg-slate-300">Conferma e archivia</button>
                  <button type="button" disabled={workingId === document.id} onClick={() => void review(document, "REJECT")} className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600">Rifiuta proposta</button>
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                {GUIMMIA_DOCUMENT_FOLDER_LABELS[document.folderCode]} · Preparato per {document.recipientRoles.map((role) => GUIMMIA_DOCUMENT_RECIPIENT_LABELS[role]).join(", ")}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
