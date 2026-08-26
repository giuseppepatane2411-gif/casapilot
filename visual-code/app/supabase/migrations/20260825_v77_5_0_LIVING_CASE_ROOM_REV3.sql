-- GUIMMIA V77.5.0 - Living Case Room, conversational operations and controlled property sheet
-- OpenAI extracts a draft from natural language; the customer must confirm it.

create extension if not exists pgcrypto;

do $$
begin
  if to_regclass('public.guimmia_ai_brain_profiles') is null
     or to_regclass('public.guimmia_ai_brain_interactions') is null
     or to_regclass('public.guimmia_ai_usage_events') is null then
    raise exception 'V77.5 requires verified V77.4 REV2';
  end if;
end $$;

create table if not exists public.guimmia_ai_intake_profiles (
  singleton_key text primary key check (singleton_key = 'GUIMMIA_CONVERSATIONAL_INTAKE'),
  operating_agency_id uuid not null unique references public.guimmia_online_agency_profile(id),
  version text not null check (version = '77.5.0'),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'PAUSED')),
  execution_mode text not null default 'DRY_RUN' check (execution_mode = 'DRY_RUN'),
  model text not null default 'gpt-5.6-luna' check (model = 'gpt-5.6-luna'),
  structured_output_required boolean not null default true
    check (structured_output_required = true),
  controlled_vocabulary_required boolean not null default true
    check (controlled_vocabulary_required = true),
  location_confirmation_required boolean not null default true
    check (location_confirmation_required = true),
  human_confirmation_required boolean not null default true
    check (human_confirmation_required = true),
  automatic_case_creation_enabled boolean not null default false
    check (automatic_case_creation_enabled = false),
  personal_contact_data_to_model boolean not null default false
    check (personal_contact_data_to_model = false),
  max_output_tokens integer not null default 520
    check (max_output_tokens = 520),
  max_request_cost_usd numeric(10,4) not null default 0.01
    check (max_request_cost_usd between 0 and 0.01),
  reuse_window_minutes integer not null default 15
    check (reuse_window_minutes = 15),
  rate_limit_requests integer not null default 20
    check (rate_limit_requests = 20),
  rate_limit_window_minutes integer not null default 30
    check (rate_limit_window_minutes = 30),
  controlled_objectives jsonb not null
    check (jsonb_typeof(controlled_objectives) = 'array'),
  controlled_property_types jsonb not null
    check (jsonb_typeof(controlled_property_types) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guimmia_ai_intake_interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  draft_id text not null check (length(draft_id) between 1 and 120),
  request_fingerprint text not null check (length(request_fingerprint) = 64),
  message_hash text not null check (length(message_hash) = 64),
  message_length integer not null check (message_length between 1 and 2000),
  model text not null check (model = 'gpt-5.6-luna'),
  execution_mode text not null check (execution_mode = 'DRY_RUN'),
  status text not null check (status in ('COMPLETED', 'FAILED', 'BLOCKED')),
  response_id text,
  ai_result jsonb,
  extracted_fields text[] not null default '{}'::text[],
  input_tokens integer not null default 0 check (input_tokens >= 0),
  cached_input_tokens integer not null default 0
    check (cached_input_tokens between 0 and input_tokens),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  estimated_cost_usd numeric(12,6) not null default 0
    check (estimated_cost_usd between 0 and 0.01),
  error_code text,
  human_confirmation_required boolean not null default true
    check (human_confirmation_required = true),
  automatic_case_created boolean not null default false
    check (automatic_case_created = false),
  personal_contact_data_sent boolean not null default false
    check (personal_contact_data_sent = false),
  controlled_vocabulary_applied boolean not null default true
    check (controlled_vocabulary_applied = true),
  created_at timestamptz not null default now()
);

alter table public.guimmia_ai_usage_events
  add column if not exists intake_interaction_id uuid
    references public.guimmia_ai_intake_interactions(id) on delete cascade;

alter table public.guimmia_ai_usage_events
  drop constraint if exists guimmia_ai_usage_events_use_case_check,
  drop constraint if exists guimmia_ai_usage_events_source_check;

