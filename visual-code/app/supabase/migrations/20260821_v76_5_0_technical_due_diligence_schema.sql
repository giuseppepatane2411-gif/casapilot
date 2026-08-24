-- GUIMMIA V76.5 — Technical Due Diligence Engine
-- Additive migration. Prerequisite: V76.3 Document Intelligence installed.
-- Questa migration crea il modello tecnico; NON rende "corrente" alcuna norma.

create table if not exists public.guimmia_brain_technical_finding_catalog (
  code text primary key,
  label text not null,
  default_severity text not null check (default_severity in ('info','warning','blocking','critical')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guimmia_brain_technical_comparison_defs (
  key text primary key,
  left_path text not null,
  right_path text not null,
  requires_professional_interpretation boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guimmia_brain_technical_source_classes (
  code text primary key,
  domain text not null,
  review_rank integer not null check (review_rank between 0 and 100),
  description text not null,
  auto_resolves_conflicts boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guimmia_brain_technical_gate_defs (
  code text primary key check (code in ('PUBLICATION','OFFER','PRELIMINARY','CLOSING')),
  label text not null,
  purpose text not null,
  disclaimer text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guimmia_brain_legal_source_registry (
  source_key text primary key,
  jurisdiction text not null default 'IT',
  title text not null,
  authority text not null,
  url text not null,
  source_status text not null default 'REFERENCE_ONLY' check (source_status in ('REFERENCE_ONLY','VERIFIED_CURRENT','STALE')),
  verified_at timestamptz,
  verified_by text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guimmia_brain_technical_legal_map (
  ruleset_key text primary key,
  topic text not null,
  source_keys text[] not null default '{}',
  scope_notes text,
  requires_regional_local_check boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guimmia_brain_technical_reviews (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  review_version integer not null default 1,
  status text not null default 'NOT_STARTED' check (status in ('NOT_STARTED','COLLECTING','IN_REVIEW','PROFESSIONAL_REQUIRED','APPROVED','REJECTED','STALE')),
  input_fingerprint text,
  dossier_snapshot_id uuid references public.guimmia_brain_case_dossier_snapshots(id) on delete set null,
  assigned_agent_id uuid,
  assigned_professional_user_id uuid,
  professional_role text,
  scope jsonb not null default '{}'::jsonb,
  source_map_status text not null default 'INCOMPLETE' check (source_map_status in ('INCOMPLETE','COMPLETE','STALE')),
  timeline_status text not null default 'NOT_BUILT' check (timeline_status in ('NOT_BUILT','BUILT','REVIEWED','STALE')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(case_id, review_version)
);
create index if not exists idx_guimmia_technical_review_case on public.guimmia_brain_technical_reviews(case_id,status,updated_at desc);

create table if not exists public.guimmia_brain_technical_case_scopes (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  review_id uuid not null references public.guimmia_brain_technical_reviews(id) on delete cascade,
  status text not null default 'DRAFT' check (status in ('DRAFT','LOCKED','STALE')),
  primary_unit jsonb not null default '{}'::jsonb,
  components jsonb not null default '[]'::jsonb,
  exclusions jsonb not null default '[]'::jsonb,
  approved_by uuid,
  approved_at timestamptz,
  input_fingerprint text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(review_id)
);

create table if not exists public.guimmia_brain_technical_sources (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  review_id uuid not null references public.guimmia_brain_technical_reviews(id) on delete cascade,
  source_class_code text not null references public.guimmia_brain_technical_source_classes(code) on delete restrict,
  domain text not null,
  document_version_id uuid references public.guimmia_brain_case_document_versions(id) on delete set null,
  evidence_anchor_id uuid references public.guimmia_brain_document_evidence_anchors(id) on delete set null,
  source_ref text,
  issued_at timestamptz,
  observed_at timestamptz,
  is_current boolean not null default true,
  verified_by_professional boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_guimmia_technical_sources_case on public.guimmia_brain_technical_sources(case_id,domain,is_current);

create table if not exists public.guimmia_brain_technical_observations (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  review_id uuid not null references public.guimmia_brain_technical_reviews(id) on delete cascade,
  source_id uuid references public.guimmia_brain_technical_sources(id) on delete set null,
  observation_type text not null,
  observed_value jsonb,
  location_ref text,
  evidence jsonb not null default '[]'::jsonb,
  observer_role text not null,
  observed_by uuid,
  observed_at timestamptz not null default now(),
  status text not null default 'OBSERVED' check (status in ('OBSERVED','REVIEWED','STALE')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guimmia_brain_technical_cadastral_units (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  review_id uuid references public.guimmia_brain_technical_reviews(id) on delete cascade,
  source_id uuid references public.guimmia_brain_technical_sources(id) on delete set null,
  source_document_version_id uuid references public.guimmia_brain_case_document_versions(id) on delete set null,
  sheet text, parcel text, subaltern text,
  category text, class text, cadastral_address text,
  cadastral_surface numeric,
  rooms_or_consistency text,
  cadastral_income numeric,
  source_kind text not null default 'CADASTRAL_CURRENT',
  is_current boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_guimmia_cadastral_units_case on public.guimmia_brain_technical_cadastral_units(case_id,is_current);

create table if not exists public.guimmia_brain_technical_urban_titles (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  review_id uuid references public.guimmia_brain_technical_reviews(id) on delete cascade,
  source_id uuid references public.guimmia_brain_technical_sources(id) on delete set null,
  source_document_version_id uuid references public.guimmia_brain_case_document_versions(id) on delete set null,
  title_kind text not null,
  reference_no text,
  issue_or_submission_date date,
  authority text,
  status text not null default 'UNKNOWN' check (status in ('DOCUMENTED','DECLARED','PENDING','UNKNOWN','SUPERSEDED')),
  linked_work_refs jsonb not null default '[]'::jsonb,
  authorized_scope jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_guimmia_urban_titles_case on public.guimmia_brain_technical_urban_titles(case_id,issue_or_submission_date);

create table if not exists public.guimmia_brain_technical_timeline_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  review_id uuid not null references public.guimmia_brain_technical_reviews(id) on delete cascade,
  event_type text not null check (event_type in ('CONSTRUCTION','URBAN_TITLE','VARIANT','WORKS','CHANGE_OF_USE','SANATORIA','CONDONO','AGIBILITY','CADASTRAL_UPDATE','OTHER')),
  event_date date,
  status text not null default 'DECLARED' check (status in ('DECLARED','DOCUMENTED','VERIFIED','UNKNOWN')),
  source_ids uuid[] not null default '{}',
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_guimmia_technical_timeline_case on public.guimmia_brain_technical_timeline_events(case_id,event_date);

create table if not exists public.guimmia_brain_technical_record_access_requests (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  review_id uuid not null references public.guimmia_brain_technical_reviews(id) on delete cascade,
  authority text,
  office text,
  request_scope jsonb not null default '{}'::jsonb,
  status text not null default 'TO_REQUEST' check (status in ('NOT_REQUIRED','TO_REQUEST','REQUESTED','PARTIAL','COMPLETE','FAILED','STALE')),
  requested_at timestamptz,
  completed_at timestamptz,
  response_document_version_ids uuid[] not null default '{}',
  failure_reason text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_guimmia_record_access_case on public.guimmia_brain_technical_record_access_requests(case_id,status);

create table if not exists public.guimmia_brain_technical_comparisons (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  review_id uuid not null references public.guimmia_brain_technical_reviews(id) on delete cascade,
  comparison_key text not null references public.guimmia_brain_technical_comparison_defs(key) on delete restrict,
  left_value jsonb, right_value jsonb,
  left_source_id uuid references public.guimmia_brain_technical_sources(id) on delete set null,
  right_source_id uuid references public.guimmia_brain_technical_sources(id) on delete set null,
  result text not null check (result in ('MATCH','MISMATCH','PARTIAL','UNKNOWN','NOT_APPLICABLE')),
  materiality text not null default 'UNKNOWN' check (materiality in ('LOW','MEDIUM','HIGH','UNKNOWN')),
  requires_professional_interpretation boolean not null default true,
  input_fingerprint text,
  status text not null default 'CURRENT' check (status in ('CURRENT','STALE')),
  notes text,
  evaluated_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(review_id,comparison_key)
);

create table if not exists public.guimmia_brain_technical_findings (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  review_id uuid not null references public.guimmia_brain_technical_reviews(id) on delete cascade,
  finding_code text not null references public.guimmia_brain_technical_finding_catalog(code) on delete restrict,
  title text not null,
  description text,
  severity text not null check (severity in ('info','warning','blocking','critical')),
  decision_level text not null check (decision_level in ('REVIEW','AGENT_REQUIRED','PROFESSIONAL_REQUIRED')),
  gate_impact text[] not null default '{}',
  reason_codes text[] not null default '{}',
  status text not null default 'OPEN' check (status in ('OPEN','IN_REVIEW','RESOLVED','DISMISSED','STALE')),
  professional_role text,
  resolution jsonb not null default '{}'::jsonb,
  input_fingerprint text,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_guimmia_technical_findings_open on public.guimmia_brain_technical_findings(case_id,status,severity);

create table if not exists public.guimmia_brain_technical_evidence_links (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  finding_id uuid references public.guimmia_brain_technical_findings(id) on delete cascade,
  comparison_id uuid references public.guimmia_brain_technical_comparisons(id) on delete cascade,
  source_id uuid references public.guimmia_brain_technical_sources(id) on delete set null,
  evidence_anchor_id uuid references public.guimmia_brain_document_evidence_anchors(id) on delete set null,
  document_version_id uuid references public.guimmia_brain_case_document_versions(id) on delete set null,
  fact_id uuid references public.guimmia_brain_case_facts(id) on delete set null,
  relation text not null default 'SUPPORTS' check (relation in ('SUPPORTS','CONTRADICTS','CONTEXT','SOURCE')),
  notes text,
  created_at timestamptz not null default now(),
  check (finding_id is not null or comparison_id is not null)
);

create table if not exists public.guimmia_brain_technical_risk_register (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  review_id uuid not null references public.guimmia_brain_technical_reviews(id) on delete cascade,
  risk_code text not null,
  title text not null,
  severity text not null check (severity in ('info','warning','blocking','critical')),
  status text not null default 'OPEN' check (status in ('OPEN','MITIGATED','ACCEPTED','CLOSED','STALE')),
  gate_impact text[] not null default '{}',
  owner_role text not null,
  finding_ids uuid[] not null default '{}',
  mitigation text,
  accepted_by uuid,
  accepted_at timestamptz,
  input_fingerprint text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(review_id,risk_code)
);

create table if not exists public.guimmia_brain_technical_professional_requests (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  review_id uuid not null references public.guimmia_brain_technical_reviews(id) on delete cascade,
  requested_role text not null default 'TECHNICIAN',
  reason_codes text[] not null default '{}',
  status text not null default 'OPEN' check (status in ('OPEN','ASSIGNED','IN_PROGRESS','COMPLETED','CANCELLED')),
  professional_user_id uuid,
  marketplace_request_id uuid,
  scope jsonb not null default '{}'::jsonb,
  requested_checks jsonb not null default '[]'::jsonb,
  input_source_ids uuid[] not null default '{}',
  input_document_version_ids uuid[] not null default '{}',
  output_requirements jsonb not null default '[]'::jsonb,
  legal_ruleset_keys text[] not null default '{}',
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guimmia_brain_technical_signoffs (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  review_id uuid not null references public.guimmia_brain_technical_reviews(id) on delete cascade,
  professional_request_id uuid references public.guimmia_brain_technical_professional_requests(id) on delete set null,
  signoff_type text not null check (signoff_type in ('AGENT_REVIEW','TECHNICAL_REVIEW','NOTARY_REVIEW','OTHER_PROFESSIONAL')),
  status text not null check (status in ('APPROVED','REJECTED','STALE')),
  signer_user_id uuid,
  signer_role text not null,
  scope jsonb not null default '{}'::jsonb,
  findings_addressed uuid[] not null default '{}',
  limitations text,
  input_fingerprint text not null,
  document_version_ids uuid[] not null default '{}',
  signed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.guimmia_brain_technical_gate_decisions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  review_id uuid not null references public.guimmia_brain_technical_reviews(id) on delete cascade,
  gate_code text not null references public.guimmia_brain_technical_gate_defs(code) on delete restrict,
  status text not null check (status in ('NOT_EVALUATED','READY','REVIEW_REQUIRED','BLOCKED','STALE')),
  reason_codes text[] not null default '{}',
  finding_ids uuid[] not null default '{}',
  signoff_ids uuid[] not null default '{}',
  ruleset_snapshot jsonb not null default '{}'::jsonb,
  input_fingerprint text not null,
  decided_by text not null default 'SYSTEM_POLICY',
  decided_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(review_id,gate_code)
);

create table if not exists public.guimmia_brain_technical_override_log (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  review_id uuid not null references public.guimmia_brain_technical_reviews(id) on delete cascade,
  target_type text not null check (target_type in ('FINDING','GATE','RISK','OTHER')),
  target_id uuid,
  requested_action text not null,
  status text not null check (status in ('APPROVED','REJECTED','EXPIRED')),
  reason text not null,
  scope jsonb not null default '{}'::jsonb,
  expires_at timestamptz,
  decided_by uuid not null,
  decided_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.guimmia_brain_technical_agent_memos (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  review_id uuid not null references public.guimmia_brain_technical_reviews(id) on delete cascade,
  status text not null default 'CURRENT' check (status in ('CURRENT','STALE')),
  input_fingerprint text not null,
  overall_status text not null,
  key_facts jsonb not null default '[]'::jsonb,
  open_findings jsonb not null default '[]'::jsonb,
  professional_actions jsonb not null default '[]'::jsonb,
  gate_summary jsonb not null default '{}'::jsonb,
  disclaimer text not null,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.guimmia_brain_technical_invalidation_log (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  trigger_type text not null,
  trigger_ref text,
  previous_fingerprint text,
  new_fingerprint text,
  invalidated_objects jsonb not null default '[]'::jsonb,
  reason text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.guimmia_brain_technical_snapshots (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  review_id uuid not null references public.guimmia_brain_technical_reviews(id) on delete cascade,
  phase_code text not null default 'PHASE_04_URBAN_CADASTRAL',
  brain_version text not null default '76.5.0',
  readiness text not null check (readiness in ('READY','REVIEW_REQUIRED','BLOCKED')),
  dossier_snapshot_id uuid references public.guimmia_brain_case_dossier_snapshots(id) on delete set null,
  input_fingerprint text not null,
  rules_fingerprint text not null,
  scope_snapshot jsonb not null default '{}'::jsonb,
  source_snapshot jsonb not null default '[]'::jsonb,
  timeline_snapshot jsonb not null default '[]'::jsonb,
  comparison_ids uuid[] not null default '{}',
  finding_ids uuid[] not null default '{}',
  risk_ids uuid[] not null default '{}',
  signoff_ids uuid[] not null default '{}',
  gate_decision_ids uuid[] not null default '{}',
  ruleset_snapshot jsonb not null default '{}'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  blockers jsonb not null default '[]'::jsonb,
  reviews jsonb not null default '[]'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists idx_guimmia_technical_snapshot_case on public.guimmia_brain_technical_snapshots(case_id,created_at desc);

-- Trigger updated_at per tabelle mutabili.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'guimmia_brain_technical_finding_catalog','guimmia_brain_technical_comparison_defs','guimmia_brain_technical_source_classes',
    'guimmia_brain_technical_gate_defs','guimmia_brain_legal_source_registry','guimmia_brain_technical_legal_map',
    'guimmia_brain_technical_reviews','guimmia_brain_technical_case_scopes','guimmia_brain_technical_sources',
    'guimmia_brain_technical_observations','guimmia_brain_technical_cadastral_units','guimmia_brain_technical_urban_titles',
    'guimmia_brain_technical_timeline_events','guimmia_brain_technical_record_access_requests','guimmia_brain_technical_comparisons',
    'guimmia_brain_technical_findings','guimmia_brain_technical_risk_register','guimmia_brain_technical_professional_requests'
  ] LOOP
    EXECUTE format('drop trigger if exists %I on public.%I','trg_'||t||'_updated_at',t);
    EXECUTE format('create trigger %I before update on public.%I for each row execute function public.guimmia_set_updated_at()','trg_'||t||'_updated_at',t);
  END LOOP;
END $$;

-- Backend first: RLS attiva e nessun grant diretto anon/authenticated.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'guimmia_brain_technical_finding_catalog','guimmia_brain_technical_comparison_defs','guimmia_brain_technical_source_classes',
    'guimmia_brain_technical_gate_defs','guimmia_brain_legal_source_registry','guimmia_brain_technical_legal_map',
    'guimmia_brain_technical_reviews','guimmia_brain_technical_case_scopes','guimmia_brain_technical_sources',
    'guimmia_brain_technical_observations','guimmia_brain_technical_cadastral_units','guimmia_brain_technical_urban_titles',
    'guimmia_brain_technical_timeline_events','guimmia_brain_technical_record_access_requests','guimmia_brain_technical_comparisons',
    'guimmia_brain_technical_findings','guimmia_brain_technical_evidence_links','guimmia_brain_technical_risk_register',
    'guimmia_brain_technical_professional_requests','guimmia_brain_technical_signoffs','guimmia_brain_technical_gate_decisions',
    'guimmia_brain_technical_override_log','guimmia_brain_technical_agent_memos','guimmia_brain_technical_invalidation_log',
    'guimmia_brain_technical_snapshots'
  ] LOOP
    EXECUTE format('alter table public.%I enable row level security',t);
    EXECUTE format('revoke all on public.%I from anon, authenticated',t);
  END LOOP;
END $$;
