"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import { ArrowRight, ArrowUp, FileSearch, FilePenLine, FolderKanban, Gauge, Menu, MessageSquareText, ScrollText, X } from "lucide-react";
import Logo from "@/components/brand/Logo";
import { buildAuthPath, safeNextPath } from "@/lib/navigation/auth-flow";
import SmartphoneChatPreview from "./SmartphoneChatPreview";
import styles from "./GuimmiaHome.module.css";

const productTools = [
  { icon: MessageSquareText, title: "Una risposta chiara", description: "Capisci termini, passaggi e possibilità. Parti dal tuo caso, anche se non sai da dove cominciare.", prompt: "Ho una domanda sull’immobiliare italiano. Aiutami a inquadrare il caso e dimmi quali informazioni ti servono.", focus: "GENERAL" },
  { icon: FileSearch, title: "Documenti, senza confusione", description: "Prepara la checklist, organizza i documenti e individua i punti da approfondire.", href: "/dashboard/documents", protected: true },
  { icon: FilePenLine, title: "L’annuncio giusto per la tua casa", description: "Dalle caratteristiche dell’immobile a una bozza di annuncio chiara, completa e da personalizzare.", prompt: "Aiutami a scrivere un annuncio immobiliare. Raccogli prima i dati reali dell’immobile, senza inventare caratteristiche.", focus: "LISTING" },
  { icon: ScrollText, title: "Una prima bozza, guidata", description: "Imposta messaggi, clausole e bozze di contratto. I dati mancanti e le verifiche restano in evidenza.", prompt: "Devo preparare una bozza immobiliare. Chiedimi il tipo di operazione e i dati indispensabili prima di scriverla.", focus: "CONTRACT" },
  { icon: Gauge, title: "Un punto di partenza sul valore", description: "Avvia una stima orientativa per la vendita o l’affitto, partendo dai dati del tuo immobile.", href: "/valuta-immobile", protected: false },
  { icon: FolderKanban, title: "Il tuo caso, tutto in ordine", description: "Collega la conversazione a una pratica e ritrova dati, checklist e prossimi passi.", href: "/dashboard/properties/new", protected: true },
] as const;

const steps = [
  { title: "Racconta cosa ti serve", text: "Una domanda, un dubbio o un progetto. Scrivi con parole tue: Guimmia ti aiuta a mettere a fuoco il caso." },
  { title: "Fai chiarezza", text: "Ricevi una risposta organizzata, le informazioni da raccogliere e un prossimo passo concreto." },
  { title: "Continua da dove eri rimasto", text: "Conserva le chat nel tuo account, organizzale in cartelle e collegale alla pratica quando il lavoro prende forma." },
] as const;

