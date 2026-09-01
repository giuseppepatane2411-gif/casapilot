"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  PROFESSIONAL_CATEGORIES,
  availabilityLabel,
} from "@/lib/professionals/catalog";
import { Badge, Heading, Page } from "./ui";
import ProfessionalNav from "./ProfessionalNav";

export default function Hub() {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return PROFESSIONAL_CATEGORIES;
    return PROFESSIONAL_CATEGORIES.filter((category) =>
      [
        category.name,
        category.description,
        ...category.services.map((service) => service.name),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [search]);

  return (
    <Page>
      <ProfessionalNav />
      <Heading
        eyebrow="Servizi per il tuo immobile"
        title="Di che cosa hai bisogno?"
        description="Descrivi il risultato che vuoi ottenere. Guimmia prepara una richiesta chiara e ti mette in contatto soltanto con professionisti pertinenti."
      />

      <div className="mb-7 grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-blue-100 bg-blue-50 p-6">
          <p className="font-semibold text-blue-950">
            Il numero di telefono non è il prodotto. Il percorso verificato sì.
          </p>
          <p className="mt-2 text-sm leading-6 text-blue-800">
            Confronta offerte strutturate e sblocca i recapiti soltanto dopo
            avere scelto.
          </p>
        </div>
        <div className="rounded-3xl border border-violet-200 bg-violet-50 p-6">
          <p className="font-semibold text-violet-950">
            Gestisci l’immobile anche se sei lontano o parli poco italiano.
          </p>
          <p className="mt-2 text-sm leading-6 text-violet-800">
            Guimmia può tradurre la comunicazione, segnalare i servizi
            gestibili a distanza e preferire professionisti adatti alla tua
            situazione, senza creare un percorso separato.
          </p>
          <Link
            href="/dashboard/professionals/preferences"
            className="mt-4 inline-flex text-sm font-semibold text-violet-800"
          >
            Configura lingua e presenza →
          </Link>
        </div>
      </div>

      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Cerca planimetria, contratto, foto, pulizia, mutuo..."
        className="mb-7 min-h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((category) => (
          <Link
            key={category.id}
            href={`/dashboard/professionals/category/${category.id}`}
            className="group rounded-3xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg"
          >
            <div className="flex justify-between gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-2xl">
                {category.icon}
              </span>
              <Badge
                tone={
                  category.availabilityStatus === "active"
                    ? "success"
                    : category.availabilityStatus === "limited"
                      ? "warning"
                      : "neutral"
                }
              >
                {availabilityLabel(category.availabilityStatus)}
              </Badge>
            </div>
            <h2 className="mt-5 text-xl font-semibold text-slate-950">
              {category.name}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {category.description}
            </p>
            <p className="mt-5 text-sm font-semibold text-blue-600">
              {category.services.length} servizi →
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-3xl border border-dashed border-blue-300 bg-blue-50 p-6">
        <h2 className="font-semibold text-blue-950">
          Non sai che cosa scegliere?
        </h2>
        <p className="mt-2 text-sm text-blue-800">
          Descrivi il problema con parole tue, anche nella lingua che preferisci.
          Guimmia suggerirà il servizio e potrai correggerlo prima dell’invio.
        </p>
        <Link
          href="/dashboard/professionals/request"
          className="mt-4 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
        >
          Descrivi il problema
        </Link>
      </div>
    </Page>
  );
}
