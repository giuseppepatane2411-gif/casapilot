-- GUIMMIA V77.5.1 REV3 - verifica intake conversazionale, documenti e agenda.

with checks as (
  select 'V774_BASE'::text as controllo,
    (select count(*)::int from public.guimmia_ai_brain_profiles
      where singleton_key = 'GUIMMIA_FULL_BRAIN_BRIDGE'
        and version = '77.4.0') as valore,
    1::int as atteso
  union all
  select 'V775_TABLES',
    (select count(*)::int from information_schema.tables
      where table_schema = 'public'
        and table_name in (
          'guimmia_ai_intake_profiles',
          'guimmia_ai_intake_interactions',
          'guimmia_ai_operations_profiles',
          'guimmia_case_document_staging',
          'guimmia_ai_document_interactions',
          'guimmia_availability_windows',
          'guimmia_case_appointments',
          'guimmia_ai_schedule_interactions'
        )),
    8
  union all
  select 'V769_APPOINTMENTS_PRESERVED',
    (select count(*)::int from information_schema.columns
      where table_schema = 'public'
        and table_name = 'guimmia_appointments'
        and column_name in (
          'case_id','operating_agency_id','appointment_type_id',
          'calendar_id','slot_fingerprint','idempotency_key'
        )),
    6
  union all
  select 'CASE_APPOINTMENT_CONTRACT',
    (select count(*)::int from information_schema.columns
      where table_schema = 'public'
        and table_name = 'guimmia_case_appointments'
        and column_name in (
          'user_id','draft_id','event_type','starts_at','ends_at',
          'status','source','owner_confirmation_required','automatic_booking_executed'
        )),
    9
  union all
  select 'INTAKE_PROFILE',
    (select count(*)::int from public.guimmia_ai_intake_profiles
      where singleton_key = 'GUIMMIA_CONVERSATIONAL_INTAKE'
        and version = '77.5.0'
        and status = 'ACTIVE'),
    1
  union all
  select 'OPERATIONS_PROFILE_REV3',
    (select count(*)::int from public.guimmia_ai_operations_profiles
      where singleton_key = 'GUIMMIA_CONVERSATIONAL_OPERATIONS'
        and version = '77.5.0'
        and package_revision = 3
        and model = 'gpt-5.6-luna'),
    1
  union all
  select 'LIVING_CASE_ROOM',
    (select count(*)::int from public.guimmia_ai_operations_profiles
      where living_case_room_enabled is true
        and deterministic_next_action is true
        and action_receipts_required is true
        and confirmation_queue_enabled is true
        and human_authority_policy ->> 'livingCaseRoomEnabled' = 'true'
        and human_authority_policy ->> 'actionReceiptsRequired' = 'true'),
    1
  union all
  select 'STRUCTURED_EXTRACTION',
    (select count(*)::int from public.guimmia_ai_intake_profiles
      where structured_output_required is true
        and max_output_tokens = 520),
    1
  union all
  select 'CONTROLLED_VOCABULARY',
    (select count(*)::int from public.guimmia_ai_intake_profiles
      where controlled_vocabulary_required is true
        and jsonb_array_length(controlled_objectives) = 6
        and jsonb_array_length(controlled_property_types) = 11),
    1
  union all
  select 'LOCATION_CONFIRMATION',
    (select count(*)::int from public.guimmia_ai_intake_profiles
      where location_confirmation_required is true),
    1
  union all
  select 'HUMAN_CONFIRMATION',
    (select count(*)::int from public.guimmia_ai_intake_profiles
      where human_confirmation_required is true
        and personal_contact_data_to_model is false),
    1
  union all
  select 'AUTOMATIC_CASE_OFF',
    (select count(*)::int from public.guimmia_ai_intake_profiles
      where automatic_case_creation_enabled is false),
    1
  union all
  select 'RESPONSE_REUSE_WINDOW',
    (select count(*)::int from public.guimmia_ai_intake_profiles
      where reuse_window_minutes = 15),
    1
  union all
  select 'REQUEST_COST_LIMIT',
    (select count(*)::int from public.guimmia_ai_intake_profiles
      where max_request_cost_usd = 0.01
        and rate_limit_requests = 20
        and rate_limit_window_minutes = 30),
    1
  union all
  select 'PRIVATE_DOCUMENT_BUCKET',
    (select count(*)::int from storage.buckets
      where id = 'guimmia-documents'
        and public is false
        and file_size_limit = 10485760),
    1
  union all
  select 'DOCUMENT_CONFIRMATION',
    (select count(*)::int from public.guimmia_ai_operations_profiles
      where private_storage_required is true
        and structured_output_required is true
        and document_confirmation_required is true),
    1
  union all
  select 'SHARED_VOICE_CALENDAR',
    (select count(*)::int from public.guimmia_ai_operations_profiles
      where voice_uses_shared_calendar is true
        and owner_confirmation_required is true),
    1
  union all
  select 'AUTOMATIC_SEND_OFF',
    (select count(*)::int from public.guimmia_ai_operations_profiles
      where automatic_document_send_enabled is false
        and human_authority_policy ->> 'aiMaySendDocuments' = 'false'),
    1
  union all
  select 'AUTOMATIC_BOOKING_OFF',
    (select count(*)::int from public.guimmia_ai_operations_profiles
      where automatic_booking_enabled is false
        and human_authority_policy ->> 'aiMayConfirmAppointments' = 'false'),
    1
  union all
  select 'DETERMINISTIC_AVAILABILITY',
    (select count(*)::int from public.guimmia_ai_operations_profiles
      where human_authority_policy ->> 'deterministicAvailabilityCheck' = 'true'),
    1
  union all
  select 'USAGE_OPERATION_LINKS',
    (select count(*)::int from information_schema.columns
      where table_schema = 'public'
        and table_name = 'guimmia_ai_usage_events'
        and column_name in (
          'intake_interaction_id',
          'document_interaction_id',
          'schedule_interaction_id'
        )),
    3
  union all
  select 'RLS_ENABLED',
    (select count(*)::int from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname in (
          'guimmia_ai_intake_profiles',
          'guimmia_ai_intake_interactions',
          'guimmia_ai_operations_profiles',
          'guimmia_case_document_staging',
          'guimmia_ai_document_interactions',
          'guimmia_availability_windows',
          'guimmia_case_appointments',
          'guimmia_ai_schedule_interactions'
        )
        and c.relrowsecurity is true),
    8
  union all
  select 'RLS_FORCED',
    (select count(*)::int from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname in (
          'guimmia_ai_intake_profiles',
          'guimmia_ai_intake_interactions',
          'guimmia_ai_operations_profiles',
          'guimmia_case_document_staging',
          'guimmia_ai_document_interactions',
          'guimmia_availability_windows',
          'guimmia_case_appointments',
          'guimmia_ai_schedule_interactions'
        )
        and c.relforcerowsecurity is true),
    8
  union all
  select 'PUBLIC_WRITES_BLOCKED',
    (select count(*)::int from information_schema.role_table_grants
      where table_schema = 'public'
        and table_name in (
          'guimmia_ai_intake_interactions',
          'guimmia_case_document_staging',
          'guimmia_ai_document_interactions',
          'guimmia_availability_windows',
          'guimmia_case_appointments',
          'guimmia_ai_schedule_interactions'
        )
        and grantee in ('anon', 'authenticated')
        and privilege_type in ('INSERT', 'UPDATE', 'DELETE')),
    0
  union all
  select 'SERVER_ONLY_AUDIT_ACCESS',
    (select count(*)::int from information_schema.role_table_grants
      where table_schema = 'public'
        and table_name in (
          'guimmia_ai_intake_interactions',
          'guimmia_ai_document_interactions',
          'guimmia_ai_schedule_interactions'
        )
        and grantee = 'service_role'
        and privilege_type in ('INSERT', 'SELECT')),
    6
  union all
  select 'HARD_GUARD_FUNCTIONS',
    (select count(*)::int from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.proname in (
          'guimmia_v775_intake_guard',
          'guimmia_v775_intake_immutable',
          'guimmia_v775_document_transition_guard',
          'guimmia_v775_schedule_guard',
          'guimmia_v775_operations_audit_immutable'
        )),
    5
  union all
  select 'HUMAN_AUTHORITY_LOCKED',
    (select count(*)::int from public.guimmia_ai_operations_profiles
      where document_confirmation_required is true
        and owner_confirmation_required is true
        and automatic_document_send_enabled is false
        and automatic_booking_enabled is false
        and human_authority_policy ->> 'humanConfirmationRequired' = 'true'),
    1
)
select controllo, valore, atteso,
  case when valore = atteso then 'OK' else 'ERRORE' end as stato
