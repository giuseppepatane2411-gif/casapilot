"use client";

import { CheckCircle } from "lucide-react";

type ConversationProps = {
  message?: string;
};

export default function Conversation({
  message = "",
}: ConversationProps) {
  return (
    <div className="mt-8 w-full max-w-3xl">

      {/* Messaggio utente */}

      {message && (
        <div className="mb-8 flex justify-end">
          <div className="max-w-xl rounded-3xl bg-blue-600 px-6 py-4 text-white shadow-lg">
            {message}
          </div>
        </div>
      )}

      {/* Risposta Pilot */}

      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">

        <p className="text-lg font-semibold text-slate-900">
          Perfetto.
        </p>

        <p className="mt-3 leading-8 text-slate-600">
          Ti accompagnerò passo dopo passo durante tutta la vendita del tuo
          immobile.
        </p>

        <div className="mt-8 flex items-center gap-3 rounded-2xl bg-emerald-50 p-4">
          <CheckCircle
            size={22}
            className="text-emerald-600"
          />

          <span className="font-medium text-emerald-700">
            Fascicolo dell'immobile creato.
          </span>
        </div>

        <div className="mt-10">
          <h3 className="font-semibold text-slate-900">
            Da dove vuoi iniziare?
          </h3>

          <div className="mt-5 flex flex-wrap gap-3">
            <button className="rounded-full border border-slate-300 px-5 py-2 transition hover:border-blue-600 hover:text-blue-600">
              Appartamento
            </button>

            <button className="rounded-full border border-slate-300 px-5 py-2 transition hover:border-blue-600 hover:text-blue-600">
              Villa
            </button>

            <button className="rounded-full border border-slate-300 px-5 py-2 transition hover:border-blue-600 hover:text-blue-600">
              Terreno
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}