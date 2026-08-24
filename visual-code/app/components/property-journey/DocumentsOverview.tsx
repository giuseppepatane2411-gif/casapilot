"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  FileText,
  FolderLock,
  Plus,
} from "lucide-react";

import DocumentGuideItem from "@/components/property-journey/DocumentGuideItem";
import { useJourneys } from "@/hooks/useJourneys";
import { useLocalVault } from "@/hooks/useLocalVault";
import { getRequiredDocuments } from "@/lib/property-journey/constants";
import { updateJourneyDocuments } from "@/lib/property-journey/storage";
import type { DocumentKey } from "@/lib/property-journey/types";

export default function DocumentsOverview() {
  const {
    hydrated,
    journeys,
    activeJourney,
    activateJourney,
  } = useJourneys();
  const { hydrated: vaultHydrated, documents: vaultDocuments } = useLocalVault();

  if (!hydrated || !vaultHydrated) {
    return <div className="h-80 animate-pulse rounded-[28px] bg-slate-200/70" />;
  }

  if (!activeJourney) {
    return (
      <section className="mx-auto max-w-3xl rounded-[30px] border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm sm:p-10">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <FileText size={25} />
        </span>
        <h1 className="mt-5 text-2xl font-bold text-slate-950">Prima aggiungiamo il tuo immobile.</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">
          Dopo poche domande Guimmia preparerà la checklist dei documenti che ti servono.
        </p>
        <Link
          href="/dashboard/properties/new"
          className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700"
        >
          <Plus size={17} />
          Crea il mio immobile
        </Link>
      </section>
    );
  }

  const requiredDocuments = getRequiredDocuments(activeJourney.operation, activeJourney.property.type);
  const availableIds = new Set(activeJourney.documents);
  const available = requiredDocuments.filter((document) => availableIds.has(document.id));
  const missing = requiredDocuments.filter((document) => !availableIds.has(document.id));
  const primaryMissing = missing[0] ?? null;
  const otherMissing = missing.slice(1);
  const attachedFiles = vaultDocuments.filter((document) => document.journeyId === activeJourney.id).length;
  const progress = requiredDocuments.length ? Math.round((available.length / requiredDocuments.length) * 100) : 0;

  function toggleDocument(documentId: DocumentKey) {
    const nextDocuments = activeJourney.documents.includes(documentId)
      ? activeJourney.documents.filter((item) => item !== documentId)
      : [...activeJourney.documents, documentId];

    updateJourneyDocuments(activeJourney.id, nextDocuments);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">Documenti</p>
          <h1 className="mt-1 text-3xl font-bold tracking-[-0.04em] text-slate-950 sm:text-4xl">
            Qui teniamo tutto in ordine.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Ti mostriamo prima ciò che manca. Quello che hai già resta al suo posto, senza occupare spazio.
          </p>
        </div>

        {journeys.length > 1 && (
          <div className="relative w-full sm:w-64">
            <Building2 size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={activeJourney.id}
              onChange={(event) => activateJourney(event.target.value)}
              className="min-h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-9 text-sm font-bold text-slate-900 outline-none focus:border-blue-400"
            >
              {journeys.map((journey) => (
                <option key={journey.id} value={journey.id}>{journey.property.name}</option>
              ))}
            </select>
            <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        )}
      </header>

      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{activeJourney.property.name}</p>
            <p className="mt-2 text-sm font-semibold text-slate-700">
              {missing.length === 0
                ? "Hai indicato tutti i documenti della checklist iniziale."
                : `${missing.length} ${missing.length === 1 ? "documento manca ancora" : "documenti mancano ancora"}.`}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {available.length} di {requiredDocuments.length} disponibili{attachedFiles > 0 ? ` · ${attachedFiles} file allegati` : ""}
            </p>
          </div>
          <Link
            href={`/dashboard/vault?journey=${activeJourney.id}`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            <FolderLock size={16} />
            I miei file
          </Link>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-blue-600" style={{ width: `${progress}%` }} />
        </div>
      </section>

      {primaryMissing ? (
        <section className="rounded-[28px] border border-amber-200 bg-amber-50/50 p-4 shadow-sm sm:p-5">
          <div className="mb-3">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-amber-700">Comincia da questo</p>
            <p className="mt-1 text-sm text-amber-900">Non serve occuparti di tutti i documenti insieme.</p>
          </div>
          <DocumentGuideItem
            document={primaryMissing}
            selected={false}
            onToggle={() => toggleDocument(primaryMissing.id)}
          />
        </section>
      ) : (
        <section className="rounded-[26px] border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
              <Check size={18} strokeWidth={2.8} />
            </span>
            <div>
              <h2 className="font-bold text-emerald-950">Checklist iniziale completa.</h2>
              <p className="mt-1 text-sm leading-6 text-emerald-800">
                Torna al percorso: Guimmia ti mostrerà il prossimo passo utile.
              </p>
            </div>
          </div>
        </section>
      )}

      {otherMissing.length > 0 && (
        <details className="group rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 text-sm font-bold text-slate-700 [&::-webkit-details-marker]:hidden">
            <span>Vedi gli altri documenti da recuperare ({otherMissing.length})</span>
            <ChevronDown size={17} className="text-slate-400 transition-transform group-open:rotate-180" />
          </summary>
          <div className="space-y-3 border-t border-slate-100 p-4">
            {otherMissing.map((document) => (
              <DocumentGuideItem
                key={document.id}
                document={document}
                selected={false}
                onToggle={() => toggleDocument(document.id)}
              />
            ))}
          </div>
        </details>
      )}

      {available.length > 0 && (
        <details className="group rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 text-sm font-bold text-slate-700 [&::-webkit-details-marker]:hidden">
            <span>Documenti già disponibili ({available.length})</span>
            <ChevronDown size={17} className="text-slate-400 transition-transform group-open:rotate-180" />
          </summary>
          <div className="space-y-3 border-t border-slate-100 p-4">
            {available.map((document) => (
              <DocumentGuideItem
                key={document.id}
                document={document}
                selected
                onToggle={() => toggleDocument(document.id)}
              />
            ))}
          </div>
        </details>
      )}

      <Link
        href="/dashboard"
        className="group flex items-center justify-between gap-3 rounded-2xl bg-slate-950 p-4 text-white"
      >
        <div>
          <p className="text-sm font-bold">Non sai cosa fare dopo?</p>
          <p className="mt-1 text-xs text-slate-300">Torna al Percorso: Guimmia sceglie la priorità per te.</p>
        </div>
        <ArrowRight size={18} className="shrink-0 transition-transform group-hover:translate-x-1" />
      </Link>

      <p className="text-xs leading-5 text-slate-400">
        Guimmia organizza la checklist, ma le verifiche tecniche, fiscali e legali vanno confermate con un professionista abilitato quando necessario.
      </p>
    </div>
  );
}