alter table public.guimmia_ai_usage_events
  add constraint guimmia_ai_usage_events_use_case_check check (use_case in (
    'PROPERTY_VALUATION',
    'BRAIN_GUIDANCE',
    'DOCUMENT_CHECK',
    'NEXT_ACTION',
    'COMMUNICATION_DRAFT',
    'CONVERSATIONAL_INTAKE'
  )),
  add constraint guimmia_ai_usage_events_source_check check (
    (use_case = 'PROPERTY_VALUATION'
      and valuation_lead_id is not null
      and brain_interaction_id is null
      and intake_interaction_id is null)
    or
    (use_case in ('BRAIN_GUIDANCE','DOCUMENT_CHECK','NEXT_ACTION','COMMUNICATION_DRAFT')
      and valuation_lead_id is null
      and brain_interaction_id is not null
      and intake_interaction_id is null)
    or
    (use_case = 'CONVERSATIONAL_INTAKE'
      and valuation_lead_id is null
      and brain_interaction_id is null
      and intake_interaction_id is not null)
  );

create unique index if not exists idx_guimmia_v775_completed_fingerprint
  on public.guimmia_ai_intake_interactions(request_fingerprint)
  where status = 'COMPLETED';
create index if not exists idx_guimmia_v775_intake_user_created
  on public.guimmia_ai_intake_interactions(user_id, created_at desc);
create index if not exists idx_guimmia_v775_intake_draft_created
  on public.guimmia_ai_intake_interactions(draft_id, created_at desc);
create index if not exists idx_guimmia_v775_usage_intake
  on public.guimmia_ai_usage_events(intake_interaction_id)
  where intake_interaction_id is not null;

insert into public.guimmia_ai_intake_profiles (
  singleton_key,
  operating_agency_id,
  version,
  status,
  execution_mode,
  model,
  structured_output_required,
  controlled_vocabulary_required,
  location_confirmation_required,
  human_confirmation_required,
  automatic_case_creation_enabled,
  personal_contact_data_to_model,
  max_output_tokens,
  max_request_cost_usd,
  reuse_window_minutes,
  rate_limit_requests,
  rate_limit_window_minutes,
  controlled_objectives,
  controlled_property_types
)
select
  'GUIMMIA_CONVERSATIONAL_INTAKE',
  id,
  '77.5.0',
  'ACTIVE',
  'DRY_RUN',
  'gpt-5.6-luna',
  true,
  true,
  true,
  true,
  false,
  false,
  520,
  0.01,
  15,
  20,
  30,
  '["Vendere","Acquistare","Affittare","Cercare in affitto","Valutare per vendere","Valutare per affittare"]'::jsonb,
  '["Appartamento","Attico","Villa","Villetta","Casa indipendente","Rustico o casale","Terreno","Locale commerciale","Ufficio","Magazzino","Garage o box"]'::jsonb
from public.guimmia_online_agency_profile
where singleton_key = 'GUIMMIA' and code = 'GUIMMIA'
on conflict (singleton_key) do update set
  operating_agency_id = excluded.operating_agency_id,
  version = '77.5.0',
  status = 'ACTIVE',
  execution_mode = 'DRY_RUN',
  model = 'gpt-5.6-luna',
  structured_output_required = true,
  controlled_vocabulary_required = true,
  location_confirmation_required = true,
  human_confirmation_required = true,
  automatic_case_creation_enabled = false,
  personal_contact_data_to_model = false,
  max_output_tokens = 520,
  max_request_cost_usd = 0.01,
  reuse_window_minutes = 15,
  rate_limit_requests = 20,
  rate_limit_window_minutes = 30,
  controlled_objectives = excluded.controlled_objectives,
  controlled_property_types = excluded.controlled_property_types,
  updated_at = now();

