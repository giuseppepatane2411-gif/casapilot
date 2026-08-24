import Link from "next/link";
import PublicAgencyHeader from "@/components/agency/PublicAgencyHeader";
import PublicAgencyFooter from "@/components/agency/PublicAgencyFooter";

export default function AffittarePage() {
  return (
    <>
      <PublicAgencyHeader />
      <main>
        <section className="bg-gradient-to-br from-blue-50 via-white to-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <p className="text-sm font-black uppercase tracking-[.16em] text-blue-600">Affittare con Guimmia</p>
            <h1 className="mt-5 max-w-4xl text-5xl font-black tracking-[-.055em] text-slate-950 sm:text-7xl">
              Dall’annuncio al contratto, con Guimmia al tuo fianco.
            </h1>
            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-600">
              Organizza documenti, annuncio, richieste, visite, contratto e adempimenti in un unico percorso.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/valuta-immobile" className="rounded-2xl bg-blue-600 px-6 py-3.5 font-black text-white">Stima il canone</Link>
              <Link href="/registrazione/proprietario" className="rounded-2xl border border-slate-300 bg-white px-6 py-3.5 font-black text-slate-900">Affitta con Guimmia</Link>
              <Link href="/guimmia?intent=rent" className="rounded-2xl border border-slate-300 bg-white px-6 py-3.5 font-black text-slate-900">Parla con Guimmia</Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              ["Annuncio", "Guimmia organizza le informazioni e prepara la scheda dell'immobile."],
              ["Visite", "Richieste e appuntamenti restano ordinati in un unico flusso."],
              ["Contratto", "Guimmia ti ricorda cosa serve e quando coinvolgere il professionista adatto."],
            ].map(([t,d]) => (
              <div key={t} className="rounded-[28px] border border-slate-200 p-7">
                <h2 className="text-2xl font-black text-slate-950">{t}</h2>
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
