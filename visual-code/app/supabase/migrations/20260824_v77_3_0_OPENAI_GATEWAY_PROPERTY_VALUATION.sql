-- GUIMMIA V77.3.0 - OpenAI gateway and preliminary property valuation
-- Requires the verified V77.0 central case orchestrator.

create extension if not exists pgcrypto;

do $$
begin
  if to_regclass('public.guimmia_case_orchestrator_profiles') is null
     or to_regclass('public.guimmia_online_agency_profile') is null then
    raise exception 'V77.3 requires the verified V77.0 central orchestrator';
  end if;
end $$;

create table if not exists public.guimmia_ai_gateway_profiles (
  singleton_key text primary key check (singleton_key = 'GUIMMIA_OPENAI_GATEWAY'),
  operating_agency_id uuid not null unique references public.guimmia_online_agency_profile(id),
  version text not null check (version = '77.3.0'),
  package_revision integer not null default 2 check (package_revision = 2),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'PAUSED')),
  execution_mode text not null default 'DRY_RUN' check (execution_mode = 'DRY_RUN'),
  default_model text not null default 'gpt-5.6-luna' check (default_model = 'gpt-5.6-luna'),
  escalation_model text not null default 'gpt-5.6-terra' check (escalation_model = 'gpt-5.6-terra'),
  automatic_escalation_enabled boolean not null default false check (automatic_escalation_enabled = false),
  monthly_budget_usd numeric(10,2) not null default 5.00 check (monthly_budget_usd between 0 and 5.00),
  max_request_cost_usd numeric(10,4) not null default 0.05 check (max_request_cost_usd between 0 and 0.05),
  web_search_enabled boolean not null default true,
  max_web_search_calls integer not null default 2 check (max_web_search_calls between 0 and 2),
  minimum_source_count integer not null default 2 check (minimum_source_count = 2),
  rate_limit_requests integer not null default 3 check (rate_limit_requests = 3),
  rate_limit_window_minutes integer not null default 30 check (rate_limit_window_minutes = 30),
  human_authority_policy jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guimmia_property_valuation_leads (
  id uuid primary key default gen_random_uuid(),
  operation_type text not null check (operation_type in ('SALE', 'RENT_LONG_TERM')),
  owner_name text not null check (length(trim(owner_name)) between 2 and 120),
  owner_email text not null check (length(owner_email) between 5 and 160 and position('@' in owner_email) > 1),
  owner_phone text check (owner_phone is null or length(owner_phone) <= 40),
  property_snapshot jsonb not null check (jsonb_typeof(property_snapshot) = 'object'),
  privacy_accepted_at timestamptz not null,
  automated_analysis_accepted_at timestamptz not null,
  source text not null check (source = 'PUBLIC_VALUATION'),
  status text not null check (status in ('VALUATION_READY', 'NEEDS_REVIEW', 'CONTACTED', 'ARCHIVED')),
  ai_execution_mode text not null check (ai_execution_mode = 'DRY_RUN'),
  ai_status text not null check (ai_status in ('COMPLETED', 'FAILED', 'NOT_CONFIGURED', 'BLOCKED')),
  ai_request_id text,
  ai_model text not null check (ai_model in ('gpt-5.6-luna', 'gpt-5.6-terra')),
  ai_result jsonb,
  ai_sources jsonb not null default '[]'::jsonb check (jsonb_typeof(ai_sources) = 'array'),
  ai_quality jsonb,
  input_tokens integer not null default 0 check (input_tokens >= 0),
  cached_input_tokens integer not null default 0 check (cached_input_tokens between 0 and input_tokens),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  web_search_calls integer not null default 0 check (web_search_calls between 0 and 2),
  estimated_cost_usd numeric(12,6) not null default 0 check (estimated_cost_usd between 0 and 0.05),
  error_code text,
  human_review_required boolean not null default true check (human_review_required = true),
  price_published boolean not null default false check (price_published = false),
  automatic_action_executed boolean not null default false check (automatic_action_executed = false),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guimmia_ai_usage_events (
  id bigserial primary key,
  valuation_lead_id uuid not null references public.guimmia_property_valuation_leads(id) on delete cascade,
  request_id text not null unique,
  use_case text not null check (use_case = 'PROPERTY_VALUATION'),
  model text not null check (model in ('gpt-5.6-luna', 'gpt-5.6-terra')),
  execution_mode text not null check (execution_mode = 'DRY_RUN'),
  status text not null check (status in ('COMPLETED', 'FAILED')),
  input_tokens integer not null default 0 check (input_tokens >= 0),
  cached_input_tokens integer not null default 0 check (cached_input_tokens between 0 and input_tokens),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  web_search_calls integer not null default 0 check (web_search_calls between 0 and 2),
  estimated_cost_usd numeric(12,6) not null default 0 check (estimated_cost_usd between 0 and 0.05),
  created_at timestamptz not null default now()
);

-- REV2 upgrade path: safe even if the first V77.3 package was already executed.
alter table public.guimmia_ai_gateway_profiles
  add column if not exists package_revision integer not null default 2,
  add column if not exists max_request_cost_usd numeric(10,4) not null default 0.05,
  add column if not exists minimum_source_count integer not null default 2,
  add column if not exists rate_limit_requests integer not null default 3,
  add column if not exists rate_limit_window_minutes integer not null default 30;

alter table public.guimmia_property_valuation_leads
  add column if not exists ai_quality jsonb;

alter table public.guimmia_ai_gateway_profiles
  drop constraint if exists guimmia_ai_gateway_profiles_package_revision_check,
  drop constraint if exists guimmia_ai_gateway_profiles_max_request_cost_usd_check,
  drop constraint if exists guimmia_ai_gateway_profiles_minimum_source_count_check,
  drop constraint if exists guimmia_ai_gateway_profiles_rate_limit_requests_check,
  drop constraint if exists guimmia_ai_gateway_profiles_rate_limit_window_minutes_check;
alter table public.guimmia_ai_gateway_profiles
  add constraint guimmia_ai_gateway_profiles_package_revision_check check (package_revision = 2),
  add constraint guimmia_ai_gateway_profiles_max_request_cost_usd_check check (max_request_cost_usd between 0 and 0.05),
  add constraint guimmia_ai_gateway_profiles_minimum_source_count_check check (minimum_source_count = 2),
  add constraint guimmia_ai_gateway_profiles_rate_limit_requests_check check (rate_limit_requests = 3),
  add constraint guimmia_ai_gateway_profiles_rate_limit_window_minutes_check check (rate_limit_window_minutes = 30);

alter table public.guimmia_property_valuation_leads
  drop constraint if exists guimmia_property_valuation_leads_ai_status_check,
  drop constraint if exists guimmia_property_valuation_leads_estimated_cost_usd_check;
alter table public.guimmia_property_valuation_leads
  add constraint guimmia_property_valuation_leads_ai_status_check check (ai_status in ('COMPLETED', 'FAILED', 'NOT_CONFIGURED', 'BLOCKED')),
  add constraint guimmia_property_valuation_leads_estimated_cost_usd_check check (estimated_cost_usd between 0 and 0.05);

alter table public.guimmia_ai_usage_events
  drop constraint if exists guimmia_ai_usage_events_estimated_cost_usd_check;
alter table public.guimmia_ai_usage_events
  add constraint guimmia_ai_usage_events_estimated_cost_usd_check check (estimated_cost_usd between 0 and 0.05);

create index if not exists idx_guimmia_v773_valuation_status_created
  on public.guimmia_property_valuation_leads(status, created_at desc);
create index if not exists idx_guimmia_v773_valuation_email
  on public.guimmia_property_valuation_leads(lower(owner_email), created_at desc);
create index if not exists idx_guimmia_v773_usage_created
  on public.guimmia_ai_usage_events(created_at desc);

insert into public.guimmia_ai_gateway_profiles (
  singleton_key,
  operating_agency_id,
  version,
  package_revision,
  status,
  execution_mode,
  default_model,
  escalation_model,
  automatic_escalation_enabled,
  monthly_budget_usd,
  max_request_cost_usd,
  web_search_enabled,
  max_web_search_calls,
  minimum_source_count,
  rate_limit_requests,
  rate_limit_window_minutes,
  human_authority_policy
)
select
  'GUIMMIA_OPENAI_GATEWAY',
  id,
  '77.3.0',
  2,
  'ACTIVE',
  'DRY_RUN',
  'gpt-5.6-luna',
  'gpt-5.6-terra',
  false,
  5.00,
  0.05,
  true,
  2,
  2,
  3,
  30,
  '{
    "aiMayAnalyze": true,
    "aiMayRecommend": true,
    "aiMayEstimateIndicativeRange": true,
    "aiMayPublishPrice": false,
    "aiMaySetFinalPrice": false,
    "aiMayContactCustomerAutonomously": false,
    "humanReviewRequired": true,
    "ownerContactDataSentToModel": false,
    "automaticEscalationEnabled": false
  }'::jsonb
