-- CasaPilot V72 — Adaptive Communication & Remote Operations
-- Migrazione additiva. NON viene eseguita dall'installer.
-- Prerequisiti: V69, V70 e migrazione V71 applicate.

create extension if not exists "pgcrypto";

alter table if exists public.owner_remote_preferences
  add column if not exists communication_preference text not null default 'automatic',
  add column if not exists translation_consent boolean not null default false,
  add column if not exists show_original_by_default boolean not null default true,
  add column if not exists local_contact_role text not null default '',
  add column if not exists preferred_contact_windows jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'owner_remote_preferences_v72_communication_check'
  ) then
    alter table public.owner_remote_preferences
      add constraint owner_remote_preferences_v72_communication_check
      check (communication_preference in (
        'automatic','direct_preferred','translation_allowed','direct_only'
      ));
  end if;
end $$;

alter table if exists public.professional_profiles
  add column if not exists asynchronous_updates boolean not null default true,
  add column if not exists preferred_contact_windows jsonb not null default '[]'::jsonb;

alter table if exists public.professional_service_offerings_v70
  add column if not exists remote_feasibility text not null default 'local_only',
  add column if not exists document_handling text not null default 'not_applicable',
  add column if not exists signature_mode text not null default 'not_required',
  add column if not exists local_contact_sufficient boolean not null default true,
  add column if not exists owner_action_required jsonb not null default '[]'::jsonb,
  add column if not exists remote_workflow_steps jsonb not null default '[]'::jsonb,
  add column if not exists report_frequency text not null default 'on_milestone';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'offerings_v72_remote_feasibility_check'
  ) then
    alter table public.professional_service_offerings_v70
      add constraint offerings_v72_remote_feasibility_check
      check (remote_feasibility in (
        'local_only','remote_coordination','mostly_remote','fully_remote'
      ));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'offerings_v72_document_handling_check'
  ) then
    alter table public.professional_service_offerings_v70
      add constraint offerings_v72_document_handling_check
      check (document_handling in (
        'digital','digital_and_originals','physical_originals','not_applicable'
      ));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'offerings_v72_signature_mode_check'
  ) then
    alter table public.professional_service_offerings_v70
      add constraint offerings_v72_signature_mode_check
      check (signature_mode in (
        'not_required','digital_possible','delegation_possible','in_person_required'
      ));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'offerings_v72_report_frequency_check'
  ) then
    alter table public.professional_service_offerings_v70
      add constraint offerings_v72_report_frequency_check
      check (report_frequency in (
        'on_milestone','daily','weekly','on_request'
      ));
  end if;
end $$;

alter table if exists public.lead_requests
  add column if not exists communication_preference text not null default 'automatic',
  add column if not exists show_original_by_default boolean not null default true,
  add column if not exists local_contact_role text,
  add column if not exists preferred_contact_windows jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'lead_requests_v72_communication_check'
  ) then
    alter table public.lead_requests
      add constraint lead_requests_v72_communication_check
      check (communication_preference in (
        'automatic','direct_preferred','translation_allowed','direct_only'
      ));
  end if;
end $$;

alter table if exists public.messages
  add column if not exists content_sensitivity text not null default 'routine',
  add column if not exists translation_method text not null default 'none',
  add column if not exists translation_quality text not null default 'unknown',
  add column if not exists translation_review_required boolean not null default false,
  add column if not exists translation_reviewed_at timestamptz,
  add column if not exists translation_reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists glossary_references jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'messages_v72_sensitivity_check'
  ) then
    alter table public.messages
      add constraint messages_v72_sensitivity_check
      check (content_sensitivity in (
        'routine','technical','financial','legal','official_document'
      ));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'messages_v72_translation_method_check'
  ) then
    alter table public.messages
      add constraint messages_v72_translation_method_check
      check (translation_method in (
        'same_language','local_glossary','provider','human_review','none'
      ));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'messages_v72_translation_quality_check'
  ) then
    alter table public.messages
      add constraint messages_v72_translation_quality_check
      check (translation_quality in ('unknown','low','medium','high'));
  end if;
end $$;

