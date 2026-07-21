import { Bot, CheckCircle2 } from "lucide-react";

export default function PilotDemo() {
  return (
    <section className="mx-auto mt-24 max-w-4xl">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-100">

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white">
            <Bot size={22} />
          </div>

          <div>
            <h3 className="font-semibold text-slate-900">
              Pilot
            </h3>

            <p className="text-sm text-slate-500">
              Il tuo assistente immobiliare intelligente
            </p>
          </div>
        </div>

        <div className="space-y-6">

          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="font-medium text-slate-800">
              👤 Vorrei vendere casa.
            </p>
          </div>

          <div className="rounded-2xl bg-blue-50 p-6">

            <p className="text-slate-800">
              Perfetto.
            </p>

            <p className="mt-2 text-slate-800">
              Ti accompagnerò passo dopo passo durante tutta la vendita.
            </p>

            <div className="mt-5 flex items-center gap-2 text-green-600">
              <CheckCircle2 size={18} />
              <span className="font-medium">
                Fascicolo dell'immobile creato.
              </span>
            </div>

            <div className="mt-6">

              <p className="font-semibold text-slate-900">
                Da dove vuoi iniziare?
              </p>

              <div className="mt-4 flex flex-wrap gap-3">

                <button className="rounded-xl border px-4 py-2 hover:bg-white">
                  Appartamento
                </button>

                <button className="rounded-xl border px-4 py-2 hover:bg-white">
                  Villa
                </button>

                <button className="rounded-xl border px-4 py-2 hover:bg-white">
                  Terreno
                </button>

              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}