-- CasaPilot · account, profili e verifica professionale
-- Esegui l'intero file nel SQL Editor di Supabase.
-- Lo script è pensato per essere rieseguito: aggiorna anche lo schema della v6.5.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  account_type text not null default 'private',
  full_name text not null default '',
  phone text,
  city text,
  province text,
  avatar_url text,
  marketing_consent boolean not null default false,
  marketing_consent_updated_at timestamptz,
  terms_accepted_at timestamptz,
  terms_version text,
  privacy_accepted_at timestamptz,
  privacy_version text,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists marketing_consent boolean not null default false;
alter table public.profiles add column if not exists marketing_consent_updated_at timestamptz;
alter table public.profiles add column if not exists terms_accepted_at timestamptz;
alter table public.profiles add column if not exists terms_version text;
alter table public.profiles add column if not exists privacy_accepted_at timestamptz;
alter table public.profiles add column if not exists privacy_version text;
alter table public.profiles add column if not exists onboarding_completed_at timestamptz;

alter table public.profiles drop constraint if exists profiles_account_type_check;
alter table public.profiles
  add constraint profiles_account_type_check
  check (account_type in ('private', 'professional'));

create table if not exists public.professional_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  profession text not null default '',
  business_name text not null default '',
  vat_number text,
  registration_number text,
  phone text,
  city text,
  province text,
  website_url text,
  bio text,
  service_areas text[] not null default '{}',
  years_experience integer,
  slug text,
  verification_status text not null default 'draft',
  verification_notes text,
  is_public boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.professional_profiles add column if not exists website_url text;
alter table public.professional_profiles add column if not exists years_experience integer;
alter table public.professional_profiles add column if not exists slug text;
alter table public.professional_profiles add column if not exists verification_notes text;
alter table public.professional_profiles add column if not exists is_public boolean not null default false;

-- Prima rimuoviamo il vecchio vincolo della v6.5, poi migriamo i valori.
-- Invertire quest'ordine farebbe fallire l'UPDATE perché il vecchio vincolo
-- non ammetteva ancora gli stati `draft` e `changes_requested`.
alter table public.professional_profiles
  drop constraint if exists professional_profiles_verification_status_check;

update public.professional_profiles
set verification_status = case verification_status
  when 'pending' then 'draft'
  when 'rejected' then 'changes_requested'
  else verification_status
end
where verification_status in ('pending', 'rejected');

alter table public.professional_profiles
  alter column verification_status set default 'draft';

alter table public.professional_profiles
  add constraint professional_profiles_verification_status_check
  check (verification_status in (
    'draft',
    'submitted',
    'under_review',
    'changes_requested',
    'verified',
    'suspended'
  ));

alter table public.professional_profiles
  drop constraint if exists professional_profiles_years_experience_check;
alter table public.professional_profiles
  add constraint professional_profiles_years_experience_check
  check (years_experience is null or years_experience between 0 and 80);

create table if not exists public.professional_verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.professional_profiles(user_id) on delete cascade,
  status text not null default 'submitted'
    check (status in ('submitted', 'under_review', 'changes_requested', 'approved', 'rejected', 'cancelled')),
  profile_snapshot jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewer_id uuid references auth.users(id) on delete set null,
  reviewer_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.normalize_professional_profile()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.profession = trim(coalesce(new.profession, ''));
  new.business_name = trim(coalesce(new.business_name, ''));
  new.province = upper(nullif(trim(coalesce(new.province, '')), ''));
  new.service_areas = coalesce(new.service_areas, '{}');

  if new.verification_status <> 'verified' then
    new.is_public = false;
  end if;

  if tg_op = 'UPDATE'
     and old.verification_status in ('submitted', 'under_review', 'verified')
     and (
       new.profession is distinct from old.profession or
       new.business_name is distinct from old.business_name or
       new.vat_number is distinct from old.vat_number or
       new.registration_number is distinct from old.registration_number or
       new.phone is distinct from old.phone or
       new.city is distinct from old.city or
       new.province is distinct from old.province or
       new.website_url is distinct from old.website_url or
       new.years_experience is distinct from old.years_experience or
       new.bio is distinct from old.bio or
       new.service_areas is distinct from old.service_areas
     ) then
    new.verification_status = 'draft';
    new.verification_notes = null;
    new.verified_at = null;
    new.is_public = false;
  end if;

  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_account_type text;
  selected_service_areas text[] := '{}';
