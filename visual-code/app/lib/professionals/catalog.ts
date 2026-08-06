import type { ProfessionalCategory, ProfessionalService, WizardQuestion } from "./types";

const GENERIC_QUESTIONS: WizardQuestion[] = [
  { id: "goal", label: "Quale risultato vuoi ottenere?", type: "textarea", required: true, placeholder: "Descrivi il risultato che vorresti ottenere con parole semplici." },
  { id: "situation", label: "Qual è la situazione attuale?", type: "textarea", required: true, placeholder: "Racconta ciò che sai già e che cosa ti sta bloccando." },
  { id: "deadline", label: "Hai una scadenza precisa?", type: "single", required: true, options: [
    { value: "asap", label: "Il prima possibile" }, { value: "week", label: "Entro una settimana" }, { value: "month", label: "Entro un mese" }, { value: "flexible", label: "Non ho una scadenza" }
  ]},
];

const SPECIAL: Record<string, WizardQuestion[]> = {
  "verifica-catastale-urbanistica": [
    { id: "problem", label: "Che cosa vuoi verificare?", type: "single", required: true, options: [
      { value: "documents", label: "Completezza dei documenti" }, { value: "plan", label: "Corrispondenza planimetria e immobile" }, { value: "changes", label: "Modifiche effettuate" }, { value: "unknown", label: "Non so esattamente che cosa controllare" }
    ]},
    { id: "documents", label: "Quali documenti possiedi già?", helper: "Il professionista potrà includerne il recupero.", type: "multi", options: [
      { value: "floorplan", label: "Planimetria catastale" }, { value: "cadastral", label: "Visura catastale" }, { value: "deed", label: "Atto di provenienza" }, { value: "permits", label: "Pratiche comunali" }, { value: "none", label: "Non possiedo questi documenti" }
    ]},
    { id: "changes", label: "Sono state effettuate modifiche rispetto alla planimetria?", type: "single", required: true, options: [
      { value: "yes_authorized", label: "Sì, e credo siano autorizzate" }, { value: "yes_unknown", label: "Sì, ma non so se siano autorizzate" }, { value: "no", label: "No" }, { value: "unknown", label: "Non lo so" }
    ]},
  ],
  "certificazione-energetica": [
    { id: "property_type", label: "Di che immobile si tratta?", type: "single", required: true, options: [
      { value: "apartment", label: "Appartamento" }, { value: "house", label: "Casa indipendente o villa" }, { value: "commercial", label: "Locale commerciale" }, { value: "office", label: "Ufficio" }, { value: "other", label: "Altro" }
    ]},
    { id: "surface", label: "Qual è la superficie indicativa?", type: "number", required: true, placeholder: "Metri quadrati" },
    { id: "floorplan", label: "Hai già la planimetria?", type: "boolean", required: true },
  ],
  "fotografia-immobiliare": [
    { id: "purpose", label: "Dove userai il materiale?", type: "single", required: true, options: [
      { value: "sale", label: "Annuncio di vendita" }, { value: "long_rent", label: "Affitto tradizionale" }, { value: "short_rent", label: "Affitto breve" }
    ]},
    { id: "media", label: "Che tipo di contenuti desideri?", type: "multi", required: true, options: [
      { value: "photos", label: "Fotografie professionali" }, { value: "video", label: "Video" }, { value: "drone", label: "Riprese con drone" }, { value: "tour", label: "Tour virtuale" }
    ]},
    { id: "rooms", label: "Quanti ambienti devono essere fotografati?", type: "number", required: true },
  ],
  "contratto-locazione": [
    { id: "contract_type", label: "Che tipo di affitto vuoi attivare?", type: "single", required: true, options: [
      { value: "long", label: "Contratto abitativo tradizionale" }, { value: "temporary", label: "Contratto transitorio" }, { value: "students", label: "Contratto per studenti" }, { value: "commercial", label: "Locazione commerciale" }, { value: "unknown", label: "Non so quale contratto scegliere" }
    ]},
    { id: "tenant", label: "Hai già individuato l’inquilino?", type: "boolean", required: true },
  ],
  "pulizia-profonda": [
    { id: "cleaning_type", label: "Che tipo di pulizia ti serve?", type: "single", required: true, options: [
      { value: "photos", label: "Prima delle fotografie" }, { value: "delivery", label: "Prima della consegna" }, { value: "deep", label: "Pulizia profonda" }, { value: "post_renovation", label: "Dopo una ristrutturazione" }
    ]},
    { id: "surface", label: "Qual è la superficie indicativa?", type: "number", required: true },
    { id: "furnished", label: "L’immobile è arredato?", type: "boolean", required: true },
  ],
  "ristrutturazione-completa": [
    { id: "intervention", label: "Che cosa deve essere sistemato?", type: "textarea", required: true },
    { id: "surface", label: "Qual è la superficie interessata?", type: "number", required: true },
    { id: "occupied", label: "L’immobile è abitato?", type: "boolean", required: true },
  ],
};