create or replace function public.guimmia_v775_intake_guard()
returns trigger
language plpgsql
as $$
begin
  if new.execution_mode <> 'DRY_RUN'
     or new.human_confirmation_required is not true
     or new.automatic_case_created is true
     or new.personal_contact_data_sent is true
     or new.controlled_vocabulary_applied is not true then
    raise exception 'v775_human_confirmation_and_controlled_vocabulary_required';
  end if;

  if new.status = 'COMPLETED' then
    if new.response_id is null
       or new.ai_result is null
       or jsonb_typeof(new.ai_result) <> 'object'
       or new.error_code is not null then
      raise exception 'v775_completed_structured_result_required';
    end if;
  else
    if new.ai_result is not null or new.error_code is null then
      raise exception 'v775_failed_intake_error_required';
    end if;
  end if;

  if new.cached_input_tokens > new.input_tokens
     or new.estimated_cost_usd > 0.01 then
    raise exception 'v775_intake_usage_limit_exceeded';
  end if;

  return new;
end $$;

drop trigger if exists trg_guimmia_v775_intake_guard
  on public.guimmia_ai_intake_interactions;
create trigger trg_guimmia_v775_intake_guard
before insert on public.guimmia_ai_intake_interactions
for each row execute function public.guimmia_v775_intake_guard();

create or replace function public.guimmia_v775_intake_immutable()
returns trigger
language plpgsql
as $$
begin
  raise exception 'V77.5 intake interactions are immutable';
end $$;

drop trigger if exists trg_guimmia_v775_intake_immutable
  on public.guimmia_ai_intake_interactions;
create trigger trg_guimmia_v775_intake_immutable
before update or delete on public.guimmia_ai_intake_interactions
for each row execute function public.guimmia_v775_intake_immutable();

alter table public.guimmia_ai_intake_profiles enable row level security;
alter table public.guimmia_ai_intake_profiles force row level security;
alter table public.guimmia_ai_intake_interactions enable row level security;
alter table public.guimmia_ai_intake_interactions force row level security;

revoke all on public.guimmia_ai_intake_profiles from anon, authenticated;
revoke all on public.guimmia_ai_intake_interactions from anon, authenticated;
revoke all on function public.guimmia_v775_intake_guard() from public;
revoke all on function public.guimmia_v775_intake_immutable() from public;

grant insert, select on public.guimmia_ai_intake_interactions to service_role;
grant execute on function public.guimmia_v775_intake_guard() to service_role;
grant execute on function public.guimmia_v775_intake_immutable() to service_role;

comment on table public.guimmia_ai_intake_profiles is
  'V77.5 controlled conversational intake policy for Guimmia.';
comment on table public.guimmia_ai_intake_interactions is
  'Immutable structured extraction audit. Raw customer messages are not stored.';

-- REV3: archivio documentale intelligente e agenda immobiliare condivisa.

