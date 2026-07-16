"use client";

import {
  Bot,
  FileCheck2,
  Users,
  ArrowRight,
} from "lucide-react";

const steps = [
  {
    icon: Bot,
    title: "Parla con Pilot",
    description:
      "Descrivi quello che vuoi fare. Pilot comprende la tua situazione e crea il percorso più adatto.",
  },
  {
    icon: FileCheck2,
    title: "Pilot prepara tutto",
    description:
      "Documenti, controlli, scadenze e fascicolo dell'immobile vengono organizzati automaticamente.",
  },
  {
    icon: Users,
    title: "Coinvolgi i professionisti",
    description:
      "Quando serve, trovi notai, geometri, tecnici e agenti già verificati direttamente su CasaPilot.",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-36">

      <div className="mx-auto max-w-7xl px-6">

        {/* Heading */}

        <div className="mx-auto max-w-3xl text-center">

          <span className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">
            Come funziona
          </span>

          <h2 className="mt-6 text-5xl font-semibold tracking-[-0.04em] text-slate-950">
            Pilot lavora al posto tuo.
          </h2>

          <p className="mt-8 text-xl leading-9 text-slate-500">
            Ti accompagna passo dopo passo nella vendita o nell'affitto,
            eliminando dubbi, burocrazia e perdite di tempo.
          </p>

        </div>

        {/* Timeline */}

        <div className="relative mt-24">

          <div className="absolute left-0 right-0 top-10 hidden border-t border-dashed border-slate-300 lg:block" />

          <div className="grid gap-10 lg:grid-cols-3">

            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.title}
                  className="relative"
                >

                  {/* Numero */}

                  <div className="absolute -top-5 left-8 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shadow-lg">

                    {index + 1}

                  </div>

                  {/* Card */}

                  <div
                    className="
                      h-full
                      rounded-[34px]
                      border
                      border-slate-200
                      bg-white
                      p-10
                      shadow-[0_25px_70px_rgba(15,23,42,.05)]
                      transition-all
                      duration-500
                      hover:-translate-y-2
                      hover:shadow-[0_35px_90px_rgba(15,23,42,.10)]
                    "
                  >

                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">

                      <Icon
                        size={30}
                        className="text-blue-600"
                      />

                    </div>

                    <h3 className="mt-8 text-2xl font-semibold text-slate-950">

                      {step.title}

                    </h3>

                    <p className="mt-5 leading-8 text-slate-500">

                      {step.description}

                    </p>

                    <div className="mt-10 flex items-center font-semibold text-blue-600">

                      Continua

                      <ArrowRight
                        size={18}
                        className="ml-2"
                      />

                    </div>

                  </div>

                </div>
              );
            })}

          </div>

        </div>

      </div>

    </section>
  );
}