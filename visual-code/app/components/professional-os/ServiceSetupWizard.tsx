"use client";

import { useEffect, useMemo, useState } from "react";
import { findCategory, findService } from "@/lib/professionals/catalog";
import {
  createEmptyOffering,
  loadProfessionalState,
  saveOffering,
} from "@/lib/professional-os/repository";
import {
  getServicePolicy,
  professionCompatibility,
} from "@/lib/professional-os/service-policy";
import { offeringReadiness } from "@/lib/professional-os/readiness";
import {
  DELIVERY_MODE_LABELS,
  PRICING_MODE_LABELS,
  PROPERTY_TYPE_LABELS,
  URGENCY_LABELS,
  OWNER_PRESENCE_LABELS,
  REMOTE_EXECUTION_LABELS,
} from "@/lib/professional-os/labels";
import type {
  DeliveryMode,
  LeadUrgency,
  PricingMode,
  ProfessionalIdentity,
  PropertyType,
  ServiceOffering,
} from "@/lib/professional-os/types";
import type {
  OwnerPresenceRequirement,
  RemoteExecutionLevel,
} from "@/lib/remote-layer/types";
import {
  getRemoteServicePolicy,
  mergeRemoteConfiguration,
} from "@/lib/remote-layer/service-policy";
import {
  Badge,
  Breadcrumb,
  Button,
  EmptyState,
  Page,
  Panel,
  ProgressBar,
  ToggleCard,
} from "./ui";
import { Icon } from "./icons";

const STEPS = [
  "Idoneità",
  "Modalità e zona",
  "Gestione a distanza",
  "Richieste accettate",
  "Prezzi e capacità",
  "Competenze",
  "Conferma",
];

function toggle<T extends string>(values: T[], value: T) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

