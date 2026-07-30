"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function CTASection() {
  return (
    <section className="bg-white px-4 pb-20 pt-8 sm:px-6 sm:pb-28 sm:pt-12 lg:px-8 lg:pb-36">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[30px] border border-slate-200 bg-slate-50 px-6 py-14 shadow-[0_24px_70px_rgba(15,23,42,0.06)] sm:rounded-[38px] sm:px-10 sm:py-18 lg:flex lg:items-center lg:justify-between lg:gap-14 lg:px-16 lg:py-20">
          {/* Decorazione */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-100/80 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-indigo-100/60 blur-3xl"
          />

          {/* Testo */}
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600 shadow-sm sm:text-sm">
              <Sparkles size={15} aria-hidden="true" />
              Inizia con CasaPilot
            </div>

            <h2 className="mt-6 text-3xl font-semibold leading-tight tracking-[-0.045em] text-slate-950 sm:text-4xl lg:text-5xl">
              Il tuo immobile merita un percorso più semplice.
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Organizza ogni fase, evita errori e trova il supporto giusto
              quando ne hai davvero bisogno.
            </p>

            <div className="mt-7 flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:flex-wrap sm:gap-x-6">
              <div className="flex items-center gap-2">
                <CheckCircle2
                  size={18}
                  className="text-blue-600"
                  aria-hidden="true"
                />
                Percorso personalizzato
              </div>

              <div className="flex items-center gap-2">
                <ShieldCheck
                  size={18}
                  className="text-blue-600"
                  aria-hidden="true"
                />
                Informazioni sempre organizzate
              </div>
            </div>
          </div>

          {/* Pulsante */}
          <div className="relative z-10 mt-10 shrink-0 lg:mt-0">
            <Link
              href="/dashboard/beta"
              className="
                group
                inline-flex
                min-h-14
                w-full
                items-center
                justify-center
                gap-3
                rounded-full
                bg-slate-950
                px-7
                text-base
                font-semibold
                text-white
                shadow-[0_16px_35px_rgba(15,23,42,0.20)]
                transition-all
                duration-300
                hover:-translate-y-0.5
                hover:bg-blue-600
                hover:shadow-[0_20px_45px_rgba(37,99,235,0.28)]
                sm:w-auto
              "
            >
              Prova la beta gratuita

              <ArrowRight
                size={20}
                className="transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>

            <p className="mt-3 text-center text-xs text-slate-500">
              Bastano meno di due minuti.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}