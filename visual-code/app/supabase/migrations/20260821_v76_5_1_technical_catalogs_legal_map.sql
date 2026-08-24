-- GUIMMIA V76.5 — Cataloghi, source model e legal freshness map
insert into public.guimmia_brain_technical_finding_catalog(code,label,default_severity) values
('SCOPE_NOT_LOCKED','Oggetto tecnico della verifica non definito','blocking'),
('COMPONENTS_UNMAPPED','Pertinenze/componenti non mappati','blocking'),
('SOURCE_MAP_INCOMPLETE','Mappa fonti tecnica incompleta','blocking'),
('SOURCE_DOMAIN_CONFLICT','Conflitto tra fonti/domìni da interpretare','blocking'),
('CURRENT_STATE_UNOBSERVED','Stato fisico attuale non rilevato quando necessario','blocking'),
('TIMELINE_INCOMPLETE','Cronologia tecnica incompleta','blocking'),
('RECORD_ACCESS_REQUIRED','Accesso atti necessario','blocking'),
('RECORD_ACCESS_PARTIAL','Accesso atti parziale','blocking'),
('RECORD_ACCESS_FAILED','Accesso atti non completato','blocking'),
('CADASTRAL_ID_MISSING','Identificativi catastali mancanti','blocking'),
('CADASTRAL_ID_MISMATCH','Identificativi catastali discordanti','blocking'),
('CADASTRAL_ADDRESS_MISMATCH','Indirizzo catastale discordante','warning'),
('CADASTRAL_CATEGORY_MISMATCH','Categoria catastale da approfondire','warning'),
('CADASTRAL_PLAN_MISSING','Planimetria catastale non disponibile','blocking'),
('CADASTRAL_PLAN_STALE','Planimetria potenzialmente non corrente','blocking'),
('CADASTRAL_PLAN_OBSERVED_MISMATCH','Possibile differenza planimetria/stato osservato','blocking'),
('CADASTRAL_SURFACE_MISMATCH','Superficie discordante','warning'),
('CADASTRAL_HISTORY_GAP','Storico catastale insufficiente per la ricostruzione','warning'),
('URBAN_TITLE_CHAIN_INCOMPLETE','Catena titoli/pratiche edilizie incompleta','blocking'),
('URBAN_TITLE_STATUS_UNCLEAR','Stato di una pratica edilizia non chiaro','blocking'),
('WORK_WITHOUT_LINKED_TITLE','Lavori dichiarati/osservati senza pratica collegata','blocking'),
('STATE_LEGITIMATE_NOT_RECONSTRUCTED','Stato legittimo non ricostruito','blocking'),
('HISTORIC_CONSTRUCTION_BASIS_UNPROVEN','Base documentale edificio storico insufficiente','blocking'),
('USE_DECLARED_VS_CADASTRAL_MISMATCH','Uso dichiarato e catastale discordanti','warning'),
('USE_DECLARED_VS_URBAN_MISMATCH','Uso dichiarato e urbanistico discordanti','blocking'),
('CHANGE_OF_USE_SUSPECTED','Possibile mutamento d''uso','blocking'),
('AGIBILITY_STATUS_UNKNOWN','Agibilità non chiarita','warning'),
('AGIBILITY_SCOPE_MISMATCH','Ambito agibilità/configurazione da verificare','blocking'),
('PROTECTED_PROPERTY_REVIEW','Vincolo/tutela da verificare','blocking'),
('TOLERANCE_CLAIM_REQUIRES_TECHNICIAN','Possibile tolleranza: qualificazione riservata al tecnico','blocking'),
('SANATORIA_PENDING','Procedimento di regolarizzazione pendente','critical'),
('SANATORIA_OUTCOME_UNKNOWN','Esito regolarizzazione non documentato','blocking'),
('CONDONO_PENDING','Condono pendente','critical'),
('CONDONO_OUTCOME_UNKNOWN','Esito condono non documentato','blocking'),
('POSSIBLE_UNAUTHORIZED_WORK','Possibile opera non assistita da titolo coerente','critical'),
('ONGOING_WORKS','Lavori in corso','warning'),
('TRANSFER_FORMALITY_REVIEW','Profili formali trasferimento da verificare','blocking'),
('TECHNICAL_EVIDENCE_GAP','Finding tecnico senza evidenza sufficiente','blocking'),
('PROFESSIONAL_SCOPE_INCOMPLETE','Richiesta al tecnico incompleta','blocking'),
('PROFESSIONAL_SIGNOFF_STALE','Sign-off professionale non più corrente','blocking'),
('CONTROLLED_OVERRIDE_PRESENT','Override agente registrato','warning'),
('CRITICAL_OVERRIDE_ATTEMPT','Tentativo di override su criticità non derogabile','critical')
on conflict (code) do update set label=excluded.label,default_severity=excluded.default_severity,active=true;

