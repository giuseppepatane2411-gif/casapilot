-- CasaPilot V70 — Professional OS
-- Migrazione additiva. NON viene eseguita dall'installer.
-- Prerequisito: schema Professionisti V69 già applicato e backup Supabase creato.

create extension if not exists "pgcrypto";

alter table if exists public.lead_requests
  add column if not exists property_type text,
  add column if not exists quality_score smallint not null default 0,
  add column if not exists distribution_status text not null default 'queued',
  add column if not exists max_professionals smallint not null default 3;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'lead_requests_quality_score_v70_check'
  ) then
    alter table public.lead_requests
      add constraint lead_requests_quality_score_v70_check
      check (quality_score between 0 and 100);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'lead_requests_distribution_v70_check'
  ) then
    alter table public.lead_requests
      add constraint lead_requests_distribution_v70_check
      check (distribution_status in (
        'queued','wave_1','wave_2','completed','manual_review'
      ));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'lead_requests_max_professionals_v70_check'
  ) then
    alter table public.lead_requests
      add constraint lead_requests_max_professionals_v70_check
      check (max_professionals between 1 and 5);
  end if;
end $$;

-- Normalizza gli eventuali valori testuali introdotti dalle versioni demo precedenti.
update public.lead_requests
set urgency = case urgency
  when 'Il prima possibile' then 'asap'
  when 'Entro una settimana' then 'within_week'
  when 'Entro un mese' then 'within_month'
  when 'Non ho una scadenza' then 'flexible'
  else urgency
end
where urgency in (
  'Il prima possibile','Entro una settimana','Entro un mese','Non ho una scadenza'
);

create table if not exists public.professional_service_offerings_v70 (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null
    references public.professional_profiles(id) on delete cascade,
  service_id text not null
    references public.professional_service_catalog(id) on delete cascade,

  activation_status text not null default 'draft'
    check (activation_status in (
      'draft','pending_verification','active','limited','paused','rejected'
    )),

  delivery_modes jsonb not null default '["onsite"]'::jsonb,
  use_general_areas boolean not null default true,
  areas jsonb not null default '[]'::jsonb,
  radius_km integer,

  accepted_urgencies jsonb not null default
    '["asap","within_week","within_month","flexible"]'::jsonb,
  property_types jsonb not null default
    '["apartment","house","commercial","office","land","condominium","garage","other"]'::jsonb,

  pricing_mode text not null default 'after_inspection'
    check (pricing_mode in (
      'fixed','starting_from','range','hourly','daily','per_sqm','after_inspection'
    )),
  price_min numeric(12,2),
  price_max numeric(12,2),
  vat_included boolean not null default true,

  weekly_capacity integer not null default 5 check (weekly_capacity >= 0),
  current_week_assigned integer not null default 0
    check (current_week_assigned >= 0),
  minimum_lead_quality smallint not null default 60
    check (minimum_lead_quality between 0 and 100),
  response_sla_hours integer not null default 24
    check (response_sla_hours > 0),

  availability_windows jsonb not null default '[]'::jsonb,
  capabilities jsonb not null default '[]'::jsonb,
  exclusions jsonb not null default '[]'::jsonb,
  verification_item_ids jsonb not null default '[]'::jsonb,
  internal_notes text not null default '',
  auto_pause_when_full boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (professional_id, service_id)
);

create table if not exists public.professional_service_requirements_v70 (
  service_id text not null
    references public.professional_service_catalog(id) on delete cascade,
  requirement_key text not null,
  label text not null,
  verification_types jsonb not null default '[]'::jsonb,
  required boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (service_id, requirement_key)
);

insert into public.professional_service_requirements_v70
  (service_id, requirement_key, label, verification_types, required)
