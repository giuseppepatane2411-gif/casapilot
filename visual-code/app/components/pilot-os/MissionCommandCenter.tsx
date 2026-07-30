"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  FileCheck2,
  ListChecks,
  Sparkles,
  Target,
} from "lucide-react";

import { getDocumentDefinition } from "@/lib/property-journey/scoring";
import { updateJourneyDocuments } from "@/lib/property-journey/storage";
import {
  addPilotTimelineEvent,
  completePilotMission,
} from "@/lib/pilot-os/store";
import type { PilotContext, PilotMission } from "@/lib/pilot-os/types";

const priorityLabels = {
  critical: "Urgente",
  high: "Alta",
  medium: "Media",
  low: "Bassa",
};

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
          "Pilot ha aggiornato checklist, Health Score e prossima missione.",
        type: "document",
      });
      return;
    }

    completePilotMission(context.journey.id, selectedMission.id);
    addPilotTimelineEvent(context.journey.id, {
      id: `mission-${selectedMission.id}`,
      title: "Missione completata",
      description: selectedMission.title,
      type: "mission",
    });
  }

  const canComplete =
    Boolean(mission.documentId) || mission.id === "marketing-material";

  return (
    <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-600/20 sm:p-8">
      <div
        aria-hidden="true"
        className="absolute -right-20 -top-24 h-72 w-72 rounded-full border border-white/10"
      />
      <div
        aria-hidden="true"
        className="absolute -right-5 top-8 h-44 w-44 rounded-full border border-white/10"
      />

      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-blue-100">
            <Target size={17} />
            Missione di oggi
          </p>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">
              {Math.max(context.missionQueue.length, 1)} missioni aperte
            </span>
            <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">
              Priorità {priorityLabels[mission.priority]}
            </span>
          </div>
        </div>

        <h2 className="mt-6 max-w-3xl text-3xl font-bold tracking-[-0.045em] sm:text-4xl">
          {mission.title}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">
          {mission.description}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Metric icon={Clock3} label="Tempo stimato" value={`${mission.estimatedMinutes} min`} />
          <Metric icon={Sparkles} label="Impatto score" value={`+${mission.scoreGain} punti`} />
          <Metric icon={ListChecks} label="Prontezza" value={`${context.readiness.overall}%`} />
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-blue-100">
            Perché questa missione
          </p>
          <p className="mt-2 text-sm leading-6 text-white">{mission.reason}</p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {canComplete ? (
            <button
              type="button"
              onClick={() => completeMission(mission)}
              className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-white px-5 text-sm font-bold text-blue-700 shadow-lg hover:-translate-y-0.5 hover:bg-blue-50"
            >
              <CheckCircle2 size={18} />
              {mission.actionLabel}
            </button>
          ) : (
            <Link
              href={mission.href}
              className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-white px-5 text-sm font-bold text-blue-700 shadow-lg hover:-translate-y-0.5 hover:bg-blue-50"
            >
              {mission.actionLabel}
              <ArrowRight size={17} />
            </Link>
          )}
          <Link
            href={mission.href}
            className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 text-sm font-bold text-white hover:bg-white/15"
          >
            Apri attività
            <ArrowRight size={17} />
          </Link>
        </div>

        {context.missionQueue.length > 1 && (
          <div className="mt-7 border-t border-white/10 pt-5">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-200">
              Subito dopo
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {context.missionQueue.slice(1, 3).map((nextMission) => (
                <Link
                  key={nextMission.id}
                  href={nextMission.href}
                  className="group flex items-center justify-between gap-3 rounded-2xl bg-white/10 px-4 py-3 hover:bg-white/15"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-blue-100">
                      {nextMission.documentId ? (
                        <FileCheck2 size={17} />
                      ) : (
                        <Check size={17} />
                      )}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-white">
                        {nextMission.title}
                      </p>
                      <p className="mt-0.5 text-xs text-blue-200">
                        {nextMission.estimatedMinutes} min · +{nextMission.scoreGain} punti
                      </p>
                    </div>
                  </div>
                  <ArrowRight
                    size={16}
                    className="shrink-0 text-blue-200 transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

type MetricProps = {
  icon: typeof Clock3;
  label: string;
  value: string;
};

function Metric({ icon: Icon, label, value }: MetricProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
      <p className="flex items-center gap-2 text-xs font-semibold text-blue-100">
        <Icon size={14} />
        {label}
      </p>
      <p className="mt-2 text-lg font-bold text-white">{value}</p>
    </div>
  );
}
