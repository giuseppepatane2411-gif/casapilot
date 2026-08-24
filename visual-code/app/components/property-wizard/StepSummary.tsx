import { Building2, FileCheck2, Hash, MapPin, Target } from "lucide-react";

import {
  getOccupancyLabel,
  getOperationLabel,
  getPropertyLabel,
  getRequiredDocuments,
} from "@/lib/property-journey/constants";
import type { WizardData } from "@/lib/property-journey/types";

type StepSummaryProps = {
  data: WizardData;
  onEditStep: (step: number) => void;
};

export default function StepSummary({ data, onEditStep }: StepSummaryProps) {
  if (!data.operation || !data.propertyType) return null;

  const requiredDocuments = getRequiredDocuments(data.operation, data.propertyType);
  const availableDocuments = requiredDocuments.filter((document) => data.documents.includes(document.id));
  const missingDocuments = requiredDocuments.length - availableDocuments.length;
  const generatedName = data.propertyName.trim() || `${getPropertyLabel(data.propertyType)} a ${data.city}`;

  return (
    <div className="space-y-5">
      <section className="rounded-[26px] border border-emerald-200 bg-emerald-50 p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.13em] text-emerald-700">Quasi fatto</p>
        <h3 className="mt-2 text-2xl font-bold text-emerald-950">{generatedName}</h3>
        <p className="mt-2 text-sm leading-6 text-emerald-800">
          Controlla solo che queste informazioni siano corrette. Non devi completare tutto adesso.
        </p>
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
          label="Dove si trova"
          value={`${data.city}, ${data.province}`}
          detail={`${data.address} · ${data.postalCode}${data.locationVerified ? " · Posizione confermata" : data.latitude !== null && data.longitude !== null ? " · Punto da confermare" : " · Posizione non indicata"}`}
          onEdit={() => onEditStep(3)}
        />
        {(data.cadastralSheet || data.cadastralParcel || data.cadastralSubaltern) && (
          <SummaryCard
            icon={Hash}
            label="Dati catastali"
            value={[
              data.cadastralSheet ? `Foglio ${data.cadastralSheet}` : "",
              data.cadastralParcel ? `Part. ${data.cadastralParcel}` : "",
              data.cadastralSubaltern ? `Sub. ${data.cadastralSubaltern}` : "",
            ].filter(Boolean).join(" · ")}
            detail="Puoi modificarli anche dopo aver creato l’immobile."
            onEdit={() => onEditStep(3)}
          />
        )}
        <SummaryCard
          icon={FileCheck2}
          label="Documenti"
          value={`${availableDocuments.length} già disponibili`}
          detail={missingDocuments > 0 ? `${missingDocuments} da recuperare più avanti` : "Checklist iniziale completa"}
          onEdit={() => onEditStep(4)}
        />
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <p className="font-bold text-slate-950">Cosa succede dopo?</p>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Guimmia ti porterà direttamente alla prima cosa utile da fare. Non dovrai scegliere da solo da dove iniziare.
        </p>
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

function SummaryCard({ icon: Icon, label, value, detail, onEdit }: SummaryCardProps) {
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
