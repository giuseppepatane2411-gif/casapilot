"use client";

import { useEffect, useMemo, useState } from "react";
import { findService } from "@/lib/professionals/catalog";
import {
  buildDistributionWaves,
  evaluateMatch,
} from "@/lib/professional-os/matching";
import { loadProfessionalState } from "@/lib/professional-os/repository";
import {
  LANGUAGE_LABELS,
  PRESENCE_LABELS,
} from "@/lib/remote-layer/labels";
import type {
  MatchEvaluation,
  ProfessionalIdentity,
  ProfessionalOsState,
  ServiceOffering,
} from "@/lib/professional-os/types";
import {
  Badge,
  EmptyState,
  Heading,
  Page,
  Panel,
  StatCard,
} from "./ui";

function cloneIdentity(
  source: ProfessionalIdentity,
  id: string,
  displayName: string,
  changes: Partial<ProfessionalIdentity>,
): ProfessionalIdentity {
  return {
    ...source,
    ...changes,
    id,
    displayName,
    updatedAt: new Date().toISOString(),
  };
}

function cloneOffering(
  source: ServiceOffering,
  id: string,
  professionalId: string,
  changes: Partial<ServiceOffering>,
): ServiceOffering {
  return {
    ...source,
    ...changes,
    id,
    professionalId,
    updatedAt: new Date().toISOString(),
  };
}

