-- GUIMMIA V77.0.0 - Digital Agency
-- Dipende dalla V74 Foundation per app_roles / is_admin.
-- Additiva: non modifica marketplace V74.1.1.

begin;
create extension if not exists pgcrypto;

do $$
begin
  if to_regclass('public.app_roles') is null then
    raise exception 'V74 Foundation richiesta: public.app_roles non trovata';
  end if;
end $$;

create or replace function public.guimmia_touch_updated_at()
returns trigger language plpgsql set search_path='' as $$
begin
  new.updated_at = now();
  return new;
end $$;

create or replace function public.guimmia_is_admin()
returns boolean language sql stable security definer set search_path='' as $$
  select exists(
    select 1 from public.app_roles r
    where r.user_id = auth.uid() and r.role = 'admin'
  );
$$;
revoke all on function public.guimmia_is_admin() from public;
grant execute on function public.guimmia_is_admin() to authenticated;

create table if not exists public.agency_listings (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete set null,
  source_property_ref text,
  slug text not null unique,
  operation text not null check(operation in ('sale','rent')),
  property_type text not null,
  title text not null,
  description text not null default '',
  price_cents bigint not null check(price_cents >= 0),
  rent_period text check(rent_period is null or rent_period in ('month','week','day')),
  city text not null,
  province text,
  zone text,
  address_public text,
  latitude double precision,
  longitude double precision,
  bedrooms integer check(bedrooms is null or bedrooms >= 0),
  bathrooms integer check(bathrooms is null or bathrooms >= 0),
  rooms integer check(rooms is null or rooms >= 0),
  surface_sqm numeric(10,2) check(surface_sqm is null or surface_sqm > 0),
  floor text,
  total_floors integer check(total_floors is null or total_floors > 0),
  elevator boolean,
  furnished boolean,
  energy_class text,
  property_condition text,
  features text[] not null default '{}',
  cover_image_url text,
  status text not null default 'draft'
    check(status in ('draft','review','published','paused','reserved','sold','rented','archived')),
  visibility_tier text not null default 'standard'
    check(visibility_tier in ('standard','top')),
  featured boolean not null default false,
  ai_content_status text not null default 'empty'
    check(ai_content_status in ('empty','draft','approved')),
  ai_title text,
  ai_description text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agency_listings_public_idx
on public.agency_listings(status, featured desc, visibility_tier desc, published_at desc);

create index if not exists agency_listings_owner_idx
on public.agency_listings(owner_user_id, updated_at desc);

create index if not exists agency_listings_search_idx
on public.agency_listings(operation, city, property_type, price_cents);

drop trigger if exists agency_listings_updated_at on public.agency_listings;
create trigger agency_listings_updated_at
before update on public.agency_listings
for each row execute function public.guimmia_touch_updated_at();

create table if not exists public.agency_listing_media (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.agency_listings(id) on delete cascade,
  media_type text not null default 'photo'
    check(media_type in ('photo','video','floorplan','virtual_tour')),
  original_url text not null,
  branded_url text,
  alt_text text,
  position integer not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists agency_listing_media_listing_idx
on public.agency_listing_media(listing_id, position);

create table if not exists public.agency_listing_distribution (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.agency_listings(id) on delete cascade,
  portal text not null,
  publication_mode text not null default 'manual'
    check(publication_mode in ('manual','feed','api')),
  status text not null default 'draft'
    check(status in ('draft','ready','published','update_required','paused','removed','error')),
  external_id text,
  external_url text,
  last_error text,
  published_at timestamptz,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(listing_id, portal)
);

drop trigger if exists agency_distribution_updated_at on public.agency_listing_distribution;
create trigger agency_distribution_updated_at
before update on public.agency_listing_distribution
for each row execute function public.guimmia_touch_updated_at();

create table if not exists public.agency_inquiries (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.agency_listings(id) on delete cascade,
  listing_slug text not null,
  requester_user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  message text not null,
  wants_visit boolean not null default false,
  preferred_date date,
  privacy_accepted_at timestamptz not null,
  source text not null default 'guimmia_showcase',
  status text not null default 'new'
    check(status in ('new','contacted','qualified','visit_planned','closed','spam')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists agency_inquiries_listing_idx
on public.agency_inquiries(listing_id, created_at desc);

drop trigger if exists agency_inquiries_updated_at on public.agency_inquiries;
create trigger agency_inquiries_updated_at
before update on public.agency_inquiries
for each row execute function public.guimmia_touch_updated_at();

create table if not exists public.agency_visits (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.agency_listings(id) on delete cascade,
  inquiry_id uuid references public.agency_inquiries(id) on delete set null,
  owner_user_id uuid references auth.users(id) on delete set null,
  visitor_name text not null,
  visitor_email text,
  visitor_phone text,
  scheduled_for timestamptz not null,
  duration_minutes integer not null default 30 check(duration_minutes between 15 and 240),
  status text not null default 'planned'
    check(status in ('planned','confirmed','completed','cancelled','no_show')),
  owner_notes text,
  visitor_feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists agency_visits_listing_date_idx
on public.agency_visits(listing_id, scheduled_for);

drop trigger if exists agency_visits_updated_at on public.agency_visits;
create trigger agency_visits_updated_at
before update on public.agency_visits
for each row execute function public.guimmia_touch_updated_at();

create table if not exists public.agency_listing_events (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.agency_listings(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists agency_listing_events_idx
on public.agency_listing_events(listing_id, created_at desc);

-- RLS
alter table public.agency_listings enable row level security;
alter table public.agency_listing_media enable row level security;
alter table public.agency_listing_distribution enable row level security;
alter table public.agency_inquiries enable row level security;
alter table public.agency_visits enable row level security;
alter table public.agency_listing_events enable row level security;

-- Drop policies idempotentemente
do $$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname='public' and tablename like 'agency_%'
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

create policy agency_listings_public_read
on public.agency_listings for select to anon,authenticated
using(status='published');

create policy agency_listings_owner_read
on public.agency_listings for select to authenticated
using(owner_user_id=auth.uid());

create policy agency_listings_owner_insert
on public.agency_listings for insert to authenticated
with check(owner_user_id=auth.uid() and status in('draft','review'));

create policy agency_listings_owner_update
on public.agency_listings for update to authenticated
using(owner_user_id=auth.uid() and status in('draft','review'))
with check(owner_user_id=auth.uid() and status in('draft','review'));

create policy agency_listings_admin_all
on public.agency_listings for all to authenticated
using(public.guimmia_is_admin())
with check(public.guimmia_is_admin());

create policy agency_media_public_read
on public.agency_listing_media for select to anon,authenticated
using(exists(select 1 from public.agency_listings l where l.id=listing_id and l.status='published'));

create policy agency_media_owner_read
on public.agency_listing_media for select to authenticated
using(exists(select 1 from public.agency_listings l where l.id=listing_id and l.owner_user_id=auth.uid()));

create policy agency_media_owner_write
on public.agency_listing_media for all to authenticated
using(exists(select 1 from public.agency_listings l where l.id=listing_id and l.owner_user_id=auth.uid() and l.status in('draft','review')))
with check(exists(select 1 from public.agency_listings l where l.id=listing_id and l.owner_user_id=auth.uid() and l.status in('draft','review')));

create policy agency_media_admin_all
on public.agency_listing_media for all to authenticated
using(public.guimmia_is_admin()) with check(public.guimmia_is_admin());

create policy agency_distribution_owner_read
on public.agency_listing_distribution for select to authenticated
using(exists(select 1 from public.agency_listings l where l.id=listing_id and l.owner_user_id=auth.uid()));

create policy agency_distribution_admin_all
on public.agency_listing_distribution for all to authenticated
using(public.guimmia_is_admin()) with check(public.guimmia_is_admin());

create policy agency_inquiries_public_insert
on public.agency_inquiries for insert to anon,authenticated
with check(
  privacy_accepted_at is not null
  and exists(select 1 from public.agency_listings l where l.id=listing_id and l.status='published')
);

create policy agency_inquiries_owner_read
on public.agency_inquiries for select to authenticated
using(exists(select 1 from public.agency_listings l where l.id=listing_id and l.owner_user_id=auth.uid()));

create policy agency_inquiries_admin_all
on public.agency_inquiries for all to authenticated
using(public.guimmia_is_admin()) with check(public.guimmia_is_admin());

create policy agency_visits_owner_read
on public.agency_visits for select to authenticated
using(owner_user_id=auth.uid());

create policy agency_visits_admin_all
on public.agency_visits for all to authenticated
using(public.guimmia_is_admin()) with check(public.guimmia_is_admin());

create policy agency_events_owner_read
on public.agency_listing_events for select to authenticated
using(exists(select 1 from public.agency_listings l where l.id=listing_id and l.owner_user_id=auth.uid()));

create policy agency_events_admin_all
on public.agency_listing_events for all to authenticated
using(public.guimmia_is_admin()) with check(public.guimmia_is_admin());

grant select on public.agency_listings to anon,authenticated;
grant insert,update,delete on public.agency_listings to authenticated;
grant select on public.agency_listing_media to anon,authenticated;
grant insert,update,delete on public.agency_listing_media to authenticated;
grant select on public.agency_listing_distribution to authenticated;
grant insert,update,delete on public.agency_listing_distribution to authenticated;
grant insert on public.agency_inquiries to anon,authenticated;
grant select,update on public.agency_inquiries to authenticated;
grant select,insert,update on public.agency_visits to authenticated;
grant select,insert on public.agency_listing_events to authenticated;

commit;

-- ------------------------------------------------------------
-- V77 EXTENSION: Case Center + Document Engine + AI-first metrics
-- ------------------------------------------------------------
begin;

alter table public.agency_listings
  add column if not exists current_phase text not null default 'onboarding',
  add column if not exists human_touches integer not null default 0;

create table if not exists public.agency_case_tasks (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.agency_listings(id) on delete cascade,
  title text not null,
  category text not null,
  status text not null default 'todo'
    check(status in ('todo','in_progress','blocked','done')),
  priority integer not null default 100,
  due_at timestamptz,
  action_url text,
  why_it_matters text,
  requires_professional boolean not null default false,
  professional_type text,
  auto_created boolean not null default true,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists agency_case_tasks_listing_idx
  on public.agency_case_tasks(listing_id, priority, created_at);

drop trigger if exists agency_case_tasks_updated_at on public.agency_case_tasks;
create trigger agency_case_tasks_updated_at
before update on public.agency_case_tasks
for each row execute function public.guimmia_touch_updated_at();

create table if not exists public.agency_document_templates (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  document_type text not null,
  operation text check(operation is null or operation in ('sale','rent')),
  version integer not null default 1,
  status text not null default 'draft'
    check(status in ('draft','approved','retired')),
  schema_json jsonb not null default '{}'::jsonb,
  body_template text not null,
  legal_reviewed_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(code,version)
);

create table if not exists public.agency_documents (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.agency_listings(id) on delete cascade,
  template_id uuid references public.agency_document_templates(id) on delete restrict,
  document_type text not null,
  title text not null,
  status text not null default 'draft'
    check(status in (
      'draft','generated','review_required','approved',
      'signature_pending','signed','registration_pending',
      'registered','superseded','cancelled'
    )),
  current_version integer not null default 1,
  requires_human_review boolean not null default false,
  registration_required boolean not null default false,
  registration_deadline date,
  signed_at timestamptz,
  registered_at timestamptz,
  external_file_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists agency_documents_listing_idx
  on public.agency_documents(listing_id, created_at desc);

drop trigger if exists agency_documents_updated_at on public.agency_documents;
create trigger agency_documents_updated_at
before update on public.agency_documents
for each row execute function public.guimmia_touch_updated_at();

create table if not exists public.agency_document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.agency_documents(id) on delete cascade,
  version integer not null,
  data_json jsonb not null default '{}'::jsonb,
  rendered_text text,
  file_url text,
  checksum text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(document_id,version)
);

create table if not exists public.agency_contract_events (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.agency_listings(id) on delete cascade,
  document_id uuid references public.agency_documents(id) on delete set null,
  event_type text not null,
  event_date timestamptz not null default now(),
  amount_cents bigint,
  notes text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.agency_case_tasks enable row level security;
alter table public.agency_document_templates enable row level security;
alter table public.agency_documents enable row level security;
alter table public.agency_document_versions enable row level security;
alter table public.agency_contract_events enable row level security;

drop policy if exists agency_tasks_owner_read on public.agency_case_tasks;
create policy agency_tasks_owner_read
on public.agency_case_tasks for select to authenticated
using(exists(
  select 1 from public.agency_listings l
  where l.id=listing_id and l.owner_user_id=auth.uid()
));

drop policy if exists agency_tasks_admin_all on public.agency_case_tasks;
create policy agency_tasks_admin_all
on public.agency_case_tasks for all to authenticated
using(public.guimmia_is_admin()) with check(public.guimmia_is_admin());

drop policy if exists agency_templates_approved_read on public.agency_document_templates;
create policy agency_templates_approved_read
on public.agency_document_templates for select to authenticated
using(status='approved');

drop policy if exists agency_templates_admin_all on public.agency_document_templates;
create policy agency_templates_admin_all
on public.agency_document_templates for all to authenticated
using(public.guimmia_is_admin()) with check(public.guimmia_is_admin());

drop policy if exists agency_documents_owner_read on public.agency_documents;
create policy agency_documents_owner_read
on public.agency_documents for select to authenticated
using(exists(
  select 1 from public.agency_listings l
  where l.id=listing_id and l.owner_user_id=auth.uid()
));

drop policy if exists agency_documents_admin_all on public.agency_documents;
create policy agency_documents_admin_all
on public.agency_documents for all to authenticated
using(public.guimmia_is_admin()) with check(public.guimmia_is_admin());

drop policy if exists agency_document_versions_owner_read on public.agency_document_versions;
create policy agency_document_versions_owner_read
on public.agency_document_versions for select to authenticated
using(exists(
  select 1
  from public.agency_documents d
  join public.agency_listings l on l.id=d.listing_id
  where d.id=document_id and l.owner_user_id=auth.uid()
));

drop policy if exists agency_document_versions_admin_all on public.agency_document_versions;
create policy agency_document_versions_admin_all
on public.agency_document_versions for all to authenticated
using(public.guimmia_is_admin()) with check(public.guimmia_is_admin());

drop policy if exists agency_contract_events_owner_read on public.agency_contract_events;
create policy agency_contract_events_owner_read
on public.agency_contract_events for select to authenticated
using(exists(
  select 1 from public.agency_listings l
  where l.id=listing_id and l.owner_user_id=auth.uid()
));

drop policy if exists agency_contract_events_admin_all on public.agency_contract_events;
create policy agency_contract_events_admin_all
on public.agency_contract_events for all to authenticated
using(public.guimmia_is_admin()) with check(public.guimmia_is_admin());

grant select on public.agency_case_tasks to authenticated;
grant select on public.agency_document_templates to authenticated;
grant select on public.agency_documents to authenticated;
grant select on public.agency_document_versions to authenticated;
grant select on public.agency_contract_events to authenticated;

commit;
