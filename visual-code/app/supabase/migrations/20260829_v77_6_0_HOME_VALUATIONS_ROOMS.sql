-- GUIMMIA V77.6.0 - Home essenziale, valutazioni registrate e affitto stanze.
-- Additiva: conserva annunci, lead e pratiche esistenti.

begin;

do $$
begin
  if to_regclass('public.agency_listings') is null
     or to_regclass('public.guimmia_property_valuation_leads') is null
     or to_regclass('public.guimmia_ai_intake_profiles') is null then
    raise exception 'V77.6 richiede V77.5 REV3 verificata';
  end if;
end $$;

-- Le quattro valutazioni condividono lo stesso registro lead.
alter table public.guimmia_property_valuation_leads
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists registration_verified_at timestamptz,
  add column if not exists email_delivery_status text not null default 'NOT_SENT',
  add column if not exists email_sent_at timestamptz;

alter table public.guimmia_property_valuation_leads
  drop constraint if exists guimmia_property_valuation_leads_operation_type_check,
  drop constraint if exists guimmia_property_valuation_leads_email_delivery_status_check,
  drop constraint if exists guimmia_property_valuation_leads_status_check,
  drop constraint if exists guimmia_property_valuation_leads_ai_status_check;

alter table public.guimmia_property_valuation_leads
  add constraint guimmia_property_valuation_leads_operation_type_check
    check (operation_type in (
      'SALE',
      'RENT_LONG_TERM',
      'RENT_SHORT_TERM',
      'RENT_ROOM'
    )),
  add constraint guimmia_property_valuation_leads_email_delivery_status_check
    check (email_delivery_status in (
      'PENDING',
      'SENT',
      'NOT_CONFIGURED',
      'FAILED',
      'NOT_SENT'
    )),
  add constraint guimmia_property_valuation_leads_status_check
    check (status in (
      'VALUATION_REQUESTED',
      'VALUATION_READY',
      'NEEDS_REVIEW',
      'CONTACTED',
      'ARCHIVED'
    )),
  add constraint guimmia_property_valuation_leads_ai_status_check
    check (ai_status in (
      'PENDING',
      'COMPLETED',
      'FAILED',
      'NOT_CONFIGURED',
      'BLOCKED'
    ));

create index if not exists idx_guimmia_v776_valuation_user_created
  on public.guimmia_property_valuation_leads(user_id, created_at desc)
  where user_id is not null;

drop policy if exists guimmia_v776_owner_valuation_read
  on public.guimmia_property_valuation_leads;
create policy guimmia_v776_owner_valuation_read
  on public.guimmia_property_valuation_leads
  for select to authenticated
  using (user_id = auth.uid());

grant select on public.guimmia_property_valuation_leads to authenticated;
grant insert, update, select on public.guimmia_property_valuation_leads to service_role;

-- Campi pubblici strutturati per la stanza e la convivenza esistente.
alter table public.agency_listings
  add column if not exists listing_kind text not null default 'whole_property',
  add column if not exists room_type text,
  add column if not exists room_surface_sqm numeric(8,2),
  add column if not exists private_bathroom boolean,
  add column if not exists current_roommates_count integer,
  add column if not exists current_household_summary text,
  add column if not exists accepted_occupant_profiles text[] not null default '{}'::text[],
  add column if not exists available_from date,
  add column if not exists expenses_included boolean;

alter table public.agency_listings
  drop constraint if exists agency_listings_listing_kind_check,
  drop constraint if exists agency_listings_room_type_check,
  drop constraint if exists agency_listings_room_surface_check,
  drop constraint if exists agency_listings_roommates_check,
  drop constraint if exists agency_listings_occupant_profiles_check,
  drop constraint if exists agency_listings_room_contract_check;

