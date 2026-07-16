"use client";

import { CheckCircle } from "lucide-react";

type PilotConversationProps = {
  message: string;
};

export default function PilotConversation({
  message,
}: PilotConversationProps) {
  return (
    <div className="mt-14 w-full max-w-5xl">

      {/* Messaggio utente */}

      <div className="mb-8 flex justify-end">

        <div className="max-w-2xl rounded-[28px] bg-blue-600 px-7 py-5 text-lg text-white shadow-lg">

          {message}

        </div>

      </div>

      {/* Risposta Pilot */}

      <div className="rounded-[34px] border border-slate-200 bg-white p-10 shadow-[0_25px_70px_rgba(15,23,42,.08)]">

        <span className="text-sm font-semibold uppercase tracking-[0.20em] text-blue-600">
          CASAPILOT
        </span>

        <h2 className="mt-4 text-3xl font-semibold text-slate-900">
          Perfetto, iniziamo.
        </h2>

        <p className="mt-5 text-lg leading-8 text-slate-600">
          Ti accompagnerò durante tutta la procedura di vendita del tuo
          immobile. Ti farò poche domande mirate e creerò automaticamente il
          fascicolo della proprietà.
        </p>

        {/* Stato */}

        <div className="mt-10 rounded-3xl bg-emerald-50 p-6">

          <div className="flex items-center gap-4">

            <CheckCircle
              size={24}
              className="text-emerald-600"
            />

            <div>

              <p className="font-semibold text-emerald-700">
                Fascicolo creato
              </p>

              <p className="text-sm text-emerald-600">
                Tutti i dati verranno salvati automaticamente.
              </p>

            </div>

          </div>

        </div>

        {/* Domanda */}

        <div className="mt-12">

          <h3 className="text-xl font-semibold text-slate-900">
            Che tipo di immobile vuoi vendere?
          </h3>

          <div className="mt-6 flex flex-wrap gap-4">

            {[
              "Appartamento",
              "Villa",
              "Terreno",
              "Locale commerciale",
            ].map((item) => (
              <button
                key={item}
                className="
                  rounded-full
                  border
                  border-slate-300
                  bg-white
                  px-6
                  py-3
                  font-medium
                  transition-all
                  duration-300
                  hover:border-blue-600
                  hover:bg-blue-50
                  hover:text-blue-600
                "
              >
                {item}
              </button>
            ))}

          </div>

        </div>

      </div>

    </div>
  );
}