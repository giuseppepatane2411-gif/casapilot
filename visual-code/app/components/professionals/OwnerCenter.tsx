"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { findService } from "@/lib/professionals/catalog";
import { getLeads, getQuotes } from "@/lib/professionals/store";
import type { LeadRequest } from "@/lib/professionals/types";
import {
  LANGUAGE_LABELS,
  PRESENCE_LABELS,
} from "@/lib/remote-layer/labels";
import { Badge, Heading, Page } from "./ui";
import ProfessionalNav from "./ProfessionalNav";

const labels: Record<LeadRequest["status"], string> = {
  draft: "Bozza",
  submitted: "Inviata",
  matching: "Ricerca professionisti",
  matched: "Professionisti abbinati",
  viewed: "Visualizzata",
  quote_received: "Preventivi ricevuti",
  quote_accepted: "Preventivo accettato",
  contacts_unlocked: "Contatti sbloccati",
  job_in_progress: "Lavoro in corso",
  job_completed: "Completata",
  cancelled: "Annullata",
};

export default function OwnerCenter() {
  const [leads, setLeads] = useState<LeadRequest[]>([]);
  useEffect(() => setLeads(getLeads()), []);

  return (
    <Page>
      <ProfessionalNav />
      <Heading
        eyebrow="Lead tracciate"
        title="Le mie richieste"
        description="Segui il funnel completo: invio, visualizzazione, preventivo, scelta e incarico."
      />
      <div className="space-y-4">
        {leads.map((lead) => {
          const service = findService(lead.serviceId);
          const quotes = getQuotes(lead.id);
          return (
            <article
              key={lead.id}
              className="rounded-3xl border border-slate-200 bg-white p-6"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="blue">{labels[lead.status]}</Badge>
                    <Badge
                      tone={lead.leadScore >= 80 ? "success" : "warning"}
                    >
                      Qualità {lead.leadScore}/100
                    </Badge>
                    {quotes.length > 0 ? (
                      <Badge tone="success">
                        {quotes.length} preventivi
                      </Badge>
                    ) : null}
                    <Badge>
                      {LANGUAGE_LABELS[lead.remoteContext.ownerLanguage]}
                    </Badge>
                    {lead.remoteContext.presenceAvailability !== "available" ? (
                      <Badge tone="warning">
                        {PRESENCE_LABELS[
                          lead.remoteContext.presenceAvailability
                        ]}
                      </Badge>
                    ) : null}
                  </div>
                  <h2 className="mt-3 text-lg font-semibold text-slate-950">
                    {service?.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {lead.propertyLabel} · {lead.location}
                  </p>
                </div>
                {quotes.length > 0 ? (
                  <Link
                    href={`/dashboard/professionals/compare/${lead.id}`}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
                  >
                    Confronta preventivi
                  </Link>
                ) : (
                  <span className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    In attesa di proposte
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </Page>
  );
}