insert into public.guimmia_brain_technical_comparison_defs(key,left_path,right_path,requires_professional_interpretation) values
('CADASTRAL_IDENTIFIERS_VS_TITLE','cadastre.identifiers','title.cadastralIdentifiers',true),
('CADASTRAL_IDENTIFIERS_VS_DECLARATION','cadastre.identifiers','property.declaredCadastralIdentifiers',true),
('CADASTRAL_ADDRESS_VS_CASE','cadastre.address','property.address',true),
('CADASTRAL_PLAN_VS_OBSERVED','cadastre.planLayout','physical.observedLayout',true),
('CADASTRAL_PLAN_VS_DECLARED','cadastre.planLayout','property.declaredLayout',true),
('CADASTRAL_SURFACE_VS_DECLARED','cadastre.surface','property.declaredSurface',true),
('CADASTRAL_CATEGORY_VS_DECLARED_USE','cadastre.category','property.declaredUse',true),
('URBAN_AUTHORIZED_USE_VS_DECLARED','urban.authorizedUse','property.declaredUse',true),
('URBAN_AUTHORIZED_STATE_VS_OBSERVED','urban.authorizedState','physical.observedState',true),
('URBAN_AUTHORIZED_STATE_VS_CADASTRAL_PLAN','urban.authorizedState','cadastre.planLayout',true),
('DECLARED_WORKS_VS_URBAN_TITLES','property.declaredWorks','urban.linkedWorks',true),
('OBSERVED_WORKS_VS_URBAN_TITLES','physical.observedWorks','urban.linkedWorks',true),
('AGIBILITY_SCOPE_VS_CURRENT_CONFIGURATION','agibility.scope','physical.currentConfiguration',true),
('TITLE_DEED_COMPONENTS_VS_SCOPE','title.components','technical.scopeComponents',true),
('CADASTRAL_UNITS_VS_SCOPE','cadastre.units','technical.scopeComponents',true),
('HISTORICAL_CADASTRE_VS_TIMELINE','cadastre.historicalEvents','technical.timeline',true),
('URBAN_TITLES_VS_TIMELINE','urban.titleEvents','technical.timeline',true),
('DECLARED_CONSTRUCTION_DATE_VS_EVIDENCE','property.declaredConstructionDate','technical.constructionEvidence',true)
on conflict (key) do update set left_path=excluded.left_path,right_path=excluded.right_path,requires_professional_interpretation=true,active=true;

insert into public.guimmia_brain_technical_source_classes(code,domain,review_rank,description,auto_resolves_conflicts) values
('OWNER_DECLARATION','PHYSICAL_STATE',30,'Dichiarazione del cliente: utile come input, mai prova tecnica autonoma.',false),
('TITLE_DEED','IDENTITY',78,'Atto di provenienza/trasferimento usato nel proprio dominio informativo.',false),
('CADASTRAL_CURRENT','CADASTRE',82,'Dati catastali correnti; non equivalgono a verifica urbanistica.',false),
('CADASTRAL_HISTORICAL','CADASTRE',85,'Dati catastali storici utili alla timeline, da interpretare nel contesto.',false),
('URBAN_TITLE','URBAN',92,'Titolo/pratica urbanistico-edilizia documentata.',false),
('MUNICIPAL_RECORD','URBAN',95,'Fascicolo/atto proveniente dall''amministrazione competente.',false),
('AGIBILITY_RECORD','AGIBILITY',90,'Documentazione sull''agibilità.',false),
('PROFESSIONAL_OBSERVATION','PHYSICAL_STATE',75,'Osservazione/sopralluogo professionale dello stato fisico.',false),
('PROFESSIONAL_SIGNED_REPORT','URBAN',100,'Relazione firmata nel perimetro dichiarato dal professionista.',false),
('OFFICIAL_EXTERNAL_SOURCE','PROTECTED_PROPERTY',70,'Fonte ufficiale esterna, da usare nel proprio perimetro.',false),
('AI_INFERENCE','PHYSICAL_STATE',10,'Inferenza IA: mai fonte primaria né certificazione.',false)
on conflict (code) do update set domain=excluded.domain,review_rank=excluded.review_rank,description=excluded.description,auto_resolves_conflicts=false,active=true;

