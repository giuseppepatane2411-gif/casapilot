"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { findService } from "@/lib/professionals/catalog";
import { loadProfessionalState } from "@/lib/professional-os/repository";
import { rankLeads } from "@/lib/professional-os/matching";
import {
  PROPERTY_TYPE_LABELS,
  URGENCY_LABELS,
} from "@/lib/professional-os/labels";
import {
  LANGUAGE_LABELS,
  PRESENCE_LABELS,
} from "@/lib/remote-layer/labels";
import type { ProfessionalOsState } from "@/lib/professional-os/types";
import {
  Badge,
  EmptyState,
  Heading,
  LinkButton,
  Page,
} from "./ui";
import { Icon } from "./icons";

type Filter =
  | "all"
  | "eligible"
  | "reserve"
  | "urgent"
  | "high_quality"
  | "remote";

export default function LeadInbox() {
  const [state, setState] = useState<ProfessionalOsState | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => setState(loadProfessionalState()), []);

  const ranked = useMemo(() => {
    if (!state?.identity) return [];
    let values = rankLeads(state.leads, state.identity, state.offerings);
    if (filter === "eligible") {
      values = values.filter(({ match }) => match.decision === "eligible");
    } else if (filter === "reserve") {
      values = values.filter(({ match }) => match.decision === "reserve");
    } else if (filter === "urgent") {
      values = values.filter(({ lead }) => lead.urgency === "asap");
    } else if (filter === "high_quality") {
      values = values.filter(({ lead }) => lead.qualityScore >= 85);
    } else if (filter === "remote") {
      values = values.filter(
        ({ lead }) => lead.presenceAvailability !== "available",
      );
    }
    return values;
  }, [filter, state]);

  return (
    <Page>
      <Heading
        eyebrow="Lead professionali"
        title="Richieste compatibili"
        description="Servizio, zona, requisiti e capacità restano prioritari. Lingua e distanza migliorano il matching senza creare un mercato separato."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {([
          ["all", "Tutte"],
          ["eligible", "Prima ondata"],
          ["reserve", "Riserva"],
          ["urgent", "Urgenti"],
          ["high_quality", "Qualità ≥ 85"],
          ["remote", "Gestione a distanza"],
        ] as Array<[Filter, string]>).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
              filter === value
                ? "bg-blue-600 text-white"
                : "border border-slate-200 bg-white text-slate-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {!state?.identity ? (
        <EmptyState
          title="Profilo professionale necessario"
          description="Completa il profilo e configura almeno un servizio prima di ricevere lead."
          action={
            <LinkButton href="/professionista/onboarding">
              Configura il profilo
            </LinkButton>
          }
        />
      ) : ranked.length === 0 ? (
        <EmptyState
          title="Nessuna richiesta in questa vista"
          description="Pilot mostrerà soltanto lead che rispettano i parametri attivi."
          action={
            <LinkButton href="/professionista/servizi" variant="secondary">
              Controlla i servizi
            </LinkButton>
          }
        />
      ) : (
        <div className="space-y-4">
          {ranked.map(({ lead, match }) => (
            <article
              key={lead.id}
              className="rounded-3xl border border-slate-200 bg-white p-6"
            >
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="max-w-4xl">
                  <div className="flex flex-wrap gap-2">
                    <Badge tone={match.decision === "eligible" ? "success" : "warning"}>
                      {match.decision === "eligible"
                        ? `Prima ondata · ${match.score}%`
                        : `Riserva · ${match.score}%`}
                    </Badge>
                    <Badge tone={lead.qualityScore >= 85 ? "blue" : "neutral"}>
                      Qualità lead {lead.qualityScore}/100
                    </Badge>
                    <Badge>{URGENCY_LABELS[lead.urgency]}</Badge>
                    <Badge>{lead.approximateLocation}</Badge>
                    <Badge>{LANGUAGE_LABELS[lead.ownerLanguage]}</Badge>
                    {lead.presenceAvailability !== "available" ? (
                      <Badge tone="warning">
                        {PRESENCE_LABELS[lead.presenceAvailability]}
                      </Badge>
                    ) : null}
                  </div>

                  <h2 className="mt-3 text-lg font-semibold">
                    {findService(lead.serviceId)?.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {PROPERTY_TYPE_LABELS[lead.propertyType]} · {lead.propertyLabel}
                  </p>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {match.positiveReasons.slice(0, 5).map((reason) => (
                      <p
                        key={reason}
                        className="flex items-center gap-2 text-xs text-emerald-700"
                      >
                        <Icon name="check" className="h-4 w-4" />
                        {reason}
                      </p>
                    ))}
                  </div>

                  {match.warnings.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {match.warnings.map((warning) => (
                        <span
                          key={warning}
                          className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-800"
                        >
                          {warning}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <Link
                  href={`/professionista/richieste/${lead.id}`}
                  className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
                >
                  Valuta la lead
                  <Icon name="arrow" className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </Page>
  );
}
