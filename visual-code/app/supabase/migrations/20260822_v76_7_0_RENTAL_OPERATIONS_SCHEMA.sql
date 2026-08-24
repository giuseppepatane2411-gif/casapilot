-- GUIMMIA V76.7 - RENTAL OPERATIONS & TOURIST LIFECYCLE ENGINE
-- Additive schema. Requires V76.6 installed and verified.

do $$ begin
 if to_regclass('public.guimmia_brain_cases') is null then raise exception 'V76.6 brain cases missing'; end if;
 if to_regclass('public.guimmia_brain_modules') is null then raise exception 'V76.6 brain modules missing'; end if;
 if to_regclass('public.guimmia_brain_workflows') is null then raise exception 'V76.6 brain workflows missing'; end if;
 if to_regclass('public.guimmia_brain_workflow_steps') is null then raise exception 'V76.6 brain workflow steps missing'; end if;
 if to_regclass('public.guimmia_brain_rules') is null then raise exception 'V76.6 brain rules missing'; end if;
 if to_regclass('public.guimmia_case_transaction_profiles') is null then raise exception 'V76.6 case transaction profiles missing'; end if;
 if to_regclass('public.guimmia_phase05_snapshots') is null then raise exception 'V76.6 phase05 snapshots missing'; end if;
 if to_regclass('public.guimmia_transaction_gate_states') is null then raise exception 'V76.6 transaction gates missing'; end if;
 if to_regclass('public.guimmia_rental_candidates') is null then raise exception 'V76.6 rental candidates missing'; end if;
 if to_regclass('public.guimmia_rental_candidate_decisions') is null then raise exception 'V76.6 candidate decisions missing'; end if;
 if to_regclass('public.guimmia_rental_contract_reviews') is null then raise exception 'V76.6 rental contract reviews missing'; end if;
 if to_regclass('public.guimmia_case_contract_instances') is null then raise exception 'V76.6 contract instances missing'; end if;
 if to_regclass('public.guimmia_rental_handover_records') is null then raise exception 'V76.6 handover records missing'; end if;
 if to_regclass('public.guimmia_tourist_unit_compliance') is null then raise exception 'V76.6 tourist compliance missing'; end if;
 if to_regprocedure('public.guimmia_set_updated_at()') is null then raise exception 'V76.6 updated_at trigger function missing'; end if;
end $$;

