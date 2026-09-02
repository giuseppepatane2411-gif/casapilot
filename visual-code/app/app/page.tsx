import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck2,
  FileCheck2,
  Handshake,
  House,
  KeyRound,
} from "lucide-react";

import PublicAgencyFooter from "@/components/agency/PublicAgencyFooter";
import PublicAgencyHeader from "@/components/agency/PublicAgencyHeader";
import GuimmiaFloatingGuide from "@/components/home/GuimmiaFloatingGuide";
import HomeIntroduction from "@/components/home/HomeIntroduction";
import { createPublicMetadata } from "@/lib/seo/metadata";

export const metadata = createPublicMetadata({
  title: "Guimmia | L’agenzia immobiliare digitale",
  description:
    "Vendi o affitta casa con Guimmia: annunci, documenti, visite, negoziazione e contratti in un unico percorso immobiliare digitale.",
  path: "/",
  absoluteTitle: true,
});

const serviceSteps = [
  {
    icon: FileCheck2,
    number: "01",
    title: "Prepariamo l’immobile",
    description:
      "Raccogliamo informazioni e documenti e individuiamo ciò che manca prima della pubblicazione.",
  },
  {
    icon: CalendarCheck2,
    number: "02",
    title: "Organizziamo contatti e visite",
    description:
      "L’annuncio, le richieste e gli appuntamenti restano ordinati in un unico percorso digitale.",
  },
  {
    icon: Handshake,
    number: "03",
    title: "Ti accompagniamo fino alla firma",
    description:
      "Agenti e professionisti intervengono nella negoziazione, nelle verifiche e nella contrattualistica.",
  },
];

export default function HomePage() {
  return (
    <>
      <PublicAgencyHeader />
      <main className="min-h-screen bg-white text-slate-950">
        <HomeIntroduction />

        <section
          id="come-funziona"
          className="scroll-mt-24 border-t border-slate-100 bg-white py-16 sm:py-20 lg:py-24"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.16em] text-blue-600">
                  Come funziona
                </p>
                <h2 className="mt-3 text-4xl font-black tracking-[-0.045em] sm:text-5xl">
                  Un percorso semplice, non un altro problema da gestire.
                </h2>
                <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
                  Puoi occuparti direttamente di appuntamenti e visite. Guimmia
                  mantiene ordinati dati, documenti e prossimi passaggi, con
                  l’assistenza dell’agenzia quando conta.
                </p>
              </div>

              <div className="grid gap-4">
                {serviceSteps.map(({ icon: Icon, number, title, description }) => (
                  <article
                    key={number}
                    className="grid gap-4 rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-[auto_1fr] sm:items-start"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <Icon size={22} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-600">
                        Passaggio {number}
                      </p>
                      <h3 className="mt-2 text-xl font-black text-slate-950">
                        {title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {description}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          id="per-il-tuo-immobile"
          className="border-t border-slate-200 bg-slate-50 py-16 sm:py-20 lg:py-24"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-blue-600">
                Per il tuo immobile
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.045em] sm:text-5xl">
                Tu conosci la casa. Noi sappiamo come accompagnarla sul mercato.
              </h2>
              <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
                Guimmia è un’agenzia immobiliare online che semplifica vendita e
                affitto, dalla preparazione dell’annuncio fino alla negoziazione e
                ai contratti.
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              <article className="group relative overflow-hidden rounded-[32px] bg-slate-950 p-7 text-white shadow-xl sm:p-10">
                <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-blue-600/30 blur-3xl" />
                <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-blue-200">
                  <House size={26} aria-hidden="true" />
                </span>
                <h3 className="relative mt-7 text-3xl font-black tracking-[-0.04em]">
                  Vuoi vendere casa?
                </h3>
                <p className="relative mt-4 max-w-xl leading-7 text-slate-300">
                  Prepariamo immobile, documentazione e annuncio, organizziamo le
                  visite e ti affianchiamo nella trattativa.
                </p>
                <Link
                  href="/vendere"
                  className="relative mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-slate-950 transition group-hover:bg-blue-100"
                >
                  Vendi con Guimmia <ArrowRight size={17} aria-hidden="true" />
                </Link>
              </article>

              <article className="group relative overflow-hidden rounded-[32px] border border-blue-100 bg-blue-50 p-7 shadow-xl shadow-blue-950/[0.04] sm:p-10">
                <div className="absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-blue-300/40 blur-3xl" />
                <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white">
                  <KeyRound size={26} aria-hidden="true" />
                </span>
                <h3 className="relative mt-7 text-3xl font-black tracking-[-0.04em] text-slate-950">
                  Vuoi mettere in affitto?
                </h3>
                <p className="relative mt-4 max-w-xl leading-7 text-slate-600">
                  Lungo termine, transitorio, studenti o turistico: costruiamo il
                  percorso adatto al tuo immobile.
                </p>
                <Link
                  href="/affittare"
                  className="relative mt-8 inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-black text-white transition group-hover:bg-blue-700"
                >
                  Affitta il tuo immobile <ArrowRight size={17} aria-hidden="true" />
                </Link>
              </article>
            </div>
          </div>
        </section>
      </main>
      <PublicAgencyFooter />
      <GuimmiaFloatingGuide />
    </>
  );
}