values
  ('certificazione-energetica','professional_register','Abilitazione professionale compatibile','["professional_register","license"]'::jsonb,true),
  ('riprese-drone','drone_license','Abilitazione operatore drone','["drone_license","license"]'::jsonb,true),
  ('assistenza-notarile','professional_register','Iscrizione professionale verificata','["professional_register"]'::jsonb,true),
  ('consulenza-legale','professional_register','Iscrizione all albo','["professional_register"]'::jsonb,true),
  ('sfratti-recupero','professional_register','Iscrizione all albo','["professional_register"]'::jsonb,true),
  ('consulenza-mutuo','license','Abilitazione o iscrizione richiesta','["license","professional_register"]'::jsonb,true),
  ('impianto-elettrico','license','Abilitazione impiantistica','["license","certification"]'::jsonb,true),
  ('impianto-idraulico','license','Abilitazione impiantistica','["license","certification"]'::jsonb,true)
on conflict (service_id, requirement_key) do update set
  label = excluded.label,
  verification_types = excluded.verification_types,
  required = excluded.required;

create table if not exists public.professional_match_runs_v70 (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null
    references public.lead_requests(id) on delete cascade,
  algorithm_version text not null default 'v70.0',
  status text not null default 'completed'
    check (status in ('running','completed','failed')),
  max_professionals smallint not null default 3,
  eligible_count integer not null default 0,
  reserve_count integer not null default 0,
  blocked_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.professional_match_candidates_v70 (
  id uuid primary key default gen_random_uuid(),
  match_run_id uuid not null
    references public.professional_match_runs_v70(id) on delete cascade,
  lead_id uuid not null
    references public.lead_requests(id) on delete cascade,
  professional_id uuid not null
    references public.professional_profiles(id) on delete cascade,
  offering_id uuid
    references public.professional_service_offerings_v70(id) on delete cascade,

  decision text not null
    check (decision in ('eligible','reserve','blocked')),
  score smallint not null check (score between 0 and 100),
  hard_blockers jsonb not null default '[]'::jsonb,
  positive_reasons jsonb not null default '[]'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  evaluated_at timestamptz not null default now(),

  unique (match_run_id, professional_id)
);

create table if not exists public.lead_distribution_waves_v70 (
  id uuid primary key default gen_random_uuid(),
  match_run_id uuid not null
    references public.professional_match_runs_v70(id) on delete cascade,
  lead_id uuid not null
    references public.lead_requests(id) on delete cascade,
  wave_number smallint not null check (wave_number in (1,2)),
  status text not null default 'queued'
    check (status in ('queued','active','completed','cancelled')),
  opens_at timestamptz,
  closes_at timestamptz,
  created_at timestamptz not null default now(),
  unique (lead_id, wave_number)
);

create table if not exists public.lead_invitations_v70 (
  id uuid primary key default gen_random_uuid(),
  wave_id uuid not null
    references public.lead_distribution_waves_v70(id) on delete cascade,
  lead_id uuid not null
    references public.lead_requests(id) on delete cascade,
  professional_id uuid not null
    references public.professional_profiles(id) on delete cascade,
  offering_id uuid not null
    references public.professional_service_offerings_v70(id) on delete cascade,
  rank integer not null,
  score smallint not null check (score between 0 and 100),
  status text not null default 'sent'
    check (status in ('queued','sent','viewed','accepted','declined','expired')),
  expires_at timestamptz not null,
  viewed_at timestamptz,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lead_id, professional_id)
);

create index if not exists professional_offerings_v70_match_idx
  on public.professional_service_offerings_v70
  (service_id, activation_status, minimum_lead_quality);

create index if not exists professional_offerings_v70_capacity_idx
  on public.professional_service_offerings_v70
  (weekly_capacity, current_week_assigned);

create index if not exists match_candidates_v70_rank_idx
  on public.professional_match_candidates_v70
  (match_run_id, decision, score desc);

create index if not exists invitations_v70_status_idx
  on public.lead_invitations_v70
  (professional_id, status, expires_at);

alter table public.professional_service_offerings_v70
  enable row level security;
alter table public.professional_service_requirements_v70
  enable row level security;
alter table public.professional_match_runs_v70
  enable row level security;
alter table public.professional_match_candidates_v70
  enable row level security;
