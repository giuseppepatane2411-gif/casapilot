-- GUIMMIA V76.3.0 — DOCUMENT INTELLIGENCE CORE
-- Additiva rispetto a V76.1. V76.2 NON richiesta.
-- Migrazione additiva: non elimina tabelle o dati applicativi.

create extension if not exists pgcrypto;

-- Catalogo documentale
create table if not exists public.guimmia_brain_document_catalog_v2 (
  code text primary key,
  label text not null,
  category text not null,
  sensitivity text not null check (sensitivity in ('NORMAL','PERSONAL','HIGH')),
  extraction_profile text,
  description text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guimmia_brain_document_requirement_defs_v2 (
  id uuid primary key default gen_random_uuid(),
  workflow_slug text not null,
  phase_code text not null,
  requirement_key text not null,
  document_code text not null references public.guimmia_brain_document_catalog_v2(code) on delete restrict,
  requirement_level text not null check (requirement_level in ('CORE','CONDITIONAL','OPTIONAL','PROFESSIONAL')),
  exit_policy text not null check (exit_policy in ('ROUTED','RECEIVED','VERIFIED','OPTIONAL')),
  reason text not null,
  condition_definition jsonb not null default '{}'::jsonb,
  legal_ruleset_key text,
  professional_type text,
  active boolean not null default true,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workflow_slug, phase_code, requirement_key, version)
);

-- Documento logico della pratica
create table if not exists public.guimmia_brain_case_document_records (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  document_code text references public.guimmia_brain_document_catalog_v2(code) on delete restrict,
  logical_key text not null,
  title text,
  status text not null default 'EXPECTED' check (status in ('EXPECTED','REQUESTED','RECEIVED','PROCESSING','CLASSIFIED','EXTRACTED','REVIEW_REQUIRED','VERIFIED','REJECTED','SUPERSEDED')),
  sensitivity text not null default 'PERSONAL' check (sensitivity in ('NORMAL','PERSONAL','HIGH')),
  current_version_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(case_id, logical_key)
);

create table if not exists public.guimmia_brain_case_document_versions (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.guimmia_brain_case_document_records(id) on delete cascade,
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  version_no integer not null check (version_no > 0),
  original_filename text,
  mime_type text,
  file_size_bytes bigint,
  page_count integer,
  storage_bucket text,
  storage_path text,
  storage_visibility text not null default 'UNKNOWN' check (storage_visibility in ('PRIVATE','PUBLIC','UNKNOWN')),
  sha256 text,
  content_fingerprint text,
  provenance text not null default 'USER_UPLOAD' check (provenance in ('USER_UPLOAD','AGENT_UPLOAD','PROFESSIONAL_UPLOAD','OFFICIAL_SOURCE','SYSTEM_GENERATED','OTHER')),
  quality text not null default 'UNKNOWN' check (quality in ('UNKNOWN','GOOD','PARTIAL','UNREADABLE')),
  status text not null default 'RECEIVED' check (status in ('RECEIVED','PROCESSING','CLASSIFIED','EXTRACTED','REVIEW_REQUIRED','VERIFIED','REJECTED','SUPERSEDED')),
  is_current boolean not null default true,
  supersedes_version_id uuid references public.guimmia_brain_case_document_versions(id) on delete set null,
  uploaded_by uuid,
  received_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(record_id, version_no)
);
create unique index if not exists uq_guimmia_current_doc_version on public.guimmia_brain_case_document_versions(record_id) where is_current;
create index if not exists idx_guimmia_doc_versions_case on public.guimmia_brain_case_document_versions(case_id, status, is_current);
create index if not exists idx_guimmia_doc_versions_hash on public.guimmia_brain_case_document_versions(case_id, sha256) where sha256 is not null;

alter table public.guimmia_brain_case_document_records
  drop constraint if exists guimmia_doc_record_current_version_fk;
alter table public.guimmia_brain_case_document_records
  add constraint guimmia_doc_record_current_version_fk foreign key (current_version_id) references public.guimmia_brain_case_document_versions(id) on delete set null;

