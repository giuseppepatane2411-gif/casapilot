import { Check } from "lucide-react";

import {
  WIZARD_STEPS,
  getOperationLabel,
} from "@/lib/property-journey/constants";
import type { OperationType } from "@/lib/property-journey/types";

type WizardProgressProps = {
  currentStep: number;
  operation: OperationType | "";
};

export default function WizardProgress({
  currentStep,
  operation,
}: WizardProgressProps) {
  const current = WIZARD_STEPS[currentStep - 1];
  const objective = operation
    ? getOperationLabel(operation).toLocaleLowerCase("it-IT")
    : "obiettivo finale";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
            Configurazione iniziale
          </p>
          <p className="mt-1 text-sm font-bold text-slate-900">
            Passaggio {currentStep} di {WIZARD_STEPS.length} · {current.label}
          </p>
        </div>
        <span className="self-start rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
          Stai creando la scheda
        </span>
      </div>

      <div className="mt-4 grid grid-cols-5 gap-2" aria-label="Avanzamento della configurazione iniziale">
        {WIZARD_STEPS.map((step) => {
          const completed = step.id < currentStep;
          const active = step.id === currentStep;

          return (
            <div key={step.id} className="min-w-0">
              <div
                className={`flex h-2 items-center justify-center rounded-full transition-colors ${
                  completed || active ? "bg-blue-600" : "bg-slate-100"
                }`}
              />
              <div className="mt-2 flex items-center gap-1.5">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    completed
                      ? "bg-emerald-100 text-emerald-700"
                      : active
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {completed ? <Check size={11} strokeWidth={3} /> : step.id}
                </span>
                <span
                  className={`hidden truncate text-[11px] font-semibold sm:block ${
                    active ? "text-slate-900" : "text-slate-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-500">
        Questa barra indica soltanto quanto manca per creare la scheda dell’immobile.
        L’avanzamento reale verso la {objective} verrà calcolato dopo, includendo
        documenti, preparazione, pubblicazione e passaggi conclusivi.
      </p>
    </div>
  );
}
