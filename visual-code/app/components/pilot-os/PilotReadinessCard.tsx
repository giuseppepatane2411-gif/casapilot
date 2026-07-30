import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Database,
  FileCheck2,
  ShieldAlert,
} from "lucide-react";

import type { PilotContext } from "@/lib/pilot-os/types";

type PilotReadinessCardProps = {
  context: PilotContext;
};

export default function PilotReadinessCard({
  context,
}: PilotReadinessCardProps) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-600">Pilot Readiness</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">
            {context.readiness.label}
          </h2>
        </div>
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-slate-950 text-white">
          <span className="text-xl font-bold">{context.readiness.overall}</span>
          <span className="absolute -bottom-1 rounded-full bg-blue-600 px-2 py-0.5 text-[9px] font-bold">
            /100
          </span>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <ReadinessBar
          icon={Database}
          label="Dati immobile"
          value={context.readiness.data}
        />
        <ReadinessBar
          icon={FileCheck2}
          label="Documenti"
          value={context.readiness.documents}
        />
        <ReadinessBar
          icon={BarChart3}
          label="Operatività"
          value={context.readiness.execution}
        />
      </div>

      <div className="mt-6 border-t border-slate-100 pt-5">
        <div className="flex items-center gap-2">
          <ShieldAlert size={17} className="text-amber-500" />
          <h3 className="font-bold text-slate-950">Attenzioni rilevate</h3>
        </div>

        {context.risks.length > 0 ? (
          <div className="mt-3 space-y-2">
            {context.risks.map((risk) => (
              <div
                key={risk.id}
                className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3.5"
              >
                <span
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                    risk.severity === "high"
                      ? "bg-red-50 text-red-600"
                      : risk.severity === "medium"
                        ? "bg-amber-50 text-amber-600"
                        : "bg-blue-50 text-blue-600"
                  }`}
                >
                  <AlertTriangle size={15} />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {risk.title}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {risk.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-800">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <p className="text-sm leading-6">
              Nessun blocco evidente nella base attuale del percorso.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

type ReadinessBarProps = {
  icon: typeof Database;
  label: string;
  value: number;
};

function ReadinessBar({ icon: Icon, label, value }: ReadinessBarProps) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="flex items-center gap-2 font-semibold text-slate-600">
          <Icon size={14} />
          {label}
        </span>
        <span className="font-bold text-slate-900">{value}%</span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-600"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