alter table public.lead_distribution_waves_v70
  enable row level security;
alter table public.lead_invitations_v70
  enable row level security;

drop policy if exists requirements_v70_catalog_read
  on public.professional_service_requirements_v70;
create policy requirements_v70_catalog_read
  on public.professional_service_requirements_v70
  for select to authenticated
  using (true);

drop policy if exists offerings_v70_owner_read
  on public.professional_service_offerings_v70;
create policy offerings_v70_owner_read
  on public.professional_service_offerings_v70
  for select to authenticated
  using (
    exists (
      select 1
      from public.professional_profiles profile
      where profile.id = professional_service_offerings_v70.professional_id
        and profile.user_id = auth.uid()
    )
  );

drop policy if exists offerings_v70_owner_insert
  on public.professional_service_offerings_v70;
create policy offerings_v70_owner_insert
  on public.professional_service_offerings_v70
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.professional_profiles profile
      where profile.id = professional_service_offerings_v70.professional_id
        and profile.user_id = auth.uid()
    )
  );

drop policy if exists offerings_v70_owner_update
  on public.professional_service_offerings_v70;
create policy offerings_v70_owner_update
  on public.professional_service_offerings_v70
  for update to authenticated
  using (
    exists (
      select 1
      from public.professional_profiles profile
      where profile.id = professional_service_offerings_v70.professional_id
        and profile.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.professional_profiles profile
      where profile.id = professional_service_offerings_v70.professional_id
        and profile.user_id = auth.uid()
    )
  );

drop policy if exists offerings_v70_owner_delete
  on public.professional_service_offerings_v70;
create policy offerings_v70_owner_delete
  on public.professional_service_offerings_v70
  for delete to authenticated
  using (
    exists (
      select 1
      from public.professional_profiles profile
      where profile.id = professional_service_offerings_v70.professional_id
        and profile.user_id = auth.uid()
    )
  );

drop policy if exists invitations_v70_professional_read
  on public.lead_invitations_v70;
create policy invitations_v70_professional_read
  on public.lead_invitations_v70
  for select to authenticated
  using (
    exists (
      select 1
      from public.professional_profiles profile
      where profile.id = lead_invitations_v70.professional_id
        and profile.user_id = auth.uid()
    )
  );

-- I match completi, inclusi i candidati bloccati, restano accessibili soltanto
-- tramite funzioni server-side con service_role. Non viene creata una policy
-- di lettura diretta per gli utenti autenticati.

