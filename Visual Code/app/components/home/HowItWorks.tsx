import Link from "next/link";

export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Racconta a Pilot cosa vuoi fare",
      description:
        "Vendere, acquistare, affittare o gestire un immobile. Pilot capisce il tuo obiettivo e crea un percorso personalizzato.",
    },
    {
      number: "02",
      title: "Segui il percorso guidato",
      description:
        "Ti accompagnerà passo dopo passo, chiedendoti solo le informazioni necessarie e aiutandoti a completare ogni pratica.",
    },
    {
      number: "03",
      title: "Trova i professionisti giusti",
      description:
        "Quando servirà, Pilot ti metterà in contatto con agenti immobiliari, geometri, notai e altri professionisti verificati.",
    },
  ];

  return (
    <section className="bg-slate-50 py-24">
      <div className="mx-auto max-w-7xl px-6">

        <div className="text-center">
          <h2 className="text-4xl font-bold text-slate-900">
            Come funziona CasaPilot
          </h2>

          <p className="mt-6 text-lg text-slate-600">
            Un percorso semplice, guidato dall'intelligenza artificiale.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">

          {steps.map((step) => (
            <div
              key={step.number}
              className="rounded-3xl bg-white p-8 shadow-sm"
            >
              <div className="text-5xl font-extrabold text-blue-600">
                {step.number}
              </div>

              <h3 className="mt-6 text-2xl font-bold text-slate-900">
                {step.title}
              </h3>

              <p className="mt-4 leading-7 text-slate-600">
                {step.description}
              </p>
            </div>
          ))}

        </div>

        <div className="mt-16 text-center">
          <Link
            href="/dashboard"
            className="rounded-xl bg-blue-600 px-8 py-4 font-semibold text-white transition hover:bg-blue-700"
          >
            Prova Pilot
          </Link>
        </div>

      </div>
    </section>
  );
}