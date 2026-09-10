-- GUIMMIA V78.0.0 REV2 - Richieste persistenti di verifica
-- Additiva: non modifica né elimina i dati della linea Agenzia.

begin;

create table if not exists public.guimmia_ai_review_requests (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null,
  listing_id uuid references public.agency_listings(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  request_type text not null check (
    request_type in ('GENERAL_REVIEW', 'PROFESSIONAL_REVIEW')
  ),
  subject text not null check (char_length(subject) between 1 and 160),
  note text not null default '' check (char_length(note) <= 1000),
  message_snapshot text not null check (
    char_length(message_snapshot) between 1 and 12000
  ),
  context jsonb not null default '{}'::jsonb
    check (jsonb_typeof(context) = 'object'),
  status text not null default 'SUBMITTED' check (
    status in ('SUBMITTED', 'IN_REVIEW', 'COMPLETED', 'CLOSED')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint guimmia_ai_review_conversation_owner_fk
    foreign key (conversation_id, user_id)
    references public.guimmia_ai_conversations(id, user_id)
    on delete cascade
);

create index if not exists guimmia_ai_review_requests_user_created_idx
  on public.guimmia_ai_review_requests(user_id, created_at desc);

create index if not exists guimmia_ai_review_requests_listing_idx
  on public.guimmia_ai_review_requests(listing_id, created_at desc)
  where listing_id is not null;

create unique index if not exists guimmia_ai_review_one_open_per_chat_idx
  on public.guimmia_ai_review_requests(conversation_id)
  where status in ('SUBMITTED', 'IN_REVIEW');

create or replace function public.guimmia_v780_review_touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_guimmia_v780_review_updated_at
  on public.guimmia_ai_review_requests;
create trigger trg_guimmia_v780_review_updated_at
before update on public.guimmia_ai_review_requests
for each row execute function public.guimmia_v780_review_touch_updated_at();

alter table public.guimmia_ai_review_requests enable row level security;
alter table public.guimmia_ai_review_requests force row level security;

drop policy if exists guimmia_ai_review_owner_select
  on public.guimmia_ai_review_requests;
create policy guimmia_ai_review_owner_select
on public.guimmia_ai_review_requests
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists guimmia_ai_review_owner_insert
  on public.guimmia_ai_review_requests;
create policy guimmia_ai_review_owner_insert
on public.guimmia_ai_review_requests
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.guimmia_ai_conversations conversation
    where conversation.id = conversation_id
      and conversation.user_id = auth.uid()
  )
  and (
    listing_id is null
    or exists (
      select 1
      from public.agency_listings listing
      where listing.id = listing_id
        and listing.owner_user_id = auth.uid()
    )
  )
);

revoke all on public.guimmia_ai_review_requests from anon;
revoke all on public.guimmia_ai_review_requests from authenticated;
grant select, insert on public.guimmia_ai_review_requests to authenticated;

revoke all on function public.guimmia_v780_review_touch_updated_at()
  from public;

comment on table public.guimmia_ai_review_requests is
  'Richieste persistenti di verifica collegate a utente, chat e pratica Guimmia.';

commit;
