-- CasaPilot V71 — Remote & Multilingual Layer
-- Migrazione additiva. NON viene eseguita dall'installer.
-- Prerequisiti: migrazioni Professionisti V69 e Professional OS V70 applicate.
-- Eseguire soltanto dopo backup Supabase e dopo il test locale della UI.

create extension if not exists "pgcrypto";

create table if not exists public.owner_remote_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferred_language text not null default 'it'
    check (preferred_language in ('it','en','de','fr','es')),
  country_of_residence text not null default 'Italia',
  timezone text not null default 'Europe/Rome',
  presence_availability text not null default 'available'
    check (presence_availability in (
      'available','specific_dates','remote_only','local_contact'
    )),
  specific_presence_dates text not null default '',
  local_contact_available boolean not null default false,
  translation_enabled boolean not null default false,
  video_call_preferred boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.professional_profiles
  add column if not exists language_skills jsonb not null default
    '[{"language":"it","level":"native"}]'::jsonb,
  add column if not exists remote_consultation boolean not null default false,
  add column if not exists video_call_available boolean not null default false,
  add column if not exists international_client_experience boolean not null default false,
  add column if not exists photo_report_available boolean not null default false,
  add column if not exists delegation_supported boolean not null default false;

alter table if exists public.professional_service_offerings_v70
  add column if not exists remote_execution_level text not null default 'none',
  add column if not exists owner_presence_requirement text not null default 'sometimes',
  add column if not exists inspection_required boolean not null default false,
  add column if not exists delegation_supported boolean not null default false,
  add column if not exists photo_report_available boolean not null default false,
  add column if not exists video_call_available boolean not null default false;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'offerings_v71_remote_execution_check'
  ) then
    alter table public.professional_service_offerings_v70
      add constraint offerings_v71_remote_execution_check
      check (remote_execution_level in (
        'none','consultation_only','mostly_remote','fully_remote'
      ));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'offerings_v71_owner_presence_check'
  ) then
    alter table public.professional_service_offerings_v70
      add constraint offerings_v71_owner_presence_check
      check (owner_presence_requirement in ('never','sometimes','required'));
  end if;
end $$;

alter table if exists public.lead_requests
  add column if not exists owner_language text not null default 'it',
  add column if not exists country_of_residence text not null default 'Italia',
  add column if not exists owner_timezone text not null default 'Europe/Rome',
  add column if not exists presence_availability text not null default 'available',
  add column if not exists specific_presence_dates text,
  add column if not exists local_contact_available boolean not null default false,
  add column if not exists translation_enabled boolean not null default false,
  add column if not exists video_call_preferred boolean not null default false;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'lead_requests_v71_language_check'
  ) then
    alter table public.lead_requests
      add constraint lead_requests_v71_language_check
      check (owner_language in ('it','en','de','fr','es'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'lead_requests_v71_presence_check'
  ) then
    alter table public.lead_requests
      add constraint lead_requests_v71_presence_check
      check (presence_availability in (
        'available','specific_dates','remote_only','local_contact'
      ));
  end if;
end $$;

alter table if exists public.messages
  add column if not exists original_language text not null default 'it',
  add column if not exists original_text text,
  add column if not exists translated_language text,
  add column if not exists translated_text text,
  add column if not exists translation_status text not null default 'same_language';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'messages_v71_original_language_check'
  ) then
    alter table public.messages
      add constraint messages_v71_original_language_check
      check (original_language in ('it','en','de','fr','es'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'messages_v71_translated_language_check'
  ) then
    alter table public.messages
      add constraint messages_v71_translated_language_check
      check (
        translated_language is null or
        translated_language in ('it','en','de','fr','es')
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'messages_v71_translation_status_check'
  ) then
    alter table public.messages
      add constraint messages_v71_translation_status_check
      check (translation_status in (
        'same_language','translated','demo_translation',
        'provider_required','failed'
      ));
  end if;
end $$;

update public.messages
set original_text = body
where original_text is null;

create table if not exists public.translation_jobs_v71 (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  source_language text not null,
  target_language text not null,
  provider text,
  status text not null default 'queued'
    check (status in ('queued','processing','completed','failed','manual_review')),
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (message_id, target_language)
);

create index if not exists owner_remote_preferences_language_idx
  on public.owner_remote_preferences (preferred_language, country_of_residence);

create index if not exists professional_profiles_language_skills_gin_idx
  on public.professional_profiles using gin (language_skills);

create index if not exists offerings_v71_remote_match_idx
  on public.professional_service_offerings_v70 (
    service_id,
    activation_status,
    remote_execution_level,
    owner_presence_requirement
  );

create index if not exists lead_requests_v71_remote_idx
  on public.lead_requests (
    service_id,
    presence_availability,
    owner_language,
    status
  );

alter table public.owner_remote_preferences enable row level security;
alter table public.translation_jobs_v71 enable row level security;

drop policy if exists owner_remote_preferences_own_all
  on public.owner_remote_preferences;
create policy owner_remote_preferences_own_all
  on public.owner_remote_preferences
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- I lavori di traduzione espongono informazioni operative del provider e sono
-- gestiti soltanto da funzioni server-side/service_role. Nessuna policy diretta
-- viene concessa al browser.

create or replace function public.remote_language_bonus_v71(
  p_professional_id uuid,
  p_owner_language text,
  p_translation_enabled boolean
)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select case
    when exists (
      select 1
      from public.professional_profiles profile
      where profile.id = p_professional_id
        and profile.language_skills @>
          jsonb_build_array(jsonb_build_object('language', p_owner_language))
    ) then 6
    when p_translation_enabled then 2
    else 0
  end;
$$;

revoke all on function public.remote_language_bonus_v71(uuid, text, boolean)
  from public;
grant execute on function public.remote_language_bonus_v71(uuid, text, boolean)
  to service_role;

comment on table public.owner_remote_preferences is
  'Preferenze riutilizzabili di lingua, fuso orario e presenza. Non definiscono un segmento commerciale separato.';

comment on table public.translation_jobs_v71 is
  'Coda server-side per traduzioni delle conversazioni. Il testo originale resta sempre conservato nei messaggi.';
