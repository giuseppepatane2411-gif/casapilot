"use client";

import { useState } from "react";
import { sellFlow } from "@/lib/flows/sell";

export default function Conversation() {
  const [selected, setSelected] = useState("");
  const [stepIndex, setStepIndex] = useState(0);
  const currentStep = sellFlow[stepIndex];
  const progress = Math.round(((stepIndex + 1) / sellFlow.length) * 100);

  return (
    <div className="rounded-3xl bg-white p-8 shadow-xl">

      <div className="mb-8">

        <p className="text-sm font-semibold text-blue-600">
          PILOT
        </p>
        <div className="mt-4">

  <div className="flex justify-between text-sm text-slate-500">

    <span>Avanzamento pratica</span>

    <span>{progress}%</span>

  </div>

  <div className="mt-2 h-2 rounded-full bg-slate-200">

    <div
      className="h-2 rounded-full bg-blue-600 transition-all duration-500"
      style={{ width: `${progress}%` }}
    />

  </div>

</div>

        <h2 className="mt-2 text-3xl font-bold text-slate-900">
          👋 Ottima scelta.
        </h2>

        <p className="mt-5 text-lg leading-8 text-slate-600">
          Ti accompagnerò passo dopo passo nella vendita del tuo immobile.

          <br /><br />

          Per iniziare...

          <br />

          {currentStep.question}
        </p>

      </div>

      <div className="grid gap-4 md:grid-cols-2">

        {[
          "🏢 Appartamento",
          "🏡 Villa",
          "🏘️ Casa indipendente",
          "🏬 Locale commerciale",
          "🌳 Terreno",
          "➕ Altro",
        ].map((item) => (

          <button
            key={item}
            onClick={() => {
  setSelected(item);

  setTimeout(() => {
    if (stepIndex < sellFlow.length - 1) {
      setStepIndex(stepIndex + 1);
    }
  }, 500);
}}
            className={`rounded-2xl border p-6 text-left transition ${
              selected === item
                ? "border-blue-600 bg-blue-50"
                : "border-slate-200 hover:border-blue-500"
            }`}
          >
            {item}
          </button>

        ))}

      </div>

      {selected && (

        <div className="mt-8 rounded-2xl bg-blue-50 p-6">

          <p className="font-semibold text-blue-700">
            Hai selezionato:
          </p>

          <p className="mt-2 text-xl font-bold">
            {selected}
          </p>

          <p className="mt-5 text-slate-600">
            Nella prossima versione Pilot inizierà subito la conversazione
            facendoti domande personalizzate.
          </p>

        </div>

      )}

    </div>
  );
}