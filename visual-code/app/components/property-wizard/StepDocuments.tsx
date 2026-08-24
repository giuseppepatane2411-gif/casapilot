import { Check, FileText, Info } from "lucide-react";

import type { DocumentDefinition } from "@/lib/property-journey/constants";
import type { DocumentKey } from "@/lib/property-journey/types";

type StepDocumentsProps = {
  documents: DocumentDefinition[];
  selectedDocuments: DocumentKey[];
  onToggle: (documentId: DocumentKey) => void;
};

export default function StepDocuments({
  documents,
  selectedDocuments,
  onToggle,
}: StepDocumentsProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        <Info size={18} className="mt-0.5 shrink-0" />
        <p>
          Questa è una checklist iniziale e indicativa. Se non sei sicuro, lascia il documento non selezionato: Guimmia ti aiuterà a verificarlo.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {documents.map((document) => {
          const selected = selectedDocuments.includes(document.id);

          return (
            <button
              key={document.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onToggle(document.id)}
              className={`group flex min-h-32 items-start gap-4 rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 ${
                selected
                  ? "border-emerald-400 bg-emerald-50/70"
                  : "border-slate-200 bg-white hover:border-blue-200 hover:shadow-md"
              }`}
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                  selected
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600"
                }`}
              >
                {selected ? <Check size={19} strokeWidth={2.8} /> : <FileText size={19} />}
              </span>

              <span className="min-w-0">
                <span className="block font-bold text-slate-950">{document.title}</span>
                <span className="mt-1.5 block text-xs leading-5 text-slate-500">
                  {document.description}
                </span>
                <span
                  className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    selected
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {selected ? "Disponibile" : "Non disponibile"}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

