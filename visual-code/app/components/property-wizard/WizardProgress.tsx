import { Check } from "lucide-react";

import { WIZARD_STEPS } from "@/lib/property-journey/constants";

type WizardProgressProps = {
  currentStep: number;
};

export default function WizardProgress({
  currentStep,
}: WizardProgressProps) {
  const percentage = ((currentStep - 1) / (WIZARD_STEPS.length - 1)) * 100;

  return (
    <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between sm:hidden">
        <p className="text-sm font-bold text-slate-950">
          Passaggio {currentStep} di {WIZARD_STEPS.length}
        </p>
        <p className="text-xs font-semibold text-blue-600">
          {WIZARD_STEPS[currentStep - 1].label}
        </p>
      </div>

      <div className="relative hidden sm:block">
        <div className="absolute left-5 right-5 top-5 h-1 rounded-full bg-slate-100" />
        <div
          className="absolute left-5 top-5 h-1 rounded-full bg-blue-600 transition-[width] duration-500"
          style={{ width: `calc((100% - 2.5rem) * ${percentage / 100})` }}
        />

        <ol className="relative grid grid-cols-5 gap-2">
          {WIZARD_STEPS.map((step) => {
            const completed = step.id < currentStep;
            const active = step.id === currentStep;

            return (
              <li key={step.id} className="flex flex-col items-center text-center">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-4 border-white text-sm font-bold shadow-sm transition-colors ${
                    completed
                      ? "bg-blue-600 text-white"
                      : active
                        ? "bg-slate-950 text-white"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {completed ? <Check size={17} strokeWidth={2.8} /> : step.id}
                </span>
                <span
                  className={`mt-3 text-xs font-bold ${
                    active || completed ? "text-slate-900" : "text-slate-400"
                  }`}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100 sm:hidden">
        <div
          className="h-full rounded-full bg-blue-600 transition-[width] duration-500"
          style={{ width: `${(currentStep / WIZARD_STEPS.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