create table if not exists public.guimmia_ai_operations_profiles (
  singleton_key text primary key check (singleton_key = 'GUIMMIA_CONVERSATIONAL_OPERATIONS'),
  version text not null check (version = '77.5.0'),
  package_revision integer not null check (package_revision = 3),
  model text not null check (model = 'gpt-5.6-luna'),
  document_max_bytes bigint not null check (document_max_bytes = 10485760),
  pdf_detail text not null check (pdf_detail = 'low'),
  document_max_request_cost_usd numeric(10,4) not null check (document_max_request_cost_usd = 0.03),
  scheduling_max_request_cost_usd numeric(10,4) not null check (scheduling_max_request_cost_usd = 0.01),
  private_storage_required boolean not null check (private_storage_required = true),
  structured_output_required boolean not null check (structured_output_required = true),
  document_confirmation_required boolean not null check (document_confirmation_required = true),
  owner_confirmation_required boolean not null check (owner_confirmation_required = true),
  automatic_document_send_enabled boolean not null check (automatic_document_send_enabled = false),
  automatic_booking_enabled boolean not null check (automatic_booking_enabled = false),
  voice_uses_shared_calendar boolean not null check (voice_uses_shared_calendar = true),
  living_case_room_enabled boolean not null default true check (living_case_room_enabled = true),
  deterministic_next_action boolean not null default true check (deterministic_next_action = true),
  action_receipts_required boolean not null default true check (action_receipts_required = true),
  confirmation_queue_enabled boolean not null default true check (confirmation_queue_enabled = true),
  human_authority_policy jsonb not null check (jsonb_typeof(human_authority_policy) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Consente alla REV3 di sostituire direttamente una eventuale REV2 senza
-- lasciare il profilo bloccato al numero di revisione precedente.
alter table public.guimmia_ai_operations_profiles
  drop constraint if exists guimmia_ai_operations_profiles_package_revision_check,
  drop constraint if exists guimmia_ai_operations_profiles_living_case_room_check,
  drop constraint if exists guimmia_ai_operations_profiles_next_action_check,
  drop constraint if exists guimmia_ai_operations_profiles_action_receipts_check,
  drop constraint if exists guimmia_ai_operations_profiles_confirmation_queue_check,
  add column if not exists living_case_room_enabled boolean not null default true,
  add column if not exists deterministic_next_action boolean not null default true,
  add column if not exists action_receipts_required boolean not null default true,
  add column if not exists confirmation_queue_enabled boolean not null default true;

update public.guimmia_ai_operations_profiles
set package_revision = 3,
    living_case_room_enabled = true,
    deterministic_next_action = true,
    action_receipts_required = true,
    confirmation_queue_enabled = true,
    updated_at = now()
where singleton_key = 'GUIMMIA_CONVERSATIONAL_OPERATIONS';

alter table public.guimmia_ai_operations_profiles
  add constraint guimmia_ai_operations_profiles_package_revision_check
    check (package_revision = 3),
  add constraint guimmia_ai_operations_profiles_living_case_room_check
    check (living_case_room_enabled is true),
  add constraint guimmia_ai_operations_profiles_next_action_check
    check (deterministic_next_action is true),
  add constraint guimmia_ai_operations_profiles_action_receipts_check
    check (action_receipts_required is true),
  add constraint guimmia_ai_operations_profiles_confirmation_queue_check
    check (confirmation_queue_enabled is true);

insert into public.guimmia_ai_operations_profiles (
  singleton_key, version, package_revision, model, document_max_bytes,
  pdf_detail, document_max_request_cost_usd, scheduling_max_request_cost_usd,
  private_storage_required, structured_output_required,
  document_confirmation_required, owner_confirmation_required,
  automatic_document_send_enabled, automatic_booking_enabled,
  voice_uses_shared_calendar, living_case_room_enabled,
  deterministic_next_action, action_receipts_required,
  confirmation_queue_enabled, human_authority_policy
) values (
  'GUIMMIA_CONVERSATIONAL_OPERATIONS', '77.5.0', 3, 'gpt-5.6-luna', 10485760,
  'low', 0.03, 0.01, true, true, true, true, false, false, true,
  true, true, true, true,
  '{
    "aiMayClassifyDocuments": true,
    "aiMaySuggestFolders": true,
    "aiMaySuggestRecipients": true,
    "aiMayCertifyLegalValidity": false,
    "aiMaySendDocuments": false,
    "aiMayInterpretAvailability": true,
    "aiMayProposeAppointments": true,
    "aiMayConfirmAppointments": false,
    "deterministicAvailabilityCheck": true,
    "livingCaseRoomEnabled": true,
    "actionReceiptsRequired": true,
    "confirmationQueueEnabled": true,
    "humanConfirmationRequired": true
  }'::jsonb
)
on conflict (singleton_key) do update set
  version = excluded.version,
  package_revision = 3,
  model = 'gpt-5.6-luna',
  document_max_bytes = 10485760,
  pdf_detail = 'low',
  document_max_request_cost_usd = 0.03,
  scheduling_max_request_cost_usd = 0.01,
  private_storage_required = true,
  structured_output_required = true,
  document_confirmation_required = true,
  owner_confirmation_required = true,
  automatic_document_send_enabled = false,
  automatic_booking_enabled = false,
  voice_uses_shared_calendar = true,
  living_case_room_enabled = true,
  deterministic_next_action = true,
  action_receipts_required = true,
  confirmation_queue_enabled = true,
  human_authority_policy = excluded.human_authority_policy,
  updated_at = now();

insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
) values (
  'guimmia-documents',
  'guimmia-documents',
  false,
  10485760,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/rtf',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]::text[]
)
on conflict (id) do update set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.guimmia_case_document_staging (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  draft_id text not null check (length(draft_id) between 1 and 120),
  storage_bucket text not null default 'guimmia-documents' check (storage_bucket = 'guimmia-documents'),
  storage_path text not null unique check (length(storage_path) between 10 and 700),
  original_name text not null check (length(original_name) between 1 and 180),
  suggested_name text not null check (length(suggested_name) between 1 and 140),
  mime_type text not null,
  size_bytes bigint not null check (size_bytes between 1 and 10485760),
  sha256 text not null check (length(sha256) = 64),
  document_type text not null check (document_type in (
    'DOCUMENTO_IDENTITA','CODICE_FISCALE','ATTO_PROVENIENZA','VISURA_CATASTALE',
    'PLANIMETRIA_CATASTALE','TITOLO_URBANISTICO','CERTIFICATO_DESTINAZIONE_URBANISTICA',
    'APE','DOCUMENTO_CONDOMINIALE','DOCUMENTO_FISCALE_FINANZIARIO','INCARICO_MEDIAZIONE',
    'PROPOSTA_O_CONTRATTO','CONTRATTO_LOCAZIONE','DOCUMENTO_TURISTICO',
    'RELAZIONE_TECNICA','ALTRO_O_NON_RICONOSCIUTO'
  )),
  category text not null check (category in (
    'IDENTITA_PARTI','TITOLARITA_PROVENIENZA','CATASTO_PLANIMETRIE','URBANISTICA_EDILIZIA',
    'ENERGIA_APE','CONDOMINIO','FISCALE_FINANZIARIO','INCARICO_MEDIAZIONE',
    'CONTRATTI_PROPOSTE','LOCAZIONE','TURISTICO_OSPITI','RELAZIONI_TECNICHE','ALTRO_DA_VERIFICARE'
  )),
  folder_code text not null check (folder_code in (
    '01_IDENTITA_E_PARTI','02_PROVENIENZA_E_TITOLARITA','03_CATASTO_E_PLANIMETRIE',
    '04_URBANISTICA_EDILIZIA','05_ENERGIA_APE','06_CONDOMINIO','07_FISCALE_E_FINANZIARIO',
    '08_INCARICO_E_MEDIAZIONE','09_CONTRATTI_E_PROPOSTE','10_LOCAZIONE',
    '11_TURISTICO_E_OSPITI','12_RELAZIONI_TECNICHE','99_DA_VERIFICARE'
  )),
  recipient_roles text[] not null default array['AGENZIA_GUIMMIA']::text[],
  quality text not null check (quality in ('GOOD','PARTIAL','UNREADABLE')),
  summary text not null default '',
  warnings text[] not null default '{}',
  missing_followups text[] not null default '{}',
  confidence numeric(5,4) not null check (confidence between 0 and 1),
  status text not null default 'PENDING_CONFIRMATION' check (status in (
    'PENDING_CONFIRMATION','ARCHIVED','NEEDS_REVIEW','REJECTED'
  )),
  human_confirmation_required boolean not null default true check (human_confirmation_required = true),
  legal_validity_certified boolean not null default false check (legal_validity_certified = false),
  automatic_send_enabled boolean not null default false check (automatic_send_enabled = false),
  send_status text not null default 'NOT_SENT' check (send_status = 'NOT_SENT'),
  ai_result jsonb not null check (jsonb_typeof(ai_result) = 'object'),
  confirmed_by uuid references auth.users(id) on delete set null,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (cardinality(recipient_roles) between 1 and 5),
  check (recipient_roles <@ array[
    'AGENZIA_GUIMMIA','NOTAIO','GEOMETRA','PROPRIETARIO','CONDUTTORE','COMMERCIALISTA',
    'AMMINISTRATORE_CONDOMINIO','OSPITE','ALTRO_PROFESSIONISTA'
  ]::text[]),
  check (
    (status = 'ARCHIVED' and confirmed_by is not null and confirmed_at is not null)
    or (status <> 'ARCHIVED')
  )
);
create index if not exists idx_guimmia_v775_documents_user_draft
  on public.guimmia_case_document_staging(user_id, draft_id, created_at desc);
