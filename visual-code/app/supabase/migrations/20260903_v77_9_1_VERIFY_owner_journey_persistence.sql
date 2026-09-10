-- GUIMMIA V77.9.1 - Verifica read-only persistenza proprietario

with checks(tipo, object_name, status) as (
  select
    'TABELLA',
    'agency_owner_journeys',
    case when to_regclass('public.agency_owner_journeys') is not null
      then 'OK' else 'MANCANTE' end
  union all
  select
    'RLS',
    'agency_owner_journeys',
    case when exists (
      select 1
      from pg_class
      where oid = to_regclass('public.agency_owner_journeys')
        and relrowsecurity
        and relforcerowsecurity
    ) then 'OK' else 'MANCANTE' end
  union all
  select
    'PRIVILEGIO',
    'agency_owner_journeys_anon_blocked',
    case when not has_table_privilege(
      'anon',
      'public.agency_owner_journeys',
      'SELECT'
    ) then 'OK' else 'NON_VALIDO' end
  union all
  select
    'FUNZIONE',
    'guimmia_save_owner_journey',
    case when exists (
      select 1
      from pg_proc procedure
      join pg_namespace namespace on namespace.oid = procedure.pronamespace
      where namespace.nspname = 'public'
        and procedure.proname = 'guimmia_save_owner_journey'
        and has_function_privilege('authenticated', procedure.oid, 'EXECUTE')
        and not has_function_privilege('anon', procedure.oid, 'EXECUTE')
        and not procedure.prosecdef
    ) then 'OK' else 'MANCANTE' end
  union all
  select
    'POLICY',
    required.policy_name,
    case when exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = required.table_name
        and policyname = required.policy_name
    ) then 'OK' else 'MANCANTE' end
  from (
    values
      ('agency_owner_journeys', 'agency_owner_journeys_owner_read'),
      ('agency_owner_journeys', 'agency_owner_journeys_owner_insert'),
      ('agency_owner_journeys', 'agency_owner_journeys_owner_update'),
      ('agency_owner_journeys', 'agency_owner_journeys_owner_delete'),
      ('agency_owner_journeys', 'agency_owner_journeys_admin_all'),
      ('agency_listings', 'agency_listings_owner_delete')
  ) as required(table_name, policy_name)
)
select tipo, object_name, status
from checks
order by tipo, object_name;