begin
  selected_account_type := case
    when new.raw_user_meta_data ->> 'account_type' = 'professional'
      then 'professional'
    else 'private'
  end;

  if jsonb_typeof(new.raw_user_meta_data -> 'service_areas') = 'array' then
    select coalesce(array_agg(value), '{}')
      into selected_service_areas
    from jsonb_array_elements_text(new.raw_user_meta_data -> 'service_areas') as value;
  end if;

  insert into public.profiles (
    id,
    account_type,
    full_name,
    phone,
    city,
    province,
    marketing_consent,
    marketing_consent_updated_at,
    terms_accepted_at,
    terms_version,
    privacy_accepted_at,
    privacy_version
  ) values (
    new.id,
    selected_account_type,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    nullif(new.raw_user_meta_data ->> 'city', ''),
    upper(nullif(new.raw_user_meta_data ->> 'province', '')),
    case lower(coalesce(new.raw_user_meta_data ->> 'marketing_consent', 'false'))
      when 'true' then true
      when '1' then true
      when 'yes' then true
      else false
    end,
    now(),
    case when new.raw_user_meta_data ? 'terms_accepted_at' then now() else null end,
    nullif(new.raw_user_meta_data ->> 'terms_version', ''),
    case when new.raw_user_meta_data ? 'privacy_accepted_at' then now() else null end,
    nullif(new.raw_user_meta_data ->> 'privacy_version', '')
  )
  on conflict (id) do nothing;

  if selected_account_type = 'professional' then
    insert into public.professional_profiles (
      user_id,
      profession,
      business_name,
      vat_number,
      registration_number,
      phone,
      city,
      province,
      website_url,
      service_areas,
      verification_status
    ) values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'profession', ''),
      coalesce(new.raw_user_meta_data ->> 'business_name', ''),
      nullif(new.raw_user_meta_data ->> 'vat_number', ''),
      nullif(new.raw_user_meta_data ->> 'registration_number', ''),
      nullif(new.raw_user_meta_data ->> 'phone', ''),
      nullif(new.raw_user_meta_data ->> 'city', ''),
      upper(nullif(new.raw_user_meta_data ->> 'province', '')),
      nullif(new.raw_user_meta_data ->> 'website_url', ''),
      selected_service_areas,
      'draft'
    )
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

