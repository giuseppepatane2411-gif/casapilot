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
  Sparkles,
  UserRoundCheck,
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

          <PrivacySection icon={Sparkles} title="Conversazioni con Guimmia">
            Le cartelle, le conversazioni e i messaggi della nuova area Guimmia vengono
            conservati nel cloud e collegati al tuo account, così puoi ritrovarli da altri
            dispositivi. Quando invii una domanda, il testo e il contesto recente necessario
            vengono trasmessi dal server di Guimmia a OpenAI, il fornitore del modello di
            intelligenza artificiale, per generare la risposta. Se colleghi una pratica, Guimmia può
            includere tipo di operazione, località e stato della checklist; indirizzo preciso, coordinate
            e riferimenti catastali non vengono inviati al modello in questo flusso. Non inserire dati personali o documenti di
            terzi se non sono indispensabili e non sei autorizzato a trattarli.
          </PrivacySection>

          <PrivacySection icon={UserRoundCheck} title="Richieste di verifica">
            Quando chiedi una verifica, Guimmia conserva la risposta selezionata, la tua nota,
            lo stato della richiesta e il collegamento all’eventuale pratica. L’invio registra una
            richiesta di assistenza: non assegna automaticamente un professionista e non costituisce
            da solo un incarico professionale.
          </PrivacySection>

          <PrivacySection icon={Cloud} title="Pratica privata dell’immobile">
            I dati completi dell’immobile e la checklist vengono collegati al tuo account e conservati
            in un’area privata. Indirizzo esatto, coordinate e dati catastali non vengono copiati nella
            scheda pubblica dell’annuncio. L’accesso alla pratica è limitato al proprietario autenticato
            e agli amministratori autorizzati di Guimmia.
          </PrivacySection>

          <PrivacySection icon={HardDrive} title="File e memoria sul dispositivo">
            I PDF e le immagini allegati all’Archivio locale restano in IndexedDB sul dispositivo
            utilizzato e non vengono trasferiti automaticamente nell’account. Alcune preferenze,
            bozze e memorie operative delle funzioni agenzia precedenti possono ancora restare nel browser.
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
            Puoi eliminare un immobile e la relativa pratica privata dalla sua pagina di gestione. Dalle
            Impostazioni puoi rimuovere separatamente bozze, preferenze, memoria e file conservati sul
            dispositivo. Puoi inoltre uscire dal tuo account.
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
            L’account identifica l’utente e protegge conversazioni, cartelle, immobili e checklist.
            Le domande inviate a Guimmia vengono elaborate da OpenAI, il fornitore del modello; i file
            dell’Archivio locale e alcune memorie delle funzioni agenzia restano invece sul dispositivo.
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
          Informativa tecnica di Guimmia · ultimo aggiornamento 7 settembre 2026
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
