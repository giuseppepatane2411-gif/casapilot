-- GUIMMIA V76.5 — invalidation, hard guards e read model backend

create or replace function public.guimmia_technical_invalidate_case(
  p_case_id uuid,
  p_trigger_type text,
  p_trigger_ref text default null
) returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  v_prev text;
begin
  select input_fingerprint into v_prev
  from public.guimmia_brain_technical_reviews
  where case_id=p_case_id
  order by review_version desc
  limit 1;

  update public.guimmia_brain_technical_reviews
     set status='STALE'
   where case_id=p_case_id and status in ('COLLECTING','IN_REVIEW','PROFESSIONAL_REQUIRED','APPROVED');

  update public.guimmia_brain_technical_case_scopes
     set status='STALE'
   where case_id=p_case_id and status='LOCKED';

  update public.guimmia_brain_technical_comparisons
     set status='STALE'
   where case_id=p_case_id and status='CURRENT';

  update public.guimmia_brain_technical_findings
     set status='STALE'
   where case_id=p_case_id and status in ('OPEN','IN_REVIEW','RESOLVED');

  update public.guimmia_brain_technical_risk_register
     set status='STALE'
   where case_id=p_case_id and status in ('OPEN','MITIGATED','ACCEPTED');

  update public.guimmia_brain_technical_signoffs
     set status='STALE'
   where case_id=p_case_id and status='APPROVED';

  update public.guimmia_brain_technical_gate_decisions
     set status='STALE'
   where case_id=p_case_id and status in ('READY','REVIEW_REQUIRED','BLOCKED');

  update public.guimmia_brain_technical_agent_memos
     set status='STALE'
   where case_id=p_case_id and status='CURRENT';

  insert into public.guimmia_brain_technical_invalidation_log(
    case_id,trigger_type,trigger_ref,previous_fingerprint,reason,invalidated_objects
  ) values (
    p_case_id,p_trigger_type,p_trigger_ref,v_prev,
    'Nuovo input tecnico rilevante: ricalcolo P04 richiesto.',
    '["review","scope","comparisons","findings","risk_register","signoffs","gates","agent_memo"]'::jsonb
  );
end;
$$;
revoke all on function public.guimmia_technical_invalidate_case(uuid,text,text) from public;

create or replace function public.guimmia_technical_document_version_invalidation()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_code text;
begin
  if not new.is_current or new.status in ('REJECTED','SUPERSEDED') then
    return new;
  end if;

  select r.document_code into v_code
  from public.guimmia_brain_case_document_records r
  where r.id=new.record_id;

  if v_code = any(array[
    'TITLE_DEED','CADASTRAL_REPORT','HISTORICAL_CADASTRAL_REPORT','CADASTRAL_PLAN',
    'URBAN_ACCESS_REQUEST','URBAN_TITLES','AGIBILITY','TECHNICAL_REPORT'
  ]::text[]) then
    perform public.guimmia_technical_invalidate_case(
      new.case_id,
      'DOCUMENT_VERSION',
      concat(v_code,':',new.id::text,':v',new.version_no::text)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guimmia_technical_doc_invalidation on public.guimmia_brain_case_document_versions;
create trigger trg_guimmia_technical_doc_invalidation
after insert or update of is_current,status,content_fingerprint
on public.guimmia_brain_case_document_versions
for each row execute function public.guimmia_technical_document_version_invalidation();

create or replace function public.guimmia_technical_prevent_critical_override()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_severity text;
begin
  if new.status='APPROVED' and new.target_type='FINDING' and new.target_id is not null then
    select severity into v_severity
    from public.guimmia_brain_technical_findings
    where id=new.target_id and case_id=new.case_id;

    if v_severity='critical' then
      raise exception 'critical_finding_override_not_allowed';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guimmia_no_critical_technical_override on public.guimmia_brain_technical_override_log;
create trigger trg_guimmia_no_critical_technical_override
before insert on public.guimmia_brain_technical_override_log
for each row execute function public.guimmia_technical_prevent_critical_override();

create or replace function public.guimmia_prevent_technical_snapshot_mutation()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  raise exception 'technical_snapshot_is_immutable';
end;
$$;

drop trigger if exists trg_guimmia_technical_snapshot_immutable_u on public.guimmia_brain_technical_snapshots;
create trigger trg_guimmia_technical_snapshot_immutable_u
before update on public.guimmia_brain_technical_snapshots
for each row execute function public.guimmia_prevent_technical_snapshot_mutation();

drop trigger if exists trg_guimmia_technical_snapshot_immutable_d on public.guimmia_brain_technical_snapshots;
create trigger trg_guimmia_technical_snapshot_immutable_d
before delete on public.guimmia_brain_technical_snapshots
for each row execute function public.guimmia_prevent_technical_snapshot_mutation();

create or replace function public.guimmia_technical_case_summary(p_case_id uuid)
returns jsonb
language sql
stable
security definer
set search_path=''
as $$
with latest_review as (
  select *
  from public.guimmia_brain_technical_reviews
  where case_id=p_case_id
  order by review_version desc
  limit 1
),
finding_counts as (
  select
    count(*) filter (where status in ('OPEN','IN_REVIEW','STALE')) as open_total,
    count(*) filter (where status in ('OPEN','IN_REVIEW','STALE') and severity='critical') as critical,
    count(*) filter (where status in ('OPEN','IN_REVIEW','STALE') and severity='blocking') as blocking,
    count(*) filter (where status='STALE') as stale
  from public.guimmia_brain_technical_findings
  where case_id=p_case_id
),
gates as (
  select coalesce(jsonb_object_agg(gate_code,status),'{}'::jsonb) value
  from public.guimmia_brain_technical_gate_decisions
  where case_id=p_case_id
    and review_id=(select id from latest_review)
),
access_state as (
  select status
  from public.guimmia_brain_technical_record_access_requests
  where case_id=p_case_id and review_id=(select id from latest_review)
  order by updated_at desc limit 1
)
select jsonb_build_object(
  'caseId',p_case_id,
  'review',coalesce((select jsonb_build_object(
      'id',id,'version',review_version,'status',status,'inputFingerprint',input_fingerprint,
      'sourceMapStatus',source_map_status,'timelineStatus',timeline_status
    ) from latest_review),'{}'::jsonb),
  'findings',jsonb_build_object(
    'open',coalesce((select open_total from finding_counts),0),
    'critical',coalesce((select critical from finding_counts),0),
    'blocking',coalesce((select blocking from finding_counts),0),
    'stale',coalesce((select stale from finding_counts),0)
  ),
  'recordAccessStatus',coalesce((select status from access_state),'NOT_REQUIRED'),
  'gates',coalesce((select value from gates),'{}'::jsonb),
  'latestSnapshotAt',(select max(created_at) from public.guimmia_brain_technical_snapshots where case_id=p_case_id)
);
$$;
revoke all on function public.guimmia_technical_case_summary(uuid) from public;
-- Da invocare esclusivamente dal backend/service role finché non definiamo le policy UI.
