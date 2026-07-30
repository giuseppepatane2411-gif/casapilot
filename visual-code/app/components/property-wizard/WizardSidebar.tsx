import {
  CheckCircle2,
  Clock3,
  FileCheck2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { getRequiredDocuments } from "@/lib/property-journey/constants";
import type { WizardData } from "@/lib/property-journey/types";

type WizardSidebarProps = {
  data: WizardData;
  healthScore: number;
  draftLoaded: boolean;
};

export default function WizardSidebar({
  data,
  healthScore,
  draftLoaded,
}: WizardSidebarProps) {
  const requiredDocuments = getRequiredDocuments(
    data.operation,
    data.propertyType,
  );
  const availableDocuments = requiredDocuments.filter((document) =>
    data.documents.includes(document.id),
  ).length;

  return (
    <aside className="space-y-4 lg:sticky lg:top-[96px] lg:self-start">
      <section className="relative overflow-hidden rounded-[28px] bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/10">
        <div
          aria-hidden="true"
          className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-blue-600/30 blur-3xl"
        />

        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold">
            <Sparkles size={14} />
            Anteprima Pilot
          </span>

          <h2 className="mt-6 text-2xl font-bold">Stai costruendo una pratica solida.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Le risposte servono a personalizzare missioni, checklist e priorità del percorso.
          </p>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.07] p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                  Health Score stimato
                </p>
                <p className="mt-2 text-4xl font-bold tracking-[-0.05em]">
                  {healthScore}
                  <span className="ml-1 text-sm text-slate-400">/100</span>
                </p>
              </div>

              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
                <ShieldCheck size={23} />
              </span>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-blue-500 transition-[width] duration-500"
                style={{ width: `${healthScore}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <FileCheck2 size={19} />
          </span>
          <div>
            <p className="font-bold text-slate-950">Checklist iniziale</p>
            <p className="text-xs text-slate-500">
              {availableDocuments} di {requiredDocuments.length || "—"} documenti disponibili
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3 text-sm text-slate-600">
          <p className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            Percorso personalizzato
          </p>
          <p className="flex items-center gap-2">
            <Clock3 size={16} className="text-blue-600" />
            Meno di 3 minuti
          </p>
        </div>

        <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">
          {draftLoaded
            ? "Le modifiche vengono salvate automaticamente in questo browser."
            : "Caricamento del salvataggio automatico…"}
        </p>
      </section>
    </aside>
  );
}