create unique index if not exists idx_guimmia_v775_documents_current_hash
  on public.guimmia_case_document_staging(user_id, draft_id, sha256)
  where status <> 'REJECTED';

create table if not exists public.guimmia_ai_document_interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id uuid not null references public.guimmia_case_document_staging(id) on delete cascade,
  draft_id text not null check (length(draft_id) between 1 and 120),
  request_fingerprint text not null check (length(request_fingerprint) = 64),
  file_hash text not null check (length(file_hash) = 64),
  model text not null check (model = 'gpt-5.6-luna'),
  execution_mode text not null check (execution_mode = 'PROPOSAL_ONLY'),
  status text not null check (status in ('COMPLETED','FAILED','BLOCKED')),
  response_id text,
  ai_result jsonb,
  input_tokens integer not null default 0 check (input_tokens >= 0),
  cached_input_tokens integer not null default 0 check (cached_input_tokens between 0 and input_tokens),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  estimated_cost_usd numeric(12,6) not null default 0 check (estimated_cost_usd between 0 and 0.03),
  human_confirmation_required boolean not null default true check (human_confirmation_required = true),
  automatic_archive_executed boolean not null default false check (automatic_archive_executed = false),
  automatic_send_executed boolean not null default false check (automatic_send_executed = false),
  created_at timestamptz not null default now()
);