const QUOTE_FIELDS = ["Prezzo", "IVA", "Attività comprese", "Attività escluse", "Tempi", "Prima disponibilità", "Validità", "Costi aggiuntivi"];
const REVIEW_CRITERIA = ["Chiarezza del preventivo", "Comunicazione", "Rispetto dei tempi", "Qualità del servizio", "Rapporto qualità-prezzo"];

type Seed = { id: string; name: string; icon: string; status: ProfessionalCategory["availabilityStatus"]; description: string; services: [string,string,string,string[],ProfessionalService["availabilityStatus"]][] };
const SEEDS: Seed[] = [
  {
    "id": "documenti-conformita",
    "name": "Documenti e conformità",
    "icon": "📐",
    "status": "active",
    "description": "Catasto, urbanistica, certificazioni, pratiche comunali e regolarizzazione.",
    "services": [
      [
        "verifica-catastale-urbanistica",
        "Verifica catastale e urbanistica",
        "Controllo coordinato tra documenti, planimetria e stato reale.",
        [
          "Geometra",
          "Architetto",
          "Ingegnere"
        ],
        "active"
      ],
      [
        "verifica-planimetria",
        "Confronto planimetria e stato reale",
        "Individua differenze tra la planimetria depositata e l’immobile.",
        [
          "Geometra",
          "Architetto",
          "Ingegnere"
        ],
        "limited"
      ],
      [
        "aggiornamento-catastale",
        "Aggiornamento catastale",
        "Variazione, rettifica o aggiornamento della situazione catastale.",
        [
          "Geometra",
          "Architetto",
          "Ingegnere"
        ],
        "limited"
      ],
      [
        "sanatoria-regolarizzazione",
        "Sanatoria e regolarizzazione",
        "Valutazione e gestione di difformità o modifiche non regolarizzate.",
        [
          "Geometra",
          "Architetto",
          "Ingegnere"
        ],
        "limited"
      ],
      [
        "accesso-atti",
        "Accesso agli atti",
        "Ricerca delle pratiche edilizie conservate dal Comune.",
        [
          "Geometra",
          "Architetto",
          "Ingegnere"
        ],
        "limited"
      ],
      [
        "rilievo-planimetria",
        "Rilievo e nuova planimetria",
        "Misurazione dell’immobile e produzione di elaborati aggiornati.",
        [
          "Geometra",
          "Architetto",
          "Ingegnere",
          "Topografo"
        ],
        "limited"
      ],
      [
        "frazionamento-fusione",
        "Frazionamento o fusione",
        "Pratiche per dividere o unire unità immobiliari.",
        [
          "Geometra",
          "Architetto",
          "Ingegnere"
        ],
        "limited"
      ],
      [
        "cambio-destinazione",
        "Cambio di destinazione d’uso",
        "Verifica di fattibilità e gestione della pratica.",
        [
          "Geometra",
          "Architetto",
          "Ingegnere"
        ],
        "limited"
      ],
      [
        "certificazione-energetica",
        "Certificazione energetica (APE)",
        "Sopralluogo e rilascio dell’attestato di prestazione energetica.",
        [
          "Certificatore energetico",
          "Geometra",
          "Architetto",
          "Ingegnere"
        ],
        "active"
      ],
      [
        "certificazione-impianti",
        "Certificazione degli impianti",
        "Verifica e documentazione di conformità degli impianti.",
        [
          "Elettricista abilitato",
          "Idraulico abilitato",
          "Perito industriale"
        ],
        "limited"
      ],
      [
        "agibilita-abitabilita",
        "Agibilità e abitabilità",
        "Verifica o predisposizione delle pratiche necessarie.",
        [
          "Geometra",
          "Architetto",
          "Ingegnere"
        ],
        "limited"
      ],
      [
        "successione-voltura",
        "Successione e voltura catastale",
        "Supporto tecnico e catastale dopo una successione.",
        [
          "Geometra",
          "Commercialista",
          "Notaio"
        ],
        "limited"
      ],
      [
        "stima-perizia",
        "Stima tecnica e perizia",
        "Valutazione tecnica documentata dell’immobile.",
        [
          "Perito estimatore",
          "Geometra",
          "Architetto",
          "Ingegnere"
        ],
        "limited"
      ]
    ]
  },
  {
    "id": "vendita-intermediazione",
    "name": "Vendita e intermediazione",
    "icon": "🏷️",
    "status": "limited",
    "description": "Valutazione, strategia, visite, trattativa e supporto fino alla firma.",
    "services": [
      [
        "valutazione-immobiliare",
        "Valutazione immobiliare",
        "Analisi del valore e del posizionamento dell’immobile.",
        [
          "Agente immobiliare",
          "Perito estimatore"
        ],
        "limited"
      ],
      [
        "vendita-privati",
        "Vendita tra privati con assistenza",
        "Supporto professionale senza affidare l’intero incarico.",
        [
          "Consulente immobiliare",
          "Avvocato immobiliare",
          "Agente immobiliare"
        ],
        "limited"
      ],
      [
        "analisi-mercato",
        "Analisi comparativa di mercato",
        "Confronto con immobili e transazioni della zona.",
        [
          "Agente immobiliare",
          "Perito estimatore"
        ],
        "limited"
      ],
      [
        "ricerca-agente",
        "Ricerca agente immobiliare",
        "Confronto tra professionisti per affidare la vendita.",
        [
          "Agente immobiliare",
          "Agenzia immobiliare"
        ],
        "limited"
      ],
      [
        "verifica-proposta",
        "Verifica proposta d’acquisto",
        "Controllo di condizioni e rischi prima della firma.",
        [
          "Avvocato immobiliare",
          "Agente immobiliare"
        ],
        "limited"
      ],
      [
        "assistenza-trattativa",
        "Assistenza nella trattativa",
        "Supporto nella negoziazione di prezzo e condizioni.",
        [
          "Agente immobiliare",
          "Consulente immobiliare",
          "Avvocato immobiliare"
        ],
        "limited"
      ],
      [
        "organizzazione-visite",
        "Organizzazione delle visite",
        "Pianificazione, gestione e raccolta dei riscontri.",
        [
          "Agente immobiliare",
          "Consulente immobiliare"
        ],
        "limited"
      ],
      [
        "supporto-preliminare",
        "Supporto fino al preliminare",
        "Coordinamento dei passaggi fino al compromesso.",
        [
          "Agente immobiliare",
          "Avvocato immobiliare",
          "Notaio"
        ],
        "limited"
      ],
      [
        "vendita-ereditato",
        "Vendita immobile ereditato",
        "Coordinamento tecnico, fiscale e commerciale.",
        [
          "Agente immobiliare",
          "Notaio",
          "Commercialista",
          "Avvocato"
        ],
        "limited"
      ],
      [
        "vendita-occupato",
        "Vendita immobile occupato",
        "Strategia per immobili locati o occupati.",
        [
          "Agente immobiliare",
          "Avvocato immobiliare"
        ],
        "limited"
      ],
      [
        "aste-procedure",
        "Aste e procedure particolari",
        "Assistenza specialistica in situazioni non ordinarie.",
        [
          "Consulente aste",
          "Avvocato immobiliare"
        ],
        "limited"
      ]
    ]
  },
  {
    "id": "affitto-gestione",
    "name": "Affitto e gestione",
    "icon": "🔑",
    "status": "limited",
    "description": "Contratti, inquilini, affitti brevi, cauzioni e gestione continuativa.",
    "services": [
      [
        "definizione-canone",
        "Definizione del canone",
        "Analisi del canone sostenibile e competitivo.",
        [
          "Agente immobiliare",
          "Consulente locativo"
        ],
        "limited"
      ],
      [
        "contratto-locazione",
        "Scelta e preparazione del contratto",
        "Scelta, redazione e registrazione del contratto.",
        [
          "Avvocato",
          "Commercialista",
          "Agente immobiliare"
        ],
        "limited"
      ],
      [
        "selezione-inquilino",
        "Ricerca e selezione inquilini",
        "Pubblicazione, selezione e verifica dei candidati.",
        [
          "Agente immobiliare",
          "Property manager"
        ],
        "limited"
      ],
      [
        "verifica-candidato",
        "Verifica documentale candidato",
        "Controllo della documentazione e dell’affidabilità.",
        [
          "Agente immobiliare",
          "Consulente locativo"
        ],
        "limited"
      ],
      [
        "inventario-consegna",
        "Inventario e verbale di consegna",
        "Documentazione dello stato dell’immobile e delle dotazioni.",
        [
          "Property manager",
          "Agente immobiliare",
          "Perito"
        ],
        "limited"
      ],
      [
        "gestione-affitto",
        "Gestione affitto tradizionale",
        "Rapporto con l’inquilino, scadenze e manutenzioni.",
        [
          "Property manager",
          "Agente immobiliare"
        ],
        "limited"
      ],
      [
        "gestione-affitto-breve",
        "Gestione affitti brevi",
        "Annunci, ospiti, check-in, pulizie e rendicontazione.",
        [
          "Property manager",
          "Gestore affitti brevi"
        ],
        "limited"
      ],
      [
        "checkin-checkout",
        "Check-in e check-out",
        "Accoglienza, verifica e riconsegna dell’immobile.",
        [
          "Property manager",
          "Servizio di accoglienza"
        ],
        "limited"
      ],
      [
        "gestione-morosita",
        "Gestione morosità",
        "Supporto operativo e legale per mancati pagamenti.",
        [
          "Avvocato",
          "Property manager"
        ],
        "limited"
      ],
      [
        "chiusura-contratto",
        "Chiusura contratto e riconsegna",
        "Verbale finale, cauzione e adempimenti conclusivi.",
        [
          "Avvocato",
          "Agente immobiliare",
          "Property manager"
        ],
        "limited"
      ]
    ]
  },
  {
    "id": "legale-notarile-fiscale",
    "name": "Legale, notarile e fiscale",
    "icon": "⚖️",
    "status": "limited",
    "description": "Contratti, successioni, tasse, controversie e atti notarili.",
    "services": [
      [
        "consulenza-legale",
        "Consulenza legale immobiliare",
        "Analisi della situazione e delle possibili soluzioni.",
        [
          "Avvocato immobiliare"
        ],
        "limited"
      ],
      [
        "controllo-preliminare",
        "Controllo del preliminare",
        "Revisione del compromesso prima della firma.",
        [
          "Avvocato immobiliare",
          "Notaio"
        ],
        "limited"
      ],
      [
        "redazione-contratti",
        "Redazione o revisione contratti",
        "Supporto per accordi di vendita, affitto o gestione.",
        [
          "Avvocato",
          "Notaio"
        ],
        "limited"
      ],
      [
        "assistenza-notarile",
        "Assistenza notarile",
        "Preventivo e gestione degli atti necessari.",
        [
          "Notaio"
        ],
        "limited"
      ],
      [
        "successioni-donazioni",
        "Successioni e donazioni",
        "Coordinamento notarile, fiscale e documentale.",
        [
          "Notaio",
          "Avvocato",
          "Commercialista"
        ],
        "limited"
      ],
      [
        "divisioni-comproprieta",
        "Divisioni e comproprietà",
        "Accordi e gestione di beni condivisi.",
        [
          "Avvocato",
          "Notaio",
          "Mediatore civile"
        ],
        "limited"
      ],
      [
        "usufrutto-nuda-proprieta",
        "Usufrutto e nuda proprietà",
        "Valutazione e formalizzazione dei diritti immobiliari.",
        [
          "Notaio",
          "Avvocato",
          "Commercialista"
        ],
        "limited"
      ],
      [
        "sfratti-recupero",
        "Sfratti e recupero crediti",
        "Assistenza per morosità e rilascio dell’immobile.",
        [
          "Avvocato"
        ],
        "limited"
      ],
      [
        "controversie-condominiali",
        "Controversie condominiali",
        "Consulenza, negoziazione e mediazione.",
        [
          "Avvocato",
          "Mediatore civile"
        ],
        "limited"
      ],
      [
        "tassazione-vendita",
        "Tassazione della vendita",
        "Imposte, plusvalenza e dichiarazioni.",
        [
          "Commercialista",
          "Consulente fiscale"
        ],
        "limited"
      ],
      [
        "tassazione-affitti",
        "Tassazione degli affitti",
        "Cedolare secca, regime ordinario e adempimenti.",
        [
          "Commercialista",
          "Consulente fiscale"
        ],
        "limited"
      ],
      [
        "bonus-agevolazioni",
        "Bonus e agevolazioni",
        "Verifica dei requisiti e gestione documentale.",
        [
          "Commercialista",
          "Consulente fiscale",
          "Tecnico"
        ],
        "limited"
      ],
      [
        "mediazione-civile",
        "Mediazione civile",
        "Tentativo di accordo assistito prima del contenzioso.",
        [
          "Mediatore civile",
          "Avvocato"
        ],
        "limited"
      ]
    ]
  },
  {
    "id": "presentazione-valorizzazione",
    "name": "Presentazione e valorizzazione",
    "icon": "📸",
    "status": "active",
    "description": "Foto, video, home staging, render, annunci e promozione.",
    "services": [
      [
        "fotografia-immobiliare",
        "Fotografia immobiliare",
        "Servizio fotografico professionale per vendita o affitto.",
        [
          "Fotografo immobiliare"
        ],
        "active"
      ],
      [
        "video-immobiliare",
        "Video professionale",
        "Video di presentazione dell’immobile.",
        [
          "Videomaker immobiliare"
        ],
        "limited"
      ],
      [
        "riprese-drone",
        "Riprese con drone",
        "Foto e video aerei realizzati da operatori abilitati.",
        [
          "Operatore drone",
          "Videomaker"
        ],
        "limited"
      ],
      [
        "virtual-tour",
        "Virtual tour",
        "Visita immersiva e navigabile dell’immobile.",
        [
          "Fotografo 360",
          "Tecnico virtual tour"
        ],
        "limited"
      ],
      [
        "planimetria-arredata",
        "Planimetria arredata",
        "Rappresentazione chiara e accattivante degli spazi.",
        [
          "Render artist",
          "Interior designer",
          "Geometra"
        ],
        "limited"
      ],
      [
        "render-3d",
        "Render 3D",
        "Visualizzazione realistica di ambienti o progetti.",
        [
          "Render artist",
          "Architetto",
          "Interior designer"
        ],
        "limited"
      ],
      [
        "home-staging",
        "Home staging",
        "Preparazione fisica degli ambienti per valorizzarli.",
        [
          "Home stager",
          "Interior designer"
        ],
        "limited"
      ],
      [
        "home-staging-virtuale",
        "Home staging virtuale",
        "Arredo digitale applicato alle fotografie.",
        [
          "Home stager virtuale",
          "Render artist"
        ],
        "limited"
      ],
      [
        "scrittura-annuncio",
        "Scrittura o revisione annuncio",
        "Testo chiaro e persuasivo per portali e social.",
        [
          "Copywriter immobiliare",
          "Agente immobiliare"
        ],
        "limited"
      ],
      [
        "traduzione-annuncio",
        "Traduzione annuncio",
        "Adattamento professionale per clienti internazionali.",
        [
          "Traduttore"
        ],
        "limited"
      ],
      [
        "pubblicazione-portali",
        "Pubblicazione e promozione",
        "Gestione della pubblicazione sui canali selezionati.",
        [
          "Consulente marketing immobiliare",
          "Agente immobiliare"
        ],
        "limited"
      ],
      [
        "brochure-materiali",
        "Brochure e materiali promozionali",
        "Materiali digitali o stampabili per visite e presentazioni.",
        [
          "Graphic designer",
          "Copywriter",
          "Fotografo"
        ],
        "limited"
      ]
    ]
  },
  {
    "id": "lavori-manutenzione",
    "name": "Lavori e manutenzione",
    "icon": "🛠️",
    "status": "limited",
    "description": "Ristrutturazioni, impianti, guasti, efficientamento e spazi esterni.",
    "services": [
      [
        "ristrutturazione-completa",
        "Ristrutturazione completa",
        "Coordinamento e realizzazione di un intervento complessivo.",
        [
          "Impresa edile",
          "Architetto",
          "Geometra"
        ],
        "limited"
      ],
      [
        "piccoli-lavori-edili",
        "Piccoli lavori edili",
        "Riparazioni, muratura e interventi localizzati.",
        [
          "Impresa edile",
          "Muratore"
        ],
        "limited"
      ],
      [
        "tinteggiatura",
        "Tinteggiatura",
        "Preparazione e pittura di pareti e soffitti.",
        [
          "Imbianchino"
        ],
        "limited"
      ],
      [
        "impianto-elettrico",
        "Impianto elettrico",
        "Riparazione, adeguamento o nuova installazione.",
        [
          "Elettricista abilitato"
        ],
        "limited"
      ],
      [
        "impianto-idraulico",
        "Impianto idraulico",
        "Riparazione, adeguamento o nuova installazione.",
        [
          "Idraulico abilitato"
        ],
        "limited"
      ],
      [
        "climatizzazione-caldaie",
        "Climatizzazione e caldaie",
        "Installazione, manutenzione e certificazione.",
        [
          "Termotecnico",
          "Installatore abilitato"
        ],
        "limited"
      ],
      [
        "serramenti-infissi",
        "Serramenti e infissi",
        "Riparazione o sostituzione di finestre, porte e chiusure.",
        [
          "Serramentista",
          "Falegname",
          "Fabbro"
        ],
        "limited"
      ],
      [
        "pavimenti-piastrelle",
        "Pavimenti e piastrelle",
        "Posa, riparazione o sostituzione.",
        [
          "Piastrellista",
          "Impresa edile"
        ],
        "limited"
      ],
      [
        "isolamento-impermeabilizzazione",
        "Isolamento e impermeabilizzazione",
        "Soluzioni per dispersioni, infiltrazioni e coperture.",
        [
          "Impresa specializzata",
          "Termotecnico"
        ],
        "limited"
      ],
      [
        "muffa-umidita",
        "Muffa e umidità",
        "Diagnosi della causa e intervento risolutivo.",
        [
          "Tecnico",
          "Impresa specializzata"
        ],
        "limited"
      ],
      [
        "fotovoltaico-efficienza",
        "Fotovoltaico ed efficientamento",
        "Valutazione e installazione di soluzioni energetiche.",
        [
          "Installatore fotovoltaico",
          "Consulente energetico",
          "Ingegnere"
        ],
        "limited"
      ],
      [
        "giardini-esterni",
        "Giardini e spazi esterni",
        "Manutenzione, sistemazione e valorizzazione.",
        [
          "Giardiniere",
          "Paesaggista",
          "Impresa"
        ],
        "limited"
      ],
      [
        "sistemi-sicurezza",
        "Sistemi di sicurezza",
        "Allarmi, videosorveglianza e controllo accessi.",
        [
          "Installatore sistemi di sicurezza"
        ],
        "limited"
      ],
      [
        "disinfestazione",
        "Disinfestazione",
        "Interventi contro infestanti e parassiti.",
        [
          "Impresa di disinfestazione"
        ],
        "limited"
      ]
    ]
  },
  {
    "id": "pulizia-sgombero-trasloco",
    "name": "Pulizia, sgombero e trasloco",
    "icon": "🧹",
    "status": "active",
    "description": "Pulizia, svuotamento, smaltimento, deposito e trasporto.",
    "services": [
      [
        "pulizia-fotografie",
        "Pulizia prima delle fotografie",
        "Preparazione accurata prima del servizio fotografico.",
        [
          "Impresa di pulizie"
        ],
        "active"
      ],
      [
        "pulizia-consegna",
        "Pulizia prima della consegna",
        "Pulizia finale per vendita, affitto o riconsegna.",
        [
          "Impresa di pulizie"
        ],
        "active"
      ],
      [
        "pulizia-profonda",
        "Pulizia profonda",
        "Intervento intensivo su tutto l’immobile.",
        [
          "Impresa di pulizie"
        ],
        "active"
      ],
      [
        "pulizia-post-cantiere",
        "Pulizia post-ristrutturazione",
        "Rimozione di polveri e residui dopo i lavori.",
        [
          "Impresa di pulizie"
        ],
        "limited"
      ],
      [
        "sanificazione",
        "Sanificazione",
        "Trattamento specifico degli ambienti.",
        [
          "Impresa specializzata"
        ],
        "limited"
      ],
      [
        "sgombero-immobile",
        "Sgombero immobile",
        "Svuotamento completo o parziale.",
        [
          "Ditta di sgombero"
        ],
        "limited"
      ],
      [
        "smaltimento-mobili",
        "Smaltimento mobili e ingombranti",
        "Ritiro e gestione autorizzata dei materiali.",
        [
          "Ditta di smaltimento",
          "Ditta di sgombero"
        ],
        "limited"
      ],
      [
        "trasloco",
        "Trasloco",
        "Imballaggio, trasporto e rimontaggio.",
        [
          "Ditta di traslochi"
        ],
        "limited"
      ],
      [
        "deposito-temporaneo",
        "Deposito temporaneo",
        "Custodia di mobili e oggetti per il tempo necessario.",
        [
          "Deposito",
          "Ditta di traslochi"
        ],
        "limited"
      ],
      [
        "cantine-garage",
        "Svuotamento cantine e garage",
        "Sgombero di spazi accessori e pertinenze.",
        [
          "Ditta di sgombero"
        ],
        "limited"
      ],
      [
        "custodia-chiavi",
        "Custodia delle chiavi",
        "Gestione sicura dell’accesso per visite e interventi.",
        [
          "Property manager",
          "Servizio di custodia"
        ],
        "limited"
      ]
    ]
  },
  {
    "id": "finanza-assicurazioni-amministrazione",
    "name": "Finanza, assicurazioni e amministrazione",
    "icon": "🛡️",
    "status": "activating",
    "description": "Mutui, polizze, incentivi, condominio, utenze e pratiche economiche.",
    "services": [
      [
        "consulenza-mutuo",
        "Consulenza mutuo",
        "Analisi delle possibilità e confronto delle soluzioni.",
        [
          "Mediatore creditizio",
          "Consulente del credito"
        ],
        "activating"
      ],
      [
        "surroga-estinzione",
        "Surroga o estinzione",
        "Valutazione e gestione delle alternative sul mutuo.",
        [
          "Mediatore creditizio",
          "Consulente bancario"
        ],
        "activating"
      ],
      [
        "cancellazione-ipoteca",
        "Cancellazione ipoteca",
        "Verifica e gestione degli adempimenti necessari.",
        [
          "Notaio",
          "Consulente del credito"
        ],
        "activating"
      ],
      [
        "finanziamento-ristrutturazione",
        "Finanziamento ristrutturazione",
        "Ricerca della soluzione finanziaria per i lavori.",
        [
          "Mediatore creditizio",
          "Consulente del credito"
        ],
        "activating"
      ],
      [
        "assicurazione-immobile",
        "Assicurazione immobile",
        "Confronto delle coperture per fabbricato e responsabilità.",
        [
          "Broker assicurativo",
          "Agente assicurativo"
        ],
        "activating"
      ],
      [
        "assicurazione-canone",
        "Assicurazione sul canone",
        "Copertura contro morosità e spese legali.",
        [
          "Broker assicurativo",
          "Agente assicurativo"
        ],
        "activating"
      ],
      [
        "gestione-sinistro",
        "Gestione danni e sinistri",
        "Supporto nella documentazione e nella liquidazione.",
        [
          "Perito assicurativo",
          "Broker assicurativo"
        ],
        "activating"
      ],
      [
        "bonus-incentivi",
        "Bonus e incentivi",
        "Analisi dei requisiti e coordinamento delle pratiche.",
        [
          "Commercialista",
          "Consulente energetico",
          "Tecnico"
        ],
        "activating"
      ],
      [
        "amministrazione-condominiale",
        "Amministrazione condominiale",
        "Ricerca o supporto nella gestione del condominio.",
        [
          "Amministratore di condominio"
        ],
        "activating"
      ],
      [
        "spese-condominiali",
        "Verifica spese condominiali",
        "Analisi di bilanci, riparti e situazioni debitorie.",
        [
          "Amministratore",
          "Commercialista",
          "Avvocato"
        ],
        "activating"
      ],
      [
        "volture-utenze",
        "Volture e utenze",
        "Attivazione, voltura o chiusura delle forniture.",
        [
          "Consulente amministrativo",
          "Servizio utenze"
        ],
        "activating"
      ]
    ]
  }
];

