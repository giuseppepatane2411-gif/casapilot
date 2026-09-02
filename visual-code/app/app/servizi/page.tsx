import PublicAgencyHeader from "@/components/agency/PublicAgencyHeader";
import PublicAgencyFooter from "@/components/agency/PublicAgencyFooter";
import { createPublicMetadata } from "@/lib/seo/metadata";

export const metadata = createPublicMetadata({
  title: "Servizi immobiliari digitali",
  description:
    "Scopri i servizi Guimmia per vendita e affitto: valutazione, annuncio, documenti, visite, professionisti, negoziazione e contratti.",
  path: "/servizi",
});

const services = [
  ["Preparazione immobile", "Raccolta dati, checklist documenti, valutazione, foto e professionisti quando servono."],
  ["Annuncio", "Titolo, descrizione, caratteristiche, vetrina Guimmia e distribuzione portali."],
  ["Lead e visite", "Richieste, agenda, reminder e follow-up dentro la stessa pratica."],
  ["Documenti e contratti", "Proposte, accettazioni, preliminari, locazioni, allegati e versioni."],
  ["Burocrazia", "Task, scadenze, registrazioni e controlli durante la pratica."],
  ["Guimmia 24/7", "Una guida AI contestuale che conosce immobile, fase e documenti della pratica."],
];

export default function ServiziPage() {
  return (
    <>
      <PublicAgencyHeader />
      <main className="bg-slate-50">
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <p className="text-sm font-black uppercase tracking-[.16em] text-blue-600">Cosa fa Guimmia</p>
          <h1 className="mt-4 max-w-5xl text-5xl font-black tracking-[-.055em] text-slate-950 sm:text-7xl">Meno burocrazia. Più controllo. Un solo percorso.</h1>
          <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-600">Guimmia non vende soltanto pubblicazione online: semplifica l’intera operazione immobiliare.</p>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {services.map(([title, description]) => (
              <div key={title} className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
                <h2 className="text-2xl font-black text-slate-950">{title}</h2>
                <p className="mt-3 leading-7 text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <PublicAgencyFooter />
    </>
  );
}