export default function MatchingLab() {
  const [state, setState] =
    useState<ProfessionalOsState | null>(null);
  const [leadId, setLeadId] = useState("");

  useEffect(() => {
    const value = loadProfessionalState();
    setState(value);
    setLeadId(value.leads[0]?.id ?? "");
  }, []);

  const simulation = useMemo(() => {
    if (!state?.identity || !leadId) return null;
    const lead = state.leads.find((item) => item.id === leadId);
    if (!lead) return null;

    const baseOffering = state.offerings.find(
      (item) => item.serviceId === lead.serviceId,
    );

    if (!baseOffering) {
      return {
        lead,
        candidates: [] as Array<{
          name: string;
          evaluation: MatchEvaluation;
        }>,
        waves: { wave1: [], wave2: [] },
      };
    }

    const candidates = [
      {
        identity: state.identity,
        offering: baseOffering,
      },
      {
        identity: cloneIdentity(
          state.identity,
          "candidate_fast",
          `${state.identity.displayName} Fast`,
          {},
        ),
        offering: cloneOffering(
          baseOffering,
          "offering_fast",
          "candidate_fast",
          {
            responseSlaHours: 2,
            currentWeekAssigned: 0,
          },
        ),
      },
      {
        identity: cloneIdentity(
          state.identity,
          "candidate_full",
          `${state.identity.displayName} Full`,
          {},
        ),
        offering: cloneOffering(
          baseOffering,
          "offering_full",
          "candidate_full",
          {
            currentWeekAssigned:
              baseOffering.weeklyCapacity,
          },
        ),
      },
      {
        identity: cloneIdentity(
          state.identity,
          "candidate_other_zone",
          `${state.identity.displayName} Fuori zona`,
          {
            generalAreas: ["Milano"],
          },
        ),
        offering: cloneOffering(
          baseOffering,
          "offering_other_zone",
          "candidate_other_zone",
          {},
        ),
      },
      {
        identity: cloneIdentity(
          state.identity,
          "candidate_strict",
          `${state.identity.displayName} Selettivo`,
          {},
        ),
        offering: cloneOffering(
          baseOffering,
          "offering_strict",
          "candidate_strict",
          {
            minimumLeadQuality: 98,
          },
        ),
      },
      {
        identity: cloneIdentity(
          state.identity,
          "candidate_presence_required",
          `${state.identity.displayName} Solo presenza`,
          {
            remoteCapabilities: {
              ...state.identity.remoteCapabilities,
              languageSkills: [{ language: "it", level: "native" }],
              delegationSupported: false,
              photoReportAvailable: false,
              videoCallAvailable: false,
            },
          },
        ),
        offering: cloneOffering(
          baseOffering,
          "offering_presence_required",
          "candidate_presence_required",
          {
            remoteExecutionLevel: "none",
            ownerPresenceRequirement: "required",
            delegationSupported: false,
            photoReportAvailable: false,
            videoCallAvailable: false,
          },
        ),
      },
    ].map(({ identity, offering }) => ({
      name: identity.displayName,
      evaluation: evaluateMatch(
        lead,
        identity,
        offering,
      ),
    }));

    return {
      lead,
      candidates,
      waves: buildDistributionWaves(
        candidates.map((item) => item.evaluation),
        lead.maxProfessionals,
      ),
    };
  }, [leadId, state]);

  return (
    <Page>
      <Heading
        eyebrow="Amministrazione Guimmia"
        title="Laboratorio del matching"
        description="Simula requisiti bloccanti, lingua, distanza, punteggio e distribuzione a ondate prima di attivare il matching reale."
      />

      {!state?.identity ? (
        <EmptyState
          title="Serve un profilo di test"
          description="Configura prima un professionista e almeno un servizio."
        />
      ) : (
        <>
          <Panel>
            <label>
              <span className="mb-2 block text-sm font-semibold">
                Lead da simulare
              </span>
              <select
                value={leadId}
                onChange={(event) =>
                  setLeadId(event.target.value)
                }
                className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4"
              >
                {state.leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {findService(lead.serviceId)?.name} ·{" "}
                    {lead.approximateLocation} · {LANGUAGE_LABELS[lead.ownerLanguage]} · {PRESENCE_LABELS[lead.presenceAvailability]} · qualità{" "}
                    {lead.qualityScore}
                  </option>
                ))}
              </select>
            </label>
          </Panel>

          {simulation ? (
            <>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <StatCard
                  label="Candidati simulati"
                  value={simulation.candidates.length}
                />
                <StatCard
                  label="Prima ondata"
                  value={simulation.waves.wave1.length}
                />
                <StatCard
                  label="Seconda ondata"
                  value={simulation.waves.wave2.length}
                />
              </div>

              <div className="mt-6 space-y-4">
                {simulation.candidates
                  .sort(
                    (a, b) =>
                      b.evaluation.score -
                      a.evaluation.score,
                  )
                  .map(({ name, evaluation }) => (
                    <article
                      key={evaluation.professionalId}
                      className="rounded-3xl border border-slate-200 bg-white p-6"
                    >
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap gap-2">
                            <Badge
                              tone={
                                evaluation.decision ===
                                "eligible"
                                  ? "success"
                                  : evaluation.decision ===
                                      "reserve"
                                    ? "warning"
                                    : "danger"
                              }
                            >
                              {evaluation.decision}
                            </Badge>
                            <Badge tone="blue">
                              Punteggio {evaluation.score}
                            </Badge>
                            {simulation.waves.wave1.some(
                              (item) =>
                                item.professionalId ===
                                evaluation.professionalId,
                            ) ? (
                              <Badge tone="success">
                                Ondata 1
                              </Badge>
                            ) : simulation.waves.wave2.some(
                                (item) =>
                                  item.professionalId ===
                                  evaluation.professionalId,
                              ) ? (
                              <Badge tone="warning">
                                Ondata 2
                              </Badge>
                            ) : null}
                          </div>
                          <h2 className="mt-3 text-lg font-semibold">
                            {name}
                          </h2>
                        </div>
                        <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
                          <div>
                            <p className="text-sm font-semibold text-emerald-800">
                              Motivi positivi
                            </p>
                            <div className="mt-2 space-y-1 text-xs text-emerald-700">
                              {evaluation.positiveReasons.map(
                                (reason) => (
                                  <p key={reason}>✓ {reason}</p>
                                ),
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-red-700">
                              Blocchi e avvisi
                            </p>
                            <div className="mt-2 space-y-1 text-xs">
                              {evaluation.hardBlockers.map(
                                (blocker) => (
                                  <p
                                    key={blocker}
                                    className="text-red-700"
                                  >
                                    ✕ {blocker}
                                  </p>
                                ),
                              )}
                              {evaluation.warnings.map(
                                (warning) => (
                                  <p
                                    key={warning}
                                    className="text-amber-700"
                                  >
                                    ! {warning}
                                  </p>
                                ),
                              )}
                              {evaluation.hardBlockers
                                .length === 0 &&
                              evaluation.warnings.length === 0 ? (
                                <p className="text-slate-500">
                                  Nessun problema.
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
              </div>
            </>
          ) : null}
        </>
      )}
    </Page>
  );
}
