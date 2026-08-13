-- CasaPilot V74.1.1 - Professional Onboarding + Marketplace Core
-- Additiva rispetto a V74 Supabase Foundation.
-- Sostituisce il pacchetto V74.1 precedente NON ancora installato.
-- Non attiva pagamenti, success fee o AI matching automatico.

begin;
create extension if not exists pgcrypto;

-- ============================================================
-- 1. Profilo professionale cloud: sede strutturata + onboarding
-- ============================================================
alter table public.professional_profiles
  add column if not exists street_address text,
  add column if not exists postal_code text,
  add column if not exists region text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists onboarding_step integer not null default 0,
  add column if not exists onboarding_completed_at timestamptz;

alter table public.professional_profiles
  drop constraint if exists professional_profiles_onboarding_step_check;
alter table public.professional_profiles
  add constraint professional_profiles_onboarding_step_check
  check (onboarding_step between 0 and 10);

-- Le nuove colonne sono modificabili solo dal proprietario del profilo tramite RLS esistente.
grant update (
  street_address, postal_code, region, latitude, longitude,
  onboarding_step, onboarding_completed_at
) on public.professional_profiles to authenticated;

-- Estende la normalizzazione V74: modifiche alla sede strutturata invalidano una verifica precedente.
create or replace function public.normalize_professional_profile()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.display_name = trim(coalesce(new.display_name, ''));
  new.legal_name = nullif(trim(coalesce(new.legal_name, '')), '');
  new.contact_name = nullif(trim(coalesce(new.contact_name, '')), '');
  new.contact_role = nullif(trim(coalesce(new.contact_role, '')), '');
  new.profession = trim(coalesce(new.profession, ''));
  new.business_name = trim(coalesce(new.business_name, ''));
  if new.display_name = '' then new.display_name = coalesce(nullif(new.business_name,''),new.legal_name,new.profession); end if;
  if new.business_name = '' then new.business_name = coalesce(nullif(new.display_name,''),new.legal_name,new.profession); end if;
  new.province = upper(nullif(trim(coalesce(new.province, '')), ''));
  new.service_areas = coalesce(new.service_areas, '{}');
  if new.verification_status <> 'verified' then new.is_public = false; end if;
  if tg_op='UPDATE'
     and old.verification_status in ('submitted','under_review','verified')
     and (
       new.professional_type is distinct from old.professional_type or
       new.display_name is distinct from old.display_name or
       new.legal_name is distinct from old.legal_name or
       new.contact_name is distinct from old.contact_name or
       new.contact_role is distinct from old.contact_role or
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
       new.service_areas is distinct from old.service_areas or
       new.street_address is distinct from old.street_address or
       new.postal_code is distinct from old.postal_code or
       new.region is distinct from old.region or
       new.latitude is distinct from old.latitude or
       new.longitude is distinct from old.longitude
     ) then
    new.verification_status='draft';
    new.verification_notes=null;
    new.verified_at=null;
    new.is_public=false;
  end if;
  return new;
end;
$$;

