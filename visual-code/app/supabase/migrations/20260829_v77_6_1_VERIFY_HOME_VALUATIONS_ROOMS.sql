-- GUIMMIA V77.6.1 - verifica home/lead, valutazioni e affitto stanze.

with checks as (
  select 'V775_BASE'::text as controllo,
    (select count(*)::int from public.guimmia_ai_intake_profiles
      where singleton_key = 'GUIMMIA_CONVERSATIONAL_INTAKE'
        and status = 'ACTIVE') as valore,
    1::int as atteso
  union all
  select 'VALUATION_OPERATIONS',
    (select count(*)::int
      from pg_constraint c
      join pg_class t on t.oid = c.conrelid
      join pg_namespace n on n.oid = t.relnamespace
      where n.nspname = 'public'
        and t.relname = 'guimmia_property_valuation_leads'
        and c.conname = 'guimmia_property_valuation_leads_operation_type_check'
        and pg_get_constraintdef(c.oid) like '%RENT_SHORT_TERM%'
        and pg_get_constraintdef(c.oid) like '%RENT_ROOM%'),
    1
  union all
  select 'REGISTERED_LEAD_COLUMNS',
    (select count(*)::int from information_schema.columns
      where table_schema = 'public'
        and table_name = 'guimmia_property_valuation_leads'
        and column_name in (
          'user_id','registration_verified_at','email_delivery_status','email_sent_at'
        )),
    4
  union all
  select 'LEAD_CAPTURE_BEFORE_AI',
    (select count(*)::int
      from pg_constraint c
      join pg_class t on t.oid = c.conrelid
      join pg_namespace n on n.oid = t.relnamespace
      where n.nspname = 'public'
        and t.relname = 'guimmia_property_valuation_leads'
        and c.conname = 'guimmia_property_valuation_leads_status_check'
        and pg_get_constraintdef(c.oid) like '%VALUATION_REQUESTED%'),
    1
  union all
  select 'PENDING_AI_STATE',
    (select count(*)::int
      from pg_constraint c
      join pg_class t on t.oid = c.conrelid
      join pg_namespace n on n.oid = t.relnamespace
      where n.nspname = 'public'
        and t.relname = 'guimmia_property_valuation_leads'
        and c.conname = 'guimmia_property_valuation_leads_ai_status_check'
        and pg_get_constraintdef(c.oid) like '%PENDING%'),
    1
  union all
  select 'OWNER_VALUATION_READ',
    (select count(*)::int from pg_policies
      where schemaname = 'public'
        and tablename = 'guimmia_property_valuation_leads'
        and policyname = 'guimmia_v776_owner_valuation_read'),
    1
  union all
  select 'ROOM_PUBLIC_COLUMNS',
    (select count(*)::int from information_schema.columns
      where table_schema = 'public'
        and table_name = 'agency_listings'
        and column_name in (
          'listing_kind','room_type','room_surface_sqm','private_bathroom',
          'current_roommates_count','current_household_summary',
          'accepted_occupant_profiles','available_from','expenses_included'
        )),
    9
  union all
  select 'ROOM_LISTING_CONTRACT',
    (select count(*)::int
      from pg_constraint c
      join pg_class t on t.oid = c.conrelid
      join pg_namespace n on n.oid = t.relnamespace
      where n.nspname = 'public'
        and t.relname = 'agency_listings'
        and c.conname = 'agency_listings_room_contract_check'),
    1
  union all
  select 'ROOM_PRIVATE_TABLE',
    (select count(*)::int from information_schema.tables
      where table_schema = 'public'
        and table_name = 'agency_room_compatibility_private'),
    1
  union all
  select 'ROOM_PRIVATE_SAFEGUARDS',
    (select count(*)::int
      from pg_constraint c
      join pg_class t on t.oid = c.conrelid
      join pg_namespace n on n.oid = t.relnamespace
      where n.nspname = 'public'
        and t.relname = 'agency_room_compatibility_private'
        and c.conname in (
          'agency_room_compatibility_private_public_visibility_check',
          'agency_room_compatibility_pri_automated_filtering_enabled_check',
          'agency_room_compatibility_private_human_review_required_check'
        )),
    3
  union all
  select 'ROOM_PRIVATE_RLS',
    (select count(*)::int from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = 'agency_room_compatibility_private'
        and c.relrowsecurity is true
        and c.relforcerowsecurity is true),
    1
  union all
  select 'ROOM_NOT_PUBLIC',
    (select count(*)::int from information_schema.role_table_grants
      where table_schema = 'public'
        and table_name = 'agency_room_compatibility_private'
        and grantee = 'anon'),
    0
  union all
  select 'CONTROLLED_ROOM_TYPE',
    (select count(*)::int from public.guimmia_ai_intake_profiles
      where singleton_key = 'GUIMMIA_CONVERSATIONAL_INTAKE'
        and controlled_property_types @> '["Stanza"]'::jsonb),
    1
)
select controllo, valore, atteso,
  case when valore = atteso then 'OK' else 'ERRORE' end as stato
from checks
order by case controllo
  when 'V775_BASE' then 1
  when 'VALUATION_OPERATIONS' then 2
  when 'REGISTERED_LEAD_COLUMNS' then 3
  when 'LEAD_CAPTURE_BEFORE_AI' then 4
  when 'PENDING_AI_STATE' then 5
  when 'OWNER_VALUATION_READ' then 6
  when 'ROOM_PUBLIC_COLUMNS' then 7
  when 'ROOM_LISTING_CONTRACT' then 8
  when 'ROOM_PRIVATE_TABLE' then 9
  when 'ROOM_PRIVATE_SAFEGUARDS' then 10
  when 'ROOM_PRIVATE_RLS' then 11
  when 'ROOM_NOT_PUBLIC' then 12
  when 'CONTROLLED_ROOM_TYPE' then 13
  else 99 end;