alter table public.agency_listings
  add constraint agency_listings_listing_kind_check
    check (listing_kind in ('whole_property', 'room')),
  add constraint agency_listings_room_type_check
    check (room_type is null or room_type in ('single', 'double', 'shared')),
  add constraint agency_listings_room_surface_check
    check (room_surface_sqm is null or room_surface_sqm between 4 and 200),
  add constraint agency_listings_roommates_check
    check (current_roommates_count is null or current_roommates_count between 0 and 30),
  add constraint agency_listings_occupant_profiles_check
    check (accepted_occupant_profiles <@ array['student','worker']::text[]),
  add constraint agency_listings_room_contract_check
    check (
      listing_kind <> 'room'
      or (
        operation = 'rent'
        and rent_period = 'month'
        and property_type = 'Stanza'
        and room_type is not null
        and room_surface_sqm is not null
        and current_roommates_count is not null
        and cardinality(accepted_occupant_profiles) > 0
      )
    );

create index if not exists idx_guimmia_v776_room_listings
  on public.agency_listings(status, city, price_cents, available_from)
  where listing_kind = 'room';

-- Le preferenze personali non sono contenuto della vetrina e non alimentano filtri automatici.
create table if not exists public.agency_room_compatibility_private (
  listing_id uuid primary key references public.agency_listings(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  gender_preference text not null default 'none'
    check (gender_preference in ('none', 'men', 'women')),
  compatibility_notes text not null default ''
    check (length(compatibility_notes) <= 600),
  public_visibility boolean not null default false
    check (public_visibility = false),
  automated_filtering_enabled boolean not null default false
    check (automated_filtering_enabled = false),
  human_review_required boolean not null default true
    check (human_review_required = true),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists agency_room_compatibility_updated_at
  on public.agency_room_compatibility_private;
create trigger agency_room_compatibility_updated_at
before update on public.agency_room_compatibility_private
for each row execute function public.guimmia_touch_updated_at();

alter table public.agency_room_compatibility_private enable row level security;
alter table public.agency_room_compatibility_private force row level security;

drop policy if exists agency_room_private_owner_read
  on public.agency_room_compatibility_private;
drop policy if exists agency_room_private_owner_insert
  on public.agency_room_compatibility_private;
drop policy if exists agency_room_private_owner_update
  on public.agency_room_compatibility_private;
drop policy if exists agency_room_private_admin_all
  on public.agency_room_compatibility_private;

create policy agency_room_private_owner_read
  on public.agency_room_compatibility_private
  for select to authenticated
  using (owner_user_id = auth.uid());

create policy agency_room_private_owner_insert
  on public.agency_room_compatibility_private
  for insert to authenticated
  with check (
    owner_user_id = auth.uid()
    and exists (
      select 1 from public.agency_listings listing
      where listing.id = listing_id
        and listing.owner_user_id = auth.uid()
        and listing.listing_kind = 'room'
        and listing.status in ('draft', 'review')
    )
  );

create policy agency_room_private_owner_update
  on public.agency_room_compatibility_private
  for update to authenticated
  using (owner_user_id = auth.uid())
  with check (
    owner_user_id = auth.uid()
    and public_visibility is false
    and automated_filtering_enabled is false
    and human_review_required is true
  );

create policy agency_room_private_admin_all
  on public.agency_room_compatibility_private
  for all to authenticated
  using (public.guimmia_is_admin())
  with check (public.guimmia_is_admin());

revoke all on public.agency_room_compatibility_private from anon;
grant select, insert, update on public.agency_room_compatibility_private to authenticated;
grant all on public.agency_room_compatibility_private to service_role;

-- La chat riconosce anche la tipologia stanza mantenendo il vocabolario controllato.
update public.guimmia_ai_intake_profiles
set controlled_property_types = (
      select jsonb_agg(value order by position)
      from (
        select value, min(position) as position
        from (
          select value, ordinality::int as position
          from jsonb_array_elements_text(controlled_property_types)
            with ordinality as item(value, ordinality)
          union all
          select 'Stanza', 1000
        ) values_with_room
        group by value
      ) unique_values
    ),
    updated_at = now()
where singleton_key = 'GUIMMIA_CONVERSATIONAL_INTAKE';

comment on table public.agency_room_compatibility_private is
  'Dati privati di compatibilità per stanze: mai pubblici, mai usati per esclusioni automatiche.';
comment on column public.guimmia_property_valuation_leads.user_id is
  'Account verificato a cui è collegata la valutazione prima del calcolo.';
comment on column public.guimmia_property_valuation_leads.email_delivery_status is
  'Esito tecnico dell’invio della valutazione all’email verificata dell’account.';

commit;
