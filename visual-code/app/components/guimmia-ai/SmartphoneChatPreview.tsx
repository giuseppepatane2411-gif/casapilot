"use client";

import { useState } from "react";
import { ArrowRight, BatteryFull, ChevronLeft, Compass, FileCheck2, Signal, Wifi } from "lucide-react";
import styles from "./GuimmiaHome.module.css";

// Illustrative conversations only. No model call, saved message or user data.
const examples = [
  { label: "Vendita", focus: "SALE", question: "Voglio vendere casa. Cosa preparo prima dell’annuncio?", intro: "Mettiamo in ordine le informazioni, così parti con un quadro più chiaro.", items: [{ title: "La casa", text: "Superficie, locali, stato e caratteristiche." }, { title: "I documenti", text: "Quelli disponibili e quelli da recuperare." }, { title: "L’annuncio", text: "Dati confermati, fotografie e punti di forza." }], next: "In quale città si trova l’immobile?", attachment: "Checklist di partenza" },
  { label: "Lungo termine", focus: "RENT", question: "Vorrei affittare il mio appartamento a lungo termine. Mi aiuti?", intro: "Certo. Partiamo dalle tue esigenze, poi prepariamo il percorso.", items: [{ title: "L’immobile", text: "Località, caratteristiche e disponibilità." }, { title: "Le condizioni", text: "Durata desiderata, arredi e spese." }, { title: "La preparazione", text: "Documenti e domande per la bozza." }], next: "Dove si trova e da quando è disponibile?", attachment: "Promemoria per l’affitto" },
  { label: "Studenti", focus: "RENT", question: "Vorrei affittare casa a due studenti. Da dove comincio?", intro: "Ti aiuto a raccogliere ciò che serve per valutare il percorso adatto.", items: [{ title: "Casa o stanze?", text: "Chiarisci quali spazi vuoi affittare." }, { title: "Città e durata", text: "Servono per inquadrare il tuo caso." }, { title: "Dati e verifiche", text: "Prepariamo le domande per il contratto." }], next: "Vuoi affittare tutta la casa o due stanze?", attachment: "Checklist affitto studenti" },
  { label: "Turistico", focus: "RENT", question: "Vorrei affittare casa ai turisti. Qual è il primo passo?", intro: "Prima di preparare l’annuncio, inquadriamo l’immobile e il progetto.", items: [{ title: "La località", text: "Comune e regione da cui partire." }, { title: "Il progetto", text: "Periodi, spazi e modalità di gestione." }, { title: "Le verifiche", text: "Individuiamo gli aspetti da approfondire." }], next: "In quale comune si trova la casa?", attachment: "Promemoria affitto turistico" },
] as const;

export default function SmartphoneChatPreview({ onStart }: { onStart: (question: string, focus: string) => void }) {
  const [selected, setSelected] = useState(2);
  const example = examples[selected];
  return (
    <figure className={styles.preview} aria-label="Esempi di conversazione con Guimmia">
      <div className={styles.examplePicker} aria-label="Scegli un esempio">{examples.map((item, index) => <button key={item.label} type="button" aria-pressed={index === selected} onClick={() => setSelected(index)}>{item.label}</button>)}</div>
      <div className={styles.phone}><div className={styles.phoneScreen}>
        <div className={styles.statusBar} aria-hidden="true"><span>9:41</span><i /><div><Signal size={14} /><Wifi size={14} /><BatteryFull size={19} /></div></div>
        <div className={styles.phoneHeader}><ChevronLeft size={20} aria-hidden="true" /><span className={styles.avatar}><Compass size={23} aria-hidden="true" /></span><div><p>Guimm<span>ia</span></p><span>La tua guida immobiliare</span></div></div>
        <div className={styles.phoneConversation} aria-live="polite" aria-atomic="true">
          <p className={styles.conversationDate}>La tua prossima scelta, più chiara</p>
          <div className={styles.question}><span className="sr-only">Tu: </span>{example.question}</div>
          <div className={styles.answer}>
            <p className={styles.answerAuthor}><Compass size={15} aria-hidden="true" /> Guimmia</p><p>{example.intro}</p>
            <ol>{example.items.map((item, index) => <li key={item.title}><span aria-hidden="true">{index + 1}</span><div><strong>{item.title}</strong><p>{item.text}</p></div></li>)}</ol>
            <p className={styles.nextQuestion}>{example.next}</p>
          </div>
          <div className={styles.previewChecklist}><FileCheck2 size={20} aria-hidden="true" /><div><strong>{example.attachment}</strong><span>Da costruire insieme nella chat</span></div></div>
        </div>
        <div className={styles.phoneAction}><button type="button" onClick={() => onStart(example.question, example.focus)}>Parliamo del mio caso <ArrowRight size={17} aria-hidden="true" /></button></div>
        <div className={styles.homeIndicator} aria-hidden="true" />
      </div></div>
      <figcaption>Un esempio di conversazione. Il prossimo caso è il tuo.</figcaption>
    </figure>
  );
}
