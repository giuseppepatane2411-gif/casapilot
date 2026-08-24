-- GUIMMIA V76.7 - hard guards, invalidation and operational read models

create or replace function public.guimmia_v767_listing_publication_guard()
returns trigger language plpgsql as $$
declare gate_code text; gate_ready boolean;
begin
 if new.status='PUBLISHED' and (tg_op='INSERT' or old.status is distinct from 'PUBLISHED') then
  if new.approved_by is null or new.approved_at is null or new.phase05_snapshot_id is null then raise exception 'v767_listing_human_approval_and_snapshot_required'; end if;
  gate_code:=case when new.operation_type='RENT_TOURIST_SHORT' then 'TOURIST_PUBLICATION' else 'RENTAL_PUBLICATION' end;
  select exists(select 1 from public.guimmia_transaction_gate_states g where g.case_id=new.case_id and g.gate_code=gate_code and g.status='READY') into gate_ready;
  if not gate_ready then raise exception 'v767_listing_publication_gate_not_ready'; end if;
 end if;
 return new;
end $$;
drop trigger if exists trg_guimmia_v767_listing_publication_guard on public.guimmia_rental_listings;
create trigger trg_guimmia_v767_listing_publication_guard before insert or update on public.guimmia_rental_listings for each row execute function public.guimmia_v767_listing_publication_guard();

create or replace function public.guimmia_v767_candidate_snapshot_guard()
returns trigger language plpgsql as $$
begin
 if coalesce(array_length(new.protected_attribute_keys,1),0)>0 then raise exception 'v767_protected_attributes_forbidden'; end if;
 if new.status='FINAL' and (new.decision_source is distinct from 'HUMAN' or new.decided_by is null) then raise exception 'v767_candidate_final_decision_must_be_human'; end if;
 return new;
end $$;
drop trigger if exists trg_guimmia_v767_candidate_snapshot_guard on public.guimmia_candidate_evaluation_snapshots;
create trigger trg_guimmia_v767_candidate_snapshot_guard before insert or update on public.guimmia_candidate_evaluation_snapshots for each row execute function public.guimmia_v767_candidate_snapshot_guard();

create or replace function public.guimmia_v767_signature_guard()
returns trigger language plpgsql as $$
declare review_ok boolean;
begin
 if new.status in ('SIGNED','COMPLETED') then
  if new.actor_type='AI' then raise exception 'v767_ai_signature_event_forbidden'; end if;
  select exists(select 1 from public.guimmia_rental_contract_reviews r where r.case_id=new.case_id and r.contract_instance_id=new.contract_instance_id and r.status='APPROVED' and r.reviewer_id is not null) into review_ok;
  if not review_ok then raise exception 'v767_contract_human_review_required'; end if;
  if new.content_hash is null or length(new.content_hash)<32 then raise exception 'v767_signed_content_hash_required'; end if;
 end if;
 return new;
end $$;
drop trigger if exists trg_guimmia_v767_signature_guard on public.guimmia_lease_signature_events;
create trigger trg_guimmia_v767_signature_guard before insert on public.guimmia_lease_signature_events for each row execute function public.guimmia_v767_signature_guard();

create or replace function public.guimmia_v767_registration_guard()
returns trigger language plpgsql as $$
begin
 if new.status='COMPLETED' and (new.receipt_ref is null or new.completed_by is null or new.completed_at is null) then raise exception 'v767_registration_receipt_and_human_required'; end if;
 if new.applicability='REQUIRED' and new.status in ('READY','SUBMITTED','COMPLETED') and new.due_at is null then raise exception 'v767_registration_deadline_required'; end if;
 return new;
end $$;
drop trigger if exists trg_guimmia_v767_registration_guard on public.guimmia_lease_registration_tasks;
create trigger trg_guimmia_v767_registration_guard before insert or update on public.guimmia_lease_registration_tasks for each row execute function public.guimmia_v767_registration_guard();

create or replace function public.guimmia_v767_handover_guard()
returns trigger language plpgsql as $$
declare item_count integer; key_count integer; meter_count integer;
begin
 if new.status='COMPLETED' and (tg_op='INSERT' or old.status is distinct from 'COMPLETED') then
  select count(*) into item_count from public.guimmia_handover_inventory_items where handover_id=new.id;
  select count(*) into key_count from public.guimmia_handover_key_events where handover_id=new.id and event_type='DELIVERED';
  select count(*) into meter_count from public.guimmia_handover_meter_readings where handover_id=new.id;
  if item_count<1 or key_count<1 or meter_count<1 or new.signed_at is null then raise exception 'v767_handover_evidence_incomplete'; end if;
 end if;
 return new;
