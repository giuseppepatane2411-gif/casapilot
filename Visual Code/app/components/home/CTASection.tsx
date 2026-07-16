"use client";

import { ArrowUpRight } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-40">

      <div className="mx-auto max-w-7xl px-6">

        <div
          className="
            overflow-hidden
            rounded-[42px]
            bg-slate-950
            px-14
            py-24
            text-center
            shadow-[0_40px_120px_rgba(15,23,42,.25)]
          "
        >

          <span className="text-sm font-semibold uppercase tracking-[0.30em] text-blue-400">
            CASAPILOT
          </span>

          <h2 className="mx-auto mt-8 max-w-4xl text-6xl font-semibold leading-tight tracking-[-0.05em] text-white">

            Pronto a lasciare che
            <br />
            Pilot lavori per te?

          </h2>

          <p className="mx-auto mt-8 max-w-2xl text-xl leading-9 text-slate-400">

            Vendi o affitta il tuo immobile con una guida intelligente che ti
            accompagna dall'inizio alla firma.

          </p>

          {/* Barra */}

          <div className="mx-auto mt-16 flex max-w-3xl items-center rounded-full bg-white p-3">

            <input
              placeholder="Dimmi cosa vuoi fare..."
              className="
                flex-1
                bg-transparent
                px-8
                py-5
                text-lg
                text-slate-900
                placeholder:text-slate-400
                outline-none
              "
            />

            <button
              className="
                flex
                h-16
                w-16
                items-center
                justify-center
                rounded-full
                bg-blue-600
                text-white
                transition
                duration-300
                hover:scale-105
                hover:bg-blue-700
              "
            >
              <ArrowUpRight size={22} />
            </button>

          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-slate-400">

            <span>✓ Nessuna registrazione iniziale</span>

            <span>✓ Gratuito</span>

            <span>✓ Ti guida passo dopo passo</span>

          </div>

        </div>

      </div>

    </section>
  );
}