import type { DocumentKey } from "@/lib/property-journey/types";

export type DocumentGuide = {
  whyItMatters: string;
  howToGet: string[];
  whatToCheck: string;
  commonMistake: string;
};

export const DOCUMENT_GUIDES: Record<DocumentKey, DocumentGuide> = {
  ownership: {
    whyItMatters:
      "Chiarisce il titolo con cui sei diventato proprietario e permette ai professionisti di ricostruire la provenienza dell’immobile.",
    howToGet: [
      "Controlla l’atto ricevuto al momento dell’acquisto, della donazione o della successione.",
      "Se non lo trovi, chiedi una copia al notaio che ha stipulato l’atto o all’archivio notarile competente.",
    ],
    whatToCheck:
      "Nomi dei proprietari, dati dell’immobile, data dell’atto ed eventuali condizioni particolari.",
    commonMistake:
      "Confondere l’atto di provenienza con una semplice visura catastale: sono documenti diversi.",
  },
  cadastralPlan: {
    whyItMatters:
      "Permette di confrontare la rappresentazione depositata al Catasto con lo stato attuale dei locali.",
    howToGet: [
      "Puoi richiederla tramite i servizi catastali disponibili per il proprietario.",
      "In alternativa, incarica un tecnico abilitato o un professionista con delega.",
    ],
    whatToCheck:
      "Distribuzione interna, accessi, balconi, pertinenze e corrispondenza con lo stato reale.",
    commonMistake:
      "Considerarla una prova automatica della conformità urbanistica: il controllo urbanistico è distinto.",
  },
  cadastralSurvey: {
    whyItMatters:
      "Riassume intestazione, categoria, classe, consistenza, rendita e principali identificativi catastali.",
    howToGet: [
      "Richiedila attraverso i servizi catastali online o presso gli uffici competenti.",
      "Può essere richiesta anche da un tecnico o da un intermediario autorizzato.",
    ],
    whatToCheck:
      "Intestatari, foglio, particella, subalterno, categoria e rendita catastale.",
    commonMistake:
      "Usare una visura molto vecchia senza verificare che intestazione e dati siano ancora aggiornati.",
  },
  energyCertificate: {
    whyItMatters:
      "Indica la prestazione energetica e viene normalmente richiesto nella pubblicità e nella formalizzazione di vendita o locazione.",
    howToGet: [
      "Verifica se possiedi già un APE ancora valido.",
      "Se manca o non è più valido, incarica un certificatore energetico abilitato.",
    ],
    whatToCheck:
      "Data di validità, codice identificativo, classe energetica e dati corretti dell’immobile.",
    commonMistake:
      "Aspettare la pubblicazione dell’annuncio per richiederlo, rallentando l’avvio della pratica.",
  },
  habitability: {
    whyItMatters:
      "Raccoglie informazioni sull’idoneità dell’immobile rispetto a sicurezza, igiene, salubrità e destinazione d’uso.",
    howToGet: [
      "Cerca tra i documenti edilizi consegnati al momento dell’acquisto.",
      "Se manca, verifica la situazione presso il Comune con l’aiuto di un tecnico.",
    ],
    whatToCheck:
      "Riferimento corretto all’unità immobiliare ed eventuali successive modifiche edilizie.",
    commonMistake:
      "Dare per scontato che l’assenza del documento significhi automaticamente che l’immobile non sia utilizzabile.",
  },
  systems: {
    whyItMatters:
      "Aiuta a documentare lavori e stato degli impianti elettrico, idrico, gas, riscaldamento e climatizzazione.",
    howToGet: [
      "Cerca dichiarazioni di conformità, rispondenza, libretti e fatture degli installatori.",
      "Per documenti mancanti, chiedi una verifica a un tecnico o installatore abilitato.",
    ],
    whatToCheck:
      "Impianto a cui si riferisce ogni certificazione, data, impresa e allegati tecnici.",
    commonMistake:
      "Presentare una semplice fattura come se fosse una dichiarazione di conformità completa.",
  },
  condominium: {
    whyItMatters:
      "Spese, regolamento, lavori deliberati e situazione dei pagamenti possono incidere sulla decisione di acquirenti o inquilini.",
    howToGet: [
      "Chiedi all’amministratore regolamento, ultimi consuntivi e preventivi.",
      "Verifica verbali recenti ed eventuali lavori straordinari deliberati.",
    ],
    whatToCheck:
      "Quote ordinarie, arretrati, lavori straordinari, contenziosi e limitazioni del regolamento.",
    commonMistake:
      "Comunicare soltanto la rata mensile senza considerare conguagli o spese straordinarie già deliberate.",
  },
  urbanCompliance: {
    whyItMatters:
      "Confronta lo stato reale con i titoli edilizi e aiuta a individuare difformità prima che blocchino o rallentino la vendita.",
    howToGet: [
      "Affida a un tecnico l’accesso agli atti edilizi presso il Comune.",
      "Fai confrontare titoli, elaborati autorizzati, Catasto e stato attuale.",
    ],
    whatToCheck:
      "Distribuzione, superfici, destinazioni d’uso, ampliamenti e modifiche effettuate nel tempo.",
    commonMistake:
      "Pensare che la corrispondenza catastale garantisca anche la regolarità urbanistica.",
  },
  leaseTemplate: {
    whyItMatters:
      "Aiuta a definire in anticipo durata, canone, deposito, spese, recesso e obblighi delle parti.",
    howToGet: [
      "Scegli prima la tipologia di locazione coerente con l’obiettivo e la situazione dell’inquilino.",
      "Fai adattare la bozza al caso concreto da un professionista quando necessario.",
    ],
    whatToCheck:
      "Dati delle parti, immobile, durata, canone, aggiornamenti, deposito, spese e clausole specifiche.",
    commonMistake:
      "Scaricare un modello generico e usarlo senza verificare regime fiscale, durata e clausole applicabili.",
  },
};

export function getDocumentGuide(documentId: DocumentKey) {
  return DOCUMENT_GUIDES[documentId];
}
