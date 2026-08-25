-- GUIMMIA V77.4.0 - OpenAI Full Brain Bridge
-- Connects the deterministic Guimmia brain to OpenAI without transferring authority.

create extension if not exists pgcrypto;

do $$
begin
  if to_regclass('public.guimmia_case_orchestrator_profiles') is null
     or to_regclass('public.guimmia_ai_gateway_profiles') is null
     or to_regclass('public.guimmia_ai_usage_events') is null then
    raise exception 'V77.4 requires verified V77.0 and V77.3';
  end if;
end $$;

create table if not exists public.guimmia_ai_brain_profiles (
  singleton_key text primary key check (singleton_key = 'GUIMMIA_FULL_BRAIN_BRIDGE'),
  operating_agency_id uuid not null unique references public.guimmia_online_agency_profile(id),
  version text not null check (version = '77.4.0'),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'PAUSED')),
  execution_mode text not null default 'DRY_RUN' check (execution_mode = 'DRY_RUN'),
  model text not null default 'gpt-5.6-luna' check (model = 'gpt-5.6-luna'),
  retrieval_mode text not null default 'LOCAL_STRUCTURED'
    check (retrieval_mode in ('LOCAL_STRUCTURED', 'LOCAL_PLUS_FILE_SEARCH')),
  deterministic_decision_first boolean not null default true
    check (deterministic_decision_first = true),
  max_rules_per_request integer not null default 10
    check (max_rules_per_request between 1 and 10),
  max_cards_per_request integer not null default 6
    check (max_cards_per_request between 1 and 6),
  max_output_tokens integer not null default 900
    check (max_output_tokens between 100 and 900),
  max_request_cost_usd numeric(10,4) not null default 0.02
    check (max_request_cost_usd between 0 and 0.02),
  reuse_window_minutes integer not null default 15
    check (reuse_window_minutes = 15),
  output_authority_guard boolean not null default true
    check (output_authority_guard = true),
  supported_request_kinds jsonb not null
    check (jsonb_typeof(supported_request_kinds) = 'array'),
  human_authority_policy jsonb not null
    check (jsonb_typeof(human_authority_policy) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guimmia_ai_brain_interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  case_id text not null check (length(case_id) between 1 and 120),
  operation_type text not null check (operation_type in (
    'SALE',
    'RENT_LONG_TERM',
    'RENT_TRANSITORY',
    'RENT_STUDENT',
    'RENT_TOURIST_SHORT'
  )),
  request_kind text not null check (request_kind in (
    'GUIDANCE',
    'DOCUMENT_CHECK',
    'NEXT_ACTION',
    'COMMUNICATION_DRAFT'
  )),
  request_fingerprint text not null check (length(request_fingerprint) = 64),
  question_hash text not null check (length(question_hash) = 64),
  question_length integer not null check (question_length between 1 and 2000),
  model text not null check (model = 'gpt-5.6-luna'),
  execution_mode text not null check (execution_mode = 'DRY_RUN'),
  status text not null check (status in (
    'COMPLETED',
    'FAILED',
    'NOT_CONFIGURED',
    'BLOCKED'
  )),
  response_id text,
  deterministic_decision_first boolean not null default true
    check (deterministic_decision_first = true),
  decision_snapshot jsonb not null check (jsonb_typeof(decision_snapshot) = 'object'),
  knowledge_refs jsonb not null default '[]'::jsonb
    check (jsonb_typeof(knowledge_refs) = 'array'),
  ai_result jsonb,
  input_tokens integer not null default 0 check (input_tokens >= 0),
  cached_input_tokens integer not null default 0
    check (cached_input_tokens between 0 and input_tokens),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  estimated_cost_usd numeric(12,6) not null default 0
    check (estimated_cost_usd between 0 and 0.02),
  error_code text,
  human_review_required boolean not null default true
    check (human_review_required = true),
  automatic_action_executed boolean not null default false
    check (automatic_action_executed = false),
  output_authority_guard_passed boolean not null default true
    check (output_authority_guard_passed = true),
  created_at timestamptz not null default now()
);

-- REV2 upgrade path: safe if the first V77.4 package was already executed.
alter table public.guimmia_ai_brain_profiles
  add column if not exists reuse_window_minutes integer not null default 15,
  add column if not exists output_authority_guard boolean not null default true;

alter table public.guimmia_ai_brain_interactions
  add column if not exists request_fingerprint text,
  add column if not exists output_authority_guard_passed boolean not null default true;