end $$;
drop trigger if exists trg_guimmia_v767_handover_guard on public.guimmia_rental_handover_records;
create trigger trg_guimmia_v767_handover_guard before insert or update on public.guimmia_rental_handover_records for each row execute function public.guimmia_v767_handover_guard();

create or replace function public.guimmia_v767_tourist_booking_guard()
returns trigger language plpgsql as $$
declare gate_ready boolean; overlap_count integer;
begin
 if new.status='CONFIRMED' and (tg_op='INSERT' or old.status is distinct from 'CONFIRMED') then
  if new.confirmed_by is null or new.terms_snapshot='{}'::jsonb or new.pricing_snapshot='{}'::jsonb then raise exception 'v767_booking_terms_pricing_human_confirmation_required'; end if;
  select exists(select 1 from public.guimmia_transaction_gate_states g where g.case_id=new.case_id and g.gate_code='BOOKING' and g.status='READY') into gate_ready;
  if not gate_ready then raise exception 'v767_booking_gate_not_ready'; end if;
  select count(*) into overlap_count from public.guimmia_tourist_bookings b where b.listing_id=new.listing_id and b.id<>new.id and b.status in ('CONFIRMED','CHECKED_IN') and b.checkin_at<new.checkout_at and new.checkin_at<b.checkout_at;
  if overlap_count>0 then raise exception 'v767_overlapping_booking_forbidden'; end if;
 end if;
 return new;
end $$;
drop trigger if exists trg_guimmia_v767_tourist_booking_guard on public.guimmia_tourist_bookings;
create trigger trg_guimmia_v767_tourist_booking_guard before insert or update on public.guimmia_tourist_bookings for each row execute function public.guimmia_v767_tourist_booking_guard();

create or replace function public.guimmia_v767_checkin_guard()
returns trigger language plpgsql as $$
declare booking_ok boolean; reporting_ok boolean; safety_ok boolean;
begin
 if new.event_type='CHECKED_IN' then
  if new.actor_type='AI' then raise exception 'v767_ai_checkin_forbidden'; end if;
  select exists(select 1 from public.guimmia_tourist_bookings b where b.id=new.booking_id and b.status='CONFIRMED') into booking_ok;
  select exists(select 1 from public.guimmia_tourist_operational_tasks t where t.booking_id=new.booking_id and t.task_code='GUEST_REPORTING' and t.status in ('READY','COMPLETED')) into reporting_ok;
  select exists(select 1 from public.guimmia_tourist_operational_tasks t where t.booking_id=new.booking_id and t.task_code='SAFETY' and t.status in ('READY','COMPLETED')) into safety_ok;
  if not booking_ok or not reporting_ok or not safety_ok then raise exception 'v767_checkin_operational_tasks_not_ready'; end if;
 end if;
 return new;
end $$;
drop trigger if exists trg_guimmia_v767_checkin_guard on public.guimmia_tourist_booking_events;
create trigger trg_guimmia_v767_checkin_guard before insert on public.guimmia_tourist_booking_events for each row execute function public.guimmia_v767_checkin_guard();

create or replace function public.guimmia_v767_reconciliation_guard()
returns trigger language plpgsql as $$
declare payout_ok boolean; tax_ok boolean;
begin
 if new.status in ('RECONCILED','ARCHIVED') and (tg_op='INSERT' or old.status is distinct from new.status) then
  if new.reconciled_by is null then raise exception 'v767_human_reconciliation_required'; end if;
  select exists(select 1 from public.guimmia_tourist_payment_events p where p.booking_id=new.id and p.event_type='PAYOUT') into payout_ok;
  select exists(select 1 from public.guimmia_tourist_payment_events p where p.booking_id=new.id and p.event_type='TAX_REVIEWED' and p.actor_type='HUMAN') into tax_ok;
  if not payout_ok or not tax_ok then raise exception 'v767_payout_and_tax_review_required'; end if;
 end if;
 return new;
end $$;
drop trigger if exists trg_guimmia_v767_reconciliation_guard on public.guimmia_tourist_bookings;
create trigger trg_guimmia_v767_reconciliation_guard before insert or update on public.guimmia_tourist_bookings for each row execute function public.guimmia_v767_reconciliation_guard();

create or replace function public.guimmia_v767_event_immutable()
returns trigger language plpgsql as $$ begin raise exception 'V76.7 operational events are immutable; append a compensating event'; end $$;
do $$ declare t text; begin
 foreach t in array array['guimmia_listing_publication_events','guimmia_candidate_consent_events','guimmia_candidate_evaluation_snapshots','guimmia_lease_signature_events','guimmia_handover_key_events','guimmia_handover_meter_readings','guimmia_rental_lifecycle_events','guimmia_tourist_booking_events','guimmia_tourist_payment_events'] loop
  execute format('drop trigger if exists %I on public.%I','trg_'||t||'_immutable',t);
  execute format('create trigger %I before update or delete on public.%I for each row execute function public.guimmia_v767_event_immutable()','trg_'||t||'_immutable',t);
 end loop;