create table if not exists public.guimmia_availability_windows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  draft_id text not null check (length(draft_id) between 1 and 120),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null default 'Europe/Rome',
  allowed_event_types text[] not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','CANCELLED')),
  source text not null check (source in ('CHAT','WEB','VOICE','PORTAL')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (ends_at <= starts_at + interval '12 hours'),
  check (cardinality(allowed_event_types) between 1 and 8),
  check (allowed_event_types <@ array[
    'VISITA_IMMOBILE','SOPRALLUOGO_GEOMETRA','APPUNTAMENTO_NOTAIO','FOTO_VIDEO',
    'CONSEGNA_CHIAVI','CHECK_IN','CHECK_OUT','ALTRO'
  ]::text[])
);
create index if not exists idx_guimmia_v775_availability_user_draft_time
  on public.guimmia_availability_windows(user_id, draft_id, starts_at, ends_at)
  where status = 'ACTIVE';

-- La V76.9 possiede gia public.guimmia_appointments con il contratto
-- dell'orchestratore centrale. La chat usa una staging agenda separata per
-- non alterare ne sovrapporre la tabella operativa esistente.
create table if not exists public.guimmia_case_appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  draft_id text not null check (length(draft_id) between 1 and 120),
  event_type text not null check (event_type in (
    'VISITA_IMMOBILE','SOPRALLUOGO_GEOMETRA','APPUNTAMENTO_NOTAIO','FOTO_VIDEO',
    'CONSEGNA_CHIAVI','CHECK_IN','CHECK_OUT','ALTRO'
  )),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null default 'Europe/Rome',
  status text not null default 'PENDING_OWNER_CONFIRMATION' check (status in (
    'PENDING_OWNER_CONFIRMATION','CONFIRMED','CANCELLED'
  )),
  source text not null check (source in ('CHAT','WEB','VOICE','PORTAL')),
  title text not null check (length(title) between 1 and 140),
  owner_confirmation_required boolean not null default true check (owner_confirmation_required = true),
  automatic_booking_executed boolean not null default false check (automatic_booking_executed = false),
  confirmed_by uuid references auth.users(id) on delete set null,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (ends_at <= starts_at + interval '12 hours'),
  check (
    (status = 'CONFIRMED' and confirmed_by is not null and confirmed_at is not null)
    or status <> 'CONFIRMED'
  )
);
create index if not exists idx_guimmia_v775_case_appointments_user_draft_time
  on public.guimmia_case_appointments(user_id, draft_id, starts_at, ends_at)
  where status <> 'CANCELLED';