update public.guimmia_ai_brain_interactions
set request_fingerprint = encode(
  digest(id::text || ':' || question_hash, 'sha256'),
  'hex'
)
where request_fingerprint is null;

alter table public.guimmia_ai_brain_interactions
  alter column request_fingerprint set not null;

alter table public.guimmia_ai_brain_profiles
  drop constraint if exists guimmia_ai_brain_profiles_reuse_window_minutes_check,
  drop constraint if exists guimmia_ai_brain_profiles_output_authority_guard_check;
alter table public.guimmia_ai_brain_profiles
  add constraint guimmia_ai_brain_profiles_reuse_window_minutes_check
    check (reuse_window_minutes = 15),
  add constraint guimmia_ai_brain_profiles_output_authority_guard_check
    check (output_authority_guard = true);

alter table public.guimmia_ai_brain_interactions
  drop constraint if exists guimmia_ai_brain_interactions_request_fingerprint_check,
  drop constraint if exists guimmia_ai_brain_interactions_output_authority_guard_passed_check;
alter table public.guimmia_ai_brain_interactions
  add constraint guimmia_ai_brain_interactions_request_fingerprint_check
    check (length(request_fingerprint) = 64),
  add constraint guimmia_ai_brain_interactions_output_authority_guard_passed_check
    check (output_authority_guard_passed = true);

alter table public.guimmia_ai_usage_events
  alter column valuation_lead_id drop not null,
  add column if not exists brain_interaction_id uuid
    references public.guimmia_ai_brain_interactions(id) on delete cascade,
  add column if not exists file_search_calls integer not null default 0;

alter table public.guimmia_ai_usage_events
  drop constraint if exists guimmia_ai_usage_events_use_case_check,
  drop constraint if exists guimmia_ai_usage_events_file_search_calls_check,
  drop constraint if exists guimmia_ai_usage_events_source_check;

alter table public.guimmia_ai_usage_events
  add constraint guimmia_ai_usage_events_use_case_check check (use_case in (
    'PROPERTY_VALUATION',
    'BRAIN_GUIDANCE',
    'DOCUMENT_CHECK',
    'NEXT_ACTION',
    'COMMUNICATION_DRAFT'
  )),
  add constraint guimmia_ai_usage_events_file_search_calls_check
    check (file_search_calls between 0 and 3),
  add constraint guimmia_ai_usage_events_source_check check (
    (use_case = 'PROPERTY_VALUATION'
      and valuation_lead_id is not null
      and brain_interaction_id is null)
    or
    (use_case <> 'PROPERTY_VALUATION'
      and valuation_lead_id is null
      and brain_interaction_id is not null)
  );

create index if not exists idx_guimmia_v774_brain_case_created
  on public.guimmia_ai_brain_interactions(case_id, created_at desc);
create index if not exists idx_guimmia_v774_brain_user_created
  on public.guimmia_ai_brain_interactions(user_id, created_at desc);
create index if not exists idx_guimmia_v774_brain_request_kind
  on public.guimmia_ai_brain_interactions(request_kind, status, created_at desc);
create unique index if not exists idx_guimmia_v774_completed_fingerprint
  on public.guimmia_ai_brain_interactions(request_fingerprint)
  where status = 'COMPLETED';
create index if not exists idx_guimmia_v774_usage_brain_interaction
  on public.guimmia_ai_usage_events(brain_interaction_id)
  where brain_interaction_id is not null;

insert into public.guimmia_ai_brain_profiles (
  singleton_key,
  operating_agency_id,
  version,
  status,
  execution_mode,
  model,
  retrieval_mode,
  deterministic_decision_first,
  max_rules_per_request,
  max_cards_per_request,
  max_output_tokens,
  max_request_cost_usd,
  reuse_window_minutes,
  output_authority_guard,
  supported_request_kinds,
  human_authority_policy
)
select
  'GUIMMIA_FULL_BRAIN_BRIDGE',
  id,
  '77.4.0',
  'ACTIVE',
  'DRY_RUN',
  'gpt-5.6-luna',
  'LOCAL_STRUCTURED',
  true,
  10,
  6,
  900,
  0.02,
  15,
  true,
  '["GUIDANCE","DOCUMENT_CHECK","NEXT_ACTION","COMMUNICATION_DRAFT"]'::jsonb,
  '{
    "brainIsSourceOfTruth": true,
    "deterministicDecisionFirst": true,
    "aiMayExplain": true,
    "aiMayAskQuestions": true,
    "aiMayDraftCommunications": true,
    "aiMayApproveDocuments": false,
    "aiMayCertifyCompliance": false,
    "aiMaySetFinalPrice": false,
    "aiMaySelectCandidate": false,
    "aiMayAcceptOrRejectOffer": false,
    "aiMayExecuteMaterialActions": false,
    "unsafeGeneratedActionsAreReplaced": true,
    "humanReviewRequired": true,
    "contactDataSentToModel": false
  }'::jsonb
