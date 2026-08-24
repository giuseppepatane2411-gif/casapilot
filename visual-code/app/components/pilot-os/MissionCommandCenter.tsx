"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Target,
  Upload,
} from "lucide-react";

import { markProductMilestone, trackProductEvent } from "@/lib/product/storage";
import { getDocumentDefinition } from "@/lib/property-journey/scoring";
import { updateJourneyDocuments } from "@/lib/property-journey/storage";
import {
  addPilotTimelineEvent,
  completePilotMission,
} from "@/lib/pilot-os/store";
import type { PilotContext, PilotMission } from "@/lib/pilot-os/types";

type MissionCommandCenterProps = {
  context: PilotContext;
};

export default function MissionCommandCenter({
  context,
}: MissionCommandCenterProps) {
  const mission = context.mission;

  function completeMission(selectedMission: PilotMission) {
    if (selectedMission.documentId) {
      const document = getDocumentDefinition(selectedMission.documentId);
      updateJourneyDocuments(context.journey.id, [
        ...context.journey.documents,
        selectedMission.documentId,
      ]);
      addPilotTimelineEvent(context.journey.id, {
        id: `document-${selectedMission.documentId}`,
        title: `${document?.title ?? "Documento"} disponibile`,
        description:
          "Guimmia ha aggiornato la checklist e scelto la prossima azione.",
        type: "document",
      });
      markProductMilestone("mission-completed");
      trackProductEvent("mission-completed", {
        journeyId: context.journey.id,
        metadata: {
          missionId: selectedMission.id,
          documentId: selectedMission.documentId,
        },
      });
      return;
    }

    completePilotMission(context.journey.id, selectedMission.id);
    addPilotTimelineEvent(context.journey.id, {
      id: `mission-${selectedMission.id}`,
      title: "Attività completata",
      description: selectedMission.title,
      type: "mission",
    });
    markProductMilestone("mission-completed");
    trackProductEvent("mission-completed", {
      journeyId: context.journey.id,
      metadata: { missionId: selectedMission.id },
    });
  }

  const canComplete =
    Boolean(mission.documentId) || mission.canCompleteManually === true;

  return (
    <section className="overflow-hidden rounded-[30px] border border-blue-200 bg-white shadow-lg shadow-blue-600/5">
      <div className="border-b border-blue-100 bg-blue-50 px-5 py-4 sm:px-7">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-blue-700">
          <Target size={15} />
          Cosa facciamo adesso
        </p>
      </div>

      <div className="p-5 sm:p-7">
        <h2 className="max-w-3xl text-2xl font-bold tracking-[-0.035em] text-slate-950 sm:text-3xl">
          {mission.title}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
          {mission.description}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
            <Clock3 size={14} />
            Circa {mission.estimatedMinutes} minuti
          </span>
          <details>
            <summary className="cursor-pointer list-none rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 [&::-webkit-details-marker]:hidden">
              Perché serve?
            </summary>
            <p className="mt-2 max-w-xl rounded-2xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
              {mission.reason}
            </p>
          </details>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {mission.documentId ? (
            <>
              <Link
                href={`/dashboard/vault?journey=${context.journey.id}&document=${mission.documentId}`}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
              >
                <Upload size={18} />
                Aggiungi il documento
              </Link>
              <button
                type="button"
                onClick={() => completeMission(mission)}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                <CheckCircle2 size={18} />
                Ce l’ho già
              </button>
            </>
          ) : canComplete ? (
            <button
              type="button"
              onClick={() => completeMission(mission)}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
            >
              <CheckCircle2 size={18} />
              {mission.actionLabel}
            </button>
          ) : (
            <Link
              href={mission.href}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
            >
              {mission.actionLabel}
              <ArrowRight size={17} />
            </Link>
          )}
        </div>

        {context.missionQueue.length > 1 && (
          <details className="mt-6 border-t border-slate-100 pt-5">
            <summary className="cursor-pointer list-none text-sm font-bold text-slate-600 hover:text-blue-600 [&::-webkit-details-marker]:hidden">
              Vedi cosa verrà dopo
            </summary>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {context.missionQueue.slice(1, 3).map((nextMission) => (
                <Link
                  key={nextMission.id}
                  href={nextMission.href}
                  className="group flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 hover:bg-blue-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                      <FileCheck2 size={17} />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {nextMission.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Circa {nextMission.estimatedMinutes} minuti
                      </p>
                    </div>
                  </div>
                  <ArrowRight
                    size={16}
                    className="shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              ))}
            </div>
          </details>
        )}
      </div>
    </section>
  );
}
