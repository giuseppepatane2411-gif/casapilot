"use client";

import { useState } from "react";

export default function PilotPage() {
  const [step, setStep] = useState(0);

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-2xl w-full">

        <h1 className="text-4xl font-bold mb-2">
          👨‍✈️ Pilot
        </h1>

        <p className="text-slate-600 mb-10">
          Il tuo assistente immobiliare intelligente.
        </p>

        {step === 0 && (
          <>
            <h2 className="text-2xl font-semibold mb-6">
              Ciao! 👋
            </h2>

            <p className="mb-8">
              Ti aiuterò gratuitamente a preparare la tua pratica immobiliare.
              Da dove vuoi iniziare?
            </p>

            <div className="grid gap-4">

              <button
                onClick={() => setStep(1)}
                className="bg-blue-600 text-white rounded-xl p-4 hover:bg-blue-700"
              >
                🏠 Voglio affittare un immobile
              </button>

              <button
                className="border rounded-xl p-4"
              >
                💰 Voglio vendere un immobile
              </button>

              <button
                className="border rounded-xl p-4"
              >
                🔍 Sto cercando casa
              </button>

            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="text-2xl font-semibold mb-6">
              Perfetto!
            </h2>

            <p className="mb-6">
              L’immobile si trova in Italia?
            </p>

            <div className="flex gap-4">

              <button
                className="bg-blue-600 text-white rounded-xl px-6 py-3"
              >
                Sì
              </button>

              <button
                className="border rounded-xl px-6 py-3"
              >
                No
              </button>

            </div>
          </>
        )}

      </div>
    </main>
  );
}