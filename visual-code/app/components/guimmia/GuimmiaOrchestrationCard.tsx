"use client";

import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  LoaderCircle,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";

import { useGuimmiaOrchestration } from "@/hooks/useGuimmiaOrchestration";
import type { GoalProgressPhaseId } from "@/lib/pilot-os/goal-progress";
import type { PropertyJourney } from "@/lib/property-journey/types";

type GuimmiaOrchestrationCardProps = {
  journey: PropertyJourney;
  currentPhase: GoalProgressPhaseId;
};

const statusTone = {
  READY: "bg-emerald-100 text-emerald-800",
  BLOCKED: "bg-amber-100 text-amber-800",
  WAITING_CUSTOMER: "bg-blue-100 text-blue-800",
  WAITING_HUMAN: "bg-violet-100 text-violet-800",
  WAITING_PROFESSIONAL: "bg-orange-100 text-orange-800",
} as const;

export default function GuimmiaOrchestrationCard({
  journey,
  currentPhase,
}: GuimmiaOrchestrationCardProps) {
  const { loading, decision, error } = useGuimmiaOrchestration(
    journey,
    currentPhase,
  );

  if (loading && !decision) {
    return (
      <section className="flex min-h-36 items-center justify-center rounded-[28px] border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6 text-blue-700">
        <LoaderCircle className="animate-spin" size={22} />
        <span className="ml-3 text-sm font-bold">Guimmia sta ordinando il percorso…</span>
      </section>
    );
  }

  if (!decision) {
    return (
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="font-bold text-slate-900">Il percorso resta disponibile.</p>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          La guida intelligente non è raggiungibile in questo momento. Puoi continuare con l’attività già indicata qui sotto.
        </p>
      </section>
    );
  }

  const firstQuestion = decision.customerQuestions[0] ?? null;
  const title =
    firstQuestion?.prompt ??
    decision.nextAction?.title ??
    "Il percorso è aggiornato";
  const explanation = firstQuestion?.whyItMatters || decision.customerExplanation;
  const href = decision.operationType
    ? decision.nextAction?.href ?? "/dashboard/pilot#pilot-chat"
    : `/dashboard/properties/${journey.id}#manage-property`;
  const ctaLabel = decision.operationType
    ? decision.nextAction?.ctaLabel ?? "Continua con Guimmia"
    : "Specifica il tipo di operazione";

  return (
    <section className="overflow-hidden rounded-[30px] border border-blue-200 bg-white shadow-xl shadow-blue-600/[0.07]">
      <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-blue-700 px-5 py-5 text-white sm:px-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <BrainCircuit size={22} />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-200">
                Guida Guimmia
              </p>
              <p className="mt-1 font-bold">{decision.operationLabel}</p>
            </div>
          </div>
          <span className={`self-start rounded-full px-3 py-1.5 text-xs font-bold ${statusTone[decision.status]}`}>
            {decision.statusLabel}
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-7">
        {error && (
          <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
            Connessione temporaneamente assente: stai vedendo l’ultima indicazione sicura salvata sul dispositivo.
          </p>
        )}
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-600">
          Fase: {decision.stage.title}
        </p>
        <h2 className="mt-3 max-w-3xl text-2xl font-bold tracking-[-0.035em] text-slate-950 sm:text-3xl">
          {title}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
          {explanation}
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href={href}
            className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 text-sm font-bold text-white shadow-lg shadow-blue-600/15 transition hover:-translate-y-0.5 hover:bg-blue-700"
          >
            {ctaLabel}
            <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
          <p className="flex items-center gap-2 text-xs leading-5 text-slate-500">
            <ShieldCheck size={16} className="text-emerald-600" />
            Nessuna azione viene eseguita automaticamente.
          </p>
        </div>

        <div className="mt-5 flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
          <UserRoundCheck className="mt-0.5 shrink-0 text-blue-600" size={18} />
          <p className="text-xs leading-5 text-slate-600">
            Guimmia usa l’intelligenza artificiale per organizzare informazioni e passaggi. Le decisioni che richiedono competenza o autorizzazione restano agli agenti e ai professionisti.
          </p>
        </div>

        {decision.handoff && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-violet-200 bg-violet-50 p-4">
            <UserRoundCheck className="mt-0.5 shrink-0 text-violet-700" size={18} />
            <div>
              <p className="text-sm font-bold text-violet-950">
                Controllo umano richiesto
              </p>
              <p className="mt-1 text-xs leading-5 text-violet-800">
                {decision.handoff.destination === "PROFESSIONAL"
                  ? "Questo passaggio deve essere verificato da un professionista prima di proseguire."
                  : "Un agente Guimmia deve controllare questo passaggio prima di proseguire."}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