create table if not exists public.guimmia_ai_schedule_interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  draft_id text not null check (length(draft_id) between 1 and 120),
  request_fingerprint text not null check (length(request_fingerprint) = 64),
  message_hash text not null check (length(message_hash) = 64),
  model text not null check (model = 'gpt-5.6-luna'),
  execution_mode text not null check (execution_mode = 'PROPOSAL_ONLY'),
  status text not null check (status in ('COMPLETED','FAILED','BLOCKED')),
  response_id text,
  ai_result jsonb,
  input_tokens integer not null default 0 check (input_tokens >= 0),
  cached_input_tokens integer not null default 0 check (cached_input_tokens between 0 and input_tokens),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  estimated_cost_usd numeric(12,6) not null default 0 check (estimated_cost_usd between 0 and 0.01),
  human_confirmation_required boolean not null default true check (human_confirmation_required = true),
  automatic_booking_executed boolean not null default false check (automatic_booking_executed = false),
  created_at timestamptz not null default now()
);

alter table public.guimmia_ai_usage_events
  alter column valuation_lead_id drop not null,
  add column if not exists document_interaction_id uuid
    references public.guimmia_ai_document_interactions(id) on delete cascade,
  add column if not exists schedule_interaction_id uuid
    references public.guimmia_ai_schedule_interactions(id) on delete cascade;

alter table public.guimmia_ai_usage_events
  drop constraint if exists guimmia_ai_usage_events_use_case_check,
  drop constraint if exists guimmia_ai_usage_events_source_check;

alter table public.guimmia_ai_usage_events
  add constraint guimmia_ai_usage_events_use_case_check check (use_case in (
    'PROPERTY_VALUATION','BRAIN_GUIDANCE','DOCUMENT_CHECK','NEXT_ACTION',
    'COMMUNICATION_DRAFT','CONVERSATIONAL_INTAKE','DOCUMENT_ORGANIZATION','SCHEDULING_INTAKE'
  )),
  add constraint guimmia_ai_usage_events_source_check check (
    (use_case = 'PROPERTY_VALUATION'
      and valuation_lead_id is not null
      and brain_interaction_id is null
      and intake_interaction_id is null
      and document_interaction_id is null
      and schedule_interaction_id is null)
    or
    (use_case in ('BRAIN_GUIDANCE','DOCUMENT_CHECK','NEXT_ACTION','COMMUNICATION_DRAFT')
      and valuation_lead_id is null
      and brain_interaction_id is not null
      and intake_interaction_id is null
      and document_interaction_id is null
      and schedule_interaction_id is null)
    or
    (use_case = 'CONVERSATIONAL_INTAKE'
      and valuation_lead_id is null
      and brain_interaction_id is null
      and intake_interaction_id is not null
      and document_interaction_id is null
      and schedule_interaction_id is null)
    or
    (use_case = 'DOCUMENT_ORGANIZATION'
      and valuation_lead_id is null
      and brain_interaction_id is null
      and intake_interaction_id is null
      and document_interaction_id is not null
      and schedule_interaction_id is null)
    or
    (use_case = 'SCHEDULING_INTAKE'
      and valuation_lead_id is null
      and brain_interaction_id is null
      and intake_interaction_id is null
      and document_interaction_id is null
      and schedule_interaction_id is not null)
  );

create or replace function public.guimmia_v775_document_transition_guard()
returns trigger language plpgsql as $$
begin
  if new.human_confirmation_required is not true
     or new.legal_validity_certified is true
     or new.automatic_send_enabled is true
     or new.send_status <> 'NOT_SENT' then
    raise exception 'v775_document_human_confirmation_and_no_send_required';
  end if;
  if tg_op = 'UPDATE' then
    if new.user_id <> old.user_id
       or new.draft_id <> old.draft_id
       or new.storage_path <> old.storage_path
       or new.sha256 <> old.sha256
       or new.ai_result <> old.ai_result then
      raise exception 'v775_document_source_fields_immutable';
    end if;
    if old.status = 'ARCHIVED' and new.status <> 'ARCHIVED' then
      raise exception 'v775_archived_document_immutable';
    end if;
    if old.status = 'REJECTED' then
      raise exception 'v775_rejected_document_immutable';
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_guimmia_v775_document_transition_guard
  on public.guimmia_case_document_staging;
create trigger trg_guimmia_v775_document_transition_guard
before insert or update on public.guimmia_case_document_staging
for each row execute function public.guimmia_v775_document_transition_guard();

