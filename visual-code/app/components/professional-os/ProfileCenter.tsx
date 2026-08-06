"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { findCategory, findService } from "@/lib/professionals/catalog";
import {
  loadProfessionalState,
  saveIdentity,
} from "@/lib/professional-os/repository";
import {
  offeringReadiness,
  profileReadiness,
} from "@/lib/professional-os/readiness";
import { OFFERING_STATUS_LABELS } from "@/lib/professional-os/labels";
import {
  LANGUAGE_LABELS,
  LANGUAGE_LEVEL_LABELS,
  REMOTE_EXECUTION_LABELS,
} from "@/lib/remote-layer/labels";
import type { ProfessionalOsState } from "@/lib/professional-os/types";
import {
  Badge,
  EmptyState,
  Heading,
  LinkButton,
  Page,
  Panel,
  ProgressBar,
  ToggleCard,
} from "./ui";

export default function ProfileCenter() {
  const [state, setState] = useState<ProfessionalOsState | null>(null);
  const refresh = () => setState(loadProfessionalState());
  useEffect(refresh, []);

  const readiness = useMemo(
    () => profileReadiness(state?.identity ?? null, state?.offerings ?? []),
    [state],
  );

  if (!state?.identity) {
    return (
      <Page>
        <Heading
          eyebrow="Identità professionale"
          title="Profilo e verifiche"
          description="Il profilo è separato dal portfolio dei servizi."
        />
        <EmptyState
          title="Profilo non configurato"
          description="Completa l'onboarding prima di attivare servizi e ricevere lead."
          action={
            <LinkButton href="/professionista/onboarding">
              Configura il profilo
            </LinkButton>
          }
        />
      </Page>
    );
  }

  const identity = state.identity;
  const togglePause = () => {
    saveIdentity({
      ...identity,
      pauseAllLeads: !identity.pauseAllLeads,
      updatedAt: new Date().toISOString(),
    });
    refresh();
  };

  const categories = Array.from(
    new Set(
      state.offerings
        .map((offering) => findService(offering.serviceId))
        .filter(Boolean)
        .map((service) => service?.categoryId),
    ),
  ).filter((value): value is string => Boolean(value));

  return (
    <Page>
      <Heading
        eyebrow="Identità e reputazione"
        title="Profilo professionale"
        description="Lingue e capacità remote migliorano il matching, ma le condizioni operative restano configurate nel singolo servizio."
        action={
          <LinkButton href="/professionista/onboarding" variant="secondary">
            Modifica profilo
          </LinkButton>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Panel>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    tone={
                      identity.verificationStatus === "verified"
                        ? "success"
                        : identity.verificationStatus === "pending"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    Verifica {identity.verificationStatus}
                  </Badge>
                  <Badge>{identity.accountType}</Badge>
                </div>
                <h2 className="mt-4 text-2xl font-semibold">
                  {identity.displayName}
                </h2>
                <p className="mt-1 text-slate-600">{identity.profession}</p>
              </div>

              <ToggleCard
                title={
                  identity.pauseAllLeads
                    ? "Ricezione lead sospesa"
                    : "Ricezione lead attiva"
                }
                description={
                  identity.pauseAllLeads
                    ? "Pilot non proporrà nuove richieste."
                    : "Restano validi i limiti dei singoli servizi."
                }
                selected={!identity.pauseAllLeads}
                onClick={togglePause}
              />
            </div>

            <p className="mt-6 leading-7 text-slate-600">{identity.bio}</p>

            <div className="mt-7 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Esperienza
                </p>
                <p className="mt-2 font-semibold">
                  {identity.yearsExperience} anni
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Lingue
                </p>
                <p className="mt-2 font-semibold">
                  {identity.remoteCapabilities.languageSkills.length}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Limite generale
                </p>
                <p className="mt-2 font-semibold">
                  {identity.weeklyLeadLimit} lead/settimana
                </p>
              </div>
            </div>
          </Panel>

          <Panel>
            <h2 className="text-lg font-semibold">
              Lingue e collaborazione a distanza
            </h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {identity.remoteCapabilities.languageSkills.map((skill) => (
                <Badge key={skill.language} tone="blue">
                  {LANGUAGE_LABELS[skill.language]} · {" "}
                  {LANGUAGE_LEVEL_LABELS[skill.level]}
                </Badge>
              ))}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                [
                  "Consulenze a distanza",
                  identity.remoteCapabilities.remoteConsultation,
                ],
                [
                  "Videochiamate",
                  identity.remoteCapabilities.videoCallAvailable,
                ],
                [
                  "Esperienza con clienti lontani",
                  identity.remoteCapabilities.internationalClientExperience,
                ],
                [
                  "Report fotografici o video",
                  identity.remoteCapabilities.photoReportAvailable,
                ],
                [
                  "Gestione tramite delega",
                  identity.remoteCapabilities.delegationSupported,
                ],
              ].map(([label, enabled]) => (
                <div
                  key={String(label)}
                  className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                    enabled
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-slate-50 text-slate-500"
                  }`}
                >
                  {enabled ? "✓" : "○"} {label}
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Portfolio configurato</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {state.offerings.length} servizi in {categories.length} categorie.
                </p>
              </div>
              <LinkButton href="/professionista/servizi" variant="secondary">
                Gestisci servizi
              </LinkButton>
            </div>

            {state.offerings.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
                Nessun servizio configurato. Pilot non può assegnarti lead.
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {state.offerings.map((offering) => {
                  const service = findService(offering.serviceId);
                  const category = findCategory(service?.categoryId);
                  const currentReadiness = offeringReadiness(offering, identity);
                  return (
                    <Link
                      key={offering.id}
                      href={`/professionista/servizi/${service?.categoryId}/${offering.serviceId}`}
                      className="block rounded-2xl border border-slate-200 p-5 transition hover:border-blue-300"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex flex-wrap gap-2">
                            <Badge
                              tone={
                                ["active", "limited"].includes(
                                  offering.activationStatus,
                                )
                                  ? "success"
                                  : offering.activationStatus ===
                                      "pending_verification"
                                    ? "warning"
                                    : "neutral"
                              }
                            >
                              {OFFERING_STATUS_LABELS[offering.activationStatus]}
                            </Badge>
                            <Badge>{category?.name}</Badge>
                            <Badge tone="blue">
                              {REMOTE_EXECUTION_LABELS[
                                offering.remoteExecutionLevel
                              ]}
                            </Badge>
                          </div>
                          <h3 className="mt-3 font-semibold">{service?.name}</h3>
                        </div>
                        <div className="w-full sm:w-52">
                          <ProgressBar
                            value={currentReadiness.score}
                            label="Completezza"
                          />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>

        <aside className="space-y-5">
          <Panel>
            <h2 className="font-semibold">Prontezza complessiva</h2>
            <div className="mt-4">
              <ProgressBar value={readiness.score} />
            </div>
            <div className="mt-5 space-y-2">
              {readiness.checks.map((check) => (
                <Link
                  key={check.id}
                  href={check.href}
                  className={`block rounded-xl px-4 py-3 text-sm font-semibold ${
                    check.complete
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-amber-50 text-amber-800"
                  }`}
                >
                  {check.complete ? "✓ " : "○ "}
                  {check.label}
                </Link>
              ))}
            </div>
          </Panel>

          <Panel>
            <h2 className="font-semibold">Verifiche dichiarate</h2>
            <div className="mt-4 space-y-3">
              {identity.verificationItems.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Nessun documento indicato.
                </p>
              ) : (
                identity.verificationItems.map((item) => (
                  <div key={item.id} className="rounded-xl bg-slate-50 p-4">
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Stato: {item.status}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Panel>

          <Panel>
            <h2 className="font-semibold">Copertura generale</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {identity.generalAreas.join(", ") || "Nessuna area impostata"}
            </p>
            {identity.onlineAvailable ? (
              <Badge tone="blue">Disponibile online</Badge>
            ) : null}
          </Panel>
        </aside>
      </div>
    </Page>
  );
}
