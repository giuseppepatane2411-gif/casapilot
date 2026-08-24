"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Database,
  Download,
  Eye,
  FileCheck2,
  FileText,
  FolderLock,
  HardDrive,
  Image as ImageIcon,
  LoaderCircle,
  LockKeyhole,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";

import { useJourneys } from "@/hooks/useJourneys";
import { useLocalVault } from "@/hooks/useLocalVault";
import {
  ACCEPTED_LOCAL_FILE_TYPES,
  MAX_LOCAL_FILE_SIZE,
} from "@/lib/local-vault/db";
import type { LocalVaultDocument } from "@/lib/local-vault/types";
import { markProductMilestone, trackProductEvent } from "@/lib/product/storage";
import { addPilotTimelineEvent } from "@/lib/pilot-os/store";
import {
  getOperationLabel,
  getRequiredDocuments,
} from "@/lib/property-journey/constants";
import { updateJourneyDocuments } from "@/lib/property-journey/storage";
import type { DocumentKey } from "@/lib/property-journey/types";

export default function LocalDocumentVault() {
  const searchParams = useSearchParams();
  const requestedJourneyId = searchParams.get("journey");
  const requestedDocument = searchParams.get("document") as DocumentKey | null;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    hydrated: journeysHydrated,
    journeys,
    activeJourney,
    activateJourney,
  } = useJourneys();
  const { hydrated, documents, stats, error, add, remove } = useLocalVault(
    activeJourney?.id ?? null,
  );
  const [uploadingDocument, setUploadingDocument] = useState<DocumentKey | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (
      journeysHydrated &&
      requestedJourneyId &&
      journeys.some((journey) => journey.id === requestedJourneyId) &&
      activeJourney?.id !== requestedJourneyId
    ) {
      activateJourney(requestedJourneyId);
    }
  }, [
    activateJourney,
    activeJourney?.id,
    journeys,
    journeysHydrated,
    requestedJourneyId,
  ]);

  const requiredDocuments = useMemo(
    () =>
      activeJourney
        ? getRequiredDocuments(
            activeJourney.operation,
            activeJourney.property.type,
          )
        : [],
    [activeJourney],
  );

  const filesByDocument = useMemo(() => {
    const grouped = new Map<DocumentKey, LocalVaultDocument[]>();
    for (const document of documents) {
      const current = grouped.get(document.documentKey) ?? [];
      grouped.set(document.documentKey, [...current, document]);
    }
    return grouped;
  }, [documents]);

  if (!journeysHydrated || !hydrated) {
    return <div className="h-[650px] animate-pulse rounded-[32px] bg-slate-100" />;
  }

  if (!activeJourney) {
    return (
      <section className="rounded-[30px] border border-dashed border-slate-300 bg-white p-9 text-center shadow-sm">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
          <FolderLock size={27} />
        </span>
        <h1 className="mt-5 text-3xl font-bold text-slate-950">
          Aggiungi prima il tuo immobile
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
          Ogni file verrà collegato al tuo immobile e alla voce corretta della checklist.
        </p>
        <Link
          href="/dashboard/properties/new"
          className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700"
        >
          Aggiungi il mio immobile
          <ArrowRight size={17} />
        </Link>
      </section>
    );
  }

  function chooseFile(documentKey: DocumentKey) {
    setUploadingDocument(documentKey);
    setMessage(null);
    fileInputRef.current?.click();
  }

  async function uploadFile(file: File) {
    if (!activeJourney || !uploadingDocument) return;
    setBusy(true);
    setMessage(null);

    try {
      await add({
        journeyId: activeJourney.id,
        documentKey: uploadingDocument,
        file,
      });

      if (!activeJourney.documents.includes(uploadingDocument)) {
        updateJourneyDocuments(activeJourney.id, [
          ...activeJourney.documents,
          uploadingDocument,
        ]);
      }

      const definition = requiredDocuments.find(
        (document) => document.id === uploadingDocument,
      );
      addPilotTimelineEvent(activeJourney.id, {
        id: `vault-${uploadingDocument}-${Date.now()}`,
        title: `${definition?.title ?? "Documento"} archiviato`,
        description: `${file.name} è stato collegato alla pratica e resta soltanto su questo dispositivo.`,
        type: "document",
      });
      markProductMilestone("vault-used");
      markProductMilestone("mission-completed");
      trackProductEvent("vault-file-added", {
        journeyId: activeJourney.id,
        metadata: {
          documentKey: uploadingDocument,
          fileSize: file.size,
          fileType: file.type || "unknown",
        },
      });
      setMessage({
        tone: "success",
        text: `${file.name} è stato salvato. Lo stato della pratica e la prossima azione sono stati aggiornati.`,
      });
    } catch (uploadError) {
      setMessage({
        tone: "error",
        text:
          uploadError instanceof Error
            ? uploadError.message
            : "Non siamo riusciti ad archiviare il file.",
      });
    } finally {
      setBusy(false);
      setUploadingDocument(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function deleteFile(document: LocalVaultDocument) {
    const confirmed = window.confirm(
      `Eliminare ${document.name} dall’archivio locale? La checklist resterà invariata perché potresti possedere ancora il documento fuori da Guimmia.`,
    );
    if (!confirmed) return;

    try {
      await remove(document.id);
      setMessage({
        tone: "success",
        text: `${document.name} è stato eliminato dai file locali.`,
      });
    } catch (deleteError) {
      setMessage({
        tone: "error",
        text:
          deleteError instanceof Error
            ? deleteError.message
            : "Impossibile eliminare il file.",
      });
    }
  }

  function openFile(document: LocalVaultDocument) {
    const url = URL.createObjectURL(document.file);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  function downloadFile(document: LocalVaultDocument) {
    const url = URL.createObjectURL(document.file);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = document.name;
    link.click();
    URL.revokeObjectURL(url);
  }

  const attachedDocumentTypes = new Set(documents.map((item) => item.documentKey));
  const checklistAvailable = activeJourney.documents.length;
  const attachedFiles = documents.length;
  const storagePercentage =
    stats.quotaBytes && stats.usageBytes
      ? Math.min(100, Math.round((stats.usageBytes / stats.quotaBytes) * 100))
      : null;

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[32px] bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/10 sm:p-8">
        <div aria-hidden="true" className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-blue-600/30 blur-3xl" />
        <div className="relative grid gap-7 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold text-blue-100">
              <FolderLock size={14} />
              I tuoi documenti · solo su questo dispositivo
            </span>
            <h1 className="mt-5 max-w-3xl text-3xl font-bold tracking-[-0.05em] sm:text-5xl">
              Aggiungi e consulta i documenti dell’immobile.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Puoi allegare PDF e immagini alle voci della checklist. I file restano nel browser e non vengono inviati automaticamente a server esterni.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
            <label className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              Immobile selezionato
            </label>
            <div className="relative mt-2">
              <Building2 size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
              <select
                value={activeJourney.id}
                onChange={(event) => activateJourney(event.target.value)}
                className="min-h-12 w-full rounded-2xl border border-white/10 bg-slate-900/80 py-2 pl-10 pr-3 text-sm font-bold text-white outline-none focus:border-blue-400"
              >
                {journeys.map((journey) => (
                  <option key={journey.id} value={journey.id}>
                    {journey.property.name}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-400">
              {getOperationLabel(activeJourney.operation)} · {activeJourney.property.city || "località da completare"}
            </p>
          </div>
        </div>
      </section>

      {message && (
        <div
          role="status"
          className={`flex items-start gap-3 rounded-2xl border p-4 text-sm font-semibold ${
            message.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {message.tone === "success" ? (
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          )}
          {message.text}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <VaultMetric icon={FileCheck2} label="Checklist disponibili" value={`${checklistAvailable}/${requiredDocuments.length}`} detail="documenti dichiarati" />
        <VaultMetric icon={Database} label="File allegati" value={String(attachedFiles)} detail={`${attachedDocumentTypes.size} categorie coperte`} />
        <VaultMetric icon={HardDrive} label="Spazio dei file" value={formatBytes(stats.totalBytes)} detail={storagePercentage === null ? "salvati nel browser" : `${storagePercentage}% uso browser stimato`} />
        <VaultMetric icon={ShieldCheck} label="Invii esterni" value="0" detail="tutto resta locale" />
      </section>

      <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-blue-600">Checklist operativa</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">Allega i documenti che possiedi</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Il caricamento segna automaticamente il documento come disponibile e aggiorna Guimmia.
            </p>
          </div>
          <Link
            href="/dashboard/pilot"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:border-blue-200 hover:text-blue-700"
          >
            Torna a Guimmia
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mt-6 space-y-3">
          {requiredDocuments.map((definition) => {
            const attached = filesByDocument.get(definition.id) ?? [];
            const available = activeJourney.documents.includes(definition.id);
            const highlighted = requestedDocument === definition.id;

            return (
              <article
                key={definition.id}
                className={`rounded-2xl border p-4 transition-colors sm:p-5 ${
                  highlighted
                    ? "border-blue-400 bg-blue-50 ring-4 ring-blue-100"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                        attached.length > 0
                          ? "bg-emerald-100 text-emerald-700"
                          : available
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {attached.length > 0 ? <FileCheck2 size={20} /> : <FileText size={20} />}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-950 sm:text-base">
                          {definition.title}
                        </h3>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            attached.length > 0
                              ? "bg-emerald-100 text-emerald-700"
                              : available
                                ? "bg-blue-100 text-blue-700"
                                : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {attached.length > 0
                            ? `${attached.length} file`
                            : available
                              ? "Disponibile senza file"
                              : "Da recuperare"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {definition.description}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => chooseFile(definition.id)}
                    className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white hover:bg-blue-600 disabled:cursor-wait disabled:opacity-60"
                  >
                    {busy && uploadingDocument === definition.id ? (
                      <LoaderCircle size={17} className="animate-spin" />
                    ) : attached.length > 0 ? (
                      <Plus size={17} />
                    ) : (
                      <Upload size={17} />
                    )}
                    {attached.length > 0 ? "Aggiungi altro file" : "Allega file"}
                  </button>
                </div>

                {attached.length > 0 && (
                  <div className="mt-4 grid gap-2 border-t border-slate-100 pt-4">
                    {attached.map((document) => (
                      <div
                        key={document.id}
                        className="flex flex-col gap-3 rounded-xl bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm">
                            {document.mimeType.startsWith("image/") ? (
                              <ImageIcon size={17} />
                            ) : (
                              <FileText size={17} />
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-900">
                              {document.name}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                              {formatBytes(document.size)} · {new Date(document.uploadedAt).toLocaleString("it-IT")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openFile(document)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-blue-700"
                            aria-label={`Apri ${document.name}`}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadFile(document)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-blue-700"
                            aria-label={`Scarica ${document.name}`}
                          >
                            <Download size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteFile(document)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:text-rose-700"
                            aria-label={`Elimina ${document.name}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-[26px] border border-emerald-200 bg-emerald-50 p-5 sm:p-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white">
            <LockKeyhole size={20} />
          </span>
          <h2 className="mt-4 text-xl font-bold text-emerald-950">Privacy verificabile</h2>
          <p className="mt-2 text-sm leading-6 text-emerald-800">
            Puoi aprire gli strumenti del browser e disattivare Internet: i file restano consultabili perché non dipendono da un server.
          </p>
        </article>
        <article className="rounded-[26px] border border-amber-200 bg-amber-50 p-5 sm:p-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <AlertTriangle size={20} />
          </span>
          <h2 className="mt-4 text-xl font-bold text-amber-950">Limite dell’archivio locale</h2>
          <p className="mt-2 text-sm leading-6 text-amber-800">
            I file non sono inclusi nel backup JSON e possono andare persi cancellando i dati del browser. Conserva sempre gli originali in un luogo sicuro.
          </p>
        </article>
      </section>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={ACCEPTED_LOCAL_FILE_TYPES.join(",") + ",.pdf,.jpg,.jpeg,.png,.webp"}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void uploadFile(file);
        }}
      />

      <p className="text-center text-xs text-slate-400">
        Limite per file: {formatBytes(MAX_LOCAL_FILE_SIZE)} · Formati: PDF, JPG, PNG, WEBP
      </p>
    </div>
  );
}

function VaultMetric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Database;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <Icon size={19} />
      </span>
      <p className="mt-5 text-xs font-bold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-3xl font-bold text-slate-950">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </article>
  );
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  const value = bytes / 1024 ** index;
  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
}

