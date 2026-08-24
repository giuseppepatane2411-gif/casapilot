-- GUIMMIA V77.3.0 - database verification
with checks(controllo, valore, atteso) as (
  select 'V770_BASE',
    (select count(*)::int from public.guimmia_case_orchestrator_profiles where singleton_key = 'GUIMMIA_CENTRAL_ORCHESTRATOR'), 1
  union all
  select 'V773_TABLES',
    (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r' and c.relname in (
        'guimmia_ai_gateway_profiles',
        'guimmia_property_valuation_leads',
        'guimmia_ai_usage_events'
      )), 3
  union all
  select 'AI_GATEWAY_PROFILE',
    (select count(*)::int from public.guimmia_ai_gateway_profiles
      where singleton_key = 'GUIMMIA_OPENAI_GATEWAY' and version = '77.3.0'
        and package_revision = 2 and status = 'ACTIVE'), 1
  union all
  select 'LUNA_DEFAULT',
    (select count(*)::int from public.guimmia_ai_gateway_profiles
      where default_model = 'gpt-5.6-luna' and execution_mode = 'DRY_RUN'), 1
  union all
  select 'BUDGET_LIMIT_5_USD',
    (select count(*)::int from public.guimmia_ai_gateway_profiles
      where monthly_budget_usd = 5.00 and max_request_cost_usd = 0.05
        and max_web_search_calls = 2), 1
  union all
  select 'QUALITY_AND_RATE_GUARDS',
    (select count(*)::int from public.guimmia_ai_gateway_profiles
      where minimum_source_count = 2 and rate_limit_requests = 3
        and rate_limit_window_minutes = 30), 1
  union all
  select 'VALUATION_QUALITY_COLUMN',
    (select count(*)::int from information_schema.columns
      where table_schema = 'public'
        and table_name = 'guimmia_property_valuation_leads'
        and column_name = 'ai_quality'), 1
  union all
  select 'AUTOMATIC_ESCALATION_OFF',
    (select count(*)::int from public.guimmia_ai_gateway_profiles
      where automatic_escalation_enabled is false), 1
  union all
  select 'RLS_ENABLED',
    (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relrowsecurity and c.relname in (
        'guimmia_ai_gateway_profiles',
        'guimmia_property_valuation_leads',
        'guimmia_ai_usage_events'
      )), 3
  union all
  select 'RLS_FORCED',
    (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relforcerowsecurity and c.relname in (
        'guimmia_ai_gateway_profiles',
        'guimmia_property_valuation_leads',
        'guimmia_ai_usage_events'
      )), 3
  union all
  select 'PUBLIC_TABLE_WRITES_BLOCKED',
    (select count(*)::int from pg_policies where schemaname = 'public'
      and policyname in ('guimmia_v773_public_valuation_insert', 'guimmia_v773_public_usage_insert')), 0
  union all
  select 'SERVER_ONLY_WRITES',
    (select count(distinct table_name)::int from information_schema.role_table_grants
      where table_schema = 'public' and grantee = 'service_role'
        and privilege_type = 'INSERT'
        and table_name in ('guimmia_property_valuation_leads', 'guimmia_ai_usage_events')), 2
  union all
  select 'HARD_GUARD_FUNCTIONS',
    (select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname in (
        'guimmia_v773_valuation_guard',
        'guimmia_v773_usage_immutable',
        'guimmia_v773_ai_budget_status'
      )), 3
  union all
  select 'HUMAN_AUTHORITY_LOCKED',
    (select count(*)::int from public.guimmia_ai_gateway_profiles
      where human_authority_policy @> '{
        "aiMayPublishPrice": false,
        "aiMaySetFinalPrice": false,
        "humanReviewRequired": true,
        "ownerContactDataSentToModel": false
      }'::jsonb), 1
)
select controllo, valore, atteso,
  case when valore = atteso then 'OK' else 'ERRORE' end as stato
from checks
order by array_position(array[
  'V770_BASE',
  'V773_TABLES',
  'AI_GATEWAY_PROFILE',
  'LUNA_DEFAULT',
  'BUDGET_LIMIT_5_USD',
  'QUALITY_AND_RATE_GUARDS',
  'VALUATION_QUALITY_COLUMN',
  'AUTOMATIC_ESCALATION_OFF',
  'RLS_ENABLED',
  'RLS_FORCED',
  'PUBLIC_TABLE_WRITES_BLOCKED',
  'SERVER_ONLY_WRITES',
  'HARD_GUARD_FUNCTIONS',
  'HUMAN_AUTHORITY_LOCKED'
]::text[], controllo);
