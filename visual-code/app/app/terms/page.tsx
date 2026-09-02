import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileCheck2, Info, Scale, ShieldCheck } from "lucide-react";
import { createPublicMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPublicMetadata({
  title: "Condizioni d’uso",
  description: "Condizioni generali per l’utilizzo di Guimmia.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-950">
          <ArrowLeft size={17} />
          Torna a Guimmia
        </Link>

        <header className="mt-7 rounded-[32px] bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/10 sm:p-10">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600">
            <Scale size={23} />
          </span>
          <p className="mt-6 text-sm font-semibold text-blue-300">Condizioni d’uso</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.05em] sm:text-5xl">Regole chiare per usare Guimmia.</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
            L’utilizzo del servizio comporta l’accettazione delle condizioni riportate in questa pagina.
          </p>
        </header>

        <div className="mt-7 space-y-5">
          <TermSection icon={FileCheck2} title="Finalità del servizio">
            Guimmia aiuta a organizzare dati, documenti, attività e prossimi passi relativi a immobili e operazioni immobiliari. Le informazioni fornite hanno carattere organizzativo e informativo.
          </TermSection>
          <TermSection icon={Info} title="Limiti delle indicazioni">
            Guimmia, checklist e punteggi non sostituiscono pareri, certificazioni o verifiche di professionisti abilitati. L’utente resta responsabile della correttezza dei dati inseriti e delle decisioni assunte.
          </TermSection>
          <TermSection icon={ShieldCheck} title="Account e sicurezza">
            L’utente deve fornire dati veritieri, custodire le credenziali e segnalare accessi non autorizzati. I professionisti non possono dichiararsi verificati autonomamente: la verifica è un processo separato.
          </TermSection>
          <TermSection icon={Scale} title="Uso corretto">
            È vietato utilizzare Guimmia per attività illecite, per impersonare terzi, caricare contenuti non autorizzati o tentare di aggirare le misure di sicurezza del servizio.
          </TermSection>
        </div>

        <section className="mt-7 rounded-[28px] border border-blue-200 bg-blue-50 p-6 sm:p-7">
          <h2 className="text-xl font-bold text-slate-950">Documenti collegati</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Consulta anche l’informativa privacy per capire come vengono gestiti account, pratiche, documenti e servizi geografici.
          </p>
          <Link href="/privacy" className="mt-5 inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white hover:bg-blue-600">
            Leggi l’informativa privacy
          </Link>
        </section>

        <p className="mt-8 text-center text-xs text-slate-400">Condizioni d’uso Guimmia · versione 1 agosto 2026</p>
      </div>
    </main>
  );
}

function TermSection({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Scale;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Icon size={20} />
        </span>
        <div>
          <h2 className="text-xl font-bold text-slate-950">{title}</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">{children}</p>
        </div>
      </div>
    </section>
  );
}