create or replace function public.run_professional_match_v70(
  p_lead_id uuid,
  p_max_professionals integer default 3
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_run_id uuid;
  v_wave_1_id uuid;
  v_wave_2_id uuid;
  v_max integer := greatest(1, least(coalesce(p_max_professionals, 3), 5));
begin
  insert into public.professional_match_runs_v70 (
    lead_id,
    algorithm_version,
    status,
    max_professionals
  )
  values (p_lead_id, 'v70.0', 'running', v_max)
  returning id into v_run_id;

  with candidate_base as (
    select
      lead.id as lead_id,
      lead.service_id,
      lead.approximate_location,
      lead.property_type,
      lead.urgency,
      lead.quality_score,
      lead.budget_max,
      profile.id as professional_id,
      profile.availability_status,
      offering.id as offering_id,
      offering.activation_status,
      offering.delivery_modes,
      offering.use_general_areas,
      offering.areas,
      offering.accepted_urgencies,
      offering.property_types,
      offering.price_min,
      offering.weekly_capacity,
      offering.current_week_assigned,
      offering.minimum_lead_quality,
      offering.response_sla_hours,
      offering.auto_pause_when_full,
      (
        offering.delivery_modes ? 'online'
        or exists (
          select 1
          from jsonb_array_elements_text(offering.areas) configured_area(value)
          where length(trim(configured_area.value)) > 0
            and lead.approximate_location ilike '%' || configured_area.value || '%'
        )
        or (
          offering.use_general_areas
          and exists (
            select 1
            from public.professional_service_areas service_area
            where service_area.professional_id = profile.id
              and (
                (service_area.municipality is not null and lead.approximate_location ilike '%' || service_area.municipality || '%')
                or (service_area.province is not null and lead.approximate_location ilike '%' || service_area.province || '%')
                or (service_area.region is not null and lead.approximate_location ilike '%' || service_area.region || '%')
              )
          )
        )
      ) as zone_ok,
      (
        lead.property_type is null
        or offering.property_types ? lead.property_type
      ) as property_ok,
      (
        lead.budget_max is null
        or offering.price_min is null
        or offering.price_min <= lead.budget_max
      ) as budget_ok,
      not exists (
        select 1
        from public.professional_service_requirements_v70 requirement
        where requirement.service_id = offering.service_id
          and requirement.required = true
          and not exists (
            select 1
            from public.professional_verifications verification
            where verification.professional_id = profile.id
              and verification.status = 'verified'
              and requirement.verification_types ? verification.verification_type
          )
      ) as verification_ok
    from public.lead_requests lead
    join public.professional_service_offerings_v70 offering
      on offering.service_id = lead.service_id
    join public.professional_profiles profile
      on profile.id = offering.professional_id
    where lead.id = p_lead_id
  ), evaluated as (
    select
      candidate_base.*,
      array_remove(
        array[
          case when activation_status not in ('active','limited') then 'Servizio non attivo' end,
          case when availability_status <> 'available' then 'Professionista non disponibile' end,
          case when quality_score < minimum_lead_quality then 'Qualità lead sotto la soglia' end,
          case when not (accepted_urgencies ? urgency) then 'Urgenza non accettata' end,
          case when auto_pause_when_full and current_week_assigned >= weekly_capacity then 'Capacità settimanale esaurita' end,
          case when not property_ok then 'Tipologia immobiliare non coperta' end,
          case when not zone_ok then 'Zona non coperta' end,
          case when not budget_ok then 'Prezzo minimo superiore al budget massimo' end,
          case when not verification_ok then 'Requisiti professionali obbligatori non verificati' end
        ]::text[],
        null
      ) as blockers,
      array_remove(
        array[
          'Servizio offerto esattamente',
          case when activation_status = 'active' then 'Servizio pienamente attivo' else 'Disponibilità limitata' end,
          case when quality_score >= minimum_lead_quality then 'Qualità lead compatibile' end,
          case when accepted_urgencies ? urgency then 'Urgenza accettata' end,
          case when zone_ok then 'Zona o modalità online compatibile' end,
          case when property_ok then 'Tipologia immobiliare coperta' end,
          case when budget_ok and budget_max is not null and price_min is not null then 'Fascia economica compatibile' end,
          case when verification_ok then 'Requisiti professionali rispettati' end,
          case when response_sla_hours <= 6 then 'Risposta rapida prevista' end
        ]::text[],
        null
      ) as reasons,
      array_remove(
        array[
          case when budget_max is null or price_min is null then 'Compatibilità economica da confermare' end,
          case when property_type is null then 'Tipologia immobiliare non classificata' end
        ]::text[],
        null
      ) as warnings,
      least(
        100,
        14
        + least(16, round(quality_score::numeric / 6.25)::integer)
        + case when accepted_urgencies ? urgency then 10 else 0 end
        + case when zone_ok then 16 else 0 end
        + case when property_ok then 8 else 0 end
        + case when budget_ok and budget_max is not null and price_min is not null then 7 else 0 end
        + case when verification_ok then 8 else 0 end
        + case when current_week_assigned < weekly_capacity then least(8, weekly_capacity - current_week_assigned) else 0 end
        + case when response_sla_hours <= 6 then 5 when response_sla_hours <= 24 then 3 else 0 end
      )::smallint as raw_score
    from candidate_base
  )
  insert into public.professional_match_candidates_v70 (
    match_run_id,
    lead_id,
    professional_id,
    offering_id,
    decision,
    score,
    hard_blockers,
    positive_reasons,
    warnings
  )
  select
    v_run_id,
    lead_id,
    professional_id,
    offering_id,
    case
      when cardinality(blockers) > 0 then 'blocked'
      when raw_score >= 72 then 'eligible'
      else 'reserve'
    end,
    case when cardinality(blockers) > 0 then least(raw_score, 59) else raw_score end,
    to_jsonb(blockers),
    to_jsonb(reasons),
    to_jsonb(warnings)
  from evaluated;

  update public.professional_match_runs_v70 run
  set
    status = 'completed',
    eligible_count = (
      select count(*)
      from public.professional_match_candidates_v70 candidate
      where candidate.match_run_id = v_run_id
        and candidate.decision = 'eligible'
    ),
    reserve_count = (
      select count(*)
      from public.professional_match_candidates_v70 candidate
      where candidate.match_run_id = v_run_id
        and candidate.decision = 'reserve'
    ),
    blocked_count = (
      select count(*)
      from public.professional_match_candidates_v70 candidate
      where candidate.match_run_id = v_run_id
        and candidate.decision = 'blocked'
    )
  where run.id = v_run_id;

  insert into public.lead_distribution_waves_v70 (
    match_run_id, lead_id, wave_number, status, opens_at, closes_at
  )
  values (
    v_run_id, p_lead_id, 1, 'active', now(), now() + interval '24 hours'
  )
  returning id into v_wave_1_id;

  insert into public.lead_distribution_waves_v70 (
    match_run_id, lead_id, wave_number, status
  )
  values (v_run_id, p_lead_id, 2, 'queued')
  returning id into v_wave_2_id;

  insert into public.lead_invitations_v70 (
    wave_id, lead_id, professional_id, offering_id, rank, score, status, expires_at
  )
  select
    v_wave_1_id,
    p_lead_id,
    candidate.professional_id,
    candidate.offering_id,
    row_number() over (order by candidate.score desc)::integer,
    candidate.score,
    'sent',
    now() + interval '24 hours'
  from public.professional_match_candidates_v70 candidate
  where candidate.match_run_id = v_run_id
    and candidate.decision = 'eligible'
  order by candidate.score desc
  limit v_max;

  insert into public.lead_invitations_v70 (
    wave_id, lead_id, professional_id, offering_id, rank, score, status, expires_at
  )
  select
    v_wave_2_id,
    p_lead_id,
    candidate.professional_id,
    candidate.offering_id,
    row_number() over (
      order by
        case candidate.decision when 'eligible' then 0 else 1 end,
        candidate.score desc
    )::integer,
    candidate.score,
    'queued',
    now() + interval '48 hours'
  from public.professional_match_candidates_v70 candidate
  where candidate.match_run_id = v_run_id
    and candidate.decision in ('eligible','reserve')
    and not exists (
      select 1
      from public.lead_invitations_v70 existing_invitation
      where existing_invitation.lead_id = p_lead_id
        and existing_invitation.professional_id = candidate.professional_id
    )
  order by
    case candidate.decision when 'eligible' then 0 else 1 end,
    candidate.score desc
  limit v_max;

  update public.lead_requests
  set
    distribution_status = case
      when exists (
        select 1
        from public.lead_invitations_v70 invitation
        where invitation.wave_id = v_wave_1_id
      ) then 'wave_1'
      else 'manual_review'
    end,
    status = case
      when exists (
        select 1
        from public.lead_invitations_v70 invitation
        where invitation.wave_id = v_wave_1_id
      ) then 'matched'
      else status
    end,
    updated_at = now()
  where id = p_lead_id;

  return v_run_id;
end;
$$;

revoke all on function public.run_professional_match_v70(uuid, integer)
  from public;
grant execute on function public.run_professional_match_v70(uuid, integer)
  to service_role;

comment on function public.run_professional_match_v70(uuid, integer) is
  'Valuta requisiti bloccanti, punteggio, motivazioni e prepara prima ondata e lista di riserva. Deve essere invocata esclusivamente lato server con service_role.';