from checks
order by case controllo
  when 'V774_BASE' then 1
  when 'V775_TABLES' then 2
  when 'V769_APPOINTMENTS_PRESERVED' then 3
  when 'CASE_APPOINTMENT_CONTRACT' then 4
  when 'INTAKE_PROFILE' then 5
  when 'OPERATIONS_PROFILE_REV3' then 6
  when 'LIVING_CASE_ROOM' then 7
  when 'STRUCTURED_EXTRACTION' then 8
  when 'CONTROLLED_VOCABULARY' then 9
  when 'LOCATION_CONFIRMATION' then 10
  when 'HUMAN_CONFIRMATION' then 11
  when 'AUTOMATIC_CASE_OFF' then 12
  when 'RESPONSE_REUSE_WINDOW' then 13
  when 'REQUEST_COST_LIMIT' then 14
  when 'PRIVATE_DOCUMENT_BUCKET' then 15
  when 'DOCUMENT_CONFIRMATION' then 16
  when 'SHARED_VOICE_CALENDAR' then 17
  when 'AUTOMATIC_SEND_OFF' then 18
  when 'AUTOMATIC_BOOKING_OFF' then 19
  when 'DETERMINISTIC_AVAILABILITY' then 20
  when 'USAGE_OPERATION_LINKS' then 21
  when 'RLS_ENABLED' then 22
  when 'RLS_FORCED' then 23
  when 'PUBLIC_WRITES_BLOCKED' then 24
  when 'SERVER_ONLY_AUDIT_ACCESS' then 25
  when 'HARD_GUARD_FUNCTIONS' then 26
  when 'HUMAN_AUTHORITY_LOCKED' then 27
  else 99 end;
