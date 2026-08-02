import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  CheckCircle2,
  FileCheck2,
  MapPin,
  Users,
} from "lucide-react";

import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Professionisti",
  description: "Entra nella rete professionale CasaPilot.",
};

const benefits = [
  {
    icon: MapPin,
    title: "Richieste pertinenti",
    description:
      "Il profilo indica competenze e area operativa, così le richieste possono essere collegate al professionista adatto.",
  },
  {
    icon: FileCheck2,
    title: "Profilo verificabile",
    description:
      "Abilitazioni e dati professionali restano separati dalla semplice registrazione e possono essere controllati prima della pubblicazione.",
  },
  {
    icon: Users,
    title: "Dentro il percorso",
    description:
      "Il professionista viene coinvolto quando la pratica mostra una necessità concreta, non attraverso pubblicità generica.",
  },
];

export default function ProfessionalsPage() {
  return (
    <>
      <Navbar />
      <main className="bg-white px-4 pb-24 pt-6 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-7xl overflow-hidden rounded-[34px] bg-slate-950 px-6 py-14 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)] sm:px-10 lg:grid lg:grid-cols-[1fr_0.72fr] lg:items-center lg:gap-16 lg:px-16 lg:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-blue-200">
              <Briefcase size={15} />
              Rete professionale CasaPilot
            </span>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight tracking-[-0.05em] sm:text-6xl">
              Il tuo lavoro, nel momento in cui serve davvero.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Crea un profilo professionale, indica competenze e territorio e gestisci in modo trasparente il percorso di verifica prima della pubblicazione nella rete.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register?type=professional"
                className="group inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-blue-600 px-7 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500"
              >
                Crea il profilo professionale
                <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-14 items-center justify-center rounded-full border border-white/15 bg-white/10 px-7 text-sm font-bold text-white hover:bg-white/15"
              >
                Accedi
              </Link>
            </div>
          </div>

          <div className="mt-10 rounded-[30px] border border-white/10 bg-white/8 p-6 lg:mt-0">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600">
              <BadgeCheck size={22} />
            </span>
            <h2 className="mt-5 text-2xl font-bold">Registrazione e verifica sono separate.</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Chiunque può richiedere un profilo professionale. La visibilità come professionista verificato richiede controlli successivi su identità, attività e abilitazioni.
            </p>
            <div className="mt-6 space-y-3 text-sm text-slate-200">
              <p className="flex items-center gap-3">
                <CheckCircle2 size={17} className="text-emerald-300" />
                Profilo personale protetto
              </p>
              <p className="flex items-center gap-3">
                <CheckCircle2 size={17} className="text-emerald-300" />
                Categoria e zona di lavoro
              </p>
              <p className="flex items-center gap-3">
                <CheckCircle2 size={17} className="text-emerald-300" />
                Stato di verifica non modificabile dall’utente
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-16 max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-blue-600">Perché entrare nella rete</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-950 sm:text-5xl">
              Un profilo costruito intorno alle pratiche reali.
            </h2>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <article key={benefit.title} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <Icon size={22} />
                  </span>
                  <h3 className="mt-5 text-xl font-bold text-slate-950">{benefit.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-500">{benefit.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mx-auto mt-16 flex max-w-7xl flex-col items-start justify-between gap-6 rounded-[30px] border border-blue-100 bg-blue-50 p-7 sm:p-10 lg:flex-row lg:items-center">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
              <Building2 size={22} />
            </span>
            <div>
              <h2 className="text-2xl font-bold text-slate-950">Sei un professionista immobiliare?</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                Registrati indicando professione, attività e territorio. Dal tuo spazio personale potrai completare la scheda, inviarla per la verifica e scegliere quando renderla visibile.
              </p>
            </div>
          </div>
          <Link
            href="/register?type=professional"
            className="inline-flex min-h-13 shrink-0 items-center justify-center gap-2 rounded-full bg-slate-950 px-7 text-sm font-bold text-white hover:bg-blue-600"
          >
            Registrati
            <ArrowRight size={17} />
          </Link>
        </section>
      </main>
    </>
  );
}
