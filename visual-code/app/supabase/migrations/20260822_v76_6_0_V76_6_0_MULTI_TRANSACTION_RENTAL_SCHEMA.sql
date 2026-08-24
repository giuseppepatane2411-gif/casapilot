-- GUIMMIA V76.6 - MULTI-TRANSACTION RENTAL & FISCAL ENGINE
-- Additive schema. Requires V76.5.

do $$ begin
 if to_regclass('public.guimmia_brain_cases') is null then raise exception 'V76.1 Brain Core missing'; end if;
 if to_regclass('public.guimmia_brain_technical_findings') is null then raise exception 'V76.5 Technical Due Diligence missing'; end if;
end $$;

create table if not exists public.guimmia_transaction_profiles (
  code text primary key,
  family text not null,
  label text not null,
  workflow_slug text not null,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guimmia_transaction_gate_defs (
  code text primary key,
  family text not null,
  label text not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.guimmia_case_transaction_profiles (
  case_id uuid primary key references public.guimmia_brain_cases(id) on delete cascade,
  operation_type text not null,
  profile_code text not null references public.guimmia_transaction_profiles(code),
  route_status text not null default 'ROUTED',
  routed_at timestamptz not null default now(),
  routed_by uuid,
  facts_fingerprint text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guimmia_rental_authority_reviews (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  status text not null default 'UNKNOWN',
  authority_basis text,
  evidence jsonb not null default '[]'::jsonb,
  conflicts jsonb not null default '[]'::jsonb,
  reviewer_id uuid,
  reviewed_at timestamptz,
  input_fingerprint text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guimmia_rental_contract_profiles (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  operation_type text not null,
  contract_model text,
  local_agreement_key text,
  duration_days integer,
  furnished boolean,
  status text not null default 'DRAFT',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guimmia_rental_property_readiness (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  status text not null default 'UNKNOWN',
  blockers jsonb not null default '[]'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  input_fingerprint text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guimmia_rental_document_requirement_states (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  requirement_code text not null,
  applicability text not null default 'UNKNOWN',
  status text not null default 'MISSING',
  reason jsonb not null default '{}'::jsonb,
  source_fingerprint text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(case_id,requirement_code)
);

create table if not exists public.guimmia_rental_candidates (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  lead_id uuid,
  display_name text,
  status text not null default 'NEW',
  consent_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guimmia_rental_candidate_income_evidence (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.guimmia_rental_candidates(id) on delete cascade,
  evidence_type text not null,
  document_version_id uuid,
  normalized_summary jsonb not null default '{}'::jsonb,
  verified boolean not null default false,
  verified_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.guimmia_rental_screening_checks (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.guimmia_rental_candidates(id) on delete cascade,
  criterion_code text not null,
  criterion_version integer not null default 1,
  status text not null default 'PENDING',
  evidence jsonb not null default '[]'::jsonb,
  result jsonb not null default '{}'::jsonb,
  contains_protected_attribute boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guimmia_rental_candidate_decisions (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.guimmia_rental_candidates(id) on delete cascade,
  decision text not null,
  decided_by uuid not null,
  rationale text,
  decision_source text not null default 'HUMAN',
  created_at timestamptz not null default now()
);

create table if not exists public.guimmia_rental_contract_reviews (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  contract_instance_id uuid,
  status text not null default 'PENDING',
  reviewer_id uuid,
  review_notes text,
  input_fingerprint text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guimmia_rental_contract_events (
  id bigserial primary key,
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  contract_instance_id uuid,
  event_type text not null,
  actor_type text not null,
  actor_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.guimmia_tourist_unit_compliance (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  cin text,
  cin_status text not null default 'UNKNOWN',
  local_rules_status text not null default 'MISSING',
  safety_status text not null default 'UNKNOWN',
  business_form text not null default 'UNKNOWN',
  scia_requirement text not null default 'UNKNOWN',
  scia_status text not null default 'UNKNOWN',
  guest_reporting_status text not null default 'UNKNOWN',
  input_fingerprint text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guimmia_tourist_compliance_reviews (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  status text not null default 'PENDING',
  ruleset_snapshot jsonb not null default '{}'::jsonb,
  findings jsonb not null default '[]'::jsonb,
  reviewed_by uuid,
  reviewed_at timestamptz,
  input_fingerprint text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guimmia_tourist_guest_stays (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  booking_ref text,
  checkin_at timestamptz,
  checkout_at timestamptz,
  guest_count integer,
  status text not null default 'BOOKED',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guimmia_tourist_guest_reporting_events (
  id bigserial primary key,
  stay_id uuid not null references public.guimmia_tourist_guest_stays(id) on delete cascade,
  event_type text not null,
  status text not null,
  external_reference text,
  performed_by uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.guimmia_transaction_tax_reviews (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  operation_type text not null,
  status text not null default 'PENDING',
  final_verdict_source text,
  ruleset_snapshot jsonb not null default '{}'::jsonb,
  reviewed_by uuid,
  professional_id uuid,
  reviewed_at timestamptz,
  input_fingerprint text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guimmia_transaction_tax_facts (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.guimmia_transaction_tax_reviews(id) on delete cascade,
  fact_code text not null,
  value jsonb,
  provenance text not null,
  verified boolean not null default false,
  evidence jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.guimmia_transaction_tax_scenarios (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.guimmia_transaction_tax_reviews(id) on delete cascade,
  scenario_code text not null,
  inputs jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  disclaimer text not null default 'Simulazione non definitiva; richiede verifica.',
  status text not null default 'DRAFT',
  created_at timestamptz not null default now()
);

create table if not exists public.guimmia_transaction_gate_states (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  gate_code text not null references public.guimmia_transaction_gate_defs(code),
  status text not null default 'REVIEW_REQUIRED',
  reasons jsonb not null default '[]'::jsonb,
  input_fingerprint text,
  decided_by uuid,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(case_id,gate_code)
);

create table if not exists public.guimmia_phase05_snapshots (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  operation_type text not null,
  snapshot jsonb not null,
  input_fingerprint text not null,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.guimmia_contract_template_registry (
  id uuid primary key default gen_random_uuid(),
  template_key text not null,
  operation_type text not null,
  version integer not null,
  status text not null default 'DRAFT',
  approved_by uuid,
  approved_at timestamptz,
  legal_review_ref text,
  content_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(template_key,version)
);

create table if not exists public.guimmia_case_contract_instances (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  template_id uuid not null references public.guimmia_contract_template_registry(id),
  status text not null default 'DRAFT',
  rendered_data jsonb not null default '{}'::jsonb,
  content_hash text,
  signed_at timestamptz,
  signed_by jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guimmia_transaction_payment_roles (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  role text not null default 'UNKNOWN',
  provider text,
  collects_funds boolean not null default false,
  intervenes_in_payment boolean not null default false,
  tax_review_status text not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guimmia_rental_handover_records (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
  status text not null default 'DRAFT',
  keys jsonb not null default '[]'::jsonb,
  meters jsonb not null default '[]'::jsonb,
  inventory_snapshot jsonb not null default '{}'::jsonb,
  condition_evidence jsonb not null default '[]'::jsonb,
  signed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_guimmia_rental_candidates_case on public.guimmia_rental_candidates(case_id,status);
create index if not exists idx_guimmia_tourist_stays_case on public.guimmia_tourist_guest_stays(case_id,checkin_at);
create index if not exists idx_guimmia_tax_reviews_case on public.guimmia_transaction_tax_reviews(case_id,created_at desc);

-- updated_at triggers
do $$ declare t text; begin
 foreach t in array array['guimmia_transaction_profiles','guimmia_case_transaction_profiles','guimmia_rental_authority_reviews','guimmia_rental_contract_profiles','guimmia_rental_property_readiness','guimmia_rental_document_requirement_states','guimmia_rental_candidates','guimmia_rental_screening_checks','guimmia_rental_contract_reviews','guimmia_tourist_unit_compliance','guimmia_tourist_compliance_reviews','guimmia_tourist_guest_stays','guimmia_transaction_tax_reviews','guimmia_transaction_gate_states','guimmia_contract_template_registry','guimmia_case_contract_instances','guimmia_transaction_payment_roles','guimmia_rental_handover_records'] loop
  execute format('drop trigger if exists %I on public.%I','trg_'||t||'_updated_at',t);
  execute format('create trigger %I before update on public.%I for each row execute function public.guimmia_set_updated_at()','trg_'||t||'_updated_at',t);
 end loop;
end $$;

-- RLS: locked by default. Explicit policies will be added only with the final auth role model.
do $$ declare t text; begin
 foreach t in array array['guimmia_transaction_profiles','guimmia_transaction_gate_defs','guimmia_case_transaction_profiles','guimmia_rental_authority_reviews','guimmia_rental_contract_profiles','guimmia_rental_property_readiness','guimmia_rental_document_requirement_states','guimmia_rental_candidates','guimmia_rental_candidate_income_evidence','guimmia_rental_screening_checks','guimmia_rental_candidate_decisions','guimmia_rental_contract_reviews','guimmia_rental_contract_events','guimmia_tourist_unit_compliance','guimmia_tourist_compliance_reviews','guimmia_tourist_guest_stays','guimmia_tourist_guest_reporting_events','guimmia_transaction_tax_reviews','guimmia_transaction_tax_facts','guimmia_transaction_tax_scenarios','guimmia_transaction_gate_states','guimmia_phase05_snapshots','guimmia_contract_template_registry','guimmia_case_contract_instances','guimmia_transaction_payment_roles','guimmia_rental_handover_records'] loop
  execute format('alter table public.%I enable row level security',t);
 end loop;
end $$;