export default function GuimmiaAIHome({ authenticated }: { authenticated: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [focus, setFocus] = useState("GENERAL");
  const [menuOpen, setMenuOpen] = useState(false);
  const [entryError, setEntryError] = useState("");
  const menuButton = useRef<HTMLButtonElement>(null);

  function protectedHref(href: string) {
    return authenticated ? href : buildAuthPath("/register", { next: href, accountType: "private" });
  }
  function openAssistant(question: string, selectedFocus = focus) {
    const trimmed = question.trim();
    if (!trimmed) return;
    const params = new URLSearchParams({ message: trimmed });
    if (selectedFocus !== "GENERAL") params.set("focus", selectedFocus);
    const destination = "/ai?" + params.toString();
    if (!authenticated && !safeNextPath(destination, "")) {
      setEntryError("La domanda è troppo lunga per il passaggio all’accesso. Accorciala un poco: il testo resta qui.");
      return;
    }
    setEntryError("");
    router.push(protectedHref(destination));
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    openAssistant(message);
  }

  return (
    <div className={styles.home}>
      <a href="#contenuto" className={styles.skipLink}>Vai al contenuto</a>
      <header className={styles.header} onKeyDown={(event) => {
        if (event.key === "Escape" && menuOpen) { setMenuOpen(false); menuButton.current?.focus(); }
      }}>
        <div className={`${styles.container} ${styles.headerInner}`}>
          <Logo compact />
          <nav className={styles.desktopNav} aria-label="Navigazione principale">
            <Link href="#strumenti">Cosa puoi fare</Link><Link href="#come-funziona">Come funziona</Link>
          </nav>
          <div className={styles.headerActions}>
            {!authenticated && <Link className={styles.login} href={buildAuthPath("/login", { next: "/ai" })}>Accedi</Link>}
            <Link className={styles.primaryButton} href={protectedHref("/ai")}>{authenticated ? "Apri la chat" : "Inizia a parlare"}<ArrowRight size={17} aria-hidden="true" /></Link>
            <button ref={menuButton} className={styles.menuButton} type="button" aria-label={menuOpen ? "Chiudi il menu" : "Apri il menu"} aria-expanded={menuOpen} aria-controls="home-menu" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}
            </button>
          </div>
        </div>
        {menuOpen && <nav id="home-menu" className={styles.mobileNav} aria-label="Navigazione mobile">
          <Link href="#strumenti" onClick={() => setMenuOpen(false)}>Cosa puoi fare</Link>
          <Link href="#come-funziona" onClick={() => setMenuOpen(false)}>Come funziona</Link>
          {!authenticated && <Link href={buildAuthPath("/login", { next: "/ai" })}>Accedi al tuo account</Link>}
        </nav>}
      </header>
      <main id="contenuto" tabIndex={-1}>
        <section className={styles.hero} aria-labelledby="home-title">
          <div className={`${styles.container} ${styles.heroGrid}`}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>La chat per l’immobiliare italiano</p>
              <h1 id="home-title">La tua guida immobiliare <span>intelligente.</span></h1>
              <p className={styles.heroDescription}>Dubbi sulla casa? Parliamone. Guimmia ti aiuta a capire, preparare e organizzare: dalla prima domanda alla tua prossima decisione.</p>
              <p className={styles.scope}>Vendita e acquisto. Affitti a lungo termine, per studenti e turistici.</p>
              <form onSubmit={submit} className={styles.composer}>
                <label htmlFor="guimmia-question" className="sr-only">La tua domanda immobiliare</label>
                <textarea id="guimmia-question" name="message" value={message} aria-invalid={Boolean(entryError)} aria-describedby={entryError ? "guimmia-entry-error" : undefined} onChange={(event) => { setMessage(event.target.value); setEntryError(""); }} onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); }
                }} rows={3} maxLength={2000} placeholder="Ad esempio: voglio affittare casa a due studenti. Da dove comincio?" />
                <div className={styles.composerControls}>
                  <label htmlFor="guimmia-focus" className="sr-only">Ambito della domanda</label>
                  <select id="guimmia-focus" name="focus" value={focus} onChange={(event) => setFocus(event.target.value)}>
                    <option value="GENERAL">Di cosa parliamo?</option><option value="SALE">Vendita o acquisto</option><option value="RENT">Affitto</option><option value="LISTING">Annuncio</option><option value="CONTRACT">Contratto o clausola</option><option value="DOCUMENTS">Documenti e controlli</option><option value="VALUATION">Valutazione</option>
                  </select>
                  <button type="submit" disabled={!message.trim()} className={styles.sendButton} aria-label="Invia la domanda"><ArrowUp size={21} aria-hidden="true" /></button>
                </div>
              </form>
              {entryError && <p id="guimmia-entry-error" role="alert" className={styles.entryError}>{entryError}</p>}
              <p className={styles.accountNote}>{authenticated ? "Le tue conversazioni restano nel tuo account." : "Crea un account gratuito per conservare chat e pratiche."}</p>
              <div className={styles.quickPrompts} aria-label="Domande per iniziare">
                <button type="button" onClick={() => openAssistant("Quali documenti devo raccogliere prima di vendere casa?", "SALE")}>Da dove parto per vendere?</button>
                <button type="button" onClick={() => openAssistant("Aiutami a scrivere un annuncio immobiliare. Fammi prima le domande necessarie.", "LISTING")}>Scriviamo un annuncio</button>
              </div>
            </div>
            <SmartphoneChatPreview onStart={openAssistant} />
          </div>
        </section>
        <div className={styles.topicStrip}><div className={styles.container}><p>Una casa. Tante domande. <strong>Un unico posto da cui partire.</strong></p><span>Per privati, agenti e professionisti</span></div></div>
        <section id="strumenti" className={`${styles.container} ${styles.tools}`} aria-labelledby="tools-title">
          <p className={styles.eyebrow}>Cosa puoi fare con Guimmia</p>
          <h2 id="tools-title">Meno dubbi.<br />Più chiaro il prossimo passo.</h2>
          <p className={styles.sectionIntro}>Domande, documenti, annunci e pratiche: il lavoro sulla tua casa comincia da una conversazione.</p>
          <div className={styles.toolGrid}>{productTools.map((tool) => {
            const Icon = tool.icon;
            const content = <><span className={styles.toolIcon}><Icon size={23} aria-hidden="true" /></span><h3>{tool.title}</h3><p>{tool.description}</p><span className={styles.toolAction}>Cominciamo <ArrowRight size={17} aria-hidden="true" /></span></>;
            return "prompt" in tool ? <button key={tool.title} className={styles.toolCard} type="button" onClick={() => openAssistant(tool.prompt, tool.focus)}>{content}</button> : <Link key={tool.title} className={styles.toolCard} href={tool.protected ? protectedHref(tool.href) : tool.href}>{content}</Link>;
          })}</div>
        </section>
        <section id="come-funziona" className={styles.howSection} aria-labelledby="how-title">
          <div className={`${styles.container} ${styles.howGrid}`}>
            <div><p className={styles.eyebrow}>Come funziona</p><h2 id="how-title">Si comincia<br />con una domanda.</h2><p className={styles.sectionIntro}>Niente linguaggio complicato. Un dialogo che ti aiuta a capire cosa fare, un passo alla volta.</p></div>
            <ol className={styles.steps}>{steps.map((step, index) => <li key={step.title}><span aria-hidden="true">0{index + 1}</span><div><h3>{step.title}</h3><p>{step.text}</p></div></li>)}</ol>
          </div>
        </section>
        <section className={`${styles.container} ${styles.closing}`}>
          <div><p className={styles.eyebrow}>Il tuo prossimo passo</p><h2>La casa è una scelta importante.<br />Facciamo chiarezza, insieme.</h2><Link className={styles.primaryButton} href={protectedHref("/ai")}>Parla con Guimmia <ArrowRight size={18} aria-hidden="true" /></Link></div>
          <p className={styles.professionalNote}>Guimmia ti aiuta a orientarti e preparare il lavoro. Le risposte possono contenere errori; bozze e stime sono da verificare. Nei passaggi legali, fiscali e tecnici, serve il controllo di un professionista abilitato.</p>
        </section>
      </main>
      <footer className={styles.footer}><div className={`${styles.container} ${styles.footerInner}`}><Logo compact /><p>La tua guida immobiliare intelligente.</p><nav aria-label="Informazioni"><Link href="/privacy">Privacy</Link><Link href="/terms">Condizioni</Link></nav></div></footer>
    </div>
  );
}
