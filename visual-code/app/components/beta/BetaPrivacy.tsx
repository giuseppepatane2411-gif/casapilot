import Link from "next/link";
import {
  ArrowLeft,
  Database,
  Download,
  HardDrive,
  Info,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";

export default function BetaPrivacy() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-4xl">
        <Link
          href="/dashboard/beta"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-950"
        >
          <ArrowLeft size={17} />
          Torna a CasaPilot
        </Link>

        <header className="mt-7 rounded-[32px] bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/10 sm:p-10">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600">
            <ShieldCheck size={23} />
          </span>
          <p className="mt-6 text-sm font-semibold text-blue-300">Beta Zero-Cost v2 · Test Flight</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.05em] sm:text-5xl">
            Come vengono gestiti i dati in questa beta.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
            Questa versione è stata progettata per funzionare senza account, server, database o integrazioni a pagamento. Per questo i dati restano nel browser del dispositivo utilizzato.
          </p>
        </header>

        <div className="mt-7 space-y-5">
          <PrivacySection
            icon={HardDrive}
            title="Dove vengono salvate le informazioni"
          >
            Immobili, checklist, missioni, cronologia, sessioni di test e feedback vengono memorizzati nel localStorage. I file allegati nell’Archivio locale vengono conservati separatamente in IndexedDB. Nessuno di questi dati viene inviato automaticamente a CasaPilot o a servizi esterni.
          </PrivacySection>

          <PrivacySection
            icon={Database}
            title="Cosa non fa questa versione"
          >
            Non crea un account, non sincronizza i dati tra dispositivi, non carica documenti su un server e non utilizza OpenAI. La chat di Pilot OS usa risposte e regole locali già incluse nell’applicazione. L’Archivio locale permette di allegare file, ma soltanto all’interno del browser utilizzato.
          </PrivacySection>

          <PrivacySection
            icon={Download}
            title="Backup e trasferimento"
          >
            Dalle impostazioni puoi esportare un backup JSON con pratiche, checklist, memoria di Pilot e risultati dei test. I file PDF e le immagini dell’Archivio locale non sono inclusi nel backup: conserva sempre gli originali in un luogo sicuro. Anche il file JSON può contenere dati sensibili e non deve essere condiviso pubblicamente.
          </PrivacySection>

          <PrivacySection
            icon={RotateCcw}
            title="Cancellazione"
          >
            Puoi eliminare localStorage e Archivio locale dalla pagina Impostazioni. Anche la cancellazione dei dati del sito dalle impostazioni del browser rimuove pratiche, metriche e file allegati.
          </PrivacySection>

          <PrivacySection
            icon={Info}
            title="Limiti e responsabilità"
          >
            CasaPilot Beta è uno strumento sperimentale di organizzazione. Checklist, punteggi e suggerimenti non sostituiscono il parere di un notaio, tecnico, avvocato, commercialista o altro professionista abilitato. Prima di compiere operazioni immobiliari, verifica sempre obblighi e documenti applicabili al caso concreto.
          </PrivacySection>
        </div>

        <section className="mt-7 rounded-[28px] border border-blue-200 bg-blue-50 p-6 sm:p-7">
          <h2 className="text-xl font-bold text-slate-950">In sintesi</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            In questa beta i dati rimangono sul dispositivo, salvo quando scegli volontariamente di esportarli, copiarli o condividerli.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard/settings"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700"
            >
              Gestisci i dati locali
            </Link>
            <Link
              href="/dashboard/beta"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-blue-200 bg-white px-5 text-sm font-bold text-blue-700 hover:bg-blue-100"
            >
              Apri la beta
            </Link>
          </div>
        </section>

        <p className="mt-6 text-center text-xs leading-5 text-slate-400">
          Informativa tecnica della versione sperimentale · CasaPilot Beta Zero-Cost v2
        </p>
      </div>
    </main>
  );
}

function PrivacySection({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof ShieldCheck;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
          <Icon size={20} />
        </span>
        <div>
          <h2 className="text-xl font-bold text-slate-950">{title}</h2>
          <p className="mt-2 text-sm leading-7 text-slate-500">{children}</p>
        </div>
      </div>
    </section>
  );
}