-- Processing jobs idempotenti
create table if not exists public.guimmia_brain_document_ingestion_jobs (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  document_version_id uuid not null references public.guimmia_brain_case_document_versions(id) on delete cascade,
  idempotency_key text not null unique,
  stage text not null check (stage in ('INGEST','CLASSIFY','EXTRACT','RECONCILE','REVIEW_ROUTE')),
  status text not null default 'PENDING' check (status in ('PENDING','RUNNING','SUCCEEDED','FAILED','CANCELLED')),
  attempt_count integer not null default 0,
  error_code text,
  error_detail text,
  started_at timestamptz,
  finished_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guimmia_brain_document_extraction_runs (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  document_version_id uuid not null references public.guimmia_brain_case_document_versions(id) on delete cascade,
  extraction_profile text,
  schema_version text not null,
  status text not null default 'PENDING' check (status in ('PENDING','SUCCEEDED','REVIEW_REQUIRED','FAILED','REJECTED')),
  model_metadata jsonb not null default '{}'::jsonb,
  overall_confidence numeric(5,4),
  raw_structured_output jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guimmia_brain_document_evidence_anchors (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  document_version_id uuid not null references public.guimmia_brain_case_document_versions(id) on delete cascade,
  extraction_run_id uuid references public.guimmia_brain_document_extraction_runs(id) on delete cascade,
  page_number integer,
  field_path text,
  region jsonb not null default '{}'::jsonb,
  excerpt text,
  confidence numeric(5,4),
  created_at timestamptz not null default now()
);
create index if not exists idx_guimmia_anchor_doc on public.guimmia_brain_document_evidence_anchors(document_version_id, page_number);

create table if not exists public.guimmia_brain_document_claims (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  document_version_id uuid not null references public.guimmia_brain_case_document_versions(id) on delete cascade,
  extraction_run_id uuid references public.guimmia_brain_document_extraction_runs(id) on delete set null,
  evidence_anchor_id uuid references public.guimmia_brain_document_evidence_anchors(id) on delete set null,
  fact_path text not null,
  raw_value jsonb,
  normalized_value jsonb,
  normalization_version text,
  confidence numeric(5,4),
  source_rank integer not null default 10,
  status text not null default 'PROPOSED' check (status in ('PROPOSED','REVIEW_REQUIRED','ACCEPTED','REJECTED','SUPERSEDED')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  promoted_fact_id uuid references public.guimmia_brain_case_facts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_guimmia_claims_case_fact on public.guimmia_brain_document_claims(case_id, fact_path, status);

create table if not exists public.guimmia_brain_document_reconciliation_issues (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  issue_kind text not null check (issue_kind in ('CLAIM_CONFLICT','FACT_CONFLICT','SOURCE_CONFLICT','SECURITY','QUALITY','OTHER')),
  fact_path text,
  claim_ids uuid[] not null default '{}',
  document_version_ids uuid[] not null default '{}',
  conflicting_values jsonb not null default '[]'::jsonb,
  severity text not null default 'warning' check (severity in ('info','warning','blocking','critical')),
  decision_level text not null default 'REVIEW' check (decision_level in ('AUTO','REVIEW','AGENT_REQUIRED','PROFESSIONAL_REQUIRED')),
  status text not null default 'OPEN' check (status in ('OPEN','IN_REVIEW','RESOLVED','DISMISSED')),
  assigned_to uuid,
  resolution jsonb not null default '{}'::jsonb,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_guimmia_recon_open on public.guimmia_brain_document_reconciliation_issues(case_id, status, severity);

create table if not exists public.guimmia_brain_document_reviews (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  document_version_id uuid references public.guimmia_brain_case_document_versions(id) on delete cascade,
  claim_id uuid references public.guimmia_brain_document_claims(id) on delete cascade,
  review_type text not null check (review_type in ('QUALITY','CLASSIFICATION','EXTRACTION','CLAIM','CONFLICT','SECURITY','OTHER')),
  status text not null default 'OPEN' check (status in ('OPEN','IN_REVIEW','APPROVED','REJECTED','CANCELLED')),
  decision_level text not null check (decision_level in ('REVIEW','AGENT_REQUIRED','PROFESSIONAL_REQUIRED')),
  assigned_to uuid,
  decision jsonb not null default '{}'::jsonb,
  decided_by uuid,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guimmia_brain_case_document_requirement_states (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  requirement_key text not null,
  requirement_version integer not null default 1,
  applicability text not null check (applicability in ('APPLICABLE','NOT_APPLICABLE','UNKNOWN')),
  state text not null check (state in ('PENDING','ROUTED','RECEIVED','VERIFIED','WAIVED','NOT_APPLICABLE','UNKNOWN','STALE')),
  document_record_id uuid references public.guimmia_brain_case_document_records(id) on delete set null,
  facts_fingerprint text,
  ruleset_fingerprint text,
  legal_ruleset_snapshot jsonb not null default '{}'::jsonb,
  reason text,
  evaluated_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(case_id, requirement_key, requirement_version)
);

create table if not exists public.guimmia_brain_case_dossier_snapshots (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  phase_code text not null default 'PHASE_03_DOCUMENT_DOSSIER',
  brain_version text not null,
  readiness text not null check (readiness in ('READY','REVIEW_REQUIRED','BLOCKED')),
  facts_fingerprint text not null,
  rules_fingerprint text not null,
  document_version_ids uuid[] not null default '{}',
  requirement_state_ids uuid[] not null default '{}',
  issue_ids uuid[] not null default '{}',
  ruleset_snapshot jsonb not null default '{}'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  blockers jsonb not null default '[]'::jsonb,
  reviews jsonb not null default '[]'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists idx_guimmia_dossier_snapshot_case on public.guimmia_brain_case_dossier_snapshots(case_id, created_at desc);

create table if not exists public.guimmia_brain_document_access_log (
  id bigserial primary key,
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  document_version_id uuid references public.guimmia_brain_case_document_versions(id) on delete set null,
  actor_user_id uuid,
  actor_type text not null default 'SYSTEM' check (actor_type in ('USER','AGENT','PROFESSIONAL','SYSTEM','ADMIN')),
  action text not null check (action in ('VIEW','DOWNLOAD','UPLOAD','REPLACE','CLASSIFY','EXTRACT','REVIEW','DELETE_REQUEST','OTHER')),
  purpose text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

-- updated_at triggers
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'guimmia_brain_document_catalog_v2','guimmia_brain_document_requirement_defs_v2',
    'guimmia_brain_case_document_records','guimmia_brain_case_document_versions',
    'guimmia_brain_document_ingestion_jobs','guimmia_brain_document_extraction_runs',
    'guimmia_brain_document_claims','guimmia_brain_document_reconciliation_issues',
    'guimmia_brain_document_reviews','guimmia_brain_case_document_requirement_states'
  ] LOOP
    EXECUTE format('drop trigger if exists %I on public.%I', 'trg_'||t||'_updated_at', t);
    EXECUTE format('create trigger %I before update on public.%I for each row execute function public.guimmia_set_updated_at()', 'trg_'||t||'_updated_at', t);
  END LOOP;
END $$;

-- RLS chiusa di default
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'guimmia_brain_document_catalog_v2','guimmia_brain_document_requirement_defs_v2',
    'guimmia_brain_case_document_records','guimmia_brain_case_document_versions',
    'guimmia_brain_document_ingestion_jobs','guimmia_brain_document_extraction_runs',
    'guimmia_brain_document_evidence_anchors','guimmia_brain_document_claims',
    'guimmia_brain_document_reconciliation_issues','guimmia_brain_document_reviews',
    'guimmia_brain_case_document_requirement_states','guimmia_brain_case_dossier_snapshots',
    'guimmia_brain_document_access_log'
  ] LOOP
    EXECUTE format('alter table public.%I enable row level security', t);
  END LOOP;
END $$;

-- aggiorna Golden Path P03
update public.guimmia_brain_workflows
set description='Workflow end-to-end del backend Guimmia. Fasi 1-3 eseguibili; V76.3 introduce Document Intelligence con versioning, evidence, reconciliation e snapshot.', updated_at=now()
where slug='sale-private-apartment' and version=2;

update public.guimmia_brain_workflow_steps
set required_facts='["documents.inventoryStatus","documents.requirementsStatus","documents.dossierReadiness","documents.snapshotStatus"]'::jsonb,
    exit_criteria='["requirements_current","missing_documents_routed","blocking_conflicts_resolved","security_gate_passed","dossier_snapshot_current"]'::jsonb,
    description='Pipeline documentale: requisiti tri-state, versioning, evidence anchor, claims, conflitti, review, sicurezza e snapshot.',
    updated_at=now()
where code='P03' and phase_code='PHASE_03_DOCUMENT_DOSSIER';
