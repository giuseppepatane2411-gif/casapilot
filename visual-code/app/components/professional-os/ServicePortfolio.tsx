"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PROFESSIONAL_CATEGORIES } from "@/lib/professionals/catalog";
import { loadProfessionalState } from "@/lib/professional-os/repository";
import {
  categoryPolicySummary,
  professionCompatibility,
} from "@/lib/professional-os/service-policy";
import { offeringReadiness } from "@/lib/professional-os/readiness";
import type {
  ProfessionalIdentity,
  ServiceOffering,
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

export default function ServicePortfolio() {
  const [identity, setIdentity] =
    useState<ProfessionalIdentity | null>(null);
  const [offerings, setOfferings] = useState<ServiceOffering[]>([]);

  useEffect(() => {
    const state = loadProfessionalState();
    setIdentity(state.identity);
    setOfferings(state.offerings);
  }, []);

  const stats = useMemo(() => {
    if (!identity) {
      return { configured: 0, active: 0, pending: 0, ready: 0 };
    }

    const readiness = offerings.map((offering) =>
      offeringReadiness(offering, identity),
    );

    return {
      configured: offerings.length,
      active: offerings.filter((offering) =>
        ["active", "limited"].includes(offering.activationStatus),
      ).length,
      pending: offerings.filter(
        (offering) =>
          offering.activationStatus === "pending_verification",
      ).length,
      ready: readiness.filter((item) => item.readyForActivation).length,
    };
  }, [identity, offerings]);

  if (!identity) {
    return (
      <Page>
        <Heading
          eyebrow="Portfolio professionale"
          title="Servizi offerti"
          description="Prima completiamo l'identità professionale; poi configuriamo ogni servizio."
        />
        <EmptyState
          title="Profilo professionale non configurato"
          description="Pilot non può valutare compatibilità e requisiti senza sapere chi sei e dove operi."
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
      <Heading
        eyebrow="Il motore di Pilot"
        title="Portfolio dei servizi"
        description="Ogni cartella contiene i servizi della categoria. Ciascuno possiede requisiti, copertura, capacità, prezzo, SLA, presenza richiesta e livello di gestione a distanza."
        action={
          <LinkButton href="/professionista/profilo" variant="secondary">
            Controlla il profilo
          </LinkButton>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Servizi configurati" value={stats.configured} />
        <StatCard label="Attivi nel matching" value={stats.active} />
        <StatCard label="In verifica" value={stats.pending} />
        <StatCard label="Pronti tecnicamente" value={stats.ready} />
      </div>

      <Panel className="mt-6 border-blue-200 bg-blue-50">
        <div className="flex gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600">
            <Icon name="pilot" className="h-6 w-6" />
          </span>
          <div>
            <h2 className="font-semibold text-blue-950">
              Pilot non usa più soltanto il nome della professione
            </h2>
            <p className="mt-2 text-sm leading-6 text-blue-800">
              Prima applica i requisiti bloccanti del singolo servizio. Poi
              considera lingua e gestione a distanza come elementi di compatibilità
              e distribuisce la lead ai migliori candidati in due ondate, senza
              superare il numero massimo scelto dall’utente.
            </p>
          </div>
        </div>
      </Panel>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {PROFESSIONAL_CATEGORIES.map((category) => {
          const categoryOfferings = offerings.filter((offering) =>
            category.services.some(
              (service) => service.id === offering.serviceId,
            ),
          );
          const active = categoryOfferings.filter((offering) =>
            ["active", "limited"].includes(offering.activationStatus),
          ).length;
          const summary = categoryPolicySummary(category.id);
          const compatibleServices = category.services.filter(
            (service) =>
              professionCompatibility(
                identity.profession,
                service.eligibleProfessions,
              ) === "compatible",
          ).length;
          const averageReadiness =
            categoryOfferings.length > 0
              ? Math.round(
                  categoryOfferings.reduce(
                    (total, offering) =>
                      total +
                      offeringReadiness(offering, identity).score,
                    0,
                  ) / categoryOfferings.length,
                )
              : 0;

          return (
            <Link
              key={category.id}
              href={`/professionista/servizi/${category.id}`}
              className="group rounded-3xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-950/5"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
                  {category.icon}
                </span>
                <Badge tone={active > 0 ? "success" : "neutral"}>
                  {active} attivi
                </Badge>
              </div>

              <h2 className="mt-5 text-xl font-semibold">
                {category.name}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {category.description}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="font-semibold text-slate-900">
                    {category.services.length}
                  </p>
                  <p className="mt-1 text-slate-500">servizi totali</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="font-semibold text-slate-900">
                    {compatibleServices}
                  </p>
                  <p className="mt-1 text-slate-500">
                    coerenti col profilo
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="font-semibold text-slate-900">
                    {summary?.regulatedCount ?? 0}
                  </p>
                  <p className="mt-1 text-slate-500">regolamentati</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="font-semibold text-slate-900">
                    {categoryOfferings.length}
                  </p>
                  <p className="mt-1 text-slate-500">configurati</p>
                </div>
              </div>

              {categoryOfferings.length > 0 ? (
                <div className="mt-5">
                  <ProgressBar
                    value={averageReadiness}
                    label="Completezza media"
                  />
                </div>
              ) : null}

              <p className="mt-5 flex items-center justify-end gap-2 text-sm font-semibold text-blue-600">
                Apri cartella
                <Icon name="arrow" className="h-4 w-4" />
              </p>
            </Link>
          );
        })}
      </div>
    </Page>
  );
}
