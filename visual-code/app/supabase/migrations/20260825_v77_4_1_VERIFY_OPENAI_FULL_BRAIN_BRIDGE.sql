-- GUIMMIA V77.4.1 - verification query

with checks as (
  select 'V773_BASE'::text as controllo,
    (select count(*)::int from public.guimmia_ai_gateway_profiles
      where singleton_key = 'GUIMMIA_OPENAI_GATEWAY') as valore,
    1::int as atteso
  union all
  select 'V774_TABLES',
    (select count(*)::int from information_schema.tables
      where table_schema = 'public'
        and table_name in (
          'guimmia_ai_brain_profiles',
          'guimmia_ai_brain_interactions'
        )),
    2
  union all
  select 'BRAIN_PROFILE',
    (select count(*)::int from public.guimmia_ai_brain_profiles
      where singleton_key = 'GUIMMIA_FULL_BRAIN_BRIDGE'
        and version = '77.4.0'
        and status = 'ACTIVE'),
    1
  union all
  select 'LUNA_MODEL',
    (select count(*)::int from public.guimmia_ai_brain_profiles
      where model = 'gpt-5.6-luna'),
    1
  union all
  select 'DETERMINISTIC_FIRST',
    (select count(*)::int from public.guimmia_ai_brain_profiles
      where deterministic_decision_first is true
        and execution_mode = 'DRY_RUN'),
    1
  union all
  select 'RETRIEVAL_LIMITS',
    (select count(*)::int from public.guimmia_ai_brain_profiles
      where max_rules_per_request = 10
        and max_cards_per_request = 6
        and max_output_tokens = 900),
    1
  union all
  select 'REQUEST_COST_LIMIT',
    (select count(*)::int from public.guimmia_ai_brain_profiles
      where max_request_cost_usd = 0.02),
    1
  union all
  select 'RESPONSE_REUSE_WINDOW',
    (select count(*)::int from public.guimmia_ai_brain_profiles
      where reuse_window_minutes = 15),
    1
  union all
  select 'OUTPUT_AUTHORITY_GUARD',
    (select count(*)::int from public.guimmia_ai_brain_profiles
      where output_authority_guard is true
        and human_authority_policy ->> 'unsafeGeneratedActionsAreReplaced' = 'true'),
    1
  union all
  select 'SUPPORTED_USE_CASES',
    (select count(*)::int from public.guimmia_ai_brain_profiles
      where jsonb_array_length(supported_request_kinds) = 4),
    1
  union all
  select 'USAGE_BRAIN_LINK',
    (select count(*)::int from information_schema.columns
      where table_schema = 'public'
        and table_name = 'guimmia_ai_usage_events'
        and column_name in ('brain_interaction_id', 'file_search_calls')),
    2
  union all
  select 'RLS_ENABLED',
    (select count(*)::int from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname in (
          'guimmia_ai_brain_profiles',
          'guimmia_ai_brain_interactions'
        )
        and c.relrowsecurity is true),
    2
  union all
  select 'RLS_FORCED',
    (select count(*)::int from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname in (
          'guimmia_ai_brain_profiles',
          'guimmia_ai_brain_interactions'
        )
        and c.relforcerowsecurity is true),
    2
  union all
  select 'PUBLIC_WRITES_BLOCKED',
    (select count(*)::int from information_schema.role_table_grants
      where table_schema = 'public'
        and table_name in (
          'guimmia_ai_brain_profiles',
          'guimmia_ai_brain_interactions'
        )
        and grantee in ('anon', 'authenticated')
        and privilege_type in ('INSERT', 'UPDATE', 'DELETE')),
    0
  union all
  select 'SERVER_ONLY_ACCESS',
    (select count(*)::int from information_schema.role_table_grants
      where table_schema = 'public'
        and table_name = 'guimmia_ai_brain_interactions'
        and grantee = 'service_role'
        and privilege_type in ('INSERT', 'SELECT')),
    2
  union all
  select 'CACHE_FINGERPRINT',
    (select count(*)::int from information_schema.columns
      where table_schema = 'public'
        and table_name = 'guimmia_ai_brain_interactions'
        and column_name = 'request_fingerprint'),
    1
  union all
  select 'HARD_GUARD_FUNCTIONS',
    (select count(*)::int from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.proname in (
          'guimmia_v774_brain_interaction_guard',
          'guimmia_v774_brain_interaction_immutable'
        )),
    2
  union all
  select 'HUMAN_AUTHORITY_LOCKED',
    (select count(*)::int from public.guimmia_ai_brain_profiles
      where human_authority_policy ->> 'brainIsSourceOfTruth' = 'true'
        and human_authority_policy ->> 'aiMayExecuteMaterialActions' = 'false'
        and human_authority_policy ->> 'humanReviewRequired' = 'true'
        and human_authority_policy ->> 'contactDataSentToModel' = 'false'),
    1
)
select controllo, valore, atteso,
  case when valore = atteso then 'OK' else 'ERRORE' end as stato
from checks
order by case controllo
  when 'V773_BASE' then 1
  when 'V774_TABLES' then 2
  when 'BRAIN_PROFILE' then 3
  when 'LUNA_MODEL' then 4
  when 'DETERMINISTIC_FIRST' then 5
  when 'RETRIEVAL_LIMITS' then 6
  when 'REQUEST_COST_LIMIT' then 7
  when 'RESPONSE_REUSE_WINDOW' then 8
  when 'OUTPUT_AUTHORITY_GUARD' then 9
  when 'SUPPORTED_USE_CASES' then 10
  when 'USAGE_BRAIN_LINK' then 11
  when 'RLS_ENABLED' then 12
  when 'RLS_FORCED' then 13
  when 'PUBLIC_WRITES_BLOCKED' then 14
  when 'SERVER_ONLY_ACCESS' then 15
  when 'CACHE_FINGERPRINT' then 16
  when 'HARD_GUARD_FUNCTIONS' then 17
  when 'HUMAN_AUTHORITY_LOCKED' then 18
  else 99 end;
