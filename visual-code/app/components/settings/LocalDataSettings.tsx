"use client";

import { Download, RotateCcw, ShieldCheck } from "lucide-react";

import {
  ACTIVE_JOURNEY_STORAGE_KEY,
  JOURNEY_STORAGE_KEY,
  WIZARD_DRAFT_STORAGE_KEY,
} from "@/lib/property-journey/constants";
import { readJourneys } from "@/lib/property-journey/storage";

export default function LocalDataSettings() {
  function exportData() {
    const payload = {
      exportedAt: new Date().toISOString(),
      journeys: readJourneys(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `casapilot-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function clearData() {
    const confirmed = window.confirm(
      "Vuoi cancellare tutte le pratiche e le bozze salvate in questo browser? L’operazione non può essere annullata.",
    );

    if (!confirmed) return;

    window.localStorage.removeItem(JOURNEY_STORAGE_KEY);
    window.localStorage.removeItem(ACTIVE_JOURNEY_STORAGE_KEY);
    window.localStorage.removeItem(WIZARD_DRAFT_STORAGE_KEY);
    window.location.href = "/dashboard";
  }

  return (
    <div className="space-y-7">
      <header>
        <p className="text-sm font-semibold text-blue-600">Preferenze</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-950 sm:text-4xl">Impostazioni</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
          In questa fase MVP le pratiche vengono conservate solo nel browser che stai usando.
        </p>
      </header>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <ShieldCheck size={22} />
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-950">Dati locali dell’MVP</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Il salvataggio locale permette di provare il flusso senza account o database. Un futuro backend sostituirà questo livello senza cambiare le schermate.
            </p>
          </div>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={exportData}
            className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white hover:bg-blue-600"
          >
            <Download size={18} />
            Esporta backup JSON
          </button>
          <button
            type="button"
            onClick={clearData}
            className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-5 text-sm font-bold text-rose-700 hover:bg-rose-100"
          >
            <RotateCcw size={18} />
            Cancella i dati locali
          </button>
        </div>
      </section>
    </div>
  );
}
