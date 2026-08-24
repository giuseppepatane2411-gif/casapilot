"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { findService } from "@/lib/professionals/catalog";
import { loadProfessionalState } from "@/lib/professional-os/repository";
import { rankLeads } from "@/lib/professional-os/matching";
import { profileReadiness } from "@/lib/professional-os/readiness";
import type {
  ProfessionalOsState,
} from "@/lib/professional-os/types";
import {
  Badge,
  EmptyState,
  Heading,
  LinkButton,
  Page,
  Panel,
  ProgressBar,
  StatCard,
} from "./ui";
import { Icon } from "./icons";
import {
  PROPERTY_TYPE_LABELS,
  URGENCY_LABELS,
} from "@/lib/professional-os/labels";

export default function Dashboard() {
  const [state, setState] = useState<ProfessionalOsState | null>(null);

  useEffect(() => {
    setState(loadProfessionalState());
  }, []);

  const readiness = useMemo(
    () =>
      profileReadiness(
        state?.identity ?? null,
        state?.offerings ?? [],
      ),
    [state],
  );

  const ranked = useMemo(() => {
    if (!state?.identity) return [];
    return rankLeads(
      state.leads,
      state.identity,
      state.offerings,
    );
  }, [state]);

  if (!state) {
    return (
      <Page>
        <EmptyState
          title="Caricamento area professionista"
          description="Stiamo preparando la tua attività."
        />
      </Page>
    );
  }

  const activeOfferings = state.offerings.filter((offering) =>
    ["active", "limited"].includes(offering.activationStatus),
  );
  const pendingOfferings = state.offerings.filter(
    (offering) =>
      offering.activationStatus === "pending_verification",
  );
  const sentQuotes = state.quotes.filter(
    (quote) =>
      quote.professionalId ===
      (state.identity?.id ?? ""),
  );
  const activeJobs = state.jobs.filter(
    (job) =>
      !["completed", "cancelled"].includes(job.status),
  );

  return (
    <Page>
      <Heading
        eyebrow="Guimmia Professional OS"
        title={
          state.identity
            ? `Bentornato, ${state.identity.displayName}`
            : "Costruiamo la tua attività professionale"
        }
        description="Il tuo spazio per configurare i servizi, ricevere richieste compatibili, preparare preventivi e seguire messaggi e incarichi."
        action={
          state.identity ? (
            <LinkButton
              href="/professionista/servizi"
              variant="secondary"
            >
              Configura servizi
            </LinkButton>
          ) : undefined
        }
      />

      {!state.identity ? (
        <Panel className="mb-8 border-blue-200 bg-blue-50">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-blue-950">
                Prima configuriamo chi sei
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-800">
                Il profilo professionale è separato dagli immobili. Dopo
                l'identità configurerai i singoli servizi con parametri
                utilizzabili da Guimmia.
              </p>
            </div>
            <LinkButton href="/professionista/onboarding">
              Inizia la configurazione
            </LinkButton>
          </div>
        </Panel>
      ) : (
        <Panel className="mb-8">
          <div className="grid gap-6 lg:grid-cols-[260px_1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-semibold text-slate-950">
                Prontezza del profilo
              </p>
              <div className="mt-3">
                <ProgressBar value={readiness.score} />
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {readiness.checks.map((check) => (
                <Link
                  key={check.id}
                  href={check.href}
                  className={`rounded-xl px-4 py-3 text-sm ${
                    check.complete
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-amber-50 text-amber-800"
                  }`}
                >
                  <span className="font-semibold">
                    {check.complete ? "✓ " : "○ "}
                    {check.label}
                  </span>
                </Link>
              ))}
            </div>
            <LinkButton
              href={
                readiness.activeOfferings > 0
                  ? "/professionista/profilo"
                  : "/professionista/servizi"
              }
              variant="secondary"
            >
              {readiness.activeOfferings > 0
                ? "Controlla profilo"
                : "Attiva un servizio"}
            </LinkButton>
          </div>
        </Panel>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Servizi attivi"
          value={activeOfferings.length}
          helper={`${pendingOfferings.length} in verifica`}
        />
        <StatCard
          label="Lead compatibili"
          value={ranked.filter(({ match }) => match.decision === "eligible").length}
        />
        <StatCard
          label="Lead di riserva"
          value={ranked.filter(({ match }) => match.decision === "reserve").length}
        />
        <StatCard
          label="Preventivi inviati"
          value={sentQuotes.length}
        />
        <StatCard
          label="Incarichi attivi"
          value={activeJobs.length}
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_360px]">
        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">
                Migliori richieste per te
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Guimmia applica prima i blocchi e poi ordina per compatibilità.
              </p>
            </div>
            <Link
              href="/professionista/richieste"
              className="text-sm font-semibold text-blue-600"
            >
              Vedi tutte →
            </Link>
          </div>

          {!state.identity || activeOfferings.length === 0 ? (
            <EmptyState
              title="Il matching non è ancora attivo"
              description="Configura almeno un servizio completo. I servizi regolamentati devono superare la verifica."
              action={
                <LinkButton href="/professionista/servizi">
                  Configura i servizi
                </LinkButton>
              }
            />
          ) : ranked.length === 0 ? (
            <EmptyState
              title="Nessuna lead compatibile"
              description="Guimmia continuerà a confrontare le nuove richieste con i tuoi parametri."
            />
          ) : (
            <div className="space-y-4">
              {ranked.slice(0, 4).map(({ lead, match }) => (
                <article
                  key={lead.id}
                  className="rounded-3xl border border-slate-200 bg-white p-6"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          tone={
                            match.decision === "eligible"
                              ? "success"
                              : "warning"
                          }
                        >
                          {match.decision === "eligible"
                            ? `Compatibilità ${match.score}%`
                            : `Riserva ${match.score}%`}
                        </Badge>
                        <Badge
                          tone={
                            lead.qualityScore >= 80
                              ? "blue"
                              : "warning"
                          }
                        >
                          Qualità {lead.qualityScore}/100
                        </Badge>
                        <Badge>
                          {URGENCY_LABELS[lead.urgency]}
                        </Badge>
                      </div>
                      <h3 className="mt-3 text-lg font-semibold">
                        {findService(lead.serviceId)?.name}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {PROPERTY_TYPE_LABELS[lead.propertyType]} ·{" "}
                        {lead.approximateLocation}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {match.positiveReasons
                          .slice(0, 3)
                          .map((reason) => (
                            <span
                              key={reason}
                              className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600"
                            >
                              ✓ {reason}
                            </span>
                          ))}
                      </div>
                    </div>
                    <LinkButton
                      href={`/professionista/richieste/${lead.id}`}
                      variant="secondary"
                    >
                      Apri la lead
                    </LinkButton>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-5">
          <Panel className="border-blue-200 bg-blue-50">
            <div className="flex items-center gap-3 text-blue-700">
              <Icon name="pilot" className="h-6 w-6" />
              <h2 className="font-semibold">Distribuzione a ondate</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-blue-800">
              La prima ondata coinvolge fino a tre candidati idonei. Se
              rifiutano o scade il tempo, Guimmia usa la lista di riserva senza
              inviare la lead a decine di professionisti.
            </p>
          </Panel>

          <Panel>
            <h2 className="font-semibold">Azioni consigliate</h2>
            <div className="mt-4 space-y-3">
              {readiness.checks
                .filter((check) => !check.complete)
                .slice(0, 4)
                .map((check) => (
                  <Link
                    key={check.id}
                    href={check.href}
                    className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700"
                  >
                    {check.label}
                    <Icon name="arrow" className="h-4 w-4" />
                  </Link>
                ))}
              {readiness.checks.every((check) => check.complete) ? (
                <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                  ✓ Profilo pronto per lavorare
                </p>
              ) : null}
            </div>
          </Panel>
        </aside>
      </div>
    </Page>
  );
}