export default function ServiceSetupWizard({
  categoryId,
  serviceId,
}: {
  categoryId: string;
  serviceId: string;
}) {
  const service = findService(serviceId);
  const category = findCategory(categoryId);
  const policy = useMemo(
    () => (service ? getServicePolicy(service.id) : null),
    [service],
  );
  const remotePolicy = useMemo(
    () => (service ? getRemoteServicePolicy(service.id) : null),
    [service],
  );

  const [identity, setIdentity] =
    useState<ProfessionalIdentity | null>(null);
  const [offering, setOffering] =
    useState<ServiceOffering | null>(null);
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const state = loadProfessionalState();
    setIdentity(state.identity);

    if (state.identity && service) {
      setOffering(
        state.offerings.find(
          (item) => item.serviceId === service.id,
        ) ??
          createEmptyOffering(
            state.identity.id,
            service.id,
          ),
      );
    }
  }, [service]);

  if (!service || !category || !policy || !remotePolicy) {
    return (
      <Page>
        <EmptyState
          title="Servizio non trovato"
          description="La configurazione richiesta non è disponibile."
        />
      </Page>
    );
  }

  if (!identity || !offering) {
    return (
      <Page>
        <EmptyState
          title="Profilo professionale necessario"
          description="Completa prima il profilo professionale."
        />
      </Page>
    );
  }

  const compatibility = professionCompatibility(
    identity.profession,
    service.eligibleProfessions,
  );
  const readiness = offeringReadiness(offering, identity);
  const progress = Math.round(((step + 1) / STEPS.length) * 100);

  const update = <K extends keyof ServiceOffering>(
    key: K,
    value: ServiceOffering[K],
  ) => {
    setOffering((current) =>
      current ? { ...current, [key]: value } : current,
    );
  };

  const verificationSatisfied = (
    acceptedTypes: string[],
  ) =>
    identity.verificationItems.some(
      (item) =>
        acceptedTypes.includes(item.type) &&
        item.status === "verified",
    );

  const complete = () => {
    const nextStatus = !readiness.readyForActivation
      ? "draft"
      : policy.regulated ||
          compatibility === "requires_review"
        ? "pending_verification"
        : "active";

    saveOffering({
      ...offering,
      activationStatus: nextStatus,
      updatedAt: new Date().toISOString(),
    });
    setSaved(true);
  };

  if (saved) {
    return (
      <Page>
        <div className="mx-auto max-w-3xl">
          <Panel>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Icon name="check" className="h-7 w-7" />
            </div>
            <h1 className="mt-5 text-3xl font-semibold">
              Configurazione salvata
            </h1>
            <p className="mt-3 leading-7 text-slate-600">
              {policy.regulated ||
              compatibility === "requires_review"
                ? "Il servizio è stato inviato alla verifica. Guimmia non lo userà per assegnare lead finché i requisiti non saranno approvati."
                : "Il servizio è attivo. Guimmia può ora confrontare questi parametri con le nuove richieste."}
            </p>

            <div className="mt-6 rounded-2xl border border-slate-200 p-5">
              <ProgressBar
                value={readiness.score}
                label="Completezza configurazione"
              />
              <div className="mt-4 grid gap-2">
                {readiness.checks.map((check) => (
                  <p
                    key={check.id}
                    className={`text-sm ${
                      check.complete
                        ? "text-emerald-700"
                        : "text-amber-800"
                    }`}
                  >
                    {check.complete ? "✓" : "○"} {check.label}
                  </p>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={`/professionista/servizi/${category.id}`}
                className="inline-flex min-h-11 items-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
              >
                Torna alla cartella
              </a>
              <a
                href="/professionista/richieste"
                className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
              >
                Controlla le richieste
              </a>
            </div>
          </Panel>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <Breadcrumb
        href={`/professionista/servizi/${category.id}`}
        label={category.name}
      />

      <div className="mx-auto max-w-4xl">
        <div className="mb-5 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge tone={policy.regulated ? "warning" : "blue"}>
                {policy.regulated
                  ? "Servizio regolamentato"
                  : "Servizio non regolamentato"}
              </Badge>
              <Badge
                tone={
                  compatibility === "compatible"
                    ? "success"
                    : "warning"
                }
              >
                {compatibility === "compatible"
                  ? "Coerente con il profilo"
                  : "Idoneità da verificare"}
              </Badge>
            </div>
            <h1 className="mt-3 text-2xl font-semibold">
              {service.name}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {service.shortDescription}
            </p>
          </div>
          <div className="w-full sm:w-56">
            <ProgressBar
              value={progress}
              label={`Passaggio ${step + 1} di ${STEPS.length}`}
            />
          </div>
        </div>

        <Panel>
          <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
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
            <section>
              <h2 className="text-xl font-semibold">
                Guimmia deve poter verificare l’idoneità
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                La selezione non attiva automaticamente un servizio
                regolamentato. Guimmia controlla professione e documenti.
              </p>

              <div className="mt-6 rounded-2xl bg-slate-50 p-5">
                <p className="text-sm font-semibold">
                  Professione dichiarata
                </p>
                <p className="mt-1 text-slate-700">
                  {identity.profession}
                </p>
                <p className="mt-3 text-xs text-slate-500">
                  Professioni previste:{" "}
                  {service.eligibleProfessions.join(", ")}
                </p>
              </div>

              {policy.requirements.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {policy.requirements.map((requirement) => {
                    const complete = verificationSatisfied(
                      requirement.acceptedVerificationTypes,
                    );
                    return (
                      <div
                        key={requirement.id}
                        className={`rounded-2xl border p-5 ${
                          complete
                            ? "border-emerald-200 bg-emerald-50"
                            : requirement.required
                              ? "border-amber-200 bg-amber-50"
                              : "border-slate-200"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold">
                              {requirement.label}
                            </p>
                            {requirement.description ? (
                              <p className="mt-1 text-sm text-slate-600">
                                {requirement.description}
                              </p>
                            ) : null}
                          </div>
                          <Badge
                            tone={
                              complete
                                ? "success"
                                : requirement.required
                                  ? "warning"
                                  : "neutral"
                            }
                          >
                            {complete
                              ? "Verificato"
                              : requirement.required
                                ? "Obbligatorio"
                                : "Consigliato"}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
                  Non sono previsti requisiti professionali obbligatori
                  specifici. Restano valide le verifiche generali del profilo.
                </div>
              )}
            </section>
          ) : null}

          {step === 1 ? (
            <section>
              <h2 className="text-xl font-semibold">
                Come e dove offri questo servizio?
              </h2>
              <div className="mt-6">
                <p className="mb-3 text-sm font-semibold">
                  Modalità consentite
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {policy.allowedDeliveryModes.map((mode) => (
                    <ToggleCard
                      key={mode}
                      title={DELIVERY_MODE_LABELS[mode]}
                      selected={offering.deliveryModes.includes(mode)}
                      onClick={() =>
                        update(
                          "deliveryModes",
                          toggle<DeliveryMode>(
                            offering.deliveryModes,
                            mode,
                          ),
                        )
                      }
                    />
                  ))}
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 p-5">
                <ToggleCard
                  title="Usa le aree generali del profilo"
                  description={
                    identity.generalAreas.join(", ") ||
                    "Non hai impostato aree generali."
                  }
                  selected={offering.useGeneralAreas}
                  onClick={() =>
                    update(
                      "useGeneralAreas",
                      !offering.useGeneralAreas,
                    )
                  }
                />

                {!offering.useGeneralAreas ? (
                  <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_180px]">
                    <label>
                      <span className="mb-2 block text-sm font-semibold">
                        Aree specifiche
                      </span>
                      <input
                        value={offering.areas.join(", ")}
                        onChange={(event) =>
                          update(
                            "areas",
                            event.target.value
                              .split(",")
                              .map((item) => item.trim())
                              .filter(Boolean),
                          )
                        }
                        placeholder="Bologna, Imola..."
                        className="min-h-12 w-full rounded-xl border border-slate-200 px-4"
                      />
                    </label>
                    <label>
                      <span className="mb-2 block text-sm font-semibold">
                        Raggio massimo
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={offering.radiusKm ?? 0}
                        onChange={(event) =>
                          update(
                            "radiusKm",
                            Number(event.target.value) || 0,
                          )
                        }
                        className="min-h-12 w-full rounded-xl border border-slate-200 px-4"
                      />
                    </label>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          {step === 2 ? (
            <section>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">
                    Come può essere gestito a distanza?
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Guimmia parte da una policy coerente con il tipo di servizio.
                    Puoi confermarla o dichiarare una capacità diversa, senza
                    rendere il servizio una categoria separata.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => {
                    const recommended = mergeRemoteConfiguration(service.id);
                    setOffering((current) =>
                      current
                        ? {
                            ...current,
                            remoteExecutionLevel:
                              recommended.remoteExecutionLevel,
                            ownerPresenceRequirement:
                              recommended.ownerPresenceRequirement,
                            inspectionRequired:
                              recommended.inspectionRequired,
                            delegationSupported:
                              recommended.delegationSupported,
                            photoReportAvailable:
                              recommended.photoReportAvailable,
                            videoCallAvailable:
                              recommended.videoCallAvailable,
                            remoteFeasibility:
                              recommended.remoteFeasibility,
                            documentHandling:
                              recommended.documentHandling,
                            signatureMode: recommended.signatureMode,
                            localContactSufficient:
                              recommended.localContactSufficient,
                            ownerActionRequired:
                              recommended.ownerActionRequired,
                            remoteWorkflowSteps:
                              recommended.workflowSteps,
                          }
                        : current,
                    );
                  }}
                >
                  Applica parametri consigliati
                </Button>
              </div>

              <div className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 p-5 text-sm text-violet-900">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">Policy Guimmia del servizio</p>
                    <p className="mt-1 text-xs leading-5 text-violet-700">
                      Fattibilità: {remotePolicy.feasibility.replaceAll("_", " ")} ·
                      firma: {remotePolicy.signatureMode.replaceAll("_", " ")} ·
                      documenti: {remotePolicy.documentHandling.replaceAll("_", " ")}
                    </p>
                  </div>
                  <Badge tone={remotePolicy.inspectionRequired ? "warning" : "success"}>
                    {remotePolicy.inspectionRequired
                      ? "Sopralluogo previsto"
                      : "Nessun sopralluogo necessario"}
                  </Badge>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {remotePolicy.ownerActions.map((action) => (
                    <p key={action} className="rounded-xl bg-white/70 px-3 py-2 text-xs">
                      Azione proprietario: {action}
                    </p>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <p className="mb-3 text-sm font-semibold">
                  Livello dichiarato dal professionista
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(Object.keys(REMOTE_EXECUTION_LABELS) as RemoteExecutionLevel[]).map((level) => (
                    <ToggleCard
                      key={level}
                      title={REMOTE_EXECUTION_LABELS[level]}
                      selected={offering.remoteExecutionLevel === level}
                      onClick={() => update("remoteExecutionLevel", level)}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <p className="mb-3 text-sm font-semibold">
                  Presenza del proprietario
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {(Object.keys(OWNER_PRESENCE_LABELS) as OwnerPresenceRequirement[]).map((requirement) => (
                    <ToggleCard
                      key={requirement}
                      title={OWNER_PRESENCE_LABELS[requirement]}
                      selected={offering.ownerPresenceRequirement === requirement}
                      onClick={() => update("ownerPresenceRequirement", requirement)}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <ToggleCard
                  title="È necessario un sopralluogo"
                  description="Il professionista deve recarsi presso l'immobile, ma non necessariamente insieme al proprietario."
                  selected={offering.inspectionRequired}
                  onClick={() => update("inspectionRequired", !offering.inspectionRequired)}
                />
                <ToggleCard
                  title="Può essere gestito tramite delega"
                  selected={offering.delegationSupported}
                  onClick={() => update("delegationSupported", !offering.delegationSupported)}
                />
                <ToggleCard
                  title="Fornisco un report fotografico o video"
                  selected={offering.photoReportAvailable}
                  onClick={() => update("photoReportAvailable", !offering.photoReportAvailable)}
                />
                <ToggleCard
                  title="Videochiamata disponibile"
                  selected={offering.videoCallAvailable}
                  onClick={() => update("videoCallAvailable", !offering.videoCallAvailable)}
                />
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-semibold text-slate-950">
                  Come apparirà il flusso al proprietario
                </h3>
                <div className="mt-3 space-y-3">
                  {(offering.remoteWorkflowSteps ?? remotePolicy.steps).map((workflowStep, index) => (
                    <div
                      key={workflowStep.id}
                      className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-950">
                          {workflowStep.title}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-600">
                          {workflowStep.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm leading-6 text-blue-900">
                Un requisito di presenza diventa bloccante soltanto quando il
                proprietario non può essere presente e non esiste una soluzione
                valida tramite referente locale o delega.
              </div>
            </section>
          ) : null}

          {step === 3 ? (
            <section>
              <h2 className="text-xl font-semibold">
                Quali richieste vuoi ricevere?
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Questi sono filtri bloccanti, non semplici preferenze.
              </p>

              <div className="mt-6">
                <p className="mb-3 text-sm font-semibold">
                  Urgenze accettate
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    Object.keys(URGENCY_LABELS) as LeadUrgency[]
                  ).map((urgency) => (
                    <ToggleCard
                      key={urgency}
                      title={URGENCY_LABELS[urgency]}
                      selected={offering.acceptedUrgencies.includes(
                        urgency,
                      )}
                      onClick={() =>
                        update(
                          "acceptedUrgencies",
                          toggle<LeadUrgency>(
                            offering.acceptedUrgencies,
                            urgency,
                          ),
                        )
                      }
                    />
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <p className="mb-3 text-sm font-semibold">
                  Tipologie di immobili
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {policy.supportedPropertyTypes.map((propertyType) => (
                    <ToggleCard
                      key={propertyType}
                      title={PROPERTY_TYPE_LABELS[propertyType]}
                      selected={offering.propertyTypes.includes(
                        propertyType,
                      )}
                      onClick={() =>
                        update(
                          "propertyTypes",
                          toggle<PropertyType>(
                            offering.propertyTypes,
                            propertyType,
                          ),
                        )
                      }
                    />
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {step === 4 ? (
            <section>
              <h2 className="text-xl font-semibold">
                Prezzi, capacità e tempo di risposta
              </h2>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-semibold">
                    Modalità di prezzo
                  </span>
                  <select
                    value={offering.pricingMode}
                    onChange={(event) =>
                      update(
                        "pricingMode",
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
                    offering.vatIncluded
                      ? "IVA inclusa"
                      : "IVA esclusa"
                  }
                  selected={offering.vatIncluded}
                  onClick={() =>
                    update("vatIncluded", !offering.vatIncluded)
                  }
                />

                <label>
                  <span className="mb-2 block text-sm font-semibold">
                    Prezzo minimo indicativo
                  </span>
                  <input
                    type="number"
                    min={0}
                    disabled={
                      offering.pricingMode === "after_inspection"
                    }
                    value={offering.priceMin ?? ""}
                    onChange={(event) =>
                      update(
                        "priceMin",
                        event.target.value
                          ? Number(event.target.value)
                          : undefined,
                      )
                    }
                    className="min-h-12 w-full rounded-xl border border-slate-200 px-4 disabled:bg-slate-100"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-semibold">
                    Prezzo massimo
                  </span>
                  <input
                    type="number"
                    min={0}
                    disabled={offering.pricingMode !== "range"}
                    value={offering.priceMax ?? ""}
                    onChange={(event) =>
                      update(
                        "priceMax",
                        event.target.value
                          ? Number(event.target.value)
                          : undefined,
                      )
                    }
                    className="min-h-12 w-full rounded-xl border border-slate-200 px-4 disabled:bg-slate-100"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-semibold">
                    Lead massime a settimana
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={offering.weeklyCapacity}
                    onChange={(event) =>
                      update(
                        "weeklyCapacity",
                        Number(event.target.value) || 1,
                      )
                    }
                    className="min-h-12 w-full rounded-xl border border-slate-200 px-4"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-semibold">
                    Qualità minima lead
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={offering.minimumLeadQuality}
                    onChange={(event) =>
                      update(
                        "minimumLeadQuality",
                        Math.min(
                          100,
                          Number(event.target.value) || 0,
                        ),
                      )
                    }
                    className="min-h-12 w-full rounded-xl border border-slate-200 px-4"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-semibold">
                    Risposta prevista entro
                  </span>
                  <select
                    value={offering.responseSlaHours}
                    onChange={(event) =>
                      update(
                        "responseSlaHours",
                        Number(event.target.value),
                      )
                    }
                    className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4"
                  >
                    <option value={2}>2 ore</option>
                    <option value={6}>6 ore</option>
                    <option value={12}>12 ore</option>
                    <option value={24}>24 ore</option>
                    <option value={48}>48 ore</option>
                  </select>
                </label>

                <ToggleCard
                  title="Pausa automatica a capacità esaurita"
                  description="Evita di ricevere più lead di quante ne puoi gestire."
                  selected={offering.autoPauseWhenFull}
                  onClick={() =>
                    update(
                      "autoPauseWhenFull",
                      !offering.autoPauseWhenFull,
                    )
                  }
                />
              </div>
            </section>
          ) : null}

          {step === 5 ? (
            <section>
              <h2 className="text-xl font-semibold">
                Competenze, verifiche ed esclusioni
              </h2>

              <div className="mt-6">
                <p className="mb-3 text-sm font-semibold">
                  Competenze disponibili
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {policy.defaultCapabilities.map((capability) => (
                    <ToggleCard
                      key={capability.id}
                      title={capability.label}
                      description={capability.description}
                      selected={offering.capabilities.includes(
                        capability.label,
                      )}
                      onClick={() =>
                        update(
                          "capabilities",
                          toggle(
                            offering.capabilities,
                            capability.label,
                          ),
                        )
                      }
                    />
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <p className="mb-3 text-sm font-semibold">
                  Verifiche associate a questo servizio
                </p>
                {identity.verificationItems.length === 0 ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
                    Non hai ancora indicato documenti o abilitazioni nel
                    profilo.
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {identity.verificationItems.map((item) => (
                      <ToggleCard
                        key={item.id}
                        title={item.label}
                        description={`Stato: ${item.status}`}
                        selected={offering.verificationItemIds.includes(
                          item.id,
                        )}
                        onClick={() =>
                          update(
                            "verificationItemIds",
                            toggle(
                              offering.verificationItemIds,
                              item.id,
                            ),
                          )
                        }
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 grid gap-5">
                <label>
                  <span className="mb-2 block text-sm font-semibold">
                    Esclusioni
                  </span>
                  <textarea
                    value={offering.exclusions.join("\n")}
                    onChange={(event) =>
                      update(
                        "exclusions",
                        event.target.value
                          .split("\n")
                          .map((item) => item.trim())
                          .filter(Boolean),
                      )
                    }
                    rows={4}
                    placeholder="Una esclusione per riga: non opero su terreni; non accetto immobili occupati..."
                    className="w-full rounded-xl border border-slate-200 p-4"
                  />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-semibold">
                    Note interne per Guimmia
                  </span>
                  <textarea
                    value={offering.internalNotes}
                    onChange={(event) =>
                      update("internalNotes", event.target.value)
                    }
                    rows={4}
                    placeholder="Informazioni non pubbliche utili al matching."
                    className="w-full rounded-xl border border-slate-200 p-4"
                  />
                </label>
              </div>
            </section>
          ) : null}

          {step === 6 ? (
            <section>
              <h2 className="text-xl font-semibold">
                Controllo finale
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Guimmia utilizzerà soltanto dati confermati e servizi attivi.
              </p>

              <div className="mt-6 rounded-2xl border border-slate-200 p-5">
                <ProgressBar
                  value={readiness.score}
                  label="Completezza tecnica"
                />
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {readiness.checks.map((check) => (
                    <div
                      key={check.id}
                      className={`rounded-xl p-4 text-sm ${
                        check.complete
                          ? "bg-emerald-50 text-emerald-800"
                          : check.blocking
                            ? "bg-red-50 text-red-700"
                            : "bg-amber-50 text-amber-800"
                      }`}
                    >
                      <p className="font-semibold">
                        {check.complete ? "✓ " : "○ "}
                        {check.label}
                      </p>
                      {!check.complete && check.blocking ? (
                        <p className="mt-1 text-xs">
                          Necessario per attivare il matching.
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-blue-50 p-5 text-sm leading-6 text-blue-900">
                <strong>Stato previsto:</strong>{" "}
                {!readiness.readyForActivation
                  ? "Bozza, perché mancano requisiti bloccanti."
                  : policy.regulated ||
                      compatibility === "requires_review"
                    ? "In verifica, prima dell'attivazione."
                    : "Attivo nel matching di Guimmia."}
              </div>
            </section>
          ) : null}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-between">
            {step > 0 ? (
              <Button
                variant="secondary"
                onClick={() => setStep((value) => value - 1)}
              >
                Indietro
              </Button>
            ) : (
              <span />
            )}

            {step < STEPS.length - 1 ? (
              <Button
                disabled={
                  (step === 1 &&
                    offering.deliveryModes.length === 0) ||
                  (step === 2 &&
                    (!offering.remoteExecutionLevel ||
                      !offering.ownerPresenceRequirement)) ||
                  (step === 3 &&
                    (offering.acceptedUrgencies.length === 0 ||
                      offering.propertyTypes.length === 0))
                }
                onClick={() => setStep((value) => value + 1)}
              >
                Continua
              </Button>
            ) : (
              <Button onClick={complete}>
                Salva configurazione
              </Button>
            )}
          </div>
        </Panel>
      </div>
    </Page>
  );
}
