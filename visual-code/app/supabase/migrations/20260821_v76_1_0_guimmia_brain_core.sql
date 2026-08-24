-- GUIMMIA V76.1.0 — BRAIN CORE
-- Self-contained additive migration. Safe to run whether V76.0.0 was applied or not.

create extension if not exists pgcrypto;

create or replace function public.guimmia_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- -----------------------------------------------------------------------------
-- CONFIGURATION / KNOWLEDGE LAYER
-- -----------------------------------------------------------------------------
create table if not exists public.guimmia_brain_sources (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  source_kind text not null check (source_kind in ('USER_MANUAL','OFFICIAL_LAW','OFFICIAL_GUIDANCE','INTERNAL_POLICY')),
  normative_authority boolean not null default false,
  edition text,
  source_year integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guimmia_brain_modules (
  code text primary key,
  title text not null,
  priority text not null check (priority in ('P0','P1','P2')),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guimmia_brain_cards (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  module text not null,
  title text not null,
  summary text not null,
  stability text not null check (stability in ('STABLE','DYNAMIC','INTERNAL')),
  default_decision_level text not null check (default_decision_level in ('AUTO','REVIEW','AGENT_REQUIRED','PROFESSIONAL_REQUIRED')),
  trigger_definition jsonb not null default '[]'::jsonb,
  required_facts jsonb not null default '[]'::jsonb,
  checks jsonb not null default '[]'::jsonb,
  red_flags jsonb not null default '[]'::jsonb,
  actions jsonb not null default '[]'::jsonb,
  escalation jsonb not null default '[]'::jsonb,
  source_refs jsonb not null default '[]'::jsonb,
  legal_verification_required boolean not null default false,
  version integer not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(code, version)
);

create table if not exists public.guimmia_brain_rulesets (
  id uuid primary key default gen_random_uuid(),
  ruleset_key text not null,
  jurisdiction text not null default 'IT',
  title text not null,
  status text not null default 'MISSING' check (status in ('CURRENT','STALE','MISSING')),
  version text,
  verified_at timestamptz,
  verified_by uuid,
  official_sources jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(ruleset_key, jurisdiction)
);

create table if not exists public.guimmia_brain_workflows (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  title text not null,
  description text,
  version integer not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(slug, version)
);

create table if not exists public.guimmia_brain_workflow_steps (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.guimmia_brain_workflows(id) on delete cascade,
  code text not null,
  phase_code text not null,
  sort_order integer not null,
  label text not null,
  description text,
  required_facts jsonb not null default '[]'::jsonb,
  exit_criteria jsonb not null default '[]'::jsonb,
  client_projection jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workflow_id, code)
);

create table if not exists public.guimmia_brain_rules (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  workflow_id uuid references public.guimmia_brain_workflows(id) on delete cascade,
  step_id uuid references public.guimmia_brain_workflow_steps(id) on delete set null,
  module text not null,
  phase_code text not null,
  title text not null,
  description text not null,
  stability text not null check (stability in ('STABLE','DYNAMIC','INTERNAL')),
  decision_level text not null check (decision_level in ('AUTO','REVIEW','AGENT_REQUIRED','PROFESSIONAL_REQUIRED')),
  severity text not null check (severity in ('info','warning','blocking','critical')),
  condition_definition jsonb not null,
  outcome_definition jsonb not null,
  source_refs jsonb not null default '[]'::jsonb,
  freshness_policy jsonb not null default '{}'::jsonb,
  evidence_policy jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(code, version)
);

-- -----------------------------------------------------------------------------
-- OPERATIONAL / CASE LAYER
-- -----------------------------------------------------------------------------
create table if not exists public.guimmia_brain_cases (
  id uuid primary key default gen_random_uuid(),
  case_code text not null unique,
  workflow_slug text not null,
  workflow_version integer not null default 1,
  owner_user_id uuid,
  listing_id uuid,
  current_phase text not null default 'PHASE_01_CLIENT_MANDATE',
  status text not null default 'ONBOARDING' check (status in ('ONBOARDING','ACTIVE','PAUSED','BLOCKED','CLOSING','CLOSED','CANCELLED')),
  readiness text not null default 'REVIEW_REQUIRED' check (readiness in ('READY','REVIEW_REQUIRED','BLOCKED')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guimmia_brain_case_facts (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  fact_path text not null,
  value jsonb,
  provenance text not null check (provenance in ('USER_DECLARATION','DOCUMENT','OFFICIAL_SOURCE','AGENT','PROFESSIONAL','SYSTEM')),
  source_id text,
  document_id uuid,
  confidence numeric(5,4),
  verified boolean not null default false,
  verified_by uuid,
  verified_at timestamptz,
  captured_at timestamptz not null default now(),
  replaced_by uuid references public.guimmia_brain_case_facts(id),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_guimmia_case_facts_case_path on public.guimmia_brain_case_facts(case_id, fact_path) where active;

create table if not exists public.guimmia_brain_case_evaluations (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  phase_code text not null,
  rule_code text not null,
  rule_version integer not null,
  matched boolean not null,
  skipped boolean not null default false,
  skip_reason text,
  decision_level text check (decision_level in ('AUTO','REVIEW','AGENT_REQUIRED','PROFESSIONAL_REQUIRED')),
  severity text check (severity in ('info','warning','blocking','critical')),
  outcome jsonb not null default '{}'::jsonb,
  trace jsonb not null default '{}'::jsonb,
  ruleset_snapshot jsonb not null default '{}'::jsonb,
  evaluated_at timestamptz not null default now()
);
create index if not exists idx_guimmia_eval_case_phase on public.guimmia_brain_case_evaluations(case_id, phase_code, evaluated_at desc);

create table if not exists public.guimmia_brain_case_flags (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  rule_code text,
  code text not null,
  title text not null,
  message text not null,
  severity text not null check (severity in ('info','warning','blocking','critical')),
  decision_level text not null check (decision_level in ('AUTO','REVIEW','AGENT_REQUIRED','PROFESSIONAL_REQUIRED')),
  status text not null default 'OPEN' check (status in ('OPEN','ACKNOWLEDGED','RESOLVED','DISMISSED')),
  block_progress boolean not null default false,
  assigned_to uuid,
  resolution_note text,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_guimmia_flags_open on public.guimmia_brain_case_flags(case_id, status, severity);

create table if not exists public.guimmia_brain_case_tasks (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  source_rule_code text,
  task_type text not null,
  title text not null,
  description text,
  status text not null default 'TODO' check (status in ('TODO','IN_PROGRESS','WAITING','DONE','CANCELLED')),
  assigned_role text,
  assigned_to uuid,
  due_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guimmia_brain_case_decisions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  source_rule_code text,
  decision_type text not null,
  prompt text not null,
  options jsonb not null default '[]'::jsonb,
  status text not null default 'PENDING' check (status in ('PENDING','DECIDED','SUPERSEDED','CANCELLED')),
  decision jsonb,
  decided_by uuid,
  decided_at timestamptz,
  rationale text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guimmia_brain_case_escalations (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  source_rule_code text,
  professional_type text not null,
  reason text not null,
  status text not null default 'OPEN' check (status in ('OPEN','ASSIGNED','IN_REVIEW','RESOLVED','CANCELLED')),
  professional_id uuid,
  outcome jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guimmia_brain_case_events (
  id bigserial primary key,
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  event_type text not null,
  actor_type text not null check (actor_type in ('USER','AGENT','PROFESSIONAL','SYSTEM','AI')),
  actor_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_guimmia_case_events_case on public.guimmia_brain_case_events(case_id, created_at desc);

-- update_at triggers
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'guimmia_brain_sources','guimmia_brain_modules','guimmia_brain_cards','guimmia_brain_rulesets',
    'guimmia_brain_workflows','guimmia_brain_workflow_steps','guimmia_brain_rules','guimmia_brain_cases',
    'guimmia_brain_case_flags','guimmia_brain_case_tasks','guimmia_brain_case_decisions','guimmia_brain_case_escalations'
  ] LOOP
    EXECUTE format('drop trigger if exists %I on public.%I', 'trg_'||t||'_updated_at', t);
    EXECUTE format('create trigger %I before update on public.%I for each row execute function public.guimmia_set_updated_at()', 'trg_'||t||'_updated_at', t);
  END LOOP;
END $$;

-- RLS: intentionally locked to client-side until explicit policies are designed with the real auth/role model.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'guimmia_brain_sources','guimmia_brain_modules','guimmia_brain_cards','guimmia_brain_rulesets',
    'guimmia_brain_workflows','guimmia_brain_workflow_steps','guimmia_brain_rules','guimmia_brain_cases',
    'guimmia_brain_case_facts','guimmia_brain_case_evaluations','guimmia_brain_case_flags','guimmia_brain_case_tasks',
    'guimmia_brain_case_decisions','guimmia_brain_case_escalations','guimmia_brain_case_events'
  ] LOOP
    EXECUTE format('alter table public.%I enable row level security', t);
  END LOOP;
END $$;

-- Sources
insert into public.guimmia_brain_sources(code,title,source_kind,normative_authority,notes)
values
('REAL_ESTATE_MANUAL_USER','Manuale immobiliare fornito dall''utente','USER_MANUAL',false,'Fonte metodologica e didattica; non trattare come normativa corrente.'),
('GUIMMIA_INTERNAL_POLICY_V1','Policy operativa Guimmia v1','INTERNAL_POLICY',false,'Regole di processo e human-in-the-loop.')
on conflict(code) do update set title=excluded.title,notes=excluded.notes,updated_at=now();

-- Modules
insert into public.guimmia_brain_modules(code,title,priority,sort_order) values
('CLIENT_MANDATE','Cliente & Mandato','P0',10),('OWNERSHIP_TITLE','Proprietà, titolarità & provenienza','P0',20),
('DOCUMENT_DOSSIER','Fascicolo documentale','P0',30),('URBAN_CADASTRAL','Urbanistica & Catasto','P0',40),
('ENCUMBRANCES','Gravami & pubblicità immobiliare','P0',50),('CONDOMINIUM','Condominio','P0',60),
('TAX_SALE','Fiscalità della vendita','P0',70),('MORTGAGES','Mutui & finanziamenti','P1',80),
('VALUATION','Valutazione immobiliare','P0',90),('COMMERCIAL_PREP','Preparazione commerciale','P0',100),
('PUBLISHING','Pubblicazione & Portali','P0',110),('LEADS','Lead & qualificazione','P0',120),
('VISITS','Visite','P0',130),('NEGOTIATION','Negoziazione','P0',140),
('OFFER_PRELIMINARY','Proposta & Preliminare','P0',150),('CLOSING','Rogito & Chiusura','P0',160),
('PRO_COMPLIANCE','Compliance professionale','P0',170),('PRO_NETWORK','Professionisti esterni','P0',180),
('COMPANIES_COMPLEX','Società & casi complessi','P1',190),('SPECIAL_ASSETS','Terreni & immobili speciali','P2',200)
on conflict(code) do update set title=excluded.title,priority=excluded.priority,sort_order=excluded.sort_order,active=true,updated_at=now();

-- Dynamic ruleset placeholders: MUST be verified before production use.
insert into public.guimmia_brain_rulesets(ruleset_key,jurisdiction,title,status) values
('ITALY_AGENCY_COMPLIANCE','IT','Compliance agenzia immobiliare Italia','MISSING'),
('ITALY_DISTANCE_CONTRACTS','IT','Contratti a distanza / consumatori Italia','MISSING'),
('ITALY_URBAN_BUILDING','IT','Urbanistica ed edilizia — ruleset operativo','MISSING'),
('ITALY_REAL_ESTATE_TAX','IT','Fiscalità immobiliare vendita','MISSING'),
('ITALY_APE','IT','APE / prestazione energetica','MISSING'),
('ITALY_CREDIT_BOUNDARY','IT','Perimetro attività creditizia','MISSING')
on conflict(ruleset_key,jurisdiction) do nothing;

-- Workflow and 15 steps
insert into public.guimmia_brain_workflows(slug,title,description,version,active)
values('sale-private-apartment','Golden Path — Vendita residenziale privato / appartamento','Workflow end-to-end del backend Guimmia. Fasi 1-2 eseguibili in V76.1; fasi 3-15 modellate come struttura.',2,true)
on conflict(slug,version) do update set title=excluded.title,description=excluded.description,active=true,updated_at=now();

with wf as (select id from public.guimmia_brain_workflows where slug='sale-private-apartment' and version=2)
insert into public.guimmia_brain_workflow_steps(workflow_id,code,phase_code,sort_order,label,description,required_facts,exit_criteria,client_projection)
select wf.id,x.code,x.phase_code,x.sort_order,x.label,x.description,x.required_facts::jsonb,x.exit_criteria::jsonb,x.client_projection::jsonb
from wf cross join (values
('P01','PHASE_01_CLIENT_MANDATE',10,'Cliente e mandato','Identificazione, potere di agire, compliance, servizio e attivazione.','["client.type","client.identityStatus","mandate.status"]','["identity_routed","mandate_signed","compliance_passed","activation_gate_passed"]','{"title":"Attivazione pratica"}'),
('P02','PHASE_02_OWNERSHIP_TITLE',20,'Titolarità e provenienza','Titolari, diritti e provenienza.','["ownership.titleDocumentStatus","ownership.holdersStatus","ownership.originType"]','["title_document_acquired","holders_reconciled","provenance_routed"]','{"title":"Verifica proprietà"}'),
('P03','PHASE_03_DOCUMENT_DOSSIER',30,'Fascicolo documentale','Inventario e documenti mancanti.','["documents.inventoryStatus"]','["required_documents_identified"]','{"title":"Documenti"}'),
('P04','PHASE_04_URBAN_CADASTRAL',40,'Urbanistica e catasto','Verifiche tecniche e catastali.','["technical.reviewStatus"]','["technical_review_completed"]','{"title":"Verifiche tecniche"}'),
('P05','PHASE_05_ENCUMBRANCES_CONDO_TAX',50,'Gravami, condominio e fiscalità','Controlli preliminari economico-giuridici.','["encumbrances.reviewStatus","condominium.reviewStatus","tax.reviewStatus"]','["encumbrances_routed","condominium_routed","tax_routed"]','{"title":"Controlli preliminari"}'),
('P06','PHASE_06_VALUATION',60,'Valutazione','Metodo, comparabili, correzioni e review agente.','["valuation.status"]','["valuation_method_selected","agent_price_review_completed"]','{"title":"Valutazione"}'),
('P07','PHASE_07_MARKET_READINESS',70,'Prontezza commerciale','Materiale e contenuti pronti.','["marketReadiness.status"]','["publication_ready"]','{"title":"Preparazione annuncio"}'),
('P08','PHASE_08_PUBLISHING',80,'Pubblicazione','Listing Master e distribuzione.','["publishing.status"]','["distribution_started"]','{"title":"Pubblicazione"}'),
('P09','PHASE_09_LEADS',90,'Lead','CRM, deduplica, qualificazione e follow-up.','["leads.pipelineStatus"]','["lead_pipeline_active"]','{"title":"Richieste"}'),
('P10','PHASE_10_VISITS',100,'Visite','Agenda e feedback.','["visits.pipelineStatus"]','["visit_pipeline_active"]','{"title":"Visite"}'),
('P11','PHASE_11_NEGOTIATION',110,'Negoziazione','Scenari e decisioni umane.','["negotiation.status"]','["negotiation_decisions_tracked"]','{"title":"Trattativa"}'),
('P12','PHASE_12_OFFER',120,'Proposta','Preflight proposta e condizioni.','["offer.status"]','["offer_preflight_passed"]','{"title":"Proposta"}'),
('P13','PHASE_13_PRELIMINARY',130,'Preliminare','Checklist e coordinamento professionale.','["preliminary.status"]','["preliminary_ready_or_not_required"]','{"title":"Preliminare"}'),
('P14','PHASE_14_NOTARY_CLOSING',140,'Rogito','Checklist notarile e chiusura.','["closing.status"]','["closing_completed"]','{"title":"Rogito"}'),
('P15','PHASE_15_ARCHIVE',150,'Archiviazione','Audit finale e chiusura fascicolo.','["case.closeStatus"]','["archive_complete"]','{"title":"Vendita conclusa"}')
) as x(code,phase_code,sort_order,label,description,required_facts,exit_criteria,client_projection)
on conflict(workflow_id,code) do update set phase_code=excluded.phase_code,sort_order=excluded.sort_order,label=excluded.label,description=excluded.description,required_facts=excluded.required_facts,exit_criteria=excluded.exit_criteria,client_projection=excluded.client_projection,active=true,updated_at=now();
