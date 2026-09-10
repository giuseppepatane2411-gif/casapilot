-- GUIMMIA V78.1.0 - Link conversazione AI -> pratica immobiliare
-- Additiva: collega le nuove conversazioni AI alle pratiche esistenti
-- senza modificare o rimuovere le tabelle della linea Agenzia.

begin;

create table if not exists public.guimmia_ai_practice_links (
  conversation_id uuid primary key
    references public.guimmia_ai_conversations(id) on delete cascade,
  listing_id uuid not null
    references public.agency_listings(id) on delete cascade,
  user_id uuid not null
    references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (listing_id, conversation_id)
);

create index if not exists guimmia_ai_practice_links_user_idx
  on public.guimmia_ai_practice_links(user_id, created_at desc);

alter table public.guimmia_ai_practice_links enable row level security;
alter table public.guimmia_ai_practice_links force row level security;

drop policy if exists guimmia_ai_practice_links_owner_select
  on public.guimmia_ai_practice_links;
create policy guimmia_ai_practice_links_owner_select
on public.guimmia_ai_practice_links for select to authenticated
using (user_id = auth.uid());

drop policy if exists guimmia_ai_practice_links_owner_insert
  on public.guimmia_ai_practice_links;
create policy guimmia_ai_practice_links_owner_insert
on public.guimmia_ai_practice_links for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.guimmia_ai_conversations conversation
    where conversation.id = conversation_id
      and conversation.user_id = auth.uid()
  )
  and exists (
    select 1 from public.agency_listings listing
    where listing.id = listing_id
      and listing.owner_user_id = auth.uid()
      and listing.status in ('draft', 'review')
  )
);

drop policy if exists guimmia_ai_practice_links_owner_delete
  on public.guimmia_ai_practice_links;
create policy guimmia_ai_practice_links_owner_delete
on public.guimmia_ai_practice_links for delete to authenticated
using (user_id = auth.uid());

grant select, insert, delete
  on public.guimmia_ai_practice_links to authenticated;

comment on table public.guimmia_ai_practice_links is
  'Collegamento esplicito tra una conversazione Guimmia AI e la pratica immobiliare del proprietario.';

commit;
