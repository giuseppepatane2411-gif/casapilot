-- GUIMMIA V76.6 - hard guards, invalidation, read model

create or replace function public.guimmia_v766_snapshot_immutable()
returns trigger language plpgsql as $$ begin raise exception 'V76.6 snapshot is immutable'; end $$;
drop trigger if exists trg_guimmia_phase05_snapshot_immutable on public.guimmia_phase05_snapshots;
create trigger trg_guimmia_phase05_snapshot_immutable before update or delete on public.guimmia_phase05_snapshots for each row execute function public.guimmia_v766_snapshot_immutable();

create or replace function public.guimmia_v766_candidate_decision_guard()
returns trigger language plpgsql as $$
begin
 if new.decision_source <> 'HUMAN' or new.decided_by is null then raise exception 'candidate_decision_must_be_human'; end if;
 return new;
end $$;
drop trigger if exists trg_guimmia_candidate_decision_guard on public.guimmia_rental_candidate_decisions;
create trigger trg_guimmia_candidate_decision_guard before insert or update on public.guimmia_rental_candidate_decisions for each row execute function public.guimmia_v766_candidate_decision_guard();

create or replace function public.guimmia_v766_contract_sign_guard()
returns trigger language plpgsql as $$
declare ok boolean;
begin
 if new.status='SIGNED' then
   if tg_op='INSERT' or (tg_op='UPDATE' and old.status is distinct from 'SIGNED') then
     select exists(
       select 1
       from public.guimmia_rental_contract_reviews r
       where r.case_id=new.case_id
         and r.contract_instance_id=new.id
         and r.status='APPROVED'
         and r.reviewer_id is not null
     ) into ok;
     if not ok then raise exception 'contract_human_review_required'; end if;
   end if;
 end if;
 return new;
end $$;
drop trigger if exists trg_guimmia_contract_sign_guard on public.guimmia_case_contract_instances;
create trigger trg_guimmia_contract_sign_guard before insert or update on public.guimmia_case_contract_instances for each row execute function public.guimmia_v766_contract_sign_guard();

create or replace function public.guimmia_v766_tax_final_guard()
returns trigger language plpgsql as $$
begin
 if new.status='FINAL' and (new.final_verdict_source is null or new.final_verdict_source='AI_ONLY' or (new.reviewed_by is null and new.professional_id is null)) then raise exception 'tax_final_human_or_professional_review_required'; end if;
 return new;
end $$;
drop trigger if exists trg_guimmia_tax_final_guard on public.guimmia_transaction_tax_reviews;
create trigger trg_guimmia_tax_final_guard before insert or update on public.guimmia_transaction_tax_reviews for each row execute function public.guimmia_v766_tax_final_guard();

create or replace function public.guimmia_v766_invalidate_case_transaction_state()
returns trigger language plpgsql as $$
begin
 update public.guimmia_rental_authority_reviews set status='STALE',updated_at=now() where case_id=new.case_id and status='VERIFIED';
 update public.guimmia_rental_property_readiness set status='STALE',updated_at=now() where case_id=new.case_id and status='READY';
 update public.guimmia_transaction_tax_reviews set status='STALE',updated_at=now() where case_id=new.case_id and status in ('REVIEWED','FINAL');
 update public.guimmia_transaction_gate_states set status='REVIEW_REQUIRED',reasons=reasons||'["SOURCE_DOCUMENT_CHANGED"]'::jsonb,updated_at=now() where case_id=new.case_id and status='READY';
 return new;
end $$;
-- Attach to V76.3 document versions when present.
do $$ begin
 if to_regclass('public.guimmia_brain_case_document_versions') is not null then
  execute 'drop trigger if exists trg_guimmia_v766_doc_change_invalidate on public.guimmia_brain_case_document_versions';
  execute 'create trigger trg_guimmia_v766_doc_change_invalidate after insert on public.guimmia_brain_case_document_versions for each row execute function public.guimmia_v766_invalidate_case_transaction_state()';
 end if;
end $$;

create or replace function public.guimmia_transaction_case_summary(p_case_id uuid)
returns table(case_id uuid, operation_type text, workflow_slug text, authority_status text, readiness_status text, tax_status text, open_gate_count bigint, candidate_count bigint, tourist_cin_status text)
language sql stable security definer set search_path=public as $$
 select c.id, cp.operation_type, c.workflow_slug,
        coalesce((select status from public.guimmia_rental_authority_reviews a where a.case_id=c.id order by created_at desc limit 1),'N/A'),
        coalesce((select status from public.guimmia_rental_property_readiness r where r.case_id=c.id order by created_at desc limit 1),'N/A'),
        coalesce((select status from public.guimmia_transaction_tax_reviews t where t.case_id=c.id order by created_at desc limit 1),'N/A'),
        (select count(*) from public.guimmia_transaction_gate_states g where g.case_id=c.id and g.status<>'READY'),
        (select count(*) from public.guimmia_rental_candidates rc where rc.case_id=c.id),
        coalesce((select cin_status from public.guimmia_tourist_unit_compliance tu where tu.case_id=c.id order by created_at desc limit 1),'N/A')
 from public.guimmia_brain_cases c
 left join public.guimmia_case_transaction_profiles cp on cp.case_id=c.id
 where c.id=p_case_id;
$$;
revoke all on function public.guimmia_transaction_case_summary(uuid) from public;