create table if not exists public.guimmia_rental_listings (
 id uuid primary key default gen_random_uuid(),
 case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
 operation_type text not null check(operation_type in ('RENT_LONG_TERM','RENT_TRANSITORY','RENT_STUDENT','RENT_TOURIST_SHORT')),
 status text not null default 'DRAFT' check(status in ('DRAFT','IN_REVIEW','READY','PUBLISHED','PAUSED','ARCHIVED')),
 master_content jsonb not null default '{}'::jsonb,
 facts_fingerprint text,
 phase05_snapshot_id uuid references public.guimmia_phase05_snapshots(id),
 approved_by uuid,
 approved_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.guimmia_listing_publication_events (
 id bigserial primary key,
 listing_id uuid not null references public.guimmia_rental_listings(id) on delete cascade,
 channel_code text not null,
 event_type text not null,
 actor_type text not null,
 actor_id uuid,
 idempotency_key text not null unique,
 payload jsonb not null default '{}'::jsonb,
 occurred_at timestamptz not null default now(),
 created_at timestamptz not null default now()
);

create table if not exists public.guimmia_rental_inquiries (
 id uuid primary key default gen_random_uuid(),
 case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
 listing_id uuid not null references public.guimmia_rental_listings(id) on delete cascade,
 candidate_id uuid references public.guimmia_rental_candidates(id) on delete set null,
 status text not null default 'NEW' check(status in ('NEW','CONTACT_VERIFIED','INVITED','DUPLICATE','WITHDRAWN','CLOSED')),
 source_channel text,
 contact_fingerprint text,
 consent_status text not null default 'MISSING',
 retention_until timestamptz,
 idempotency_key text not null unique,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.guimmia_rental_viewings (
 id uuid primary key default gen_random_uuid(),
 case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
 listing_id uuid not null references public.guimmia_rental_listings(id) on delete cascade,
 inquiry_id uuid references public.guimmia_rental_inquiries(id) on delete set null,
 candidate_id uuid references public.guimmia_rental_candidates(id) on delete set null,
 status text not null default 'PLANNED' check(status in ('PLANNED','CONFIRMED','COMPLETED','CANCELLED','NO_SHOW')),
 starts_at timestamptz,
 ends_at timestamptz,
 privacy_status text not null default 'PENDING',
 feedback jsonb not null default '{}'::jsonb,
 created_by uuid,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.guimmia_candidate_consent_events (
 id bigserial primary key,
 candidate_id uuid not null references public.guimmia_rental_candidates(id) on delete cascade,
 event_type text not null check(event_type in ('GRANTED','UPDATED','WITHDRAWN','EXPIRED')),
 purpose_codes text[] not null default '{}',
 notice_version text not null,
 lawful_basis text,
 retention_until timestamptz,
 actor_type text not null,
 actor_id uuid,
 idempotency_key text not null unique,
 occurred_at timestamptz not null default now(),
 created_at timestamptz not null default now()
);

create table if not exists public.guimmia_candidate_evaluation_snapshots (
 id uuid primary key default gen_random_uuid(),
 candidate_id uuid not null references public.guimmia_rental_candidates(id) on delete cascade,
 criteria_version integer not null,
 status text not null default 'DRAFT' check(status in ('DRAFT','EVIDENCE_REVIEW','SHORTLISTED','FINAL','INVALIDATED')),
 decision text,
 decision_source text,
 decided_by uuid,
 protected_attribute_keys text[] not null default '{}',
 snapshot jsonb not null default '{}'::jsonb,
 input_fingerprint text not null,
 created_at timestamptz not null default now()
);

create table if not exists public.guimmia_lease_signature_events (
 id bigserial primary key,
 case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
 contract_instance_id uuid not null references public.guimmia_case_contract_instances(id) on delete cascade,
 signer_ref text not null,
 status text not null check(status in ('REQUESTED','VIEWED','SIGNED','COMPLETED','REJECTED','EXPIRED')),
 actor_type text not null,
 actor_id uuid,
 provider_reference text,
 content_hash text not null,
 idempotency_key text not null unique,
 payload jsonb not null default '{}'::jsonb,
 occurred_at timestamptz not null default now(),
 created_at timestamptz not null default now()
);

create table if not exists public.guimmia_lease_registration_tasks (
 id uuid primary key default gen_random_uuid(),
 case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
 contract_instance_id uuid not null references public.guimmia_case_contract_instances(id) on delete cascade,
 applicability text not null default 'UNKNOWN' check(applicability in ('UNKNOWN','REQUIRED','NOT_REQUIRED')),
 status text not null default 'PENDING' check(status in ('PENDING','READY','SUBMITTED','COMPLETED','OVERDUE','BLOCKED')),
 due_at timestamptz,
 assigned_to uuid,
 receipt_ref text,
 completed_by uuid,
 completed_at timestamptz,
 ruleset_snapshot jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(contract_instance_id)
);

create table if not exists public.guimmia_handover_inventory_items (
 id uuid primary key default gen_random_uuid(),
 handover_id uuid not null references public.guimmia_rental_handover_records(id) on delete cascade,
 item_code text not null,
 label text not null,
 quantity numeric not null default 1,
 condition_status text not null,
 evidence jsonb not null default '[]'::jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(handover_id,item_code)
);

create table if not exists public.guimmia_handover_key_events (
 id bigserial primary key,
 handover_id uuid not null references public.guimmia_rental_handover_records(id) on delete cascade,
 key_code text not null,
 event_type text not null check(event_type in ('DELIVERED','RETURNED','LOST','REPLACED')),
 quantity integer not null check(quantity>0),
 actor_type text not null,
 actor_id uuid,
 idempotency_key text not null unique,
 occurred_at timestamptz not null default now(),
 created_at timestamptz not null default now()
);

create table if not exists public.guimmia_handover_meter_readings (
 id uuid primary key default gen_random_uuid(),
 handover_id uuid not null references public.guimmia_rental_handover_records(id) on delete cascade,
 meter_code text not null,
 reading numeric not null,
 unit text not null,
 evidence jsonb not null default '[]'::jsonb,
 captured_by uuid,
 captured_at timestamptz not null default now(),
 created_at timestamptz not null default now(),
 unique(handover_id,meter_code,captured_at)
);

create table if not exists public.guimmia_rental_lifecycle_events (
 id bigserial primary key,
 case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
 event_type text not null,
 priority text not null default 'NORMAL' check(priority in ('NORMAL','HIGH','CRITICAL')),
 status text not null default 'OPEN' check(status in ('OPEN','TRIAGED','ASSIGNED','WAITING_CUSTOMER','RESOLVED','CLOSED')),
 actor_type text not null,
 actor_id uuid,
 assigned_to uuid,
 due_at timestamptz,
 idempotency_key text not null unique,
 payload jsonb not null default '{}'::jsonb,
 occurred_at timestamptz not null default now(),
 created_at timestamptz not null default now()
);

create table if not exists public.guimmia_tourist_bookings (
 id uuid primary key default gen_random_uuid(),
 case_id uuid not null references public.guimmia_brain_cases(id) on delete cascade,
 listing_id uuid not null references public.guimmia_rental_listings(id) on delete cascade,
 status text not null default 'REQUESTED' check(status in ('REQUESTED','ACCEPTED','PAYMENT_PENDING','CONFIRMED','CANCELLED','REFUND_PENDING','REFUNDED','CHECKED_IN','CHECKED_OUT','RECONCILED','ARCHIVED','REVIEW_REQUIRED')),
 checkin_at timestamptz not null,
 checkout_at timestamptz not null,
 guest_count integer not null check(guest_count>0),
 terms_snapshot jsonb not null default '{}'::jsonb,
 pricing_snapshot jsonb not null default '{}'::jsonb,
 confirmed_by uuid,
 reconciled_by uuid,
 idempotency_key text not null unique,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check(checkout_at>checkin_at)
);

create table if not exists public.guimmia_tourist_booking_events (
 id bigserial primary key,
 booking_id uuid not null references public.guimmia_tourist_bookings(id) on delete cascade,
 event_type text not null,
 actor_type text not null,
 actor_id uuid,
 idempotency_key text not null unique,
 payload jsonb not null default '{}'::jsonb,
 occurred_at timestamptz not null default now(),
 created_at timestamptz not null default now()
);

create table if not exists public.guimmia_tourist_payment_events (
 id bigserial primary key,
 booking_id uuid not null references public.guimmia_tourist_bookings(id) on delete cascade,
 event_type text not null check(event_type in ('AUTHORIZED','CAPTURED','COMMISSION','TAX','REFUND','PAYOUT','TAX_REVIEWED','ADJUSTMENT')),
 amount numeric(14,2) not null,
 currency text not null,
 provider_reference text,
 actor_type text not null,
 actor_id uuid,
 idempotency_key text not null unique,
 payload jsonb not null default '{}'::jsonb,
 occurred_at timestamptz not null default now(),
 created_at timestamptz not null default now()
);

create table if not exists public.guimmia_tourist_operational_tasks (
 id uuid primary key default gen_random_uuid(),
 booking_id uuid not null references public.guimmia_tourist_bookings(id) on delete cascade,
 task_code text not null,
 status text not null default 'PENDING' check(status in ('PENDING','READY','COMPLETED','BLOCKED','OVERDUE')),
 due_at timestamptz,
 assigned_to uuid,
 evidence jsonb not null default '[]'::jsonb,
 ruleset_snapshot jsonb not null default '{}'::jsonb,
 completed_by uuid,
 completed_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(booking_id,task_code)
);

create index if not exists idx_guimmia_rental_listings_case_status on public.guimmia_rental_listings(case_id,status);
create index if not exists idx_guimmia_rental_inquiries_listing on public.guimmia_rental_inquiries(listing_id,status);
create index if not exists idx_guimmia_rental_viewings_case_time on public.guimmia_rental_viewings(case_id,starts_at);
create index if not exists idx_guimmia_registration_due on public.guimmia_lease_registration_tasks(status,due_at);
create index if not exists idx_guimmia_lifecycle_queue on public.guimmia_rental_lifecycle_events(status,priority,due_at);
create index if not exists idx_guimmia_tourist_booking_window on public.guimmia_tourist_bookings(listing_id,checkin_at,checkout_at);
create index if not exists idx_guimmia_tourist_tasks_due on public.guimmia_tourist_operational_tasks(status,due_at);

do $$ declare t text; begin
 foreach t in array array['guimmia_rental_listings','guimmia_rental_inquiries','guimmia_rental_viewings','guimmia_lease_registration_tasks','guimmia_handover_inventory_items','guimmia_tourist_bookings','guimmia_tourist_operational_tasks'] loop
  execute format('drop trigger if exists %I on public.%I','trg_'||t||'_updated_at',t);
  execute format('create trigger %I before update on public.%I for each row execute function public.guimmia_set_updated_at()','trg_'||t||'_updated_at',t);
 end loop;
end $$;

do $$ declare t text; begin
 foreach t in array array['guimmia_rental_listings','guimmia_listing_publication_events','guimmia_rental_inquiries','guimmia_rental_viewings','guimmia_candidate_consent_events','guimmia_candidate_evaluation_snapshots','guimmia_lease_signature_events','guimmia_lease_registration_tasks','guimmia_handover_inventory_items','guimmia_handover_key_events','guimmia_handover_meter_readings','guimmia_rental_lifecycle_events','guimmia_tourist_bookings','guimmia_tourist_booking_events','guimmia_tourist_payment_events','guimmia_tourist_operational_tasks'] loop
  execute format('alter table public.%I enable row level security',t);
 end loop;
end $$;