export const PROFESSIONAL_CATEGORIES: ProfessionalCategory[] = SEEDS.map((category) => ({
  id: category.id, name: category.name, icon: category.icon, description: category.description, availabilityStatus: category.status,
  services: category.services.map(([id,name,shortDescription,eligibleProfessions,availabilityStatus]) => ({
    id, categoryId: category.id, name, shortDescription, eligibleProfessions, availabilityStatus,
    questions: SPECIAL[id] ?? GENERIC_QUESTIONS, quoteFields: QUOTE_FIELDS, reviewCriteria: REVIEW_CRITERIA,
  })),
}));
export const PROFESSIONAL_SERVICES = PROFESSIONAL_CATEGORIES.flatMap((category) => category.services);
export const findCategory = (id?: string | null) => PROFESSIONAL_CATEGORIES.find((item) => item.id === id);
export const findService = (id?: string | null) => PROFESSIONAL_SERVICES.find((item) => item.id === id);
export const availabilityLabel = (status: ProfessionalCategory["availabilityStatus"]) => status === "active" ? "Disponibile" : status === "limited" ? "Disponibilità limitata" : "In attivazione";

export function suggestService(description: string) {
  const text = description.toLowerCase();
  const rules: Array<[string[],string]> = [
    [["planimetr","catast","conform","urbanistic"],"verifica-catastale-urbanistica"], [["ape","energetic"],"certificazione-energetica"],
    [["foto","fotograf"],"fotografia-immobiliare"], [["contratto","inquilin","locazione","affitto"],"contratto-locazione"],
    [["pulizi","sporco","sanific"],"pulizia-profonda"], [["sgomber","svuot"],"sgombero-immobile"], [["trasloc"],"trasloco"],
    [["ristruttur","lavori","muratur"],"ristrutturazione-completa"], [["muff","umid"],"muffa-umidita"],
    [["valut","prezzo","quanto vale"],"valutazione-immobiliare"], [["avvocat","controvers","sfratto"],"consulenza-legale"],
    [["mutuo","finanzi"],"consulenza-mutuo"], [["assicur"],"assicurazione-immobile"],
  ];
  for (const [keywords,id] of rules) if (keywords.some((word) => text.includes(word))) return findService(id) ?? PROFESSIONAL_SERVICES[0];
  return findService("verifica-catastale-urbanistica") ?? PROFESSIONAL_SERVICES[0];
}
