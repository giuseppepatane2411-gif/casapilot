"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  FileText,
  Plus,
} from "lucide-react";

import { useJourneys } from "@/hooks/useJourneys";
import {
  getOperationLabel,
  getRequiredDocuments,
} from "@/lib/property-journey/constants";

export default function DocumentsOverview() {
  const { hydrated, journeys } = useJourneys();

  if (!hydrated) {
    return <div className="h-80 animate-pulse rounded-[28px] bg-slate-200/70" />;
  }

  const totalRequired = journeys.reduce(
    (total, journey) =>
      total +
      getRequiredDocuments(journey.operation, journey.property.type).length,
    0,
  );
  const totalAvailable = journeys.reduce(
    (total, journey) => total + journey.documents.length,
    0,
  );
  const totalMissing = Math.max(0, totalRequired - totalAvailable);

  return (
    <div className="space-y-7">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-blue-600">Archivio pratiche</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950 sm:text-4xl">
            Documenti
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Una vista unica delle checklist iniziali dei tuoi immobili.
          </p>
        </div>

        <Link
          href="/dashboard/properties/new"
          className="inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:-translate-y-0.5 hover:bg-blue-700 sm:self-auto"
        >
          <Plus size={18} />
          Nuovo percorso
        </Link>
      </header>

      {journeys.length === 0 ? (
        <section className="rounded-[30px] border border-dashed border-slate-300 bg-white p-9 text-center shadow-sm">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
            <FileText size={27} />
          </span>
          <h2 className="mt-5 text-2xl font-bold text-slate-950">
            Nessuna checklist disponibile
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">
            I documenti vengono organizzati automaticamente quando crei una pratica.
          </p>
          <Link
            href="/dashboard/properties/new"
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white hover:bg-blue-600"
          >
            Crea una pratica
            <ArrowRight size={16} />
          </Link>
        </section>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <Metric label="Totale checklist" value={totalRequired} tone="neutral" />
            <Metric label="Disponibili" value={totalAvailable} tone="success" />
            <Metric label="Da recuperare" value={totalMissing} tone="danger" />
          </section>

          <section className="space-y-4">
            {journeys.map((journey) => {
              const requiredDocuments = getRequiredDocuments(
                journey.operation,
                journey.property.type,
              );
              const available = journey.documents.length;
              const missing = Math.max(0, requiredDocuments.length - available);
              const completion = requiredDocuments.length
                ? Math.round((available / requiredDocuments.length) * 100)
                : 0;

              return (
                <article
                  key={journey.id}
                  className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                    <div className="flex min-w-0 items-start gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                        <Building2 size={22} />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="truncate text-xl font-bold text-slate-950">
                            {journey.property.name}
                          </h2>
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                            {getOperationLabel(journey.operation)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          {available} disponibili · {missing} da recuperare
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="min-w-44">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                          <span>Completamento</span>
                          <span>{completion}%</span>
                        </div>
                        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-blue-600"
                            style={{ width: `${completion}%` }}
                          />
                        </div>
                      </div>
                      <Link
                        href={`/dashboard/properties/${journey.id}#documents`}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"
                      >
                        Aggiorna checklist
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          <p className="rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-500">
            Le checklist aiutano a organizzare la pratica, ma non sostituiscono la verifica di un professionista abilitato.
          </p>
        </>
      )}
    </div>
  );
}

type MetricProps = {
  label: string;
  value: number;
  tone: "neutral" | "success" | "danger";
};

function Metric({ label, value, tone }: MetricProps) {
  const styles = {
    neutral: "bg-slate-100 text-slate-700",
    success: "bg-emerald-100 text-emerald-700",
    danger: "bg-rose-100 text-rose-700",
  };

  return (
    <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles[tone]}`}>
        {tone === "success" ? <CheckCircle2 size={19} /> : <FileText size={19} />}
      </span>
      <p className="mt-5 text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-slate-950">{value}</p>
    </article>
  );
}
