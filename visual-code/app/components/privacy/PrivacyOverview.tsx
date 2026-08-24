import Link from "next/link";
import {
  ArrowLeft,
  Cloud,
  Database,
  Download,
  HardDrive,
  Info,
  MapPin,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";

export default function PrivacyOverview() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-950"
        >
          <ArrowLeft size={17} />
          Torna a Guimmia
        </Link>

        <header className="mt-7 rounded-[32px] bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/10 sm:p-10">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600">
            <ShieldCheck size={23} />
          </span>
          <p className="mt-6 text-sm font-semibold text-blue-300">Privacy e sicurezza</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.05em] sm:text-5xl">
            Come Guimmia gestisce le tue informazioni.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
            Guimmia separa i dati dell’account dalle informazioni della pratica.
            Questa pagina descrive in modo chiaro cosa viene salvato, dove e con quale finalità.
          </p>
        </header>

        <div className="mt-7 space-y-5">
          <PrivacySection icon={Cloud} title="Account Guimmia">
            Quando la registrazione è attiva, email, dati anagrafici e tipo di profilo
            vengono gestiti dall’infrastruttura sicura dell’account per autenticazione e accesso. I professionisti
            possono inserire dati di attività e abilitazione; lo stato di verifica viene gestito
            separatamente e non può essere attribuito autonomamente dall’utente.
          </PrivacySection>

          <PrivacySection icon={HardDrive} title="Pratiche e documenti sul dispositivo">
            Immobili, checklist, missioni e cronologia vengono attualmente conservati nel browser.
            I file allegati all’Archivio locale sono salvati in IndexedDB sul dispositivo utilizzato.
            Non vengono trasferiti automaticamente nell’account.
          </PrivacySection>

          <PrivacySection icon={MapPin} title="Ricerca indirizzi e mappa">
            Quando utilizzi i suggerimenti automatici, il testo necessario viene inviato ai servizi
            geografici usati da Guimmia per proporre Comuni, vie, CAP e coordinate. La mappa usa
            tasselli OpenStreetMap. Puoi sempre compilare l’indirizzo manualmente e scegliere il punto
            direttamente sulla mappa.
          </PrivacySection>

          <PrivacySection icon={Database} title="Guimmia e organizzazione della pratica">
            Guimmia utilizza i dati della pratica per ordinare priorità, documenti e prossimi passi.
            Le indicazioni sono informative e organizzative: non sostituiscono verifiche tecniche,
            fiscali o legali affidate a professionisti abilitati.
          </PrivacySection>

          <PrivacySection icon={Download} title="Backup e trasferimento">
            Dalle impostazioni puoi esportare un file JSON con pratiche, checklist e memoria di Guimmia.
            PDF e immagini dell’Archivio locale non sono inclusi: conserva sempre gli originali in un
            luogo sicuro. Anche il backup JSON può contenere dati sensibili e non deve essere condiviso
            pubblicamente.
          </PrivacySection>

          <PrivacySection icon={RotateCcw} title="Cancellazione">
            Puoi eliminare i dati locali dalla pagina Impostazioni. Puoi inoltre uscire dal tuo account.
            La cancellazione definitiva dell’account remoto richiederà una procedura dedicata di verifica
            dell’identità prima della rimozione.
          </PrivacySection>

          <PrivacySection icon={Info} title="Responsabilità professionali">
            Checklist, punteggi e suggerimenti aiutano a organizzare il lavoro, ma non sostituiscono il
            parere di notaio, tecnico, avvocato, commercialista o altro professionista abilitato. Prima
            di concludere un’operazione verifica sempre gli obblighi applicabili al caso concreto.
          </PrivacySection>
        </div>

        <section className="mt-7 rounded-[28px] border border-blue-200 bg-blue-50 p-6 sm:p-7">
          <h2 className="text-xl font-bold text-slate-950">In sintesi</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            L’account identifica l’utente; le pratiche e i file restano sul dispositivo in questa
            configurazione. I servizi geografici ricevono soltanto le informazioni necessarie quando
            scegli di usare la ricerca automatica.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard/settings"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white hover:bg-blue-600"
            >
              Gestisci i dati
              <Download size={16} />
            </Link>
            <Link
              href="/register"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-blue-200 bg-white px-5 text-sm font-bold text-blue-700 hover:bg-blue-100"
            >
              Crea un account
            </Link>
          </div>
        </section>

        <p className="mt-8 text-center text-xs text-slate-400">
          Informativa tecnica di Guimmia · ultimo aggiornamento agosto 2026
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
  icon: typeof HardDrive;
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

