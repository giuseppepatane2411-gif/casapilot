"use client";

import { useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileJson,
  RotateCcw,
  ShieldCheck,
  Upload,
} from "lucide-react";

import { BETA_STATE_STORAGE_KEY, LEGACY_BETA_STATE_STORAGE_KEY } from "@/lib/beta/constants";
import {
  readBetaState,
  replaceBetaState,
} from "@/lib/beta/storage";
import type { CasaPilotBackup } from "@/lib/beta/types";
import { clearLocalVault } from "@/lib/local-vault/db";
import { PILOT_MEMORY_STORAGE_KEY } from "@/lib/pilot-os/store";
import {
  ACTIVE_JOURNEY_STORAGE_KEY,
  JOURNEY_STORAGE_KEY,
  WIZARD_DRAFT_STORAGE_KEY,
} from "@/lib/property-journey/constants";
import {
  readActiveJourneyId,
  readJourneys,
  readWizardDraft,
  replaceJourneys,
} from "@/lib/property-journey/storage";
import type { PropertyJourney } from "@/lib/property-journey/types";

function readJsonObject(storageKey: string) {
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

export default function LocalDataSettings() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

  function exportData() {
    const payload: CasaPilotBackup = {
      version: 3,
      product: "CasaPilot",
      release: "beta-zero-cost-v2-test-flight",
      exportedAt: new Date().toISOString(),
      activeJourneyId: readActiveJourneyId(),
      journeys: readJourneys(),
      wizardDraft: readWizardDraft(),
      pilotMemory: readJsonObject(
        PILOT_MEMORY_STORAGE_KEY,
      ) as CasaPilotBackup["pilotMemory"],
      betaState: readBetaState(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `casapilot-backup-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage({
      tone: "success",
      text: "Backup completo esportato. Conservalo in un luogo sicuro.",
    });
  }

  async function importData(file: File) {
    setMessage(null);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<CasaPilotBackup> & {
        journeys?: unknown;
      };

      if (!Array.isArray(parsed.journeys)) {
        throw new Error("Il file non contiene una lista di pratiche valida.");
      }

      const confirmed = window.confirm(
        "L’importazione sostituirà le pratiche presenti in questo browser. Vuoi continuare?",
      );
      if (!confirmed) return;

      replaceJourneys(
        parsed.journeys as PropertyJourney[],
        typeof parsed.activeJourneyId === "string"
          ? parsed.activeJourneyId
          : null,
      );

      if (parsed.wizardDraft?.version === 1) {
        window.localStorage.setItem(
          WIZARD_DRAFT_STORAGE_KEY,
          JSON.stringify(parsed.wizardDraft),
        );
      } else {
        window.localStorage.removeItem(WIZARD_DRAFT_STORAGE_KEY);
      }

      if (
        parsed.pilotMemory &&
        typeof parsed.pilotMemory === "object" &&
        !Array.isArray(parsed.pilotMemory)
      ) {
        window.localStorage.setItem(
          PILOT_MEMORY_STORAGE_KEY,
          JSON.stringify(parsed.pilotMemory),
        );
      } else {
        window.localStorage.removeItem(PILOT_MEMORY_STORAGE_KEY);
      }

      if (parsed.betaState?.version === 2) {
        replaceBetaState(parsed.betaState);
      }

      setMessage({
        tone: "success",
        text: `${parsed.journeys.length} pratiche importate. CasaPilot verrà ricaricato.`,
      });
      window.setTimeout(() => {
        window.location.href = "/dashboard";
      }, 700);
    } catch (error) {
      setMessage({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : "Il file non è un backup CasaPilot valido.",
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function clearData() {
    const confirmed = window.confirm(
      "Vuoi cancellare pratiche, bozze, memoria di Pilot, sessioni di test, feedback e file dell’Archivio locale? L’operazione non può essere annullata.",
    );

    if (!confirmed) return;

    window.localStorage.removeItem(JOURNEY_STORAGE_KEY);
    window.localStorage.removeItem(ACTIVE_JOURNEY_STORAGE_KEY);
    window.localStorage.removeItem(WIZARD_DRAFT_STORAGE_KEY);
    window.localStorage.removeItem(PILOT_MEMORY_STORAGE_KEY);
    window.localStorage.removeItem(BETA_STATE_STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_BETA_STATE_STORAGE_KEY);
    try {
      await clearLocalVault();
    } catch {
      // La pulizia dei dati principali deve proseguire anche se IndexedDB non è disponibile.
    }
    window.location.href = "/dashboard/beta";
  }

  return (
    <div className="space-y-7">
      <header>
        <p className="text-sm font-semibold text-blue-600">Dati della beta</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-950 sm:text-4xl">
          Backup, importazione e privacy
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
          In questa fase le pratiche vengono conservate nel browser. Esporta un backup prima di cambiare dispositivo o cancellare i dati del sito.
        </p>
      </header>

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

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <ShieldCheck size={22} />
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              Archivio locale completo
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Il backup include immobili, checklist, bozza del wizard, memoria di Pilot OS, timeline, conversazioni, sessioni di test e feedback. I file binari dell’Archivio locale restano esclusi: conserva sempre gli originali.
            </p>
          </div>
        </div>

        <div className="mt-7 grid gap-4 lg:grid-cols-2">
          <DataAction
            icon={Download}
            title="Esporta backup"
            description="Scarica un unico file JSON con lo stato completo di CasaPilot."
            actionLabel="Esporta tutto"
            onClick={exportData}
            primary
          />

          <DataAction
            icon={Upload}
            title="Importa backup"
            description="Ripristina un file esportato in precedenza. I dati attuali verranno sostituiti."
            actionLabel="Scegli file JSON"
            onClick={() => fileInputRef.current?.click()}
          />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void importData(file);
          }}
        />
      </section>

      <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-5 sm:p-7">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <FileJson size={20} />
          </span>
          <div>
            <h2 className="text-xl font-bold text-amber-950">
              Il file di backup può contenere dati sensibili
            </h2>
            <p className="mt-2 text-sm leading-6 text-amber-800">
              Non pubblicarlo e non inviarlo a persone non autorizzate. In questa beta non carichiamo il file su server esterni: l’importazione avviene nel browser.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-rose-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-rose-600">Zona pericolosa</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">
              Cancella tutti i dati locali
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Rimuove pratiche, demo, missioni, timeline, feedback e bozze da questo browser.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void clearData()}
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-5 text-sm font-bold text-rose-700 hover:bg-rose-100"
          >
            <RotateCcw size={18} />
            Cancella tutto
          </button>
        </div>
      </section>
    </div>
  );
}

function DataAction({
  icon: Icon,
  title,
  description,
  actionLabel,
  onClick,
  primary = false,
}: {
  icon: typeof Download;
  title: string;
  description: string;
  actionLabel: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
        <Icon size={19} />
      </span>
      <h3 className="mt-4 text-lg font-bold text-slate-950">{title}</h3>
      <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">
        {description}
      </p>
      <button
        type="button"
        onClick={onClick}
        className={`mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 text-sm font-bold ${
          primary
            ? "bg-slate-950 text-white hover:bg-blue-600"
            : "border border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-700"
        }`}
      >
        <Icon size={17} />
        {actionLabel}
      </button>
    </article>
  );
}
