import Link from "next/link";

export default function RegistrationGatewayPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-12 text-slate-950 sm:px-8 lg:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Crea il tuo account</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Scegli lo spazio corretto per te</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">Proprietari e professionisti seguono percorsi separati, con dati e funzioni coerenti con il proprio ruolo.</p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <Link href="/registrazione/proprietario" className="group rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl">🏠</span>
            <h2 className="mt-6 text-2xl font-semibold">Sono proprietario o rappresento la proprietà</h2>
            <p className="mt-3 leading-7 text-slate-600">Per persone fisiche, società, holding, enti e altri soggetti intestatari o delegati alla gestione dell’immobile.</p>
            <span className="mt-7 inline-flex font-semibold text-emerald-700">Registrazione proprietario →</span>
          </Link>

          <Link href="/registrazione/professionista" className="group rounded-3xl border border-blue-100 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-2xl">💼</span>
            <h2 className="mt-6 text-2xl font-semibold">Sono un professionista o rappresento un’attività</h2>
            <p className="mt-3 leading-7 text-slate-600">Per liberi professionisti, studi, agenzie, imprese e società che offrono servizi immobiliari.</p>
            <span className="mt-7 inline-flex font-semibold text-blue-700">Registrazione professionista →</span>
          </Link>
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">Hai già un account? <Link href="/login" className="font-semibold text-blue-600">Accedi</Link></p>
      </div>
    </main>
  );
}
