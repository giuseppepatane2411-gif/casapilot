import type { SourceRef } from "../types";

export const manualSource = (pages: string, section: string): SourceRef => ({
  sourceId: "REAL_ESTATE_MANUAL_USER",
  label: "Manuale immobiliare fornito dall'utente",
  pages,
  section,
  sourceKind: "USER_MANUAL",
  normativeAuthority: false,
});

export const internalPolicy = (section: string): SourceRef => ({
  sourceId: "GUIMMIA_INTERNAL_POLICY_V2",
  label: "Policy operativa Guimmia v2",
  section,
  sourceKind: "INTERNAL_POLICY",
  normativeAuthority: false,
});

export const officialLaw = (sourceId: string, label: string, url: string, section?: string): SourceRef => ({
  sourceId,
  label,
  section,
  sourceKind: "OFFICIAL_LAW",
  normativeAuthority: true,
  url,
  jurisdiction: "IT",
  asOf: "2026-08-22",
});


const L431 = "https://www.normattiva.it/eli/id/1998/12/15/098G0483/CONSOLIDATED/";
const DM2017 = "https://www.gazzettaufficiale.it/atto/vediMenuHTML?atto.codiceRedazionale=17A01858&atto.dataPubblicazioneGazzetta=2017-03-15&tipoSerie=serie_generale&tipoVigenza=originario";
const DL145 = "https://www.normattiva.it/uri-res/N2Ls?urn%3Anir%3Astato%3A2023%3B145~art13ter%21vig=";
const BDSRFAQ = "https://www.ministeroturismo.gov.it/faq-banca-dati-strutture-ricettive-bdsr/";
const AE_RENT = "https://infoprecompilata.agenziaentrate.gov.it/portale/semplificata-mod-fabbricati";
const AE_RENT_REG = "https://www1.agenziaentrate.gov.it/servizi/scadenzario/main.php?chi=3805&come=509&cosa=11500&entroil=01-06-2026&op=4";

const DPR380 = "https://www.normattiva.it/atto/caricaDettaglioAtto?atto.articolo.numero=0&atto.codiceRedazionale=001G0429&atto.dataPubblicazioneGazzetta=2001-10-20&title=lbl.dettaglioAtto";

export const SOURCE_MAP = {
  RIGHTS_REAL: manualSource("66-110", "Parte I, Sez. II — Diritti reali"),
  CONTRACTS: manualSource("140-179", "Parte I, Sez. IV — Contratto, formazione, preliminare, invalidità"),
  SALE: manualSource("180-208", "Parte I, Sez. V — Compravendita"),
  TRANSCRIPTION: manualSource("245-251", "Parte I, Sez. VI — Trascrizione"),
  FAMILY: manualSource("252-267", "Parte I, Sez. VII — Diritto di famiglia"),
  SUCCESSION: manualSource("268-299", "Parte I, Sez. VIII — Successione e donazione"),
  MANDATE_MEDIATION: manualSource("300-359", "Parte I, Sez. IX — Mandato, mediazione, formulari e compliance"),
  URBAN: manualSource("372-436", "Parte II — Urbanistica ed edilizia"),
  URBAN_PRACTICE: manualSource("388-436", "Parte II — Nozioni urbanistiche ed edilizie nella prassi immobiliare"),
  TAX: manualSource("486-506 circa", "Parte III — Tributi del settore immobiliare"),
  COMMERCIAL: manualSource("Diritto commerciale", "Parte IV — Impresa, società e crisi"),
  MORTGAGES: manualSource("607-672 circa", "Parte V — Mutui, finanziamenti e contratti bancari"),
  VALUATION: manualSource("673-717 circa", "Parte VI — Estimo generale e urbano"),
  CADASTRE: manualSource("Sezione IV", "Parte VI — Estimo catastale"),
  LEGAL_ESTIMATE: manualSource("758-773", "Parte VI — Estimo legale"),
  DPR380_CONSOLIDATED: officialLaw("IT_DPR_380_2001", "D.P.R. 380/2001 — Testo unico edilizia (Normattiva)", DPR380, "Testo vigente/consolidato; usare sempre la versione corrente"),
  DPR380_STATE: officialLaw("IT_DPR_380_2001_ART_9BIS", "D.P.R. 380/2001 — art. 9-bis", DPR380, "Documentazione amministrativa e stato legittimo"),
  DPR380_USE: officialLaw("IT_DPR_380_2001_ART_23TER", "D.P.R. 380/2001 — art. 23-ter", DPR380, "Mutamento della destinazione d'uso"),
  DPR380_AGIBILITY: officialLaw("IT_DPR_380_2001_ART_24", "D.P.R. 380/2001 — art. 24", DPR380, "Agibilità"),
  DPR380_TOLERANCES: officialLaw("IT_DPR_380_2001_ART_34BIS", "D.P.R. 380/2001 — art. 34-bis", DPR380, "Tolleranze costruttive/esecutive"),
  DPR380_CONFORMITY: officialLaw("IT_DPR_380_2001_ART_36_36BIS", "D.P.R. 380/2001 — artt. 36 e 36-bis", DPR380, "Accertamento di conformità"),
  RENTAL_GENERAL: manualSource("209-244", "Parte I, Sez. V - Locazione, locazioni abitative, turistiche e brevi"),
  RENTAL_HOUSING: manualSource("222-229", "Parte I, Sez. V - Locazioni ad uso abitativo, transitorie e studenti"),
  RENTAL_TOURIST: manualSource("230-244", "Parte I, Sez. V - Finalita turistica, locazioni brevi e ricettivita"),
  TAX_RENTAL: manualSource("Parte III", "Fiscalita immobiliare - redditi e imposte sulle locazioni"),
  L431_CONSOLIDATED: officialLaw("IT_L431_1998", "Legge 431/1998 - locazioni abitative (Normattiva)", L431, "Testo consolidato; forma, tipologie e disciplina abitativa"),
  DM_16_01_2017: officialLaw("IT_DM_2017_RENTAL_AGREEMENTS", "D.M. 16 gennaio 2017 - canone concordato, transitori, studenti", DM2017, "Accordi territoriali e modelli contrattuali"),
  DL145_ART13TER: officialLaw("IT_DL145_2023_ART13TER", "D.L. 145/2023 art. 13-ter - locazioni turistiche/brevi e CIN", DL145, "CIN, sicurezza, SCIA e annunci"),
  BDSR_FAQ: { sourceId:"IT_BDSR_FAQ", label:"Ministero del Turismo - FAQ BDSR/CIN", sourceKind:"OFFICIAL_GUIDANCE", normativeAuthority:true, url:BDSRFAQ, jurisdiction:"IT", asOf:"2026-08-22", section:"FAQ aggiornate 11 maggio 2026" },
  AE_RENTAL_GUIDANCE: { sourceId:"IT_AE_RENTAL_GUIDANCE", label:"Agenzia delle Entrate - locazioni e cedolare", sourceKind:"OFFICIAL_GUIDANCE", normativeAuthority:true, url:AE_RENT, jurisdiction:"IT", asOf:"2026-08-22" },
  AE_RENTAL_REGISTRATION: { sourceId:"IT_AE_RENTAL_REGISTRATION", label:"Agenzia delle Entrate - registrazione contratti di locazione", sourceKind:"OFFICIAL_GUIDANCE", normativeAuthority:true, url:AE_RENT_REG, jurisdiction:"IT", asOf:"2026-08-22" },
  DPR380_TRANSFER: officialLaw("IT_DPR_380_2001_ART_46", "D.P.R. 380/2001 — art. 46", DPR380, "Profili formali dei trasferimenti"),
} as const;