-- ============================================================
-- 2. Tassonomia CasaPilot: macro-categorie -> servizi
-- ============================================================
create table if not exists public.marketplace_macro_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  description text,
  active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketplace_services (
  id uuid primary key default gen_random_uuid(),
  macro_category_id uuid not null references public.marketplace_macro_categories(id) on delete restrict,
  slug text not null unique,
  label text not null,
  description text,
  regulatory_class text not null default 'standard'
    check (regulatory_class in ('standard','review_required','excluded_initially')),
  requires_professional_license boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketplace_professional_services (
  id uuid primary key default gen_random_uuid(),
  professional_user_id uuid not null references public.professional_profiles(user_id) on delete cascade,
  service_id uuid not null references public.marketplace_services(id) on delete restrict,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (professional_user_id, service_id)
);

insert into public.marketplace_macro_categories(slug,label,description,sort_order) values
('lavori-edili','Ristrutturazioni e lavori edili','Interventi di ristrutturazione, muratura e finiture.',10),
('pratiche-tecniche','Progettazione e pratiche tecniche','Progettazione, catasto, urbanistica, perizie e direzione lavori.',20),
('energia-certificazioni','Efficienza energetica e certificazioni','APE, diagnosi e servizi energetici collegati agli immobili.',30),
('condominio-gestione','Condominio e gestione','Amministrazione e servizi operativi per condomini e immobili.',40),
('valorizzazione','Fotografia e valorizzazione immobiliare','Fotografia, video, virtual tour e home staging.',50),
('traslochi-sgomberi','Traslochi e sgomberi','Traslochi, sgomberi e servizi logistici collegati.',60),
('manutenzione-impianti','Manutenzione e impianti','Interventi tecnici e manutentivi sugli immobili.',70)
on conflict (slug) do update set label=excluded.label, description=excluded.description, sort_order=excluded.sort_order, active=true;

with m as (select id, slug from public.marketplace_macro_categories)
insert into public.marketplace_services(macro_category_id,slug,label,description,regulatory_class,requires_professional_license,sort_order)
select m.id, v.slug, v.label, v.description, v.regulatory_class, v.requires_license, v.sort_order
from m
join (values
('lavori-edili','ristrutturazione-completa','Ristrutturazione completa','Ristrutturazione coordinata di uno o più ambienti.','standard',false,10),
('lavori-edili','rifacimento-bagno','Rifacimento bagno','Ristrutturazione completa o parziale del bagno.','standard',false,20),
('lavori-edili','rifacimento-cucina','Rifacimento cucina','Opere edili e finiture per cucine.','standard',false,30),
('lavori-edili','muratura-finiture','Muratura e finiture','Opere murarie, cartongesso, intonaci e finiture.','standard',false,40),
('pratiche-tecniche','pratiche-catastali','Pratiche catastali','Variazioni, planimetrie, visure e pratiche catastali.','review_required',true,10),
('pratiche-tecniche','pratiche-urbanistiche','Pratiche urbanistiche','CILA, SCIA e verifiche urbanistiche quando applicabili.','review_required',true,20),
('pratiche-tecniche','progettazione','Progettazione','Progettazione architettonica o tecnica.','review_required',true,30),
('pratiche-tecniche','direzione-lavori','Direzione lavori','Coordinamento tecnico e direzione dei lavori.','review_required',true,40),
('pratiche-tecniche','perizia-tecnica','Perizia tecnica','Relazioni e valutazioni tecniche sull’immobile.','review_required',true,50),
('energia-certificazioni','ape','Attestato di Prestazione Energetica (APE)','Redazione dell’APE da soggetto abilitato.','review_required',true,10),
('energia-certificazioni','diagnosi-energetica','Diagnosi energetica','Analisi dei consumi e possibili interventi di efficientamento.','review_required',true,20),
('condominio-gestione','amministrazione-condominio','Amministrazione di condominio','Gestione amministrativa e operativa del condominio.','standard',false,10),
('valorizzazione','fotografia-immobiliare','Fotografia immobiliare','Servizio fotografico professionale per immobili.','standard',false,10),
('valorizzazione','video-virtual-tour','Video e virtual tour','Video, riprese e tour virtuali dell’immobile.','standard',false,20),
('valorizzazione','home-staging','Home staging','Preparazione e valorizzazione visiva dell’immobile.','standard',false,30),
('traslochi-sgomberi','trasloco','Trasloco','Trasporto e movimentazione per cambio abitazione.','standard',false,10),
('traslochi-sgomberi','sgombero','Sgombero','Sgombero di locali, cantine, garage o immobili.','standard',false,20),
('manutenzione-impianti','idraulica','Idraulica','Interventi idraulici e manutenzione impianti.','standard',false,10),
('manutenzione-impianti','elettrico','Impianto elettrico','Interventi elettrici e manutenzione.','standard',false,20),
('manutenzione-impianti','climatizzazione','Climatizzazione','Installazione e manutenzione climatizzazione.','standard',false,30)
) as v(macro_slug,slug,label,description,regulatory_class,requires_license,sort_order)
on v.macro_slug=m.slug
on conflict (slug) do update set
  macro_category_id=excluded.macro_category_id,
  label=excluded.label,
  description=excluded.description,
  regulatory_class=excluded.regulatory_class,
  requires_professional_license=excluded.requires_professional_license,
  sort_order=excluded.sort_order,
  active=true;

-- ============================================================
-- 3. Marketplace core
-- ============================================================
create table if not exists public.marketplace_requests (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  service_id uuid not null references public.marketplace_services(id) on delete restrict,
  title text not null,
  description text not null,
  city text,
  province text,
  postal_code text,
  property_ref text,
  status text not null default 'open' check (status in ('draft','open','matched','quotes_received','accepted','in_progress','completed','cancelled')),
  max_matches smallint not null default 3 check (max_matches between 1 and 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists marketplace_requests_owner_idx on public.marketplace_requests(owner_user_id, created_at desc);

create table if not exists public.marketplace_matches (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.marketplace_requests(id) on delete cascade,
  professional_user_id uuid not null references public.professional_profiles(user_id) on delete cascade,
  status text not null default 'invited' check (status in ('invited','viewed','declined','quoted','selected','not_selected','expired')),
  match_reason jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(request_id,professional_user_id)
);

create table if not exists public.marketplace_quotes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.marketplace_requests(id) on delete cascade,
  professional_user_id uuid not null references public.professional_profiles(user_id) on delete cascade,
  amount_cents bigint not null check (amount_cents>0),
  currency char(3) not null default 'EUR',
  summary text not null,
  scope_items jsonb not null default '[]'::jsonb,
  exclusions text,
  estimated_days integer check (estimated_days is null or estimated_days>0),
  valid_until date,
  status text not null default 'submitted' check (status in ('submitted','accepted','declined','withdrawn','expired')),
  submitted_at timestamptz not null default now(),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(request_id,professional_user_id)
);

create table if not exists public.marketplace_contact_unlocks (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.marketplace_requests(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  professional_user_id uuid not null references public.professional_profiles(user_id) on delete cascade,
  reason text not null check(reason in ('quote_accepted','payment_confirmed','admin_override')),
  unlocked_at timestamptz not null default now(),
  unique(request_id,owner_user_id,professional_user_id)
);

create table if not exists public.marketplace_jobs (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.marketplace_requests(id) on delete restrict,
  quote_id uuid not null unique references public.marketplace_quotes(id) on delete restrict,
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  professional_user_id uuid not null references public.professional_profiles(user_id) on delete restrict,
  agreed_amount_cents bigint not null check(agreed_amount_cents>0),
  currency char(3) not null default 'EUR',
  monetization_mode text not null default 'unconfigured' check(monetization_mode in ('unconfigured','saas','transactional')),
  platform_fee_cents bigint check(platform_fee_cents is null or platform_fee_cents>=0),
  payment_provider text,
  payment_reference text,
  payment_status text not null default 'not_configured' check(payment_status in ('not_configured','pending','authorized','paid','failed','refunded','partially_refunded')),
  status text not null default 'accepted' check(status in ('accepted','in_progress','completed','cancelled','disputed')),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketplace_reviews (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null unique references public.marketplace_jobs(id) on delete restrict,
  reviewer_user_id uuid not null references auth.users(id) on delete restrict,
  professional_user_id uuid not null references public.professional_profiles(user_id) on delete restrict,
  rating smallint not null check(rating between 1 and 5),
  body text,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.marketplace_conversations (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.marketplace_requests(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  professional_user_id uuid not null references public.professional_profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(request_id,owner_user_id,professional_user_id)
);

create table if not exists public.marketplace_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.marketplace_conversations(id) on delete cascade,
  sender_user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  moderation_status text not null default 'pending' check(moderation_status in ('pending','allowed','blocked','redacted')),
  moderation_reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.marketplace_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.marketplace_requests(id) on delete cascade,
  job_id uuid references public.marketplace_jobs(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 4. Trigger updated_at
-- ============================================================
create or replace function public.marketplace_set_updated_at() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at=now(); return new; end; $$;

do $$ declare t text; begin
  foreach t in array array['marketplace_macro_categories','marketplace_services','marketplace_professional_services','marketplace_requests','marketplace_matches','marketplace_quotes','marketplace_jobs'] loop
    execute format('drop trigger if exists %I_updated_at on public.%I',t,t);
    execute format('create trigger %I_updated_at before update on public.%I for each row execute function public.marketplace_set_updated_at()',t,t);
  end loop;
end $$;

-- ============================================================
-- 5. RLS + grants
-- ============================================================
create or replace function public.marketplace_is_admin() returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.app_roles r where r.user_id=auth.uid() and r.role='admin'); $$;
revoke all on function public.marketplace_is_admin() from public;
grant execute on function public.marketplace_is_admin() to authenticated;

alter table public.marketplace_macro_categories enable row level security;
alter table public.marketplace_services enable row level security;
alter table public.marketplace_professional_services enable row level security;
alter table public.marketplace_requests enable row level security;
alter table public.marketplace_matches enable row level security;
alter table public.marketplace_quotes enable row level security;
alter table public.marketplace_contact_unlocks enable row level security;
alter table public.marketplace_jobs enable row level security;
alter table public.marketplace_reviews enable row level security;
alter table public.marketplace_conversations enable row level security;
alter table public.marketplace_messages enable row level security;
alter table public.marketplace_events enable row level security;

-- policies: drop/create idempotente
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname='public' AND tablename like 'marketplace_%' LOOP
    EXECUTE format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

create policy marketplace_macro_read on public.marketplace_macro_categories for select to anon,authenticated using(active=true or public.marketplace_is_admin());
create policy marketplace_services_read on public.marketplace_services for select to anon,authenticated using(active=true or public.marketplace_is_admin());
create policy marketplace_prof_services_read on public.marketplace_professional_services for select to authenticated using(professional_user_id=auth.uid() or public.marketplace_is_admin());
create policy marketplace_requests_read on public.marketplace_requests for select to authenticated using(owner_user_id=auth.uid() or public.marketplace_is_admin());
create policy marketplace_matches_read on public.marketplace_matches for select to authenticated using(professional_user_id=auth.uid() or exists(select 1 from public.marketplace_requests r where r.id=request_id and r.owner_user_id=auth.uid()) or public.marketplace_is_admin());
create policy marketplace_quotes_read on public.marketplace_quotes for select to authenticated using(professional_user_id=auth.uid() or exists(select 1 from public.marketplace_requests r where r.id=request_id and r.owner_user_id=auth.uid()) or public.marketplace_is_admin());
create policy marketplace_unlocks_read on public.marketplace_contact_unlocks for select to authenticated using(owner_user_id=auth.uid() or professional_user_id=auth.uid() or public.marketplace_is_admin());
create policy marketplace_jobs_read on public.marketplace_jobs for select to authenticated using(owner_user_id=auth.uid() or professional_user_id=auth.uid() or public.marketplace_is_admin());
create policy marketplace_reviews_public on public.marketplace_reviews for select to anon,authenticated using(published=true or reviewer_user_id=auth.uid() or professional_user_id=auth.uid() or public.marketplace_is_admin());
create policy marketplace_conversations_read on public.marketplace_conversations for select to authenticated using(owner_user_id=auth.uid() or professional_user_id=auth.uid() or public.marketplace_is_admin());
create policy marketplace_messages_read on public.marketplace_messages for select to authenticated using(exists(select 1 from public.marketplace_conversations c where c.id=conversation_id and (c.owner_user_id=auth.uid() or c.professional_user_id=auth.uid())) or public.marketplace_is_admin());
create policy marketplace_events_read on public.marketplace_events for select to authenticated using(public.marketplace_is_admin() or exists(select 1 from public.marketplace_requests r where r.id=request_id and r.owner_user_id=auth.uid()) or exists(select 1 from public.marketplace_matches m where m.request_id=marketplace_events.request_id and m.professional_user_id=auth.uid()));

revoke all on public.marketplace_macro_categories,public.marketplace_services,public.marketplace_professional_services,public.marketplace_requests,public.marketplace_matches,public.marketplace_quotes,public.marketplace_contact_unlocks,public.marketplace_jobs,public.marketplace_reviews,public.marketplace_conversations,public.marketplace_messages,public.marketplace_events from public;
grant select on public.marketplace_macro_categories,public.marketplace_services to anon,authenticated;
grant select on public.marketplace_professional_services,public.marketplace_requests,public.marketplace_matches,public.marketplace_quotes,public.marketplace_contact_unlocks,public.marketplace_jobs,public.marketplace_conversations,public.marketplace_messages,public.marketplace_events to authenticated;
grant select on public.marketplace_reviews to anon,authenticated;

-- ============================================================
-- 6. RPC onboarding: replace services in one controlled operation
-- ============================================================
create or replace function public.replace_professional_marketplace_services(p_service_ids uuid[])
returns void language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_count integer;
begin
  if v_user is null then raise exception 'authentication_required'; end if;
  if not exists(select 1 from public.app_roles r where r.user_id=v_user and r.role='professional') then raise exception 'professional_role_required'; end if;
  select count(*) into v_count from public.marketplace_services s where s.id=any(coalesce(p_service_ids,'{}'::uuid[])) and s.active=true and s.regulatory_class<>'excluded_initially';
  if v_count <> cardinality(coalesce(p_service_ids,'{}'::uuid[])) then raise exception 'invalid_service_selection'; end if;
  delete from public.marketplace_professional_services where professional_user_id=v_user;
  insert into public.marketplace_professional_services(professional_user_id,service_id)
  select v_user, unnest(coalesce(p_service_ids,'{}'::uuid[])) on conflict do nothing;
  update public.professional_profiles
  set verification_status = case when verification_status in ('submitted','under_review','verified') then 'draft' else verification_status end,
      verification_notes = case when verification_status in ('submitted','under_review','verified') then null else verification_notes end,
      verified_at = case when verification_status in ('submitted','under_review','verified') then null else verified_at end,
      is_public = case when verification_status in ('submitted','under_review','verified') then false else is_public end
  where user_id=v_user;
end $$;
revoke all on function public.replace_professional_marketplace_services(uuid[]) from public;
grant execute on function public.replace_professional_marketplace_services(uuid[]) to authenticated;

-- ============================================================
-- 7. RPC marketplace
-- ============================================================
create or replace function public.create_marketplace_request(p_service_slug text,p_title text,p_description text,p_city text default null,p_province text default null,p_postal_code text default null,p_property_ref text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_service uuid; v_id uuid:=gen_random_uuid();
begin
  if v_user is null then raise exception 'authentication_required'; end if;
  if not exists(select 1 from public.app_roles r where r.user_id=v_user and r.role='owner') then raise exception 'owner_role_required'; end if;
  select s.id into v_service from public.marketplace_services s where s.slug=p_service_slug and s.active=true and s.regulatory_class<>'excluded_initially';
  if v_service is null then raise exception 'invalid_or_unavailable_service'; end if;
  if nullif(btrim(p_title),'') is null or nullif(btrim(p_description),'') is null then raise exception 'title_and_description_required'; end if;
  insert into public.marketplace_requests(id,owner_user_id,service_id,title,description,city,province,postal_code,property_ref,status,max_matches)
  values(v_id,v_user,v_service,btrim(p_title),btrim(p_description),nullif(btrim(p_city),''),nullif(upper(btrim(p_province)),''),nullif(btrim(p_postal_code),''),nullif(btrim(p_property_ref),''),'open',3);
  insert into public.marketplace_events(request_id,actor_user_id,event_type) values(v_id,v_user,'request_created');
  return v_id;
end $$;
revoke all on function public.create_marketplace_request(text,text,text,text,text,text,text) from public;
grant execute on function public.create_marketplace_request(text,text,text,text,text,text,text) to authenticated;

create or replace function public.admin_match_professional(p_request_id uuid,p_professional_user_id uuid,p_reason jsonb default '{}'::jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid; v_max smallint; v_count integer; v_service uuid;
begin
  if not public.marketplace_is_admin() then raise exception 'admin_required'; end if;
  select r.max_matches,r.service_id into v_max,v_service from public.marketplace_requests r where r.id=p_request_id and r.status in('open','matched','quotes_received');
  if v_max is null then raise exception 'request_not_matchable'; end if;
  if not exists(select 1 from public.professional_profiles p join public.marketplace_professional_services ps on ps.professional_user_id=p.user_id where p.user_id=p_professional_user_id and p.verification_status='verified' and p.is_public=true and ps.service_id=v_service and ps.active=true) then raise exception 'professional_not_eligible'; end if;
  select count(*) into v_count from public.marketplace_matches m where m.request_id=p_request_id and m.status not in('declined','expired','not_selected') and m.professional_user_id<>p_professional_user_id;
  if v_count>=v_max then raise exception 'max_matches_reached'; end if;
  insert into public.marketplace_matches(request_id,professional_user_id,status,match_reason) values(p_request_id,p_professional_user_id,'invited',coalesce(p_reason,'{}'::jsonb))
  on conflict(request_id,professional_user_id) do update set status='invited',match_reason=excluded.match_reason,updated_at=now() returning id into v_id;
  update public.marketplace_requests set status=case when status='open' then 'matched' else status end where id=p_request_id;
  insert into public.marketplace_events(request_id,actor_user_id,event_type,payload) values(p_request_id,auth.uid(),'professional_matched',jsonb_build_object('professional_user_id',p_professional_user_id));
  return v_id;
end $$;
revoke all on function public.admin_match_professional(uuid,uuid,jsonb) from public;
grant execute on function public.admin_match_professional(uuid,uuid,jsonb) to authenticated;

create or replace function public.submit_marketplace_quote(p_request_id uuid,p_amount_cents bigint,p_summary text,p_scope_items jsonb default '[]'::jsonb,p_exclusions text default null,p_estimated_days integer default null,p_valid_until date default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_id uuid;
begin
  if v_user is null then raise exception 'authentication_required'; end if;
  if p_amount_cents is null or p_amount_cents<=0 then raise exception 'invalid_amount'; end if;
  if nullif(btrim(p_summary),'') is null then raise exception 'summary_required'; end if;
  if not exists(select 1 from public.marketplace_matches m join public.marketplace_requests r on r.id=m.request_id join public.professional_profiles p on p.user_id=m.professional_user_id where m.request_id=p_request_id and m.professional_user_id=v_user and m.status in('invited','viewed','quoted') and r.status in('matched','quotes_received') and p.verification_status='verified' and p.is_public=true) then raise exception 'not_eligible_to_quote'; end if;
  insert into public.marketplace_quotes(request_id,professional_user_id,amount_cents,summary,scope_items,exclusions,estimated_days,valid_until,status)
  values(p_request_id,v_user,p_amount_cents,btrim(p_summary),coalesce(p_scope_items,'[]'::jsonb),nullif(btrim(p_exclusions),''),p_estimated_days,p_valid_until,'submitted')
  on conflict(request_id,professional_user_id) do update set amount_cents=excluded.amount_cents,summary=excluded.summary,scope_items=excluded.scope_items,exclusions=excluded.exclusions,estimated_days=excluded.estimated_days,valid_until=excluded.valid_until,status='submitted',submitted_at=now(),accepted_at=null,updated_at=now() returning id into v_id;
  update public.marketplace_matches set status='quoted' where request_id=p_request_id and professional_user_id=v_user;
  update public.marketplace_requests set status='quotes_received' where id=p_request_id and status='matched';
  insert into public.marketplace_events(request_id,actor_user_id,event_type,payload) values(p_request_id,v_user,'quote_submitted',jsonb_build_object('quote_id',v_id,'amount_cents',p_amount_cents));
  return v_id;
end $$;
revoke all on function public.submit_marketplace_quote(uuid,bigint,text,jsonb,text,integer,date) from public;
grant execute on function public.submit_marketplace_quote(uuid,bigint,text,jsonb,text,integer,date) to authenticated;

create or replace function public.accept_marketplace_quote(p_quote_id uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_quote public.marketplace_quotes%rowtype; v_request public.marketplace_requests%rowtype; v_job_id uuid;
begin
  if v_user is null then raise exception 'authentication_required'; end if;
  select * into v_quote from public.marketplace_quotes q where q.id=p_quote_id and q.status='submitted';
  if v_quote.id is null then raise exception 'quote_not_available'; end if;
  select * into v_request from public.marketplace_requests r where r.id=v_quote.request_id and r.owner_user_id=v_user and r.status in('matched','quotes_received');
  if v_request.id is null then raise exception 'request_not_owned_or_not_accepting_quotes'; end if;
  update public.marketplace_quotes set status=case when id=p_quote_id then 'accepted' else 'declined' end,accepted_at=case when id=p_quote_id then now() else accepted_at end where request_id=v_request.id and status='submitted';
  update public.marketplace_matches set status=case when professional_user_id=v_quote.professional_user_id then 'selected' else 'not_selected' end where request_id=v_request.id and status not in('declined','expired');
  update public.marketplace_requests set status='accepted' where id=v_request.id;
  insert into public.marketplace_jobs(request_id,quote_id,owner_user_id,professional_user_id,agreed_amount_cents,currency,monetization_mode,payment_status,status)
  values(v_request.id,v_quote.id,v_user,v_quote.professional_user_id,v_quote.amount_cents,v_quote.currency,'unconfigured','not_configured','accepted')
  on conflict(request_id) do update set quote_id=excluded.quote_id,professional_user_id=excluded.professional_user_id,agreed_amount_cents=excluded.agreed_amount_cents,currency=excluded.currency,updated_at=now() returning id into v_job_id;
  insert into public.marketplace_contact_unlocks(request_id,owner_user_id,professional_user_id,reason) values(v_request.id,v_user,v_quote.professional_user_id,'quote_accepted') on conflict do nothing;
  insert into public.marketplace_conversations(request_id,owner_user_id,professional_user_id) values(v_request.id,v_user,v_quote.professional_user_id) on conflict do nothing;
  insert into public.marketplace_events(request_id,job_id,actor_user_id,event_type,payload) values(v_request.id,v_job_id,v_user,'quote_accepted',jsonb_build_object('quote_id',v_quote.id,'professional_user_id',v_quote.professional_user_id));
  return v_job_id;
end $$;
revoke all on function public.accept_marketplace_quote(uuid) from public;
grant execute on function public.accept_marketplace_quote(uuid) to authenticated;

create or replace function public.complete_marketplace_job(p_job_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_request_id uuid;
begin
  update public.marketplace_jobs j set status='completed',completed_at=now() where j.id=p_job_id and j.owner_user_id=v_user and j.status in('accepted','in_progress') returning request_id into v_request_id;
  if v_request_id is null then raise exception 'job_not_completable'; end if;
  update public.marketplace_requests set status='completed' where id=v_request_id;
  insert into public.marketplace_events(request_id,job_id,actor_user_id,event_type) values(v_request_id,p_job_id,v_user,'job_completed');
end $$;
revoke all on function public.complete_marketplace_job(uuid) from public;
grant execute on function public.complete_marketplace_job(uuid) to authenticated;

create or replace function public.create_marketplace_review(p_job_id uuid,p_rating smallint,p_body text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_professional uuid; v_review_id uuid;
begin
  if p_rating<1 or p_rating>5 then raise exception 'rating_out_of_range'; end if;
  select j.professional_user_id into v_professional from public.marketplace_jobs j where j.id=p_job_id and j.owner_user_id=v_user and j.status='completed';
  if v_professional is null then raise exception 'verified_completed_job_required'; end if;
  insert into public.marketplace_reviews(job_id,reviewer_user_id,professional_user_id,rating,body,published) values(p_job_id,v_user,v_professional,p_rating,nullif(btrim(p_body),''),true)
  on conflict(job_id) do update set rating=excluded.rating,body=excluded.body,published=true returning id into v_review_id;
  insert into public.marketplace_events(job_id,actor_user_id,event_type,payload) values(p_job_id,v_user,'review_created',jsonb_build_object('review_id',v_review_id,'rating',p_rating));
  return v_review_id;
end $$;
revoke all on function public.create_marketplace_review(uuid,smallint,text) from public;
grant execute on function public.create_marketplace_review(uuid,smallint,text) to authenticated;

-- Aggiorna verifica professionista: richiede onboarding e almeno un servizio strutturato.
create or replace function public.submit_professional_verification()
returns uuid language plpgsql security definer set search_path='' as $$
declare current_user_id uuid:=auth.uid(); professional_record public.professional_profiles%rowtype; request_id uuid;
begin
  if current_user_id is null then raise exception 'Devi accedere per inviare la richiesta.'; end if;
  select * into professional_record from public.professional_profiles where user_id=current_user_id;
  if not found then raise exception 'Profilo professionale non trovato.'; end if;
  if professional_record.verification_status not in('draft','changes_requested') then raise exception 'La richiesta è già stata inviata o il profilo non può essere reinviato.'; end if;
  if professional_record.onboarding_completed_at is null
     or length(trim(professional_record.business_name))=0
     or length(trim(coalesce(professional_record.phone,'')))=0
     or length(trim(coalesce(professional_record.city,'')))=0
     or length(trim(coalesce(professional_record.province,'')))<2
     or length(trim(coalesce(professional_record.bio,'')))<80
     or cardinality(professional_record.service_areas)=0
     or not exists(select 1 from public.marketplace_professional_services ps where ps.professional_user_id=current_user_id and ps.active=true)
  then raise exception 'Completa onboarding, servizi, descrizione e zone operative prima dell’invio.'; end if;
  insert into public.professional_verification_requests(user_id,status,profile_snapshot) values(current_user_id,'submitted',to_jsonb(professional_record)-'verification_notes') returning id into request_id;
  update public.professional_profiles set verification_status='submitted',verification_notes=null,is_public=false where user_id=current_user_id;
  return request_id;
end $$;
revoke all on function public.submit_professional_verification() from public;
grant execute on function public.submit_professional_verification() to authenticated;

-- Admin review sicura: evita di concedere colonne di verifica a tutti gli authenticated.
create or replace function public.review_professional_verification(p_request_id uuid,p_action text,p_notes text default null)
returns void language plpgsql security definer set search_path='' as $$
declare v_user uuid; v_request public.professional_verification_requests%rowtype;
begin
  if not public.marketplace_is_admin() then raise exception 'admin_required'; end if;
  if p_action not in ('under_review','approved','changes_requested') then raise exception 'invalid_review_action'; end if;
  select * into v_request from public.professional_verification_requests where id=p_request_id for update;
  if v_request.id is null then raise exception 'verification_request_not_found'; end if;
  v_user:=v_request.user_id;
  update public.professional_verification_requests
  set status=p_action, reviewed_at=case when p_action='under_review' then reviewed_at else now() end, reviewer_id=auth.uid(), reviewer_notes=nullif(btrim(p_notes),'')
  where id=p_request_id;
  if p_action='under_review' then
    update public.professional_profiles set verification_status='under_review',verification_notes=null,is_public=false where user_id=v_user;
  elsif p_action='approved' then
    update public.professional_profiles set verification_status='verified',verification_notes=null,verified_at=now(),is_public=true where user_id=v_user;
  else
    update public.professional_profiles set verification_status='changes_requested',verification_notes=nullif(btrim(p_notes),''),verified_at=null,is_public=false where user_id=v_user;
  end if;
end $$;
revoke all on function public.review_professional_verification(uuid,text,text) from public;
grant execute on function public.review_professional_verification(uuid,text,text) to authenticated;

commit;
