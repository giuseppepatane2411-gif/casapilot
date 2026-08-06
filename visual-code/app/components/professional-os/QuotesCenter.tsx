"use client";

import { useEffect, useState } from "react";
import { findService } from "@/lib/professionals/catalog";
import { loadProfessionalState } from "@/lib/professional-os/repository";
import { PRICING_MODE_LABELS } from "@/lib/professional-os/labels";
import type { ProfessionalOsState } from "@/lib/professional-os/types";
import {
  Badge,
  EmptyState,
  Heading,
  Page,
} from "./ui";

export default function QuotesCenter() {
  const [state, setState] =
    useState<ProfessionalOsState | null>(null);

  useEffect(() => {
    setState(loadProfessionalState());
  }, []);

  const quotes =
    state?.quotes.filter(
      (quote) =>
        quote.professionalId === state.identity?.id ||
        quote.professionalId === "professional_demo",
    ) ?? [];

  return (
    <Page>
      <Heading
        eyebrow="Offerte inviate"
        title="Preventivi"
        description="Ogni preventivo rimane collegato alla lead, al servizio configurato e alla conversazione protetta."
      />

      {quotes.length === 0 ? (
        <EmptyState
          title="Nessun preventivo inviato"
          description="Quando una lead compatibile richiederà una proposta, potrai prepararla con il modello specifico del servizio."
        />
      ) : (
        <div className="space-y-4">
          {quotes.map((quote) => {
            const lead = state?.leads.find(
              (item) => item.id === quote.leadId,
            );
            const service = findService(lead?.serviceId);

            return (
              <article
                key={quote.id}
                className="rounded-3xl border border-slate-200 bg-white p-6"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        tone={
                          quote.status === "accepted"
                            ? "success"
                            : quote.status === "sent"
                              ? "blue"
                              : "neutral"
                        }
                      >
                        {quote.status}
                      </Badge>
                      <Badge>
                        {PRICING_MODE_LABELS[quote.priceType]}
                      </Badge>
                    </div>
                    <h2 className="mt-3 text-lg font-semibold">
                      {service?.name ?? "Servizio"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {lead?.propertyLabel} · {lead?.approximateLocation}
                    </p>
                  </div>

                  <div className="text-left lg:text-right">
                    <p className="text-2xl font-semibold">
                      {quote.priceType === "starting_from" ? "Da " : ""}
                      {quote.priceMin} €
                      {quote.priceType === "range" &&
                      quote.priceMax
                        ? ` – ${quote.priceMax} €`
                        : ""}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {quote.vatIncluded
                        ? "IVA inclusa"
                        : "IVA esclusa"}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </Page>
  );
}
