import Link from "next/link";
import PublicAgencyHeader from "@/components/agency/PublicAgencyHeader";
import PublicAgencyFooter from "@/components/agency/PublicAgencyFooter";

const steps = [
  ["1", "Prepariamo l'immobile", "Dati, documenti, prezzo, fotografie e professionisti quando servono."],
  ["2", "Guimmia crea l'annuncio", "Un Listing Master unico, pronto per essere distribuito sui portali."],
  ["3", "Gestiamo richieste e visite", "Lead ordinati, agenda visite e prossimo passo sempre chiaro."],
  ["4", "Documenti, offerte e firma", "Proposte, preliminare, contratti e adempimenti seguono un percorso guidato con Guimmia."],
];

export default function VenderePage() {
  return (
    <>
      <PublicAgencyHeader />
      <main>
        <section className="bg-slate-950 text-white">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <p className="text-sm font-black uppercase tracking-[.16em] text-blue-300">Vendere con Guimmia</p>
            <h1 className="mt-5 max-w-4xl text-5xl font-black tracking-[-.055em] sm:text-7xl">
              Vendi casa senza affrontare tutto da solo.
            </h1>
            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-300">
              Annuncio, burocrazia, richieste, visite, offerte e contratti in un unico percorso, con Guimmia disponibile 24/7.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/valuta-immobile" className="rounded-2xl bg-blue-600 px-6 py-3.5 font-black text-white">Valuta il tuo immobile</Link>
              <Link href="/registrazione/proprietario" className="rounded-2xl border border-white/20 px-6 py-3.5 font-black text-white">Inizia il percorso</Link>
              <Link href="/guimmia?intent=sell" className="rounded-2xl border border-white/20 px-6 py-3.5 font-black text-white">Parla con Guimmia</Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-5 md:grid-cols-2">
            {steps.map(([n,t,d]) => (
              <div key={n} className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-black text-white">{n}</div>
                <h2 className="mt-5 text-2xl font-black text-slate-950">{t}</h2>
                <p className="mt-3 leading-7 text-slate-600">{d}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <PublicAgencyFooter />
    </>
  );
}
