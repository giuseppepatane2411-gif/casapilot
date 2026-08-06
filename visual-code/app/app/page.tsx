import Link from "next/link";

import Navbar from "@/components/Navbar";
import Hero from "@/components/home/Hero";

function HouseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-7 w-7">
      <path
        d="m3.5 10.5 8.5-7 8.5 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.5 9.5V21h13V9.5M9.5 21v-6h5v6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-7 w-7">
      <circle
        cx="8"
        cy="12"
        r="4.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="m12.2 10.4 8.3-4.9M16.1 8.1l1.7 2.8M18.5 6.7l1.6 2.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-7 w-7">
      <path
        d="M4 7.5h16A1.5 1.5 0 0 1 21.5 9v9A1.5 1.5 0 0 1 20 19.5H4A1.5 1.5 0 0 1 2.5 18V9A1.5 1.5 0 0 1 4 7.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8.5 7.5V5.8A1.8 1.8 0 0 1 10.3 4h3.4a1.8 1.8 0 0 1 1.8 1.8v1.7M2.5 12h19M10 12v1.8h4V12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-7 w-7">
      <path
        d="M4.5 5.5h15A1.5 1.5 0 0 1 21 7v9a1.5 1.5 0 0 1-1.5 1.5H10L5 21v-3.5h-.5A1.5 1.5 0 0 1 3 16V7a1.5 1.5 0 0 1 1.5-1.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M7.5 11.5h.01M12 11.5h.01M16.5 11.5h.01"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M4 10h11M11 6l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const steps = [
  [
    "1",
    "Parla con Pilot",
    "Descrivi liberamente ciò che vuoi fare con il tuo immobile.",
  ],
  [
    "2",
    "Pilot organizza",
    "Raccoglie le informazioni e ti fa soltanto le domande necessarie.",
  ],
  [
    "3",
    "Tu controlli",
    "Verifichi e correggi la bozza preparata da Pilot prima di salvarla.",
  ],
  [
    "4",
    "Attiva il percorso",
    "Quando serve, CasaPilot coinvolge professionisti compatibili della tua zona.",
  ],
];

export default function HomePage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-white text-slate-950">
        <Hero />

        <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
              Scegli come iniziare
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Un percorso per ogni obiettivo
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <article className="group flex flex-col rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <HouseIcon />
              </span>

              <h2 className="mt-6 text-2xl font-semibold tracking-tight">
                Vuoi vendere il tuo immobile?
              </h2>

              <p className="mt-3 flex-1 leading-7 text-slate-600">
                Descrivi il tuo immobile e racconta a Pilot qual è il tuo
                obiettivo. Pilot prepara il percorso, raccoglie le informazioni
                necessarie e, quando serve, ti mette in contatto con
                professionisti qualificati della tua zona.
              </p>

              <Link
                href="/dashboard/pilot?message=Vorrei%20vendere%20il%20mio%20immobile"
                className="mt-7 inline-flex items-center gap-2 font-semibold text-emerald-700"
              >
                Inizia con Pilot <ArrowIcon />
              </Link>
            </article>

            <article className="group flex flex-col rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50/80 to-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <KeyIcon />
              </span>

              <h2 className="mt-6 text-2xl font-semibold tracking-tight">
                Vuoi affittare il tuo immobile?
              </h2>

              <p className="mt-3 flex-1 leading-7 text-slate-600">
                Descrivi l’immobile e racconta a Pilot come vuoi affittarlo.
                Pilot prepara il percorso, organizza le informazioni necessarie
                e, quando serve, ti mette in contatto con professionisti
                qualificati della tua zona.
              </p>

              <Link
                href="/dashboard/pilot?message=Vorrei%20affittare%20il%20mio%20immobile"
                className="mt-7 inline-flex items-center gap-2 font-semibold text-amber-700"
              >
                Inizia con Pilot <ArrowIcon />
              </Link>
            </article>

            <article className="group flex flex-col rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                <BriefcaseIcon />
              </span>

              <h2 className="mt-6 text-2xl font-semibold tracking-tight">
                Fai crescere la tua attività con CasaPilot
              </h2>

              <p className="mt-3 flex-1 leading-7 text-slate-600">
                Ricevi richieste compatibili con i servizi che offri, prepara
                preventivi strutturati e gestisci clienti e incarichi da un
                unico spazio professionale.
              </p>

              <Link
                href="/registrazione/professionista"
                className="mt-7 inline-flex items-center gap-2 font-semibold text-blue-700"
              >
                Registra la tua attività <ArrowIcon />
              </Link>

              <p className="mt-4 text-sm text-slate-500">
                Nessun contatto casuale: opportunità coerenti con il tuo profilo.
              </p>
            </article>

            <article className="group flex flex-col rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50/80 to-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                <ChatIcon />
              </span>

              <h2 className="mt-6 text-2xl font-semibold tracking-tight">
                Parla con Pilot
              </h2>

              <p className="mt-3 flex-1 leading-7 text-slate-600">
                Non sai da dove iniziare? Descrivi liberamente la situazione.
                Pilot capirà cosa ti serve e ti farà una domanda alla volta.
              </p>

              <Link
                href="/dashboard/pilot"
                className="mt-7 inline-flex items-center gap-2 font-semibold text-violet-700"
              >
                Apri la chat <ArrowIcon />
              </Link>
            </article>
          </div>
        </section>

        <section
          id="come-funziona"
          className="scroll-mt-24 border-y border-slate-100 bg-slate-50/80"
        >
          <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
                Come funziona
              </p>

              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Da una conversazione nasce il percorso
              </h2>

              <p className="mt-4 text-lg leading-8 text-slate-600">
                Pilot non sostituisce le tue decisioni: prepara, organizza e ti
                mostra sempre cosa controllare.
              </p>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map(([number, title, description]) => (
                <article
                  key={number}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                    {number}
                  </span>

                  <h3 className="mt-5 font-semibold text-slate-950">{title}</h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
          <div className="grid gap-6 rounded-[2rem] border border-blue-100 bg-blue-50/60 p-7 sm:p-9 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-700">
                Per i professionisti
              </p>

              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                Porta la tua attività dentro CasaPilot
              </h2>

              <p className="mt-3 max-w-3xl leading-7 text-slate-600">
                Configura i servizi che offri e ricevi richieste coerenti con
                zona, capacità e specializzazione, senza mescolare il tuo spazio
                professionale con quello dei proprietari.
              </p>
            </div>

            <Link
              href="/professionals"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Scopri CasaPilot Pro
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