insert into public.guimmia_brain_technical_gate_defs(code,label,purpose,disclaimer) values
('PUBLICATION','Gate pubblicazione','Policy interna prima della pubblicazione marketing.','Non è una certificazione di conformità o commerciabilità.'),
('OFFER','Gate proposta','Policy interna prima della gestione formale di una proposta.','Non sostituisce la valutazione dell''agente/professionista.'),
('PRELIMINARY','Gate preliminare','Policy interna prima del preliminare.','Non sostituisce notaio, avvocato o tecnico.'),
('CLOSING','Gate rogito','Readiness interna verso il rogito.','Non è un nulla-osta notarile.')
on conflict (code) do update set label=excluded.label,purpose=excluded.purpose,disclaimer=excluded.disclaimer,active=true;

insert into public.guimmia_brain_legal_source_registry(source_key,jurisdiction,title,authority,url,source_status,notes) values
('IT_DPR_380_2001','IT','D.P.R. 380/2001 — Testo unico edilizia','Normattiva','https://www.normattiva.it/atto/caricaDettaglioAtto?atto.articolo.numero=0&atto.codiceRedazionale=001G0429&atto.dataPubblicazioneGazzetta=2001-10-20&title=lbl.dettaglioAtto','REFERENCE_ONLY','Testo consolidato; verificare versione vigente al momento dell''uso.'),
('IT_DPR_380_2001_ART_9BIS','IT','D.P.R. 380/2001 — art. 9-bis','Normattiva','https://www.normattiva.it/atto/caricaDettaglioAtto?atto.articolo.numero=0&atto.codiceRedazionale=001G0429&atto.dataPubblicazioneGazzetta=2001-10-20&title=lbl.dettaglioAtto','REFERENCE_ONLY','Stato legittimo/documentazione amministrativa.'),
('IT_DPR_380_2001_ART_23TER','IT','D.P.R. 380/2001 — art. 23-ter','Normattiva','https://www.normattiva.it/atto/caricaDettaglioAtto?atto.articolo.numero=0&atto.codiceRedazionale=001G0429&atto.dataPubblicazioneGazzetta=2001-10-20&title=lbl.dettaglioAtto','REFERENCE_ONLY','Mutamento destinazione d''uso.'),
('IT_DPR_380_2001_ART_24','IT','D.P.R. 380/2001 — art. 24','Normattiva','https://www.normattiva.it/atto/caricaDettaglioAtto?atto.articolo.numero=0&atto.codiceRedazionale=001G0429&atto.dataPubblicazioneGazzetta=2001-10-20&title=lbl.dettaglioAtto','REFERENCE_ONLY','Agibilità.'),
('IT_DPR_380_2001_ART_34BIS','IT','D.P.R. 380/2001 — art. 34-bis','Normattiva','https://www.normattiva.it/atto/caricaDettaglioAtto?atto.articolo.numero=0&atto.codiceRedazionale=001G0429&atto.dataPubblicazioneGazzetta=2001-10-20&title=lbl.dettaglioAtto','REFERENCE_ONLY','Tolleranze.'),
('IT_DPR_380_2001_ART_36_36BIS','IT','D.P.R. 380/2001 — artt. 36 e 36-bis','Normattiva','https://www.normattiva.it/atto/caricaDettaglioAtto?atto.articolo.numero=0&atto.codiceRedazionale=001G0429&atto.dataPubblicazioneGazzetta=2001-10-20&title=lbl.dettaglioAtto','REFERENCE_ONLY','Accertamento di conformità.'),
('IT_DPR_380_2001_ART_46','IT','D.P.R. 380/2001 — art. 46','Normattiva','https://www.normattiva.it/atto/caricaDettaglioAtto?atto.articolo.numero=0&atto.codiceRedazionale=001G0429&atto.dataPubblicazioneGazzetta=2001-10-20&title=lbl.dettaglioAtto','REFERENCE_ONLY','Profili formali trasferimenti.')
on conflict (source_key) do update set title=excluded.title,authority=excluded.authority,url=excluded.url,notes=excluded.notes;

