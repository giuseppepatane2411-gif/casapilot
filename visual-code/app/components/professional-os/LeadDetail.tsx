"use client";

import { useEffect, useMemo, useState } from "react";
import { findService } from "@/lib/professionals/catalog";
import { loadProfessionalState } from "@/lib/professional-os/repository";
import { evaluateMatch } from "@/lib/professional-os/matching";
import {
  PROPERTY_TYPE_LABELS,
  URGENCY_LABELS,
} from "@/lib/professional-os/labels";
import {
  LANGUAGE_LABELS,
  PRESENCE_LABELS,
  REMOTE_EXECUTION_LABELS,
} from "@/lib/remote-layer/labels";
import type {
  MatchEvaluation,
  ProfessionalOsState,
} from "@/lib/professional-os/types";
import {
  Badge,
  Breadcrumb,
  EmptyState,
  LinkButton,
  Page,
  Panel,
} from "./ui";
import MessageThread from "./MessageThread";
import { Icon } from "./icons";
import { buildRemoteOperationPlan } from "@/lib/remote-layer/service-policy";
import RemoteOperationPlanCard from "@/components/remote-layer/RemoteOperationPlanCard";

export default function LeadDetail({ leadId }: { leadId: string }) {
  const [state, setState] = useState<ProfessionalOsState | null>(null);
  useEffect(() => setState(loadProfessionalState()), [leadId]);

  const lead = state?.leads.find((item) => item.id === leadId);
  const offering = state?.offerings.find(
    (item) => item.serviceId === lead?.serviceId,
  );
  const match = useMemo<MatchEvaluation | null>(() => {
    if (!state?.identity || !lead) return null;
    return evaluateMatch(lead, state.identity, offering);
  }, [lead, offering, state]);

  if (!state || !lead) {
    return (
      <Page>
        <EmptyState
          title="Lead non trovata"
          description="La richiesta potrebbe non essere più disponibile."
        />
      </Page>
    );
  }

  const service = findService(lead.serviceId);
  const contactsUnlocked = [
    "contacts_unlocked",
    "job_in_progress",
    "job_completed",
  ].includes(lead.status);
  const remotePlan = buildRemoteOperationPlan({
    leadId: lead.id,
    serviceId: lead.serviceId,
    ownerCanAttend: ["available", "specific_dates"].includes(
      lead.presenceAvailability,
    ),
    localContactAvailable: lead.localContactAvailable,
    delegationAvailable: offering?.delegationSupported ?? false,
  });

  return (
    <Page>
      <Breadcrumb href="/professionista/richieste" label="Richieste compatibili" />

      <div className="grid gap-6 xl:grid-cols-[1fr_390px]">
        <div className="space-y-6">
          <Panel>
            <div className="flex flex-wrap gap-2">
              {match ? (
                <Badge
                  tone={
                    match.decision === "eligible"
                      ? "success"
                      : match.decision === "reserve"
                        ? "warning"
                        : "danger"
                  }
                >
                  {match.decision === "eligible"
                    ? `Prima ondata · ${match.score}%`
                    : match.decision === "reserve"
                      ? `Riserva · ${match.score}%`
                      : "Non idonea"}
                </Badge>
              ) : null}
              <Badge tone="blue">Qualità {lead.qualityScore}/100</Badge>
              <Badge>{URGENCY_LABELS[lead.urgency]}</Badge>
              <Badge>{lead.approximateLocation}</Badge>
              <Badge>{LANGUAGE_LABELS[lead.ownerLanguage]}</Badge>
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight">
              {service?.name ?? lead.serviceId}
            </h1>
            <p className="mt-2 leading-7 text-slate-600">
              {service?.shortDescription}
            </p>

            <div className="mt-7 grid gap-4 sm:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Immobile</p>
                <p className="mt-2 text-sm font-semibold">
                  {PROPERTY_TYPE_LABELS[lead.propertyType]}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Budget</p>
                <p className="mt-2 text-sm font-semibold">
                  {typeof lead.budgetMin === "number" ? `${lead.budgetMin} €` : "Non indicato"}
                  {typeof lead.budgetMax === "number" ? ` – ${lead.budgetMax} €` : ""}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Presenza</p>
                <p className="mt-2 text-sm font-semibold">
                  {PRESENCE_LABELS[lead.presenceAvailability]}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recapiti</p>
                <p className="mt-2 text-sm font-semibold">
                  {contactsUnlocked ? "Sbloccati" : "Protetti"}
                </p>
              </div>
            </div>
          </Panel>

          <RemoteOperationPlanCard plan={remotePlan} />

          <Panel className="border-blue-200 bg-blue-50">
            <h2 className="font-semibold text-blue-950">
              Comunicazione con il proprietario
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/70 p-4 text-sm text-blue-900">
                <p className="font-semibold">Lingua e preferenza</p>
                <p className="mt-2">
                  {LANGUAGE_LABELS[lead.ownerLanguage]} · {
                    (lead.communicationPreference ?? "automatic").replaceAll("_", " ")
                  }
                </p>
              </div>
              <div className="rounded-2xl bg-white/70 p-4 text-sm text-blue-900">
                <p className="font-semibold">Sicurezza della traduzione</p>
                <p className="mt-2">
                  {lead.translationEnabled
                    ? "Traduzione disponibile con originale conservato"
                    : "Comunicazione diretta o da concordare"}
                </p>
              </div>
            </div>
          </Panel>

          {match ? (
            <Panel>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Icon name="pilot" className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-semibold">Perché Pilot ha preso questa decisione</h2>
                  <p className="text-sm text-slate-500">Il punteggio viene dopo i requisiti bloccanti.</p>
                </div>
              </div>
              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold text-emerald-800">Elementi compatibili</h3>
                  <div className="mt-3 space-y-2">
                    {match.positiveReasons.map((reason) => (
                      <p key={reason} className="flex gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                        <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0" />
                        {reason}
                      </p>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Attenzioni</h3>
                  <div className="mt-3 space-y-2">
                    {match.hardBlockers.length === 0 && match.warnings.length === 0 ? (
                      <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">Nessun problema rilevato.</p>
                    ) : (
                      <>
                        {match.hardBlockers.map((blocker) => (
                          <p key={blocker} className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">Blocco: {blocker}</p>
                        ))}
                        {match.warnings.map((warning) => (
                          <p key={warning} className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{warning}</p>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Panel>
          ) : null}

          <Panel>
            <h2 className="font-semibold">Dettagli della richiesta</h2>
            <dl className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200">
              <div className="grid gap-1 px-5 py-4 sm:grid-cols-[190px_1fr]">
                <dt className="text-sm text-slate-500">Immobile</dt>
                <dd className="text-sm font-semibold">{lead.propertyLabel}</dd>
              </div>
              {Object.entries(lead.answers).map(([key, value]) => (
                <div key={key} className="grid gap-1 px-5 py-4 sm:grid-cols-[190px_1fr]">
                  <dt className="text-sm capitalize text-slate-500">{key.replaceAll("_", " ")}</dt>
                  <dd className="text-sm text-slate-800">
                    {Array.isArray(value) ? value.join(", ") : String(value)}
                  </dd>
                </div>
              ))}
            </dl>
            {lead.notes ? (
              <div className="mt-5 rounded-2xl bg-slate-50 p-5">
                <p className="text-sm font-semibold">Note dell'utente</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{lead.notes}</p>
              </div>
            ) : null}
          </Panel>
        </div>

        <aside className="space-y-5">
          <Panel className="border-blue-200 bg-blue-50">
            <div className="flex items-center gap-3 text-blue-700">
              <Icon name="shield" className="h-5 w-5" />
              <h2 className="font-semibold">Primo contatto protetto</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-blue-800">
              Prima dell'accettazione non vengono mostrati telefono, email,
              link esterni o indirizzo completo.
            </p>
          </Panel>

          <Panel>
            <h2 className="font-semibold">Azioni</h2>
            <div className="mt-4 grid gap-3">
              <LinkButton href={`/professionista/richieste/${lead.id}/preventivo`}>
                Prepara un preventivo
              </LinkButton>
              <LinkButton
                href={`/professionista/servizi/${lead.categoryId}/${lead.serviceId}`}
                variant="secondary"
              >
                Controlla i parametri del servizio
              </LinkButton>
              <button type="button" className="min-h-11 rounded-xl px-4 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50">
                Rifiuta con motivazione
              </button>
            </div>
          </Panel>

          <MessageThread
            leadId={lead.id}
            ownerLanguage={lead.ownerLanguage}
            contactsUnlocked={contactsUnlocked}
          />
        </aside>
      </div>
    </Page>
  );
}
