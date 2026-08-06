"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { findCategory } from "@/lib/professionals/catalog";
import { loadProfessionalState } from "@/lib/professional-os/repository";
import {
  getServicePolicy,
  professionCompatibility,
} from "@/lib/professional-os/service-policy";
import { offeringReadiness } from "@/lib/professional-os/readiness";
import {
  OFFERING_STATUS_LABELS,
} from "@/lib/professional-os/labels";
import type {
  ProfessionalIdentity,
  ServiceOffering,
} from "@/lib/professional-os/types";
import {
  Badge,
  Breadcrumb,
  EmptyState,
  Heading,
  LinkButton,
  Page,
  ProgressBar,
} from "./ui";
import { Icon } from "./icons";

export default function ServiceCategory({
  categoryId,
}: {
  categoryId: string;
}) {
  const category = findCategory(categoryId);
  const [identity, setIdentity] =
    useState<ProfessionalIdentity | null>(null);
  const [offerings, setOfferings] = useState<ServiceOffering[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<
    "all" | "compatible" | "configured" | "regulated"
  >("all");

  useEffect(() => {
    const state = loadProfessionalState();
    setIdentity(state.identity);
    setOfferings(state.offerings);
  }, []);

  const services = useMemo(() => {
    if (!category || !identity) return [];

    return category.services.filter((service) => {
      const query = search.trim().toLowerCase();
      const matchesQuery =
        !query ||
        `${service.name} ${service.shortDescription}`
          .toLowerCase()
          .includes(query);

      const offering = offerings.find(
        (item) => item.serviceId === service.id,
      );
      const policy = getServicePolicy(service.id);
      const compatibility = professionCompatibility(
        identity.profession,
        service.eligibleProfessions,
      );

      const matchesFilter =
        filter === "all" ||
        (filter === "compatible" &&
          compatibility === "compatible") ||
        (filter === "configured" && Boolean(offering)) ||
        (filter === "regulated" && policy.regulated);

      return matchesQuery && matchesFilter;
    });
  }, [category, filter, identity, offerings, search]);

  if (!category) {
    return (
      <Page>
        <EmptyState
          title="Cartella non trovata"
          description="La categoria richiesta non esiste."
        />
      </Page>
    );
  }

  if (!identity) {
    return (
      <Page>
        <EmptyState
          title="Profilo non configurato"
          description="Completa prima il profilo professionale."
          action={
            <LinkButton href="/professionista/onboarding">
              Configura il profilo
            </LinkButton>
          }
        />
      </Page>
    );
  }

  return (
    <Page>
      <Breadcrumb
        href="/professionista/servizi"
        label="Portfolio dei servizi"
      />
      <Heading
        eyebrow="Cartella professionale"
        title={`${category.icon} ${category.name}`}
        description="Seleziona soltanto i servizi che puoi svolgere realmente. Quelli regolamentati richiedono verifica prima di entrare nel matching."
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_auto]">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cerca un servizio in questa cartella..."
          className="min-h-13 rounded-xl border border-slate-200 bg-white px-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />
        <div className="flex flex-wrap gap-2">
          {([
            ["all", "Tutti"],
            ["compatible", "Coerenti col profilo"],
            ["configured", "Configurati"],
            ["regulated", "Regolamentati"],
          ] as const).map(([value, label]) => (
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
      </div>

      <div className="space-y-4">
        {services.map((service) => {
          const offering = offerings.find(
            (item) => item.serviceId === service.id,
          );
          const policy = getServicePolicy(service.id);
          const compatibility = professionCompatibility(
            identity.profession,
            service.eligibleProfessions,
          );
          const readiness = offering
            ? offeringReadiness(offering, identity)
            : null;

          return (
            <article
              key={service.id}
              className="rounded-3xl border border-slate-200 bg-white p-6"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap gap-2">
                    {offering ? (
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
                        {
                          OFFERING_STATUS_LABELS[
                            offering.activationStatus
                          ]
                        }
                      </Badge>
                    ) : (
                      <Badge>Non configurato</Badge>
                    )}

                    <Badge
                      tone={
                        compatibility === "compatible"
                          ? "blue"
                          : "warning"
                      }
                    >
                      {compatibility === "compatible"
                        ? "Coerente col profilo"
                        : "Richiede controllo"}
                    </Badge>

                    {policy.regulated ? (
                      <Badge tone="warning">Servizio regolamentato</Badge>
                    ) : null}
                  </div>

                  <h2 className="mt-3 text-lg font-semibold">
                    {service.name}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {service.shortDescription}
                  </p>
                  <p className="mt-3 text-xs leading-5 text-slate-500">
                    Professioni compatibili:{" "}
                    {service.eligibleProfessions.join(", ")}
                  </p>

                  {policy.requirements.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {policy.requirements.map((requirement) => (
                        <span
                          key={requirement.id}
                          className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800"
                        >
                          {requirement.required ? "Obbligatorio: " : ""}
                          {requirement.label}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {readiness ? (
                    <div className="mt-5 max-w-md">
                      <ProgressBar
                        value={readiness.score}
                        label="Completezza servizio"
                      />
                    </div>
                  ) : null}
                </div>

                <Link
                  href={`/professionista/servizi/${category.id}/${service.id}`}
                  className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
                >
                  {offering ? "Modifica configurazione" : "Configura servizio"}
                  <Icon name="arrow" className="h-4 w-4" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </Page>
  );
}
