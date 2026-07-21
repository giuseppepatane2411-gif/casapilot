import Conversation from "@/components/pilot/Conversation";

export default function SellPage() {
  return (
    <main className="min-h-screen bg-slate-100 py-12 px-6">
      <div className="mx-auto w-full max-w-5xl">

        {/* INTRODUZIONE DI PILOT */}

        <div className="mb-10 rounded-3xl bg-white p-10 shadow-xl">
          <p className="text-sm font-semibold text-blue-600">
            PILOT
          </p>

          <h1 className="mt-2 text-4xl font-bold text-slate-900">
            👋 Ottima scelta.
          </h1>

          <p className="mt-6 text-lg leading-8 text-slate-600">
            Ti accompagnerò passo dopo passo fino alla vendita del tuo immobile.
            <br />
            <br />
            Per iniziare ho bisogno di conoscerlo.
            Ti serviranno meno di 3 minuti.
          </p>
        </div>

        {/* CONVERSAZIONE */}

        <Conversation message="Ciao! Iniziamo. Qual è l'indirizzo dell'immobile che desideri vendere?" />

      </div>
    </main>
  );
}