"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

type JourneySyncErrorProps = {
  message: string;
  retry: () => Promise<void>;
  refreshing?: boolean;
};

export default function JourneySyncError({
  message,
  retry,
  refreshing = false,
}: JourneySyncErrorProps) {
  return (
    <section className="mx-auto max-w-4xl rounded-[26px] border border-amber-200 bg-amber-50 p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-700 shadow-sm">
            <AlertTriangle size={19} />
          </span>
          <div>
            <h1 className="font-bold text-amber-950">Archivio temporaneamente non disponibile</h1>
            <p className="mt-1 text-sm leading-6 text-amber-800">{message}</p>
            <p className="mt-1 text-xs leading-5 text-amber-700">
              Non mostriamo copie locali come se fossero dati aggiornati. Riprova quando la connessione è disponibile.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void retry()}
          disabled={refreshing}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-900 px-4 text-sm font-bold text-white hover:bg-amber-950 disabled:cursor-wait disabled:opacity-60"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Riprovo…" : "Riprova"}
        </button>
      </div>
    </section>
  );
}