from public.guimmia_online_agency_profile
where singleton_key = 'GUIMMIA' and code = 'GUIMMIA'
on conflict (singleton_key) do update set
  operating_agency_id = excluded.operating_agency_id,
  version = '77.4.0',
  status = 'ACTIVE',
  execution_mode = 'DRY_RUN',
  model = 'gpt-5.6-luna',
  retrieval_mode = 'LOCAL_STRUCTURED',
  deterministic_decision_first = true,
  max_rules_per_request = 10,
  max_cards_per_request = 6,
  max_output_tokens = 900,
  max_request_cost_usd = 0.02,
  reuse_window_minutes = 15,
  output_authority_guard = true,
  supported_request_kinds = excluded.supported_request_kinds,
  human_authority_policy = excluded.human_authority_policy,
  updated_at = now();

create or replace function public.guimmia_v774_brain_interaction_guard()
returns trigger
language plpgsql
as $$
begin
  if new.execution_mode <> 'DRY_RUN'
     or new.deterministic_decision_first is not true
     or new.human_review_required is not true
     or new.automatic_action_executed is true
     or new.output_authority_guard_passed is not true then
    raise exception 'v774_human_authority_and_deterministic_first_required';
  end if;

  if new.status = 'COMPLETED' then
    if new.response_id is null
       or new.ai_result is null
       or jsonb_typeof(new.ai_result) <> 'object'
       or jsonb_array_length(new.knowledge_refs) = 0
       or new.error_code is not null then
      raise exception 'v774_completed_brain_result_and_refs_required';
    end if;
  else
    if new.ai_result is not null or new.error_code is null then
      raise exception 'v774_failed_brain_error_required';
    end if;
  end if;

  if new.cached_input_tokens > new.input_tokens
     or new.estimated_cost_usd > 0.02 then
    raise exception 'v774_brain_usage_limit_exceeded';
  end if;

  return new;
end $$;

drop trigger if exists trg_guimmia_v774_brain_interaction_guard
  on public.guimmia_ai_brain_interactions;
create trigger trg_guimmia_v774_brain_interaction_guard
before insert on public.guimmia_ai_brain_interactions
for each row execute function public.guimmia_v774_brain_interaction_guard();

create or replace function public.guimmia_v774_brain_interaction_immutable()
returns trigger
language plpgsql
as $$
begin
  raise exception 'V77.4 brain interactions are immutable';
end $$;

drop trigger if exists trg_guimmia_v774_brain_interaction_immutable
  on public.guimmia_ai_brain_interactions;
create trigger trg_guimmia_v774_brain_interaction_immutable
before update or delete on public.guimmia_ai_brain_interactions
for each row execute function public.guimmia_v774_brain_interaction_immutable();

alter table public.guimmia_ai_brain_profiles enable row level security;
alter table public.guimmia_ai_brain_profiles force row level security;
alter table public.guimmia_ai_brain_interactions enable row level security;
alter table public.guimmia_ai_brain_interactions force row level security;

revoke all on public.guimmia_ai_brain_profiles from anon, authenticated;
revoke all on public.guimmia_ai_brain_interactions from anon, authenticated;
revoke all on function public.guimmia_v774_brain_interaction_guard() from public;
revoke all on function public.guimmia_v774_brain_interaction_immutable() from public;

grant insert on public.guimmia_ai_brain_interactions to service_role;
grant select on public.guimmia_ai_brain_interactions to service_role;
grant execute on function public.guimmia_v774_brain_interaction_guard() to service_role;
grant execute on function public.guimmia_v774_brain_interaction_immutable() to service_role;

comment on table public.guimmia_ai_brain_profiles is
  'V77.4 policy for the controlled bridge between the Guimmia brain and OpenAI.';
comment on table public.guimmia_ai_brain_interactions is
  'Immutable audit of AI guidance. Raw questions and personal contact data are not stored.';
