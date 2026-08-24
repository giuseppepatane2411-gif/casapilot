"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { findService } from "@/lib/professionals/catalog";
import { acceptQuote, getLead, getQuotes } from "@/lib/professionals/store";
import type { LeadRequest, Quote } from "@/lib/professionals/types";
import { LANGUAGE_LABELS, REMOTE_EXECUTION_LABELS } from "@/lib/remote-layer/labels";
import { buildRemoteOperationPlan } from "@/lib/remote-layer/service-policy";
import { Badge, Heading, Page } from "./ui";
import ChatPanel from "./ChatPanel";
import ProfessionalNav from "./ProfessionalNav";
import RemoteOperationPlanCard from "@/components/remote-layer/RemoteOperationPlanCard";

const price = (quote: Quote) =>
  quote.priceType === "range" && quote.priceMax
    ? `${quote.priceMin}–${quote.priceMax} €`
    : quote.priceType === "starting_from"
      ? `Da ${quote.priceMin} €`
      : quote.priceType === "hourly"
        ? `${quote.priceMin} €/ora`
        : `${quote.priceMin} €`;

export default function CompareQuotes({ leadId }: { leadId: string }) {
  const [lead, setLead] = useState<LeadRequest | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [accepted, setAccepted] = useState("");

  useEffect(() => {
    setLead(getLead(leadId) ?? null);
    const values = getQuotes(leadId);
    setQuotes(values);
    setAccepted(values.find((item) => item.status === "accepted")?.id ?? "");
  }, [leadId]);

  if (!lead) return <Page>Richiesta non trovata.</Page>;

  const choose = (id: string) => {
    acceptQuote(id);
    setQuotes(getQuotes(leadId));
    setAccepted(id);
  };

  const acceptedQuote = quotes.find((quote) => quote.id === accepted);
  const acceptedPlan = acceptedQuote
    ? buildRemoteOperationPlan({
        leadId,
        serviceId: lead.serviceId,
        ownerCanAttend: lead.remoteContext.presenceAvailability === "available",
        localContactAvailable: lead.remoteContext.localContactAvailable,
        delegationAvailable:
          acceptedQuote.remoteSupport?.delegationSupported ?? false,
      })
    : null;

  return (
    <Page>
      <ProfessionalNav />
      <Link
        href="/dashboard/professionals/requests"
        className="text-sm font-semibold text-blue-600"
      >
        ← Le mie richieste
      </Link>
      <div className="mt-5">
        <Heading
          eyebrow="Confronto"
          title={findService(lead.serviceId)?.name ?? "Preventivi"}
          description="Guimmia confronta prezzo, contenuto, verifiche e fattibilità operativa. La lingua o la distanza non sostituiscono mai la qualità del servizio."
        />
      </div>

      {lead.remoteContext.translationEnabled ? (
        <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm leading-6 text-blue-900">
          Le conversazioni possono essere mostrate in{" "}
          <strong>{LANGUAGE_LABELS[lead.remoteContext.ownerLanguage]}</strong>.
          Messaggi tecnici mantengono l'originale; costi, contratti e documenti
          ufficiali richiedono un controllo più prudente.
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-3">
        {quotes.map((quote, index) => {
          const chosen = accepted === quote.id;
          const remote = quote.remoteSupport;
          const commonLanguage = remote?.spokenLanguages.includes(
            lead.remoteContext.ownerLanguage,
          );
          const plan = buildRemoteOperationPlan({
            leadId,
            serviceId: lead.serviceId,
            ownerCanAttend:
              lead.remoteContext.presenceAvailability === "available",
            localContactAvailable: lead.remoteContext.localContactAvailable,
            delegationAvailable: remote?.delegationSupported ?? false,
          });

          return (
            <article
              key={quote.id}
              className={`rounded-3xl border bg-white p-6 ${
                chosen
                  ? "border-emerald-400 ring-4 ring-emerald-100"
                  : "border-slate-200"
              }`}
            >
              <div className="flex flex-wrap gap-2">
                {index === 0 ? <Badge tone="blue">Più completo</Badge> : null}
                {quote.verified ? <Badge tone="success">Verificato</Badge> : null}
                {chosen ? <Badge tone="success">Scelto</Badge> : null}
                {commonLanguage ? (
                  <Badge tone="success">Lingua in comune</Badge>
                ) : remote && lead.remoteContext.translationEnabled ? (
                  <Badge tone="blue">Traduzione Guimmia</Badge>
                ) : null}
                <Badge
                  tone={
                    plan.warnings.length === 0
                      ? "success"
                      : plan.ownerPresenceNeeded
                        ? "warning"
                        : "blue"
                  }
                >
                  {plan.warnings.length === 0
                    ? "Gestione remota compatibile"
                    : "Azioni da confermare"}
                </Badge>
              </div>

              <h2 className="mt-4 text-lg font-semibold">
                {quote.professionalName}
              </h2>
              <p className="text-sm text-slate-500">
                {quote.professionalTitle}
              </p>
              <p className="mt-2 text-sm">
                ★ {quote.rating || "Nuovo"} · {quote.reviewsCount} recensioni
              </p>
              <p className="mt-6 text-3xl font-semibold">{price(quote)}</p>
              <p className="mt-1 text-xs text-slate-500">
                {quote.vatIncluded ? "IVA inclusa" : "IVA esclusa"}
              </p>

              <ul className="mt-6 space-y-2 text-sm text-slate-600">
                {quote.included.map((item) => (
                  <li key={item}>✓ {item}</li>
                ))}
              </ul>

              {remote ? (
                <div className="mt-5 rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900">
                  <p className="font-semibold">Capacità dichiarate</p>
                  <p className="mt-2">
                    {REMOTE_EXECUTION_LABELS[remote.remoteExecutionLevel]}
                  </p>
                  <div className="mt-3 space-y-1 text-xs">
                    <p>
                      {remote.ownerPresenceRequired ? "○" : "✓"} Presenza del
                      proprietario{" "}
                      {remote.ownerPresenceRequired ? "richiesta" : "non richiesta"}
                    </p>
                    <p>
                      {remote.photoReportAvailable ? "✓" : "○"} Report fotografico
                    </p>
                    <p>
                      {remote.videoCallAvailable ? "✓" : "○"} Videochiamata
                    </p>
                    <p>
                      {remote.delegationSupported ? "✓" : "○"} Gestione tramite
                      delega
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="mt-5">
                <RemoteOperationPlanCard plan={plan} compact />
              </div>

              {quote.additionalCosts ? (
                <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
                  <strong>Costi aggiuntivi:</strong> {quote.additionalCosts}
                </div>
              ) : null}

              <div className="mt-5 text-sm">
                <p>
                  <strong>Disponibilità:</strong> {quote.firstAvailability}
                </p>
                <p className="mt-2">
                  <strong>Tempi:</strong> {quote.estimatedDuration}
                </p>
              </div>

              <div className="mt-6 grid gap-3">
                {chosen ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                    <strong>Contatti sbloccati</strong>
                    <br />
                    +39 3•• ••• ••12
                    <br />
                    contatti@professionista.it
                  </div>
                ) : accepted ? (
                  <button
                    disabled
                    className="min-h-11 rounded-xl bg-slate-100 text-sm font-semibold text-slate-400"
                  >
                    Altra proposta scelta
                  </button>
                ) : (
                  <button
                    onClick={() => choose(quote.id)}
                    className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white"
                  >
                    Accetta preventivo
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-8">
        <ChatPanel
          leadId={leadId}
          contactsUnlocked={Boolean(accepted)}
          role="owner"
          ownerLanguage={lead.remoteContext.ownerLanguage}
        />
      </div>

      {accepted && acceptedPlan ? (
        <div className="mt-8 space-y-5">
          <RemoteOperationPlanCard plan={acceptedPlan} />
          <div className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
            <h2 className="font-semibold text-blue-950">Incarico creato</h2>
            <p className="mt-2 text-sm text-blue-800">
              Guimmia continuerà a monitorare passaggi, responsabilità,
              presenza e documenti fino alla conclusione del lavoro.
            </p>
            <Link
              href="/dashboard/professionals/jobs"
              className="mt-4 inline-flex font-semibold text-blue-700"
            >
              Gestisci incarico →
            </Link>
          </div>
        </div>
      ) : null}
    </Page>
  );
}

