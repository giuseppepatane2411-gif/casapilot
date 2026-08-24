-- GUIMMIA V78.0.0 — Operating System extension
begin;

-- Parties
create table if not exists public.agency_parties (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.agency_listings(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  role text not null check(role in ('owner','seller','buyer','landlord','tenant','guarantor','delegate','other')),
  party_type text not null default 'person' check(party_type in ('person','company')),
  first_name text, last_name text, company_name text, tax_code text, vat_number text,
  email text, phone text, address text,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists agency_parties_updated_at on public.agency_parties;
create trigger agency_parties_updated_at before update on public.agency_parties for each row execute function public.guimmia_touch_updated_at();

-- Offers
create table if not exists public.agency_offers (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.agency_listings(id) on delete cascade,
  buyer_party_id uuid references public.agency_parties(id) on delete set null,
  inquiry_id uuid references public.agency_inquiries(id) on delete set null,
  amount_cents bigint not null check(amount_cents >= 0),
  deposit_cents bigint check(deposit_cents is null or deposit_cents >= 0),
  financing_required boolean not null default false,
  financing_condition text,
  other_conditions text,
  expires_at timestamptz,
  status text not null default 'draft' check(status in ('draft','submitted','countered','accepted','rejected','expired','withdrawn')),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists agency_offers_listing_idx on public.agency_offers(listing_id,created_at desc);
drop trigger if exists agency_offers_updated_at on public.agency_offers;
create trigger agency_offers_updated_at before update on public.agency_offers for each row execute function public.guimmia_touch_updated_at();

-- Registration/admittance tracker
create table if not exists public.agency_registrations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.agency_listings(id) on delete cascade,
  document_id uuid references public.agency_documents(id) on delete cascade,
  registration_type text not null,
  status text not null default 'pending' check(status in ('pending','ready','submitted','registered','error','not_required')),
  due_date date, submitted_at timestamptz, registered_at timestamptz,
  external_reference text, notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists agency_registrations_updated_at on public.agency_registrations;
create trigger agency_registrations_updated_at before update on public.agency_registrations for each row execute function public.guimmia_touch_updated_at();

-- Automation queue and notification outbox
create table if not exists public.agency_automation_jobs (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.agency_listings(id) on delete cascade,
  job_type text not null,
  run_after timestamptz not null default now(),
  status text not null default 'pending' check(status in ('pending','running','completed','failed','cancelled')),
  attempts integer not null default 0,
  payload jsonb not null default '{}'::jsonb,
  last_error text, completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists agency_automation_jobs_due_idx on public.agency_automation_jobs(status,run_after);

create table if not exists public.agency_outbox (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.agency_listings(id) on delete cascade,
  channel text not null check(channel in ('email','sms','whatsapp','in_app')),
  recipient text not null,
  template_code text not null,
  payload jsonb not null default '{}'::jsonb,
  send_after timestamptz not null default now(),
  status text not null default 'pending' check(status in ('pending','sent','failed','cancelled')),
  sent_at timestamptz, last_error text,
  created_at timestamptz not null default now()
);
create index if not exists agency_outbox_due_idx on public.agency_outbox(status,send_after);

-- Add richer task fields if base V77 exists.
alter table public.agency_case_tasks add column if not exists phase text;
alter table public.agency_case_tasks add column if not exists assigned_to text not null default 'owner';
alter table public.agency_case_tasks drop constraint if exists agency_case_tasks_assigned_to_check;
alter table public.agency_case_tasks add constraint agency_case_tasks_assigned_to_check check(assigned_to in ('owner','guimmia','professional'));

-- Audit actor classification added to base events table
alter table public.agency_listing_events add column if not exists actor_type text not null default 'system';
do $$ begin
  if not exists (select 1 from pg_constraint where conname='agency_listing_events_actor_type_check') then
    alter table public.agency_listing_events add constraint agency_listing_events_actor_type_check check(actor_type in ('owner','guimmia','professional','system','visitor'));
  end if;
end $$;

-- Seed workflow function
create or replace function public.guimmia_seed_case_tasks()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.operation='sale' then
    insert into public.agency_case_tasks(listing_id,title,category,phase,status,priority,assigned_to,why_it_matters) values
      (new.id,'Completa i dati dell''immobile','property','onboarding','todo',10,'owner','Serve per costruire il fascicolo Guimmia.'),
      (new.id,'Verifica proprietà e provenienza','ownership','documents','todo',20,'owner','Serve a identificare correttamente titolo e soggetti della vendita.'),
      (new.id,'Carica planimetria','documents','documents','todo',30,'owner','Serve per completare il fascicolo tecnico.'),
      (new.id,'Carica APE','compliance','documents','todo',40,'owner','Serve nel percorso di commercializzazione.'),
      (new.id,'Completa documentazione tecnica','compliance','documents','todo',50,'owner','Guimmia deve sapere se il fascicolo è pronto.'),
      (new.id,'Definisci strategia prezzo','valuation','valuation','todo',60,'guimmia','Serve per posizionare correttamente l''immobile.'),
      (new.id,'Prepara fotografie','media','media','todo',70,'owner','Le immagini sono necessarie per l''annuncio.'),
      (new.id,'Genera bozza annuncio','listing','listing','todo',80,'guimmia','Guimmia prepara il Listing Master.'),
      (new.id,'Revisione annuncio','review','listing','todo',90,'guimmia','Controllo prima della pubblicazione.'),
      (new.id,'Pubblica annuncio','distribution','publication','todo',100,'guimmia','Attiva vetrina e distribuzione.'),
      (new.id,'Gestisci lead e visite','crm','leads','todo',110,'guimmia','Le richieste devono restare ordinate.'),
      (new.id,'Gestisci offerte','offer','offers','todo',120,'guimmia','Prezzo e condizioni devono essere registrati.'),
      (new.id,'Prepara proposta/preliminare','contract','contracts','todo',130,'guimmia','Il documento corretto dipende dalla fase della negoziazione.'),
      (new.id,'Gestisci registrazione','registration','contracts','todo',140,'guimmia','Gli adempimenti vengono tracciati.'),
      (new.id,'Preparazione rogito','closing','closing','todo',150,'owner','Completa la pratica verso la firma finale.')
    on conflict do nothing;
  else
    insert into public.agency_case_tasks(listing_id,title,category,phase,status,priority,assigned_to,why_it_matters) values
      (new.id,'Completa i dati dell''immobile','property','onboarding','todo',10,'owner','Serve per costruire il fascicolo Guimmia.'),
      (new.id,'Completa documentazione immobile','documents','documents','todo',20,'owner','Serve per preparare la locazione.'),
      (new.id,'Carica APE','compliance','documents','todo',30,'owner','Serve nel percorso di locazione.'),
      (new.id,'Definisci canone','valuation','valuation','todo',40,'guimmia','Serve per il posizionamento.'),
      (new.id,'Prepara fotografie','media','media','todo',50,'owner','Le immagini sono necessarie.'),
      (new.id,'Genera bozza annuncio','listing','listing','todo',60,'guimmia','Guimmia prepara il Listing Master.'),
      (new.id,'Pubblica annuncio','distribution','publication','todo',70,'guimmia','Attiva vetrina e distribuzione.'),
      (new.id,'Gestisci lead e visite','crm','leads','todo',80,'guimmia','Le richieste devono restare ordinate.'),
      (new.id,'Gestisci proposta locazione','offer','offers','todo',90,'guimmia','Le condizioni devono essere registrate.'),
      (new.id,'Prepara contratto locazione','contract','contracts','todo',100,'guimmia','Guimmia usa il template approvato.'),
      (new.id,'Firma contratto','signature','contracts','todo',110,'owner','Le parti devono completare la firma.'),
      (new.id,'Registra contratto','registration','contracts','todo',120,'guimmia','L''adempimento viene tracciato.'),
      (new.id,'Consegna immobile','closing','closing','todo',130,'owner','Chiude il percorso operativo.')
    on conflict do nothing;
  end if;
  insert into public.agency_listing_events(listing_id,actor_type,event_type,payload)
  select new.id,'system','workflow_seeded',jsonb_build_object('operation',new.operation)
  where exists(select 1 from information_schema.columns where table_schema='public' and table_name='agency_listing_events' and column_name='actor_type');
  return new;
end; $$;

drop trigger if exists agency_listings_seed_workflow on public.agency_listings;
create trigger agency_listings_seed_workflow after insert on public.agency_listings for each row execute function public.guimmia_seed_case_tasks();

-- Offer accepted -> enqueue next steps
create or replace function public.guimmia_offer_status_event()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.status is distinct from old.status and new.status='accepted' then
    insert into public.agency_automation_jobs(listing_id,job_type,payload)
    values(new.listing_id,'accepted_offer_next_steps',jsonb_build_object('offer_id',new.id));
  end if;
  return new;
end; $$;
drop trigger if exists agency_offer_status_event on public.agency_offers;
create trigger agency_offer_status_event after update on public.agency_offers for each row execute function public.guimmia_offer_status_event();

-- RLS
alter table public.agency_parties enable row level security;
alter table public.agency_offers enable row level security;
alter table public.agency_registrations enable row level security;
alter table public.agency_automation_jobs enable row level security;
alter table public.agency_outbox enable row level security;

do $$ declare r record; begin
 for r in select schemaname,tablename,policyname from pg_policies where schemaname='public' and tablename in ('agency_parties','agency_offers','agency_registrations','agency_automation_jobs','agency_outbox') loop
   execute format('drop policy if exists %I on %I.%I',r.policyname,r.schemaname,r.tablename);
 end loop;
end $$;

create policy agency_parties_owner_read on public.agency_parties for select to authenticated using(exists(select 1 from public.agency_listings l where l.id=listing_id and l.owner_user_id=auth.uid()));
create policy agency_offers_owner_read on public.agency_offers for select to authenticated using(exists(select 1 from public.agency_listings l where l.id=listing_id and l.owner_user_id=auth.uid()));
create policy agency_registrations_owner_read on public.agency_registrations for select to authenticated using(exists(select 1 from public.agency_listings l where l.id=listing_id and l.owner_user_id=auth.uid()));
create policy agency_parties_admin_all on public.agency_parties for all to authenticated using(public.guimmia_is_admin()) with check(public.guimmia_is_admin());
create policy agency_offers_admin_all on public.agency_offers for all to authenticated using(public.guimmia_is_admin()) with check(public.guimmia_is_admin());
create policy agency_registrations_admin_all on public.agency_registrations for all to authenticated using(public.guimmia_is_admin()) with check(public.guimmia_is_admin());
create policy agency_jobs_admin_all on public.agency_automation_jobs for all to authenticated using(public.guimmia_is_admin()) with check(public.guimmia_is_admin());
create policy agency_outbox_admin_all on public.agency_outbox for all to authenticated using(public.guimmia_is_admin()) with check(public.guimmia_is_admin());

grant select,insert,update,delete on public.agency_parties,public.agency_offers,public.agency_registrations to authenticated;
grant select,insert,update,delete on public.agency_automation_jobs,public.agency_outbox to authenticated;

commit;