create or replace function public.activate_professional_profile(
  p_profession text,
  p_business_name text,
  p_phone text default null,
  p_city text default null,
  p_province text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Devi accedere per attivare il profilo professionale.';
  end if;

  if length(trim(coalesce(p_profession, ''))) = 0 or
     length(trim(coalesce(p_business_name, ''))) = 0 then
    raise exception 'Professione e attività sono obbligatorie.';
  end if;

  update public.profiles
  set account_type = 'professional', updated_at = now()
  where id = current_user_id;

  insert into public.professional_profiles (
    user_id,
    profession,
    business_name,
    phone,
    city,
    province,
    verification_status
  ) values (
    current_user_id,
    trim(p_profession),
    trim(p_business_name),
    nullif(trim(coalesce(p_phone, '')), ''),
    nullif(trim(coalesce(p_city, '')), ''),
    upper(nullif(trim(coalesce(p_province, '')), '')),
    'draft'
  )
  on conflict (user_id) do update set
    profession = excluded.profession,
    business_name = excluded.business_name,
    phone = coalesce(excluded.phone, public.professional_profiles.phone),
    city = coalesce(excluded.city, public.professional_profiles.city),
    province = coalesce(excluded.province, public.professional_profiles.province),
    updated_at = now();
end;
$$;

create or replace function public.submit_professional_verification()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  professional_record public.professional_profiles%rowtype;
  request_id uuid;
begin
  if current_user_id is null then
    raise exception 'Devi accedere per inviare la richiesta.';
  end if;

  select * into professional_record
  from public.professional_profiles
  where user_id = current_user_id;

  if not found then
    raise exception 'Profilo professionale non trovato.';
  end if;

  if professional_record.verification_status not in ('draft', 'changes_requested') then
    raise exception 'La richiesta è già stata inviata o il profilo non può essere reinviato.';
  end if;

  if length(trim(professional_record.profession)) = 0 or
     length(trim(professional_record.business_name)) = 0 or
     length(trim(coalesce(professional_record.phone, ''))) = 0 or
     length(trim(coalesce(professional_record.city, ''))) = 0 or
     length(trim(coalesce(professional_record.province, ''))) <> 2 or
     length(trim(coalesce(professional_record.bio, ''))) < 80 or
     cardinality(professional_record.service_areas) = 0 then
    raise exception 'Completa tutti i dati richiesti prima dell’invio.';
  end if;

  insert into public.professional_verification_requests (
    user_id,
    status,
    profile_snapshot
  ) values (
    current_user_id,
    'submitted',
    to_jsonb(professional_record) - 'verification_notes'
  )
  returning id into request_id;

  update public.professional_profiles
  set verification_status = 'submitted',
      verification_notes = null,
      is_public = false,
      updated_at = now()
  where user_id = current_user_id;

  return request_id;
end;
$$;

-- Trigger e aggiornamenti automatici

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists professional_profiles_set_updated_at on public.professional_profiles;
create trigger professional_profiles_set_updated_at
before update on public.professional_profiles
for each row execute function public.set_updated_at();

drop trigger if exists professional_profiles_normalize on public.professional_profiles;
create trigger professional_profiles_normalize
before insert or update on public.professional_profiles
for each row execute function public.normalize_professional_profile();

drop trigger if exists verification_requests_set_updated_at on public.professional_verification_requests;
create trigger verification_requests_set_updated_at
before update on public.professional_verification_requests
for each row execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.professional_profiles enable row level security;
alter table public.professional_verification_requests enable row level security;

-- Profilo personale

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- Profilo professionale

drop policy if exists "professional_profiles_select_own" on public.professional_profiles;
create policy "professional_profiles_select_own"
on public.professional_profiles for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "professional_profiles_update_own" on public.professional_profiles;
create policy "professional_profiles_update_own"
on public.professional_profiles for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- Richieste: l'utente può soltanto leggere le proprie. Inserimento e stato passano dalla funzione protetta.

drop policy if exists "verification_requests_select_own" on public.professional_verification_requests;
create policy "verification_requests_select_own"
on public.professional_verification_requests for select
to authenticated
using ((select auth.uid()) = user_id);

-- Privilegi sulle colonne modificabili dall'utente
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (
  full_name,
  phone,
  city,
  province,
  avatar_url,
  marketing_consent,
  marketing_consent_updated_at,
  onboarding_completed_at,
  updated_at
) on public.profiles to authenticated;

revoke all on public.professional_profiles from anon, authenticated;
grant select on public.professional_profiles to authenticated;
grant update (
  profession,
  business_name,
  vat_number,
  registration_number,
  phone,
  city,
  province,
  website_url,
  bio,
  service_areas,
  years_experience,
  slug,
  is_public,
  updated_at
) on public.professional_profiles to authenticated;

revoke all on public.professional_verification_requests from anon, authenticated;
grant select on public.professional_verification_requests to authenticated;

revoke execute on function public.activate_professional_profile(text, text, text, text, text) from public;
revoke execute on function public.submit_professional_verification() from public;
grant execute on function public.activate_professional_profile(text, text, text, text, text) to authenticated;
grant execute on function public.submit_professional_verification() to authenticated;

-- Elenco pubblico: espone soltanto campi non sensibili dei profili verificati e resi visibili.
drop view if exists public.verified_professionals;
create view public.verified_professionals
with (security_barrier = true)
as
select
  pp.user_id,
  pp.slug,
  p.full_name,
  pp.profession,
  pp.business_name,
  pp.city,
  pp.province,
  pp.website_url,
  pp.bio,
  pp.service_areas,
  pp.years_experience,
  pp.verified_at
from public.professional_profiles pp
join public.profiles p on p.id = pp.user_id
where pp.verification_status = 'verified'
  and pp.is_public = true;

grant select on public.verified_professionals to anon, authenticated;

create index if not exists profiles_account_type_idx
on public.profiles(account_type);

create index if not exists professional_profiles_verification_idx
on public.professional_profiles(verification_status, is_public);

create unique index if not exists professional_profiles_slug_unique_idx
on public.professional_profiles(lower(slug))
where slug is not null;

create index if not exists professional_verification_requests_user_idx
on public.professional_verification_requests(user_id, submitted_at desc);
