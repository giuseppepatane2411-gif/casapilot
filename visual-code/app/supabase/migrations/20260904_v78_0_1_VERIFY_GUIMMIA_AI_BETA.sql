-- GUIMMIA V78.0.0 REV1 - verifica read-only

with expected_tables(table_name) as (
  values
    ('guimmia_ai_projects'),
    ('guimmia_ai_conversations'),
    ('guimmia_ai_messages'),
    ('guimmia_ai_practice_links')
),
table_status as (
  select
    expected.table_name,
    case when tables.table_name is not null then 'OK' else 'MANCANTE' end as stato,
    coalesce(classes.relrowsecurity, false) as rls,
    coalesce(classes.relforcerowsecurity, false) as rls_forced,
    count(policies.policyname) as policies
  from expected_tables expected
  left join information_schema.tables tables
    on tables.table_schema = 'public'
   and tables.table_name = expected.table_name
  left join pg_class classes
    on classes.oid = to_regclass('public.' || expected.table_name)
  left join pg_policies policies
    on policies.schemaname = 'public'
   and policies.tablename = expected.table_name
  group by expected.table_name, tables.table_name, classes.relrowsecurity,
    classes.relforcerowsecurity
)
select
  'TABELLA'::text as tipo,
  table_name as oggetto,
  case
    when stato = 'OK' and rls and rls_forced and policies > 0 then 'OK'
    when stato = 'MANCANTE' then 'MANCANTE'
    when not rls then 'RLS_DISATTIVA'
    when not rls_forced then 'RLS_NON_FORZATA'
    else 'NESSUNA_POLICY'
  end as stato,
  format(
    'RLS=%s; forzata=%s; policy=%s',
    case when rls then 'ON' else 'OFF' end,
    case when rls_forced then 'SI' else 'NO' end,
    policies
  ) as dettaglio
from table_status
union all
select
  'FUNZIONE',
  'guimmia_v780_touch_updated_at',
  case when to_regprocedure('public.guimmia_v780_touch_updated_at()') is not null then 'OK' else 'MANCANTE' end,
  'Aggiorna la data di modifica di cartelle e conversazioni'
order by tipo, oggetto;
