import Link from "next/link";

const benefits = [
  ["Richieste compatibili", "Guimmia filtra prima i requisiti indispensabili e ti mostra le opportunità coerenti con servizi, zona e disponibilità."],
  ["Preventivi più chiari", "Prepara offerte strutturate, confrontabili e facili da comprendere per il proprietario."],
  ["Contatti protetti", "La prima conversazione resta dentro Guimmia e i recapiti si sbloccano soltanto dopo l’accettazione."],
  ["Attività organizzata", "Gestisci servizi, richieste, preventivi, messaggi e incarichi da un unico spazio professionale."],
];

export default function ProfessionalsLandingPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="border-b border-slate-100 bg-gradient-to-b from-blue-50/80 to-white">
        <div className="mx-auto max-w-6xl px-5 py-16 text-center sm:px-8 lg:py-24">
          <span className="inline-flex rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm">Guimmia per professionisti</span>
          <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">Trasforma le tue competenze in opportunità realmente compatibili.</h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-600">Registra la tua attività, configura i servizi che offri e lascia che Guimmia selezioni le richieste più adatte. Meno contatti casuali, più tempo per il lavoro che sai fare bene.</p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/registrazione/professionista" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-600 px-7 py-3 font-semibold text-white shadow-sm hover:bg-blue-700">Registra la tua attività</Link>
            <Link href="/professionista" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-7 py-3 font-semibold text-slate-700 shadow-sm hover:border-blue-200 hover:text-blue-700">Accedi a Guimmia Pro</Link>
          </div>
          <p className="mt-4 text-sm text-slate-500">Il profilo professionale è sempre separato dall’area del proprietario.</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 lg:py-20">
        <div className="grid gap-5 sm:grid-cols-2">
          {benefits.map(([title, description], index) => (
            <article key={title} className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 font-bold text-blue-700">{index + 1}</span>
              <h2 className="mt-5 text-xl font-semibold">{title}</h2>
              <p className="mt-3 leading-7 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Come inizi</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Un profilo chiaro, poi i singoli servizi.</h2>
              <p className="mt-4 leading-7 text-slate-600">Guimmia non ti chiede se sei “privato o professionista” dentro il percorso professionale. Scegli soltanto come è organizzata la tua attività.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
                <h3 className="font-semibold">Professionista individuale</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Per chi opera personalmente come libero professionista o autonomo.</p>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
                <h3 className="font-semibold">Impresa, studio o società</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Per agenzie, studi associati, imprese e società di servizi.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-14 text-center sm:px-8 lg:py-20">
        <div className="rounded-[2rem] bg-slate-950 px-6 py-12 text-white sm:px-10">
          <h2 className="text-3xl font-semibold tracking-tight">Il tuo prossimo incarico può iniziare da una richiesta migliore.</h2>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-300">Configura ciò che fai, dove lavori e quanta capacità hai. Guimmia userà queste informazioni per evitare opportunità inutili.</p>
          <Link href="/registrazione/professionista" className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-500 px-7 py-3 font-semibold text-white hover:bg-blue-400">Crea il profilo professionale</Link>
        </div>
      </section>
    </main>
  );
}