create table if not exists public.translation_memory_v72 (
  id uuid primary key default gen_random_uuid(),
  content_hash text not null,
  source_language text not null,
  target_language text not null,
  original_text text not null,
  translated_text text not null,
  content_sensitivity text not null,
  method text not null,
  quality text not null default 'unknown',
  provider text,
  approved boolean not null default false,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (content_hash, source_language, target_language)
);

create table if not exists public.translation_audit_v72 (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references public.messages(id) on delete cascade,
  action text not null check (action in (
    'classified','queued','translated','shown_original','review_requested',
    'approved','failed','official_document_blocked'
  )),
  content_sensitivity text,
  metadata jsonb not null default '{}'::jsonb,
  actor_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.remote_operation_plans_v72 (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.lead_requests(id) on delete cascade,
  quote_id uuid references public.quotes(id) on delete set null,
  service_id text not null,
  feasibility text not null,
  owner_presence_needed boolean not null default false,
  local_contact_useful boolean not null default false,
  delegation_possible boolean not null default false,
  inspection_required boolean not null default false,
  signature_mode text not null default 'not_required',
  document_handling text not null default 'not_applicable',
  workflow_steps jsonb not null default '[]'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  status text not null default 'draft'
    check (status in ('draft','confirmed','in_progress','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lead_id, quote_id)
);

create index if not exists translation_memory_v72_lookup_idx
  on public.translation_memory_v72
  (content_hash, source_language, target_language, approved);

create index if not exists messages_v72_review_idx
  on public.messages
  (translation_review_required, translation_reviewed_at, created_at desc);

create index if not exists offerings_v72_remote_idx
  on public.professional_service_offerings_v70
  (service_id, activation_status, remote_feasibility, owner_presence_requirement);

create index if not exists remote_operation_plans_v72_lead_idx
  on public.remote_operation_plans_v72 (lead_id, status);

alter table public.translation_memory_v72 enable row level security;
alter table public.translation_audit_v72 enable row level security;
alter table public.remote_operation_plans_v72 enable row level security;

-- Translation memory and provider audit remain server-side. No browser policy is
-- created because they can contain sensitive cross-user content.

create policy remote_operation_plans_v72_owner_read
  on public.remote_operation_plans_v72
  for select to authenticated
  using (
    exists (
      select 1
      from public.lead_requests lead
      where lead.id = remote_operation_plans_v72.lead_id
        and lead.owner_id = auth.uid()
    )
    or exists (
      select 1
      from public.quotes quote
      join public.professional_profiles profile
        on profile.id = quote.professional_id
      where quote.id = remote_operation_plans_v72.quote_id
        and profile.user_id = auth.uid()
    )
  );

create or replace function public.communication_bonus_v72(
  p_professional_id uuid,
  p_owner_language text,
  p_translation_enabled boolean,
  p_communication_preference text
)
returns table (
  blocker boolean,
  score_bonus integer,
  reason text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_common_language boolean;
begin
  select exists (
    select 1
    from public.professional_profiles profile
    where profile.id = p_professional_id
      and profile.language_skills @>
        jsonb_build_array(jsonb_build_object('language', p_owner_language))
  ) into v_common_language;

  if v_common_language then
    return query select false, 7, 'Lingua in comune'::text;
  elsif p_communication_preference = 'direct_only' then
    return query select true, 0, 'L''utente richiede comunicazione diretta'::text;
  elsif p_translation_enabled then
    return query select false, 2, 'Traduzione di Pilot disponibile'::text;
  else
    return query select false, 0, 'Comunicazione da concordare'::text;
  end if;
end;
$$;

revoke all on function public.communication_bonus_v72(uuid, text, boolean, text)
  from public;
grant execute on function public.communication_bonus_v72(uuid, text, boolean, text)
  to service_role;

comment on table public.translation_memory_v72 is
  'Cache server-side delle traduzioni. I contenuti sensibili possono essere riutilizzati soltanto quando approvati.';

comment on table public.remote_operation_plans_v72 is
  'Piano operativo collegato a lead e preventivo: responsabilità, presenza, delega, sopralluogo e documenti.';