from public.guimmia_online_agency_profile
where singleton_key = 'GUIMMIA' and code = 'GUIMMIA'
on conflict (singleton_key) do update set
  operating_agency_id = excluded.operating_agency_id,
  version = excluded.version,
  package_revision = 2,
  status = 'ACTIVE',
  execution_mode = 'DRY_RUN',
  default_model = 'gpt-5.6-luna',
  escalation_model = 'gpt-5.6-terra',
  automatic_escalation_enabled = false,
  monthly_budget_usd = 5.00,
  max_request_cost_usd = 0.05,
  web_search_enabled = true,
  max_web_search_calls = 2,
  minimum_source_count = 2,
  rate_limit_requests = 3,
  rate_limit_window_minutes = 30,
  human_authority_policy = excluded.human_authority_policy,
  updated_at = now();

create or replace function public.guimmia_v773_valuation_guard()
returns trigger
language plpgsql
as $$
begin
  if new.ai_execution_mode <> 'DRY_RUN'
     or new.human_review_required is not true
     or new.price_published is true
     or new.automatic_action_executed is true then
    raise exception 'v773_human_authority_and_dry_run_required';
  end if;

  if new.ai_status = 'COMPLETED' then
    if new.status <> 'VALUATION_READY'
       or new.ai_result is null
       or jsonb_typeof(new.ai_result) <> 'object'
       or new.ai_result #> '{range}' is null
       or new.ai_result #> '{marketEvidence}' is null
       or new.ai_quality is null
       or jsonb_typeof(new.ai_quality) <> 'object'
       or new.error_code is not null then
      raise exception 'v773_completed_valuation_result_required';
    end if;
  else
    if new.status <> 'NEEDS_REVIEW' or new.error_code is null then
      raise exception 'v773_failed_valuation_review_required';
    end if;
  end if;

  if new.cached_input_tokens > new.input_tokens
     or new.web_search_calls > 2
     or new.estimated_cost_usd > 0.05 then
    raise exception 'v773_usage_limit_exceeded';
  end if;

  return new;
