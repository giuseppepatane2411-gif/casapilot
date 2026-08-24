-- GUIMMIA V77.0 - Central Case Orchestrator schema
create extension if not exists pgcrypto;
do $$ begin if to_regclass('public.guimmia_customer_journey_profiles') is null or to_regclass('public.guimmia_document_workspaces') is null then raise exception 'V77.0 requires V76.9 installed and database verified';end if;if (select count(*) from public.guimmia_brain_rules where phase_code in('PHASE_O01_CASE_ROUTING_ASSIGNMENT','PHASE_C03_CUSTOMER_PROGRESS_ASSISTANCE') and active)<>32 then raise exception 'V77.0 requires the verified V76.9 operational brain';end if;end $$;

create table if not exists public.guimmia_case_orchestrator_profiles(
  singleton_key text primary key check(singleton_key='GUIMMIA_CENTRAL_ORCHESTRATOR'),
  operating_agency_id uuid not null unique references public.guimmia_online_agency_profile(id),
  version text not null check(version='77.0.0'),
  status text not null default 'ACTIVE' check(status in('ACTIVE','PAUSED')),
  supported_operation_types jsonb not null,
  minimum_confidence numeric(4,3) not null default 0.750 check(minimum_confidence between 0 and 1),
  max_customer_questions integer not null default 3 check(max_customer_questions between 1 and 5),
  human_authority_policy jsonb not null,
  created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists public.guimmia_case_context_snapshots(
  id uuid primary key default gen_random_uuid(),case_id uuid not null,operating_agency_id uuid not null references public.guimmia_online_agency_profile(id),
  case_version integer not null check(case_version>0),operation_type text not null check(operation_type in('SALE','RENT_LONG_TERM','RENT_TRANSITORY','RENT_STUDENT','RENT_TOURIST_SHORT')),
  customer_service_model text not null check(customer_service_model in('COMPLETA','MENSILE')),customer_role text not null,property_id uuid,current_phase text not null,internal_owner_id uuid not null,
  context_data jsonb not null,context_fingerprint text not null,status text not null default 'SNAPSHOT_READY' check(status in('DRAFT','SNAPSHOT_READY','SUPERSEDED','INVALID')),
  computed_at timestamptz not null,superseded_at timestamptz,created_at timestamptz not null default now(),unique(case_id,case_version,context_fingerprint)
);
create table if not exists public.guimmia_case_fact_observations(
  id uuid primary key default gen_random_uuid(),snapshot_id uuid not null references public.guimmia_case_context_snapshots(id),case_id uuid not null,operating_agency_id uuid not null references public.guimmia_online_agency_profile(id),
  fact_path text not null,fact_value jsonb not null,source_type text not null,source_ref text,observed_at timestamptz not null,valid_until timestamptz,verified boolean not null default false,
  content_hash text not null,status text not null check(status in('READY','MISSING','UNVERIFIED','STALE')),created_at timestamptz not null default now()
);
create table if not exists public.guimmia_case_evidence_requirements(
  id uuid primary key default gen_random_uuid(),case_id uuid not null,operating_agency_id uuid not null references public.guimmia_online_agency_profile(id),phase_code text not null,gate_code text not null,
  fact_path text not null,required boolean not null default true,verification_type text not null,max_age_days integer check(max_age_days is null or max_age_days>0),
  status text not null check(status in('PENDING','READY','MISSING','UNVERIFIED','STALE','WAIVED')),matched_observation_id uuid references public.guimmia_case_fact_observations(id),
  waiver_actor_type text,waiver_actor_id uuid,waiver_reason text,last_evaluated_at timestamptz not null default now(),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
  unique(case_id,phase_code,gate_code,fact_path)
);
create table if not exists public.guimmia_case_readiness_assessments(
  id uuid primary key default gen_random_uuid(),case_id uuid not null,operating_agency_id uuid not null references public.guimmia_online_agency_profile(id),snapshot_id uuid not null references public.guimmia_case_context_snapshots(id),
  gate_code text not null,readiness_score numeric(5,2) not null check(readiness_score between 0 and 100),status text not null check(status in('READY','BLOCKED','REVIEW','WAITING_CUSTOMER','WAITING_HUMAN','WAITING_PROFESSIONAL')),
  blocking_codes jsonb not null,evidence_refs jsonb not null,assessment_fingerprint text not null,evaluated_at timestamptz not null,created_at timestamptz not null default now(),unique(case_id,snapshot_id,gate_code)
);
create table if not exists public.guimmia_case_decision_runs(
  id uuid primary key default gen_random_uuid(),case_id uuid not null,operating_agency_id uuid not null references public.guimmia_online_agency_profile(id),snapshot_id uuid not null references public.guimmia_case_context_snapshots(id),
  run_key text not null unique,input_fingerprint text not null,previous_decision_fingerprint text,status text not null check(status in('CREATED','EVALUATING','DECIDED','BLOCKED','COMMITTED','SUPERSEDED','FAILED','CANCELLED')),
  confidence numeric(4,3) not null check(confidence between 0 and 1),started_at timestamptz not null,decided_at timestamptz,committed_at timestamptz,failure_code text,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists public.guimmia_case_decision_inputs(
  id uuid primary key default gen_random_uuid(),run_id uuid not null unique references public.guimmia_case_decision_runs(id),case_id uuid not null,operating_agency_id uuid not null references public.guimmia_online_agency_profile(id),
  context_fingerprint text not null,findings jsonb not null,candidate_actions jsonb not null,input_hash text not null,created_at timestamptz not null default now()
);
create table if not exists public.guimmia_case_rule_evaluations(
  id uuid primary key default gen_random_uuid(),run_id uuid not null references public.guimmia_case_decision_runs(id),case_id uuid not null,operating_agency_id uuid not null references public.guimmia_online_agency_profile(id),
  rule_code text not null,phase_code text not null,matched boolean not null,severity text not null check(severity in('info','warning','blocking','critical')),reason_codes jsonb not null,evidence_refs jsonb not null,
  evaluation_hash text not null,evaluated_at timestamptz not null,unique(run_id,rule_code)
);
create table if not exists public.guimmia_case_decision_outputs(
  id uuid primary key default gen_random_uuid(),run_id uuid not null unique references public.guimmia_case_decision_runs(id),case_id uuid not null,operating_agency_id uuid not null references public.guimmia_online_agency_profile(id),
  status text not null check(status in('READY','BLOCKED','WAITING_CUSTOMER','WAITING_HUMAN','WAITING_PROFESSIONAL')),selected_action jsonb,reason_codes jsonb not null,rule_refs jsonb not null,evidence_refs jsonb not null,
  customer_explanation text not null,internal_explanation text not null,handoff_required boolean not null default false,ai_execution_allowed boolean not null default false,customer_confirmation_required boolean not null default false,
  output_hash text not null,decided_at timestamptz not null,created_at timestamptz not null default now()
);
create table if not exists public.guimmia_case_next_actions(
  id uuid primary key default gen_random_uuid(),case_id uuid not null,operating_agency_id uuid not null references public.guimmia_online_agency_profile(id),run_id uuid not null references public.guimmia_case_decision_runs(id),
  action_code text not null,action_type text not null,title text not null,status text not null check(status in('PROPOSED','READY','IN_PROGRESS','BLOCKED','COMPLETED','SUPERSEDED','CANCELLED')),
  priority text not null check(priority in('LOW','NORMAL','HIGH','CRITICAL')),authority_class text not null check(authority_class in('AI_AUTONOMOUS','CUSTOMER_CONFIRMATION','GUIMMIA_HUMAN','QUALIFIED_PROFESSIONAL')),
  owner_type text not null check(owner_type in('AI','CUSTOMER','GUIMMIA','PROFESSIONAL')),owner_id uuid,reason_codes jsonb not null,dependencies jsonb not null,due_at timestamptz,customer_visible boolean not null default true,
  customer_confirmation_required boolean not null default false,customer_confirmed_at timestamptz,action_fingerprint text not null unique,superseded_by uuid references public.guimmia_case_next_actions(id),
  completed_by_actor_type text,completed_by uuid,completed_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists public.guimmia_case_handoff_requests(
  id uuid primary key default gen_random_uuid(),case_id uuid not null,operating_agency_id uuid not null references public.guimmia_online_agency_profile(id),run_id uuid not null references public.guimmia_case_decision_runs(id),action_id uuid references public.guimmia_case_next_actions(id),
  authority_class text not null check(authority_class in('GUIMMIA_HUMAN','QUALIFIED_PROFESSIONAL')),requested_owner_type text not null check(requested_owner_type in('GUIMMIA','PROFESSIONAL')),requested_owner_id uuid,
  status text not null check(status in('REQUESTED','ASSIGNED','ACCEPTED','ESCALATED','RESOLVED','CANCELLED')),reason_codes jsonb not null,context_fingerprint text not null,context_summary jsonb not null,
  sla_minutes integer not null check(sla_minutes>0),due_at timestamptz not null,accepted_at timestamptz,resolved_at timestamptz,resolution jsonb,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists public.guimmia_case_explanations(
  id uuid primary key default gen_random_uuid(),case_id uuid not null,operating_agency_id uuid not null references public.guimmia_online_agency_profile(id),run_id uuid not null references public.guimmia_case_decision_runs(id),
  audience text not null check(audience in('CUSTOMER','INTERNAL','PROFESSIONAL')),plain_language boolean not null,content text not null,reason_codes jsonb not null,rule_refs jsonb not null,evidence_refs jsonb not null,
  redacted boolean not null default true,content_hash text not null,created_at timestamptz not null default now(),unique(run_id,audience)
);
create table if not exists public.guimmia_case_orchestrator_events(
  id bigserial primary key,case_id uuid not null,operating_agency_id uuid not null references public.guimmia_online_agency_profile(id),run_id uuid references public.guimmia_case_decision_runs(id),
  event_type text not null,actor_type text not null check(actor_type in('AI','CUSTOMER','GUIMMIA','PROFESSIONAL','SYSTEM')),actor_id uuid,payload jsonb not null,previous_event_hash text,event_hash text not null unique,created_at timestamptz not null default now()
);
create table if not exists public.guimmia_case_orchestrator_locks(
  case_id uuid primary key,operating_agency_id uuid not null references public.guimmia_online_agency_profile(id),lock_token text not null unique,case_version integer not null check(case_version>0),owner_instance text not null,
  locked_at timestamptz not null,expires_at timestamptz not null,released_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists public.guimmia_case_playbook_instances(
  id uuid primary key default gen_random_uuid(),case_id uuid not null,operating_agency_id uuid not null references public.guimmia_online_agency_profile(id),playbook_code text not null,playbook_version integer not null check(playbook_version=1),operation_type text not null check(operation_type in('SALE','RENT_LONG_TERM','RENT_TRANSITORY','RENT_STUDENT','RENT_TOURIST_SHORT')),
  current_stage text not null,status text not null default 'ACTIVE' check(status in('ACTIVE','WAITING_INPUT','STAGE_READY','PAUSED','COMPLETED','CANCELLED')),stage_started_at timestamptz not null,progress_percent numeric(5,2) not null default 0 check(progress_percent between 0 and 100),context_fingerprint text not null,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(case_id,playbook_code)
);
create table if not exists public.guimmia_case_stage_transitions(
  id uuid primary key default gen_random_uuid(),playbook_instance_id uuid not null references public.guimmia_case_playbook_instances(id),case_id uuid not null,operating_agency_id uuid not null references public.guimmia_online_agency_profile(id),from_stage text not null,to_stage text not null,status text not null check(status in('PROPOSED','VERIFIED','APPLIED','REJECTED')),
  prerequisites jsonb not null,evidence_refs jsonb not null,decision_run_id uuid references public.guimmia_case_decision_runs(id),approved_by_actor_type text check(approved_by_actor_type is null or approved_by_actor_type in('GUIMMIA','PROFESSIONAL','CUSTOMER')),approved_by_actor_id uuid,verified_at timestamptz,applied_at timestamptz,transition_fingerprint text not null unique,created_at timestamptz not null default now()
);
create table if not exists public.guimmia_case_execution_commands(
  id uuid primary key default gen_random_uuid(),case_id uuid not null,operating_agency_id uuid not null references public.guimmia_online_agency_profile(id),run_id uuid not null references public.guimmia_case_decision_runs(id),action_id uuid references public.guimmia_case_next_actions(id),command_id text not null unique,mode text not null check(mode in('DRY_RUN','COMMIT')),expected_case_version integer not null check(expected_case_version>0),idempotency_key text not null unique,input_fingerprint text not null,action_type text not null,authority_class text not null check(authority_class in('AI_AUTONOMOUS','CUSTOMER_CONFIRMATION','GUIMMIA_HUMAN','QUALIFIED_PROFESSIONAL')),authority_evidence jsonb not null default '{}'::jsonb,status text not null check(status in('DRAFT','VALIDATED','BLOCKED','EXECUTING','SUCCEEDED','FAILED','CANCELLED')),executable boolean not null default false,blocked_reason_codes jsonb not null,result jsonb,result_hash text,executed_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists public.guimmia_case_question_requests(
  id uuid primary key default gen_random_uuid(),case_id uuid not null,operating_agency_id uuid not null references public.guimmia_online_agency_profile(id),run_id uuid not null references public.guimmia_case_decision_runs(id),question_code text not null,fact_path text not null,prompt text not null,why_it_matters text not null,status text not null default 'OPEN' check(status in('OPEN','ANSWERED','SUPERSEDED','CANCELLED')),sequence_no integer not null check(sequence_no between 1 and 3),response jsonb,answered_by_actor_type text check(answered_by_actor_type is null or answered_by_actor_type in('CUSTOMER','GUIMMIA','PROFESSIONAL')),answered_by_actor_id uuid,answered_at timestamptz,question_fingerprint text not null unique,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(run_id,sequence_no)
);

create index if not exists idx_v770_context_case on public.guimmia_case_context_snapshots(case_id,case_version desc);
create index if not exists idx_v770_fact_case_path on public.guimmia_case_fact_observations(case_id,fact_path,observed_at desc);
create index if not exists idx_v770_evidence_case_status on public.guimmia_case_evidence_requirements(case_id,status);
create index if not exists idx_v770_readiness_case_gate on public.guimmia_case_readiness_assessments(case_id,gate_code,evaluated_at desc);
create index if not exists idx_v770_runs_case_started on public.guimmia_case_decision_runs(case_id,started_at desc);
create index if not exists idx_v770_rule_eval_run_matched on public.guimmia_case_rule_evaluations(run_id,matched,severity);
create index if not exists idx_v770_actions_queue on public.guimmia_case_next_actions(status,priority,due_at);
create index if not exists idx_v770_handoff_queue on public.guimmia_case_handoff_requests(status,due_at);
create index if not exists idx_v770_events_case on public.guimmia_case_orchestrator_events(case_id,id);
create index if not exists idx_v770_playbook_case on public.guimmia_case_playbook_instances(case_id,status,current_stage);
create index if not exists idx_v770_stage_transition_case on public.guimmia_case_stage_transitions(case_id,status,created_at desc);
create index if not exists idx_v770_execution_case on public.guimmia_case_execution_commands(case_id,status,created_at desc);
create index if not exists idx_v770_questions_case on public.guimmia_case_question_requests(case_id,status,sequence_no);

insert into public.guimmia_case_orchestrator_profiles(singleton_key,operating_agency_id,version,status,supported_operation_types,minimum_confidence,max_customer_questions,human_authority_policy) select 'GUIMMIA_CENTRAL_ORCHESTRATOR',id,'77.0.0','ACTIVE','["SALE","RENT_LONG_TERM","RENT_TRANSITORY","RENT_STUDENT","RENT_TOURIST_SHORT"]'::jsonb,0.750,3,'{"aiMayRecommend":true,"aiMayPrepare":true,"aiMayApproveOrSign":false,"aiMaySetPrice":false,"aiMaySelectCandidate":false,"aiMayIssueProfessionalConclusion":false,"bookingRequiresCustomerConfirmation":true,"unknownActionFailsClosed":true,"executionRequiresExpectedCaseVersion":true}'::jsonb from public.guimmia_online_agency_profile where singleton_key='GUIMMIA' and code='GUIMMIA' on conflict(singleton_key) do update set operating_agency_id=excluded.operating_agency_id,version=excluded.version,status='ACTIVE',supported_operation_types=excluded.supported_operation_types,human_authority_policy=excluded.human_authority_policy,updated_at=now();
alter table public.guimmia_case_orchestrator_profiles enable row level security;alter table public.guimmia_case_orchestrator_profiles force row level security;
alter table public.guimmia_case_context_snapshots enable row level security;alter table public.guimmia_case_context_snapshots force row level security;
alter table public.guimmia_case_fact_observations enable row level security;alter table public.guimmia_case_fact_observations force row level security;
alter table public.guimmia_case_evidence_requirements enable row level security;alter table public.guimmia_case_evidence_requirements force row level security;
alter table public.guimmia_case_readiness_assessments enable row level security;alter table public.guimmia_case_readiness_assessments force row level security;
alter table public.guimmia_case_decision_runs enable row level security;alter table public.guimmia_case_decision_runs force row level security;
alter table public.guimmia_case_decision_inputs enable row level security;alter table public.guimmia_case_decision_inputs force row level security;
alter table public.guimmia_case_rule_evaluations enable row level security;alter table public.guimmia_case_rule_evaluations force row level security;
alter table public.guimmia_case_decision_outputs enable row level security;alter table public.guimmia_case_decision_outputs force row level security;
alter table public.guimmia_case_next_actions enable row level security;alter table public.guimmia_case_next_actions force row level security;
alter table public.guimmia_case_handoff_requests enable row level security;alter table public.guimmia_case_handoff_requests force row level security;
alter table public.guimmia_case_explanations enable row level security;alter table public.guimmia_case_explanations force row level security;
alter table public.guimmia_case_orchestrator_events enable row level security;alter table public.guimmia_case_orchestrator_events force row level security;
alter table public.guimmia_case_orchestrator_locks enable row level security;alter table public.guimmia_case_orchestrator_locks force row level security;
alter table public.guimmia_case_playbook_instances enable row level security;alter table public.guimmia_case_playbook_instances force row level security;
alter table public.guimmia_case_stage_transitions enable row level security;alter table public.guimmia_case_stage_transitions force row level security;
alter table public.guimmia_case_execution_commands enable row level security;alter table public.guimmia_case_execution_commands force row level security;
alter table public.guimmia_case_question_requests enable row level security;alter table public.guimmia_case_question_requests force row level security;
