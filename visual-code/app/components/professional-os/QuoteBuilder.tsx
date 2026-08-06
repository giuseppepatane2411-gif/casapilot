"use client";

import { useEffect, useState } from "react";
import { findService } from "@/lib/professionals/catalog";
import {
  loadProfessionalState,
  saveQuote,
} from "@/lib/professional-os/repository";
import { getServicePolicy } from "@/lib/professional-os/service-policy";
import {
  PRICING_MODE_LABELS,
} from "@/lib/professional-os/labels";
import type {
  LeadRequest,
  PricingMode,
  ProfessionalIdentity,
  ServiceOffering,
} from "@/lib/professional-os/types";
import {
  Breadcrumb,
  Button,
  EmptyState,
  LinkButton,
  Page,
  Panel,
  ProgressBar,
  ToggleCard,
} from "./ui";

const STEPS = ["Prezzo", "Contenuto", "Tempi", "Controllo"];

export default function QuoteBuilder({ leadId }: { leadId: string }) {
  const [lead, setLead] = useState<LeadRequest | null>(null);
  const [identity, setIdentity] =
    useState<ProfessionalIdentity | null>(null);
  const [offering, setOffering] =
    useState<ServiceOffering | null>(null);
  const [step, setStep] = useState(0);
  const [priceType, setPriceType] =
    useState<PricingMode>("fixed");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [vatIncluded, setVatIncluded] = useState(true);
  const [included, setIncluded] = useState("");
  const [excluded, setExcluded] = useState("");
  const [additionalCosts, setAdditionalCosts] = useState("");
  const [availability, setAvailability] = useState("");
  const [duration, setDuration] = useState("");
  const [validityDays, setValidityDays] = useState(10);
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const state = loadProfessionalState();
    const currentLead = state.leads.find(
      (item) => item.id === leadId,
    );
    const currentOffering = state.offerings.find(
      (item) => item.serviceId === currentLead?.serviceId,
    );

    setLead(currentLead ?? null);
    setIdentity(state.identity);
    setOffering(currentOffering ?? null);

    if (currentOffering) {
      setPriceType(currentOffering.pricingMode);
      setPriceMin(
        currentOffering.priceMin?.toString() ?? "",
      );
      setPriceMax(
        currentOffering.priceMax?.toString() ?? "",
      );
      setVatIncluded(currentOffering.vatIncluded);
    }
  }, [leadId]);

  if (!lead || !identity || !offering) {
    return (
      <Page>
        <EmptyState
          title="Preventivo non disponibile"
          description="La lead o il servizio professionale non risultano configurati."
        />
      </Page>
    );
  }

  const service = findService(lead.serviceId);
  const policy = getServicePolicy(lead.serviceId);
  const progress = Math.round(((step + 1) / STEPS.length) * 100);

  const submit = () => {
    saveQuote({
      leadId,
      professionalId: identity.id,
      offeringId: offering.id,
      priceType,
      priceMin: Number(priceMin) || 0,
      priceMax: priceMax ? Number(priceMax) : undefined,
      vatIncluded,
      includedItems: included
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      excludedItems: excluded
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      additionalCosts,
      firstAvailability: availability,
      estimatedDuration: duration,
      validityDays,
      message,
      status: "sent",
    });
    setSaved(true);
  };

  if (saved) {
    return (
      <Page>
        <div className="mx-auto max-w-3xl">
          <Panel>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl text-emerald-700">
              ✓
            </div>
            <h1 className="mt-5 text-3xl font-semibold">
              Preventivo inviato
            </h1>
            <p className="mt-3 leading-7 text-slate-600">
              L’utente lo vedrà in una schermata comparativa. I recapiti restano
              protetti fino all’accettazione.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <LinkButton href="/professionista/preventivi">
                Vai ai preventivi
              </LinkButton>
              <LinkButton
                href="/professionista/richieste"
                variant="secondary"
              >
                Torna alle richieste
              </LinkButton>
            </div>
          </Panel>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <Breadcrumb
        href={`/professionista/richieste/${lead.id}`}
        label="Torna alla lead"
      />

      <div className="mx-auto max-w-4xl">
        <Panel>
          <div className="grid gap-5 sm:grid-cols-[1fr_220px] sm:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                Preventivo strutturato
              </p>
              <h1 className="mt-2 text-2xl font-semibold">
                {service?.name}
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                I campi seguono il modello previsto per questo servizio.
              </p>
            </div>
            <ProgressBar
              value={progress}
              label={`Passaggio ${step + 1} di ${STEPS.length}`}
            />
          </div>

          <div className="mt-6 flex gap-2 overflow-x-auto">
            {STEPS.map((label, index) => (
              <span
                key={label}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
                  index === step
                    ? "bg-blue-600 text-white"
                    : index < step
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                }`}
              >
                {index < step ? "✓ " : ""}
                {label}
              </span>
            ))}
          </div>

          {step === 0 ? (
            <section className="mt-8">
              <h2 className="text-xl font-semibold">
                Prezzo chiaro e confrontabile
              </h2>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-semibold">
                    Modalità
                  </span>
                  <select
                    value={priceType}
                    onChange={(event) =>
                      setPriceType(
                        event.target.value as PricingMode,
                      )
                    }
                    className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4"
                  >
                    {(
                      Object.keys(
                        PRICING_MODE_LABELS,
                      ) as PricingMode[]
                    ).map((mode) => (
                      <option key={mode} value={mode}>
                        {PRICING_MODE_LABELS[mode]}
                      </option>
                    ))}
                  </select>
                </label>
                <ToggleCard
                  title={
                    vatIncluded
                      ? "IVA inclusa"
                      : "IVA esclusa"
                  }
                  selected={vatIncluded}
                  onClick={() =>
                    setVatIncluded((value) => !value)
                  }
                />
                <label>
                  <span className="mb-2 block text-sm font-semibold">
                    Importo minimo
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={priceMin}
                    onChange={(event) =>
                      setPriceMin(event.target.value)
                    }
                    className="min-h-12 w-full rounded-xl border border-slate-200 px-4"
                  />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-semibold">
                    Importo massimo
                  </span>
                  <input
                    type="number"
                    min={0}
                    disabled={priceType !== "range"}
                    value={priceMax}
                    onChange={(event) =>
                      setPriceMax(event.target.value)
                    }
                    className="min-h-12 w-full rounded-xl border border-slate-200 px-4 disabled:bg-slate-100"
                  />
                </label>
              </div>
            </section>
          ) : null}

          {step === 1 ? (
            <section className="mt-8">
              <h2 className="text-xl font-semibold">
                Che cosa comprende la proposta?
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Modello previsto: {policy.quoteTemplate.join(" · ")}
              </p>
              <div className="mt-6 grid gap-5">
                <label>
                  <span className="mb-2 block text-sm font-semibold">
                    Attività comprese — una per riga
                  </span>
                  <textarea
                    value={included}
                    onChange={(event) =>
                      setIncluded(event.target.value)
                    }
                    rows={6}
                    className="w-full rounded-xl border border-slate-200 p-4"
                  />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-semibold">
                    Attività escluse — una per riga
                  </span>
                  <textarea
                    value={excluded}
                    onChange={(event) =>
                      setExcluded(event.target.value)
                    }
                    rows={4}
                    className="w-full rounded-xl border border-slate-200 p-4"
                  />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-semibold">
                    Possibili costi aggiuntivi
                  </span>
                  <textarea
                    value={additionalCosts}
                    onChange={(event) =>
                      setAdditionalCosts(event.target.value)
                    }
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 p-4"
                  />
                </label>
              </div>
            </section>
          ) : null}

          {step === 2 ? (
            <section className="mt-8">
              <h2 className="text-xl font-semibold">
                Tempi e validità
              </h2>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-semibold">
                    Prima disponibilità
                  </span>
                  <input
                    value={availability}
                    onChange={(event) =>
                      setAvailability(event.target.value)
                    }
                    placeholder="Tra 3 giorni"
                    className="min-h-12 w-full rounded-xl border border-slate-200 px-4"
                  />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-semibold">
                    Durata stimata
                  </span>
                  <input
                    value={duration}
                    onChange={(event) =>
                      setDuration(event.target.value)
                    }
                    placeholder="Consegna entro 5 giorni"
                    className="min-h-12 w-full rounded-xl border border-slate-200 px-4"
                  />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-semibold">
                    Validità in giorni
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={validityDays}
                    onChange={(event) =>
                      setValidityDays(
                        Number(event.target.value) || 1,
                      )
                    }
                    className="min-h-12 w-full rounded-xl border border-slate-200 px-4"
                  />
                </label>
                <label className="sm:col-span-2">
                  <span className="mb-2 block text-sm font-semibold">
                    Messaggio personale
                  </span>
                  <textarea
                    value={message}
                    onChange={(event) =>
                      setMessage(event.target.value)
                    }
                    rows={4}
                    className="w-full rounded-xl border border-slate-200 p-4"
                  />
                </label>
              </div>
            </section>
          ) : null}

          {step === 3 ? (
            <section className="mt-8">
              <h2 className="text-xl font-semibold">
                Controllo prima dell’invio
              </h2>
              <div className="mt-6 rounded-2xl border border-slate-200 p-6">
                <p className="text-3xl font-semibold">
                  {priceType === "starting_from" ? "Da " : ""}
                  {priceMin || "0"} €
                  {priceType === "range" && priceMax
                    ? ` – ${priceMax} €`
                    : ""}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {vatIncluded
                    ? "IVA inclusa"
                    : "IVA esclusa"}
                </p>

                <h3 className="mt-6 font-semibold">
                  Compreso
                </h3>
                <ul className="mt-2 space-y-2 text-sm text-slate-600">
                  {included
                    .split("\n")
                    .filter(Boolean)
                    .map((item) => (
                      <li key={item}>✓ {item}</li>
                    ))}
                </ul>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-semibold">
                      Prima disponibilità
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {availability || "Non indicata"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">
                      Durata stimata
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {duration || "Non indicata"}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-between">
            {step > 0 ? (
              <Button
                variant="secondary"
                onClick={() =>
                  setStep((value) => value - 1)
                }
              >
                Indietro
              </Button>
            ) : (
              <span />
            )}

            {step < STEPS.length - 1 ? (
              <Button
                disabled={
                  (step === 0 && !priceMin) ||
                  (step === 1 &&
                    included.trim().length === 0) ||
                  (step === 2 &&
                    (!availability.trim() ||
                      !duration.trim()))
                }
                onClick={() =>
                  setStep((value) => value + 1)
                }
              >
                Continua
              </Button>
            ) : (
              <Button onClick={submit}>
                Invia preventivo
              </Button>
            )}
          </div>
        </Panel>
      </div>
    </Page>
  );
}
