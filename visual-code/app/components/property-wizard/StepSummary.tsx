import {
  Building2,
  FileCheck2,
  MapPin,
  Ruler,
  ShieldCheck,
  Target,
} from "lucide-react";

import {
  getOccupancyLabel,
  getOperationLabel,
  getPropertyLabel,
  getRequiredDocuments,
} from "@/lib/property-journey/constants";
import type { WizardData } from "@/lib/property-journey/types";

type StepSummaryProps = {
  data: WizardData;
  healthScore: number;
  onEditStep: (step: number) => void;
};

export default function StepSummary({
  data,
  healthScore,
  onEditStep,
}: StepSummaryProps) {
  if (!data.operation || !data.propertyType) return null;

  const requiredDocuments = getRequiredDocuments(
    data.operation,
    data.propertyType,
  );
  const availableDocuments = requiredDocuments.filter((document) =>
    data.documents.includes(document.id),
  );
  const missingDocuments = requiredDocuments.length - availableDocuments.length;
  const generatedName =
    data.propertyName.trim() || `${getPropertyLabel(data.propertyType)} a ${data.city}`;

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-slate-950 text-white">
        <div className="grid gap-6 p-6 sm:p-7 lg:grid-cols-[1fr_190px] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.13em] text-blue-300">
              Nuova pratica
            </p>
            <h3 className="mt-3 text-2xl font-bold sm:text-3xl">{generatedName}</h3>
            <p className="mt-3 flex items-center gap-2 text-sm text-slate-300">
              <MapPin size={16} />
              {data.address}, {data.city} ({data.province})
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              <ShieldCheck size={15} />
              Health Score
            </p>
            <p className="mt-3 text-4xl font-bold tracking-[-0.05em]">
              {healthScore}
              <span className="ml-1 text-sm text-slate-400">/100</span>
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{ width: `${healthScore}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <SummaryCard
          icon={Target}
          label="Obiettivo"
          value={getOperationLabel(data.operation)}
          onEdit={() => onEditStep(1)}
        />
        <SummaryCard
          icon={Building2}
          label="Immobile"
          value={getPropertyLabel(data.propertyType)}
          detail={`${data.surface} m² · ${getOccupancyLabel(data.occupancy || null)}`}
          onEdit={() => onEditStep(2)}
        />
        <SummaryCard
          icon={MapPin}
          label="Posizione"
          value={`${data.city}, ${data.province}`}
          detail={`${data.address} · ${data.postalCode}`}
          onEdit={() => onEditStep(3)}
        />
        <SummaryCard
          icon={FileCheck2}
          label="Documenti"
          value={`${availableDocuments.length} disponibili`}
          detail={`${missingDocuments} da recuperare`}
          onEdit={() => onEditStep(4)}
        />
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
            <Ruler size={19} />
          </span>
          <div>
            <p className="font-bold text-slate-950">Dopo la creazione</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              La dashboard mostrerà la prima missione, il punteggio aggiornato e i documenti da recuperare. Potrai modificare la checklist in qualsiasi momento.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

type SummaryCardProps = {
  icon: typeof Target;
  label: string;
  value: string;
  detail?: string;
  onEdit: () => void;
};

function SummaryCard({
  icon: Icon,
  label,
  value,
  detail,
  onEdit,
}: SummaryCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <Icon size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">{label}</p>
          <p className="mt-1 truncate font-bold text-slate-950">{value}</p>
          {detail && <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>}
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="shrink-0 text-xs font-bold text-blue-600 hover:text-blue-800"
        >
          Modifica
        </button>
      </div>
    </article>
  );
}
