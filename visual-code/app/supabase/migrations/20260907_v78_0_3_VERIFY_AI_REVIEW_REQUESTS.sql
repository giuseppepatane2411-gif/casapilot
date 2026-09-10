-- GUIMMIA V78.0.0 REV2 - Verifica sola lettura richieste di controllo

with required_columns(column_name) as (
  values
    ('id'),
    ('conversation_id'),
    ('listing_id'),
    ('user_id'),
    ('request_type'),
    ('subject'),
    ('note'),
    ('message_snapshot'),
    ('context'),
    ('status'),
    ('created_at'),
    ('updated_at')
),
checks as (
  select
    to_regclass('public.guimmia_ai_review_requests') is not null
      as table_present,
    not exists (
      select 1
      from required_columns required
      where not exists (
        select 1
        from information_schema.columns column_info
        where column_info.table_schema = 'public'
          and column_info.table_name = 'guimmia_ai_review_requests'
          and column_info.column_name = required.column_name
      )
    ) as columns_present,
    coalesce((
      select relrowsecurity and relforcerowsecurity
      from pg_class
      where oid = to_regclass('public.guimmia_ai_review_requests')
    ), false) as rls_forced,
    (
      select count(*) = 2
      from pg_policies
      where schemaname = 'public'
        and tablename = 'guimmia_ai_review_requests'
        and policyname in (
          'guimmia_ai_review_owner_select',
          'guimmia_ai_review_owner_insert'
        )
    ) as owner_policies_present,
    to_regclass('public.guimmia_ai_review_one_open_per_chat_idx')
      is not null as active_request_guard_present
)
select
  table_present,
  columns_present,
  rls_forced,
  owner_policies_present,
  active_request_guard_present,
  (
    table_present
    and columns_present
    and rls_forced
    and owner_policies_present
    and active_request_guard_present
  ) as guimmia_v780_rev2_review_ready
from checks;