end $$;

drop trigger if exists trg_guimmia_v773_valuation_guard
  on public.guimmia_property_valuation_leads;
create trigger trg_guimmia_v773_valuation_guard
before insert or update on public.guimmia_property_valuation_leads
for each row execute function public.guimmia_v773_valuation_guard();

create or replace function public.guimmia_v773_usage_immutable()
returns trigger
language plpgsql
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    raise exception 'V77.3 AI usage events are immutable';
  end if;
  return new;
end $$;

drop trigger if exists trg_guimmia_v773_usage_immutable
  on public.guimmia_ai_usage_events;
create trigger trg_guimmia_v773_usage_immutable
before update or delete on public.guimmia_ai_usage_events
for each row execute function public.guimmia_v773_usage_immutable();

create or replace function public.guimmia_v773_ai_budget_status()
returns table (
  month_spend_usd numeric,
  monthly_budget_usd numeric,
  remaining_usd numeric,
  available boolean
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with profile as (
    select p.monthly_budget_usd, p.max_request_cost_usd
    from public.guimmia_ai_gateway_profiles p
    where p.singleton_key = 'GUIMMIA_OPENAI_GATEWAY'
      and p.status = 'ACTIVE'
  ), usage as (
    select coalesce(sum(u.estimated_cost_usd), 0)::numeric as spent
    from public.guimmia_ai_usage_events u
    where u.status = 'COMPLETED'
      and u.created_at >= date_trunc('month', now())
  )
  select
    usage.spent,
    profile.monthly_budget_usd,
    greatest(profile.monthly_budget_usd - usage.spent, 0)::numeric,
    (profile.monthly_budget_usd - usage.spent) >= profile.max_request_cost_usd
  from profile cross join usage;
$$;

alter table public.guimmia_ai_gateway_profiles enable row level security;
alter table public.guimmia_ai_gateway_profiles force row level security;
alter table public.guimmia_property_valuation_leads enable row level security;
alter table public.guimmia_property_valuation_leads force row level security;
alter table public.guimmia_ai_usage_events enable row level security;
alter table public.guimmia_ai_usage_events force row level security;

drop policy if exists guimmia_v773_public_valuation_insert
  on public.guimmia_property_valuation_leads;
drop policy if exists guimmia_v773_public_usage_insert
  on public.guimmia_ai_usage_events;

revoke all on public.guimmia_ai_gateway_profiles from anon, authenticated;
revoke all on public.guimmia_property_valuation_leads from anon, authenticated;
revoke all on public.guimmia_ai_usage_events from anon, authenticated;
revoke all on sequence public.guimmia_ai_usage_events_id_seq from anon, authenticated;
revoke all on function public.guimmia_v773_ai_budget_status() from public;
grant insert on public.guimmia_property_valuation_leads to service_role;
grant insert on public.guimmia_ai_usage_events to service_role;
grant usage, select on sequence public.guimmia_ai_usage_events_id_seq to service_role;
grant execute on function public.guimmia_v773_ai_budget_status() to service_role;

comment on table public.guimmia_ai_gateway_profiles is
  'V77.3 OpenAI gateway policy. API secrets are never stored in this table.';
comment on table public.guimmia_property_valuation_leads is
  'Public valuation requests. Contact data is kept outside the OpenAI model input.';
comment on table public.guimmia_ai_usage_events is
  'Immutable token, search and estimated-cost audit for Guimmia AI calls.';
comment on function public.guimmia_v773_ai_budget_status() is
  'Returns only aggregate monthly spend and remaining V77.3 test budget; no customer data.';
