"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  FileText,
  Lightbulb,
  ListChecks,
  MapPinned,
} from "lucide-react";

import type { DocumentDefinition } from "@/lib/property-journey/constants";
import { getDocumentGuide } from "@/lib/property-journey/document-guides";

export default function DocumentGuideItem({
  document,
  selected,
  onToggle,
}: {
  document: DocumentDefinition;
  selected: boolean;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const guide = getDocumentGuide(document.id);

  return (
    <article
      className={`overflow-hidden rounded-2xl border transition-all ${
        selected
          ? "border-emerald-300 bg-emerald-50/60"
          : "border-slate-200 bg-white hover:border-blue-200"
      }`}
    >
      <div className="flex items-start gap-3 p-4">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            selected
              ? "bg-emerald-600 text-white"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {selected ? (
            <Check size={18} strokeWidth={2.8} />
          ) : (
            <FileText size={18} />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-950">{document.title}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{document.description}</p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${
                selected
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {selected ? "Disponibile" : "Da recuperare"}
            </span>
            <button
              type="button"
              aria-pressed={selected}
              onClick={onToggle}
              className={`rounded-full px-3 py-1 text-[11px] font-bold transition-colors ${
                selected
                  ? "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  : "bg-slate-950 text-white hover:bg-blue-700"
              }`}
            >
              {selected ? "Non ce l’ho" : "Ce l’ho già"}
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200/80 bg-white/70">
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
          className="flex min-h-11 w-full items-center justify-between gap-3 px-4 text-left text-xs font-bold text-blue-700 hover:bg-blue-50"
        >
          <span className="flex items-center gap-2">
            <Lightbulb size={15} />
            {expanded ? "Nascondi la guida" : "Come faccio a recuperarlo?"}
          </span>
          <ChevronDown
            size={16}
            className={`transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>

        {expanded && (
          <div className="space-y-4 border-t border-slate-100 p-4 text-xs leading-5 text-slate-600">
            <GuideBlock icon={Lightbulb} title="Perché serve">
              {guide.whyItMatters}
            </GuideBlock>
            <GuideBlock icon={MapPinned} title="Come recuperarlo">
              <ol className="space-y-1.5">
                {guide.howToGet.map((step, index) => (
                  <li key={step} className="flex gap-2">
                    <span className="font-bold text-blue-700">{index + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </GuideBlock>
            <GuideBlock icon={ListChecks} title="Cosa controllare">
              {guide.whatToCheck}
            </GuideBlock>
            <GuideBlock icon={AlertTriangle} title="Errore frequente" tone="warning">
              {guide.commonMistake}
            </GuideBlock>
          </div>
        )}
      </div>
    </article>
  );
}

function GuideBlock({
  icon: Icon,
  title,
  children,
  tone = "default",
}: {
  icon: typeof Lightbulb;
  title: string;
  children: React.ReactNode;
  tone?: "default" | "warning";
}) {
  return (
    <div
      className={`rounded-xl p-3 ${
        tone === "warning" ? "bg-amber-50" : "bg-slate-50"
      }`}
    >
      <p
        className={`flex items-center gap-2 font-bold ${
          tone === "warning" ? "text-amber-800" : "text-slate-800"
        }`}
      >
        <Icon size={14} />
        {title}
      </p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