end $$;

create or replace function public.guimmia_v767_invalidate_operations()
returns trigger language plpgsql as $$
begin
 update public.guimmia_rental_listings set status='IN_REVIEW',updated_at=now() where case_id=new.case_id and status in ('READY','PUBLISHED','PAUSED');
 update public.guimmia_tourist_bookings set status='REVIEW_REQUIRED',updated_at=now() where case_id=new.case_id and status in ('REQUESTED','ACCEPTED','PAYMENT_PENDING','CONFIRMED');
 return new;
end $$;
drop trigger if exists trg_guimmia_v767_phase05_invalidate on public.guimmia_phase05_snapshots;
create trigger trg_guimmia_v767_phase05_invalidate after insert on public.guimmia_phase05_snapshots for each row execute function public.guimmia_v767_invalidate_operations();
drop trigger if exists trg_guimmia_v767_contract_invalidate on public.guimmia_case_contract_instances;
create trigger trg_guimmia_v767_contract_invalidate after update on public.guimmia_case_contract_instances for each row when (old.content_hash is distinct from new.content_hash) execute function public.guimmia_v767_invalidate_operations();
drop trigger if exists trg_guimmia_v767_tourist_compliance_invalidate on public.guimmia_tourist_unit_compliance;
create trigger trg_guimmia_v767_tourist_compliance_invalidate after update on public.guimmia_tourist_unit_compliance for each row execute function public.guimmia_v767_invalidate_operations();

create or replace function public.guimmia_rental_operations_summary(p_case_id uuid)
returns table(case_id uuid,operation_type text,listing_status text,candidate_count bigint,human_decision_count bigint,registration_status text,handover_status text,open_support_count bigint,critical_support_count bigint)
language sql stable security definer set search_path=public as $$
 select c.id,cp.operation_type,
  coalesce((select l.status from public.guimmia_rental_listings l where l.case_id=c.id order by l.updated_at desc limit 1),'N/A'),
  (select count(*) from public.guimmia_rental_candidates rc where rc.case_id=c.id),
  (select count(*) from public.guimmia_rental_candidate_decisions d join public.guimmia_rental_candidates rc on rc.id=d.candidate_id where rc.case_id=c.id and d.decision_source='HUMAN'),
  coalesce((select t.status from public.guimmia_lease_registration_tasks t where t.case_id=c.id order by t.updated_at desc limit 1),'N/A'),
  coalesce((select h.status from public.guimmia_rental_handover_records h where h.case_id=c.id order by h.updated_at desc limit 1),'N/A'),
  (select count(*) from public.guimmia_rental_lifecycle_events e where e.case_id=c.id and e.status not in ('RESOLVED','CLOSED')),
  (select count(*) from public.guimmia_rental_lifecycle_events e where e.case_id=c.id and e.priority='CRITICAL' and e.status not in ('RESOLVED','CLOSED'))
 from public.guimmia_brain_cases c left join public.guimmia_case_transaction_profiles cp on cp.case_id=c.id where c.id=p_case_id;
$$;
revoke all on function public.guimmia_rental_operations_summary(uuid) from public;

create or replace function public.guimmia_operations_action_queue(p_case_id uuid default null)
returns table(source_type text,source_id text,case_id uuid,priority text,status text,due_at timestamptz,assigned_to uuid,reason_code text)
language sql stable security definer set search_path=public as $$
 select 'RENTAL_SUPPORT',e.id::text,e.case_id,e.priority,e.status,e.due_at,e.assigned_to,e.event_type from public.guimmia_rental_lifecycle_events e where e.status not in ('RESOLVED','CLOSED') and (p_case_id is null or e.case_id=p_case_id)
 union all
 select 'LEASE_REGISTRATION',t.id::text,t.case_id,case when t.status='OVERDUE' then 'CRITICAL' else 'HIGH' end,t.status,t.due_at,t.assigned_to,'LEASE_REGISTRATION' from public.guimmia_lease_registration_tasks t where t.status not in ('COMPLETED') and (p_case_id is null or t.case_id=p_case_id)
 union all
 select 'TOURIST_TASK',t.id::text,b.case_id,case when t.status='OVERDUE' then 'CRITICAL' else 'HIGH' end,t.status,t.due_at,t.assigned_to,t.task_code from public.guimmia_tourist_operational_tasks t join public.guimmia_tourist_bookings b on b.id=t.booking_id where t.status not in ('COMPLETED') and (p_case_id is null or b.case_id=p_case_id);
$$;
revoke all on function public.guimmia_operations_action_queue(uuid) from public;
