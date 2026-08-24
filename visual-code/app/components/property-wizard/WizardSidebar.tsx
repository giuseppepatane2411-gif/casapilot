import {
  CheckCircle2,
  Clock3,
  FileCheck2,
  Save,
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
      <section className="rounded-[26px] border border-blue-100 bg-blue-50 p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">
          Non serve sapere tutto adesso
        </p>
        <h2 className="mt-3 text-xl font-bold text-slate-950">
          Rispondi solo a quello che sai.
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Se ti manca un documento non è un problema: Guimmia lo inserirà tra le cose da fare dopo.
        </p>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="space-y-4 text-sm text-slate-600">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={17} />
            </span>
            <div>
              <p className="font-bold text-slate-900">Percorso personalizzato</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Le prossime attività dipenderanno dalle tue risposte.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Clock3 size={17} />
            </span>
            <div>
              <p className="font-bold text-slate-900">Pochi minuti</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Ti chiediamo solo le informazioni essenziali.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <FileCheck2 size={17} />
            </span>
            <div>
              <p className="font-bold text-slate-900">Documenti</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {requiredDocuments.length
                  ? `${availableDocuments} di ${requiredDocuments.length} già indicati come disponibili.`
                  : "La checklist apparirà quando avremo i dati necessari."}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">
          <Save size={15} className="shrink-0" />
          {draftLoaded
            ? "Le risposte vengono salvate automaticamente in questo browser."
            : "Stiamo preparando il salvataggio automatico…"}
        </div>
      </section>
    </aside>
  );
}
