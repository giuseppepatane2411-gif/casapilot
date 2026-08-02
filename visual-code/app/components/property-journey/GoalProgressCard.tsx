import { CheckCircle2, ChevronDown, Flag, Target } from "lucide-react";

import type { GoalProgress } from "@/lib/pilot-os/goal-progress";

type GoalProgressCardProps = {
  progress: GoalProgress;
};

export default function GoalProgressCard({ progress }: GoalProgressCardProps) {
  return (
    <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Target size={20} />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-600">
              Avanzamento reale
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-950 sm:text-2xl">
              {progress.title}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Conta l’intero obiettivo, non soltanto i dati inseriti nella scheda.
            </p>
          </div>
        </div>

        <div className="self-start rounded-2xl bg-slate-950 px-4 py-3 text-white">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
            Percorso
          </p>
          <p className="mt-1 text-2xl font-bold">{progress.overall}%</p>
        </div>
      </div>

      <div className="mt-6 flex h-3 overflow-hidden rounded-full bg-slate-100" aria-label={`${progress.overall}% del percorso completato`}>
        {progress.phases.map((phase) => (
          <div
            key={phase.id}
            className="relative h-full border-r border-white last:border-r-0"
            style={{ width: `${phase.weight}%` }}
            title={`${phase.label}: ${phase.completion}%`}
          >
            <div
              className={`h-full transition-[width] duration-500 ${
                phase.status === "completed"
                  ? "bg-emerald-500"
                  : phase.status === "current"
                    ? "bg-blue-600"
                    : "bg-slate-300"
              }`}
              style={{ width: `${phase.completion}%` }}
            />
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-2 rounded-2xl bg-blue-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-sm font-bold text-blue-900">
          <Flag size={16} />
          Fase attuale: {progress.currentPhaseLabel}
        </p>
        <p className="text-xs leading-5 text-blue-700">
          Ogni fase pesa in base alla sua importanza per l’obiettivo finale.
        </p>
      </div>

      <details className="group mt-4 border-t border-slate-100 pt-4">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-slate-600 hover:text-slate-950 [&::-webkit-details-marker]:hidden">
          <span>Vedi come viene calcolato</span>
          <ChevronDown size={17} className="text-slate-400 transition-transform group-open:rotate-180" />
        </summary>

        <div className="mt-4 space-y-2">
          {progress.phases.map((phase) => (
            <div
              key={phase.id}
              className={`rounded-2xl border p-4 ${
                phase.status === "current"
                  ? "border-blue-200 bg-blue-50/70"
                  : "border-slate-100 bg-slate-50"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="flex items-center gap-2 text-sm font-bold text-slate-950">
                    {phase.status === "completed" && (
                      <CheckCircle2 size={16} className="text-emerald-600" />
                    )}
                    {phase.label}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {phase.description}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-700 shadow-sm">
                  {phase.completion}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}