create or replace function public.guimmia_v775_schedule_guard()
returns trigger language plpgsql as $$
begin
  if tg_table_name = 'guimmia_case_appointments' then
    if new.owner_confirmation_required is not true
       or new.automatic_booking_executed is true then
      raise exception 'v775_appointment_owner_confirmation_required';
    end if;
    if tg_op = 'UPDATE' and old.status = 'CONFIRMED' and new.status not in ('CONFIRMED','CANCELLED') then
      raise exception 'v775_confirmed_appointment_invalid_transition';
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_guimmia_v775_availability_guard on public.guimmia_availability_windows;
create trigger trg_guimmia_v775_availability_guard
before insert or update on public.guimmia_availability_windows
for each row execute function public.guimmia_v775_schedule_guard();
drop trigger if exists trg_guimmia_v775_appointment_guard on public.guimmia_case_appointments;
create trigger trg_guimmia_v775_appointment_guard
before insert or update on public.guimmia_case_appointments
for each row execute function public.guimmia_v775_schedule_guard();

create or replace function public.guimmia_v775_operations_audit_immutable()
returns trigger language plpgsql as $$
begin
  raise exception 'V77.5 operations AI interactions are immutable';
end $$;

drop trigger if exists trg_guimmia_v775_document_audit_immutable on public.guimmia_ai_document_interactions;
create trigger trg_guimmia_v775_document_audit_immutable
before update or delete on public.guimmia_ai_document_interactions
for each row execute function public.guimmia_v775_operations_audit_immutable();
drop trigger if exists trg_guimmia_v775_schedule_audit_immutable on public.guimmia_ai_schedule_interactions;
create trigger trg_guimmia_v775_schedule_audit_immutable
before update or delete on public.guimmia_ai_schedule_interactions
for each row execute function public.guimmia_v775_operations_audit_immutable();

alter table public.guimmia_ai_operations_profiles enable row level security;
alter table public.guimmia_ai_operations_profiles force row level security;
alter table public.guimmia_case_document_staging enable row level security;
alter table public.guimmia_case_document_staging force row level security;
alter table public.guimmia_ai_document_interactions enable row level security;
alter table public.guimmia_ai_document_interactions force row level security;
alter table public.guimmia_availability_windows enable row level security;
alter table public.guimmia_availability_windows force row level security;
alter table public.guimmia_case_appointments enable row level security;
alter table public.guimmia_case_appointments force row level security;
alter table public.guimmia_ai_schedule_interactions enable row level security;
alter table public.guimmia_ai_schedule_interactions force row level security;

revoke all on public.guimmia_ai_operations_profiles from anon, authenticated;
revoke all on public.guimmia_case_document_staging from anon, authenticated;
revoke all on public.guimmia_ai_document_interactions from anon, authenticated;
revoke all on public.guimmia_availability_windows from anon, authenticated;
revoke all on public.guimmia_case_appointments from anon, authenticated;
revoke all on public.guimmia_ai_schedule_interactions from anon, authenticated;
revoke all on function public.guimmia_v775_document_transition_guard() from public;
revoke all on function public.guimmia_v775_schedule_guard() from public;
revoke all on function public.guimmia_v775_operations_audit_immutable() from public;

grant select on public.guimmia_ai_operations_profiles to service_role;
grant select, insert, update on public.guimmia_case_document_staging to service_role;
grant select, insert on public.guimmia_ai_document_interactions to service_role;
grant select, insert, update on public.guimmia_availability_windows to service_role;
grant select, insert, update on public.guimmia_case_appointments to service_role;
grant select, insert on public.guimmia_ai_schedule_interactions to service_role;
grant execute on function public.guimmia_v775_document_transition_guard() to service_role;
grant execute on function public.guimmia_v775_schedule_guard() to service_role;
grant execute on function public.guimmia_v775_operations_audit_immutable() to service_role;

comment on table public.guimmia_case_document_staging is
  'Private Guimmia staging archive. AI classifications require confirmation and never certify legal validity.';
comment on table public.guimmia_availability_windows is
  'Shared owner availability used by web chat and the future voice assistant.';
comment on table public.guimmia_case_appointments is
  'Deterministically checked Guimmia appointments. Owner confirmation is mandatory in V77.5.';
