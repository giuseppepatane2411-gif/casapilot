-- GUIMMIA V77.9.0 - Owner journey persistence
-- Additiva: agency_listings resta la scheda pubblicabile; questa tabella privata
-- conserva la pratica completa del proprietario senza esporre dati sensibili.

begin;

do $$
declare
  missing_columns text;
begin
  if to_regclass('public.agency_listings') is null then
    raise exception 'Base V77.8 richiesta: public.agency_listings non trovata';
  end if;
  if to_regprocedure('public.guimmia_touch_updated_at()') is null
    or to_regprocedure('public.guimmia_is_admin()') is null then
    raise exception 'Base V77.8 richiesta: funzioni Guimmia non trovate';
  end if;

  select string_agg(required.column_name, ', ' order by required.column_name)
  into missing_columns
  from (
    values
      ('current_phase'),
      ('listing_kind'),
      ('room_type'),
      ('room_surface_sqm'),
      ('private_bathroom'),
      ('current_roommates_count'),
      ('current_household_summary'),
      ('accepted_occupant_profiles'),
      ('available_from'),
      ('expenses_included')
  ) as required(column_name)
  where not exists (
    select 1
    from information_schema.columns existing
    where existing.table_schema = 'public'
      and existing.table_name = 'agency_listings'
      and existing.column_name = required.column_name
  );

  if missing_columns is not null then
    raise exception 'Base V77.8 incompleta. Colonne mancanti: %', missing_columns;
  end if;
end;
$$;