insert into public.guimmia_brain_technical_legal_map(ruleset_key,topic,source_keys,requires_regional_local_check) values
('IT_DPR380_GENERAL_TITLES','Titoli edilizi e quadro generale',ARRAY['IT_DPR_380_2001']::text[],false),
('IT_DPR380_STATE_LEGITIMATE','Stato legittimo',ARRAY['IT_DPR_380_2001_ART_9BIS']::text[],true),
('IT_DPR380_USE','Destinazione d''uso',ARRAY['IT_DPR_380_2001_ART_23TER']::text[],true),
('IT_DPR380_AGIBILITY','Agibilità',ARRAY['IT_DPR_380_2001_ART_24']::text[],true),
('IT_DPR380_TOLERANCES','Tolleranze',ARRAY['IT_DPR_380_2001_ART_34BIS']::text[],true),
('IT_DPR380_CONFORMITY','Accertamento di conformità/regolarizzazione',ARRAY['IT_DPR_380_2001_ART_36_36BIS']::text[],true),
('IT_DPR380_TRANSFER_FORMALITIES','Profili formali dei trasferimenti',ARRAY['IT_DPR_380_2001_ART_46']::text[],true),
('IT_REGIONAL_LOCAL_URBAN','Disciplina regionale, comunale e strumenti urbanistici',ARRAY['IT_DPR_380_2001']::text[],true),
('IT_PROTECTED_PROPERTY','Vincoli/tutele e discipline di settore',ARRAY['IT_DPR_380_2001']::text[],true)
on conflict (ruleset_key) do update set topic=excluded.topic,source_keys=excluded.source_keys,requires_regional_local_check=excluded.requires_regional_local_check,active=true;

-- Creiamo i ruleset come MISSING: i riferimenti ufficiali sono pre-caricati ma NON certificati CURRENT.
insert into public.guimmia_brain_rulesets(ruleset_key,jurisdiction,title,status,notes) values
('IT_DPR380_GENERAL_TITLES','IT','Titoli edilizi e quadro generale','MISSING','V76.5: verificare e versionare su fonti ufficiali correnti prima di applicare la regola dinamica.'),
('IT_DPR380_STATE_LEGITIMATE','IT','Stato legittimo','MISSING','V76.5: verificare e versionare su fonti ufficiali correnti prima di applicare la regola dinamica.'),
('IT_DPR380_USE','IT','Destinazione d''uso','MISSING','V76.5: verificare e versionare su fonti ufficiali correnti prima di applicare la regola dinamica.'),
('IT_DPR380_AGIBILITY','IT','Agibilità','MISSING','V76.5: verificare e versionare su fonti ufficiali correnti prima di applicare la regola dinamica.'),
('IT_DPR380_TOLERANCES','IT','Tolleranze','MISSING','V76.5: verificare e versionare su fonti ufficiali correnti prima di applicare la regola dinamica.'),
('IT_DPR380_CONFORMITY','IT','Accertamento di conformità/regolarizzazione','MISSING','V76.5: verificare e versionare su fonti ufficiali correnti prima di applicare la regola dinamica.'),
('IT_DPR380_TRANSFER_FORMALITIES','IT','Profili formali dei trasferimenti','MISSING','V76.5: verificare e versionare su fonti ufficiali correnti prima di applicare la regola dinamica.'),
('IT_REGIONAL_LOCAL_URBAN','IT','Disciplina regionale, comunale e strumenti urbanistici','MISSING','V76.5: verificare e versionare su fonti ufficiali correnti prima di applicare la regola dinamica.'),
('IT_PROTECTED_PROPERTY','IT','Vincoli/tutele e discipline di settore','MISSING','V76.5: verificare e versionare su fonti ufficiali correnti prima di applicare la regola dinamica.')
on conflict (ruleset_key,jurisdiction) do nothing;