create table if not exists public.agency_owner_journeys (
  listing_id uuid primary key
    references public.agency_listings(id) on delete cascade,
  owner_user_id uuid not null
    references auth.users(id) on delete cascade,
  journey_schema_version integer not null default 1
    check (journey_schema_version > 0),
  journey_data jsonb not null
    check (jsonb_typeof(journey_data) = 'object'),
  wizard_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agency_owner_journeys_owner_idx
  on public.agency_owner_journeys(owner_user_id, updated_at desc);

drop trigger if exists agency_owner_journeys_updated_at
  on public.agency_owner_journeys;
create trigger agency_owner_journeys_updated_at
before update on public.agency_owner_journeys
for each row execute function public.guimmia_touch_updated_at();

alter table public.agency_owner_journeys enable row level security;
alter table public.agency_owner_journeys force row level security;

drop policy if exists agency_owner_journeys_owner_read
  on public.agency_owner_journeys;
create policy agency_owner_journeys_owner_read
on public.agency_owner_journeys for select to authenticated
using (owner_user_id = auth.uid());

drop policy if exists agency_owner_journeys_owner_insert
  on public.agency_owner_journeys;
create policy agency_owner_journeys_owner_insert
on public.agency_owner_journeys for insert to authenticated
with check (
  owner_user_id = auth.uid()
  and exists (
    select 1
    from public.agency_listings listing
    where listing.id = listing_id
      and listing.owner_user_id = auth.uid()
      and listing.status in ('draft', 'review')
  )
);

drop policy if exists agency_owner_journeys_owner_update
  on public.agency_owner_journeys;
create policy agency_owner_journeys_owner_update
on public.agency_owner_journeys for update to authenticated
using (owner_user_id = auth.uid())
with check (
  owner_user_id = auth.uid()
  and exists (
    select 1
    from public.agency_listings listing
    where listing.id = listing_id
      and listing.owner_user_id = auth.uid()
      and listing.status in ('draft', 'review')
  )
);

drop policy if exists agency_owner_journeys_owner_delete
  on public.agency_owner_journeys;
create policy agency_owner_journeys_owner_delete
on public.agency_owner_journeys for delete to authenticated
using (owner_user_id = auth.uid());

drop policy if exists agency_owner_journeys_admin_all
  on public.agency_owner_journeys;
create policy agency_owner_journeys_admin_all
on public.agency_owner_journeys for all to authenticated
using (public.guimmia_is_admin())
with check (public.guimmia_is_admin());

drop policy if exists agency_listings_owner_delete on public.agency_listings;
create policy agency_listings_owner_delete
on public.agency_listings for delete to authenticated
using (
  owner_user_id = auth.uid()
  and status in ('draft', 'review')
);

grant select, insert, update, delete
  on public.agency_owner_journeys to authenticated;
grant select, insert, update, delete
  on public.agency_listings to authenticated;

comment on table public.agency_owner_journeys is
  'Pratica privata proprietario collegata uno-a-uno alla scheda agency_listings.';
comment on column public.agency_owner_journeys.journey_data is
  'Snapshot canonico privato del percorso proprietario Guimmia.';

-- Scrive scheda pubblicabile e pratica privata nella stessa transazione.
-- La funzione usa i privilegi dell'utente chiamante: le policy RLS restano
-- quindi il confine di sicurezza anche se l'RPC viene invocata direttamente.
create or replace function public.guimmia_save_owner_journey(
  p_mode text,
  p_journey_id uuid,
  p_source_property_ref text,
  p_operation text,
  p_property_type text,
  p_title text,
  p_rent_period text,
  p_city text,
  p_province text,
  p_surface_sqm numeric,
  p_listing_kind text,
  p_room_type text,
  p_room_surface_sqm numeric,
  p_private_bathroom boolean,
  p_current_roommates_count integer,
  p_current_household_summary text,
  p_accepted_occupant_profiles text[],
  p_available_from date,
  p_expenses_included boolean,
  p_journey_data jsonb,
  p_wizard_completed_at timestamptz
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Autenticazione richiesta';
  end if;
  if p_mode not in ('create', 'update') then
    raise exception 'Modalita di salvataggio non valida';
  end if;
  if p_operation not in ('sale', 'rent') then
    raise exception 'Operazione non valida';
  end if;
  if p_listing_kind not in ('whole_property', 'room') then
    raise exception 'Tipologia annuncio non valida';
  end if;
  if p_journey_data is null or jsonb_typeof(p_journey_data) <> 'object' then
    raise exception 'Pratica privata non valida';
  end if;
  if p_journey_data ->> 'id' is distinct from p_journey_id::text
    or p_journey_data ->> 'version' is distinct from '1'
    or p_journey_data ->> 'status' is distinct from 'active' then
    raise exception 'Identita della pratica non valida';
  end if;
  if pg_column_size(p_journey_data) > 524288 then
    raise exception 'Pratica privata troppo grande';
  end if;
  if nullif(btrim(p_title), '') is null
    or nullif(btrim(p_city), '') is null
    or nullif(btrim(p_property_type), '') is null then
    raise exception 'Dati immobile incompleti';
  end if;

  if p_mode = 'create' then
    insert into public.agency_listings as existing_listing (
      id,
      owner_user_id,
      source_property_ref,
      slug,
      operation,
      property_type,
      title,
      description,
      price_cents,
      rent_period,
      city,
      province,
      zone,
      address_public,
      latitude,
      longitude,
      surface_sqm,
      status,
      current_phase,
      listing_kind,
      room_type,
      room_surface_sqm,
      private_bathroom,
      current_roommates_count,
      current_household_summary,
      accepted_occupant_profiles,
      available_from,
      expenses_included
    ) values (
      p_journey_id,
      v_user_id,
      left(p_source_property_ref, 180),
      'owner-' || p_journey_id::text,
      p_operation,
      p_property_type,
      left(btrim(p_title), 180),
      '',
      0,
      p_rent_period,
      left(btrim(p_city), 120),
      left(nullif(btrim(p_province), ''), 120),
      null,
      null,
      null,
      null,
      p_surface_sqm,
      'draft',
      'onboarding',
      p_listing_kind,
      p_room_type,
      p_room_surface_sqm,
      p_private_bathroom,
      p_current_roommates_count,
      nullif(left(btrim(p_current_household_summary), 500), ''),
      coalesce(p_accepted_occupant_profiles, '{}'::text[]),
      p_available_from,
      p_expenses_included
    )
    on conflict (id) do update set
      source_property_ref = excluded.source_property_ref,
      operation = excluded.operation,
      property_type = excluded.property_type,
      title = excluded.title,
      rent_period = excluded.rent_period,
      city = excluded.city,
      province = excluded.province,
      address_public = null,
      latitude = null,
      longitude = null,
      surface_sqm = excluded.surface_sqm,
      listing_kind = excluded.listing_kind,
      room_type = excluded.room_type,
      room_surface_sqm = excluded.room_surface_sqm,
      private_bathroom = excluded.private_bathroom,
      current_roommates_count = excluded.current_roommates_count,
      current_household_summary = excluded.current_household_summary,
      accepted_occupant_profiles = excluded.accepted_occupant_profiles,
      available_from = excluded.available_from,
      expenses_included = excluded.expenses_included
    where existing_listing.owner_user_id = v_user_id
      and existing_listing.status in ('draft', 'review');
  else
    update public.agency_listings set
      source_property_ref = left(p_source_property_ref, 180),
      operation = p_operation,
      property_type = p_property_type,
      title = left(btrim(p_title), 180),
      rent_period = p_rent_period,
      city = left(btrim(p_city), 120),
      province = left(nullif(btrim(p_province), ''), 120),
      address_public = null,
      latitude = null,
      longitude = null,
      surface_sqm = p_surface_sqm,
      listing_kind = p_listing_kind,
      room_type = p_room_type,
      room_surface_sqm = p_room_surface_sqm,
      private_bathroom = p_private_bathroom,
      current_roommates_count = p_current_roommates_count,
      current_household_summary = nullif(left(btrim(p_current_household_summary), 500), ''),
      accepted_occupant_profiles = coalesce(p_accepted_occupant_profiles, '{}'::text[]),
      available_from = p_available_from,
      expenses_included = p_expenses_included
    where id = p_journey_id
      and owner_user_id = v_user_id
      and status in ('draft', 'review');
  end if;

  if not found then
    raise exception 'Immobile non trovato o non modificabile';
  end if;

  insert into public.agency_owner_journeys as existing_journey (
    listing_id,
    owner_user_id,
    journey_schema_version,
    journey_data,
    wizard_completed_at
  ) values (
    p_journey_id,
    v_user_id,
    1,
    p_journey_data,
    p_wizard_completed_at
  )
  on conflict (listing_id) do update set
    journey_schema_version = excluded.journey_schema_version,
    journey_data = excluded.journey_data,
    wizard_completed_at = coalesce(
      existing_journey.wizard_completed_at,
      excluded.wizard_completed_at
    )
  where existing_journey.owner_user_id = v_user_id;

  if not found then
    raise exception 'Pratica privata non modificabile';
  end if;

  return p_journey_id;
end;
$$;

revoke all on function public.guimmia_save_owner_journey(
  text, uuid, text, text, text, text, text, text, text, numeric, text,
  text, numeric, boolean, integer, text, text[], date, boolean, jsonb,
  timestamptz
) from public;
grant execute on function public.guimmia_save_owner_journey(
  text, uuid, text, text, text, text, text, text, text, numeric, text,
  text, numeric, boolean, integer, text, text[], date, boolean, jsonb,
  timestamptz
) to authenticated;

comment on function public.guimmia_save_owner_journey(
  text, uuid, text, text, text, text, text, text, text, numeric, text,
  text, numeric, boolean, integer, text, text[], date, boolean, jsonb,
  timestamptz
) is 'Salvataggio atomico e RLS-aware della scheda immobile e della pratica privata.';

commit;
