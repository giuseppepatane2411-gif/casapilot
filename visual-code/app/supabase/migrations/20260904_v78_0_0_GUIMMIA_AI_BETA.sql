-- GUIMMIA V78.0.0 REV1 - Guimmia AI Beta
-- Cronologia e cartelle cloud personali per l'assistente immobiliare.

create extension if not exists pgcrypto;

create table if not exists public.guimmia_ai_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table if not exists public.guimmia_ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.guimmia_ai_projects(id) on delete set null,
  title text not null check (char_length(title) between 1 and 120),
  focus text not null default 'GENERAL' check (focus in (
    'GENERAL',
    'SALE',
    'RENT',
    'LISTING',
    'CONTRACT',
    'DOCUMENTS',
    'VALUATION'
  )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table if not exists public.guimmia_ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 12000),
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  constraint guimmia_ai_messages_conversation_owner_fk
    foreign key (conversation_id, user_id)
    references public.guimmia_ai_conversations(id, user_id)
    on delete cascade
);

create index if not exists idx_guimmia_ai_projects_user_created
  on public.guimmia_ai_projects(user_id, created_at);
create index if not exists idx_guimmia_ai_conversations_user_updated
  on public.guimmia_ai_conversations(user_id, updated_at desc);
create index if not exists idx_guimmia_ai_conversations_project_updated
  on public.guimmia_ai_conversations(project_id, updated_at desc)
  where project_id is not null;
create index if not exists idx_guimmia_ai_messages_conversation_created
  on public.guimmia_ai_messages(conversation_id, created_at);

create or replace function public.guimmia_v780_touch_updated_at()
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

drop trigger if exists trg_guimmia_v780_projects_updated_at
  on public.guimmia_ai_projects;
create trigger trg_guimmia_v780_projects_updated_at
before update on public.guimmia_ai_projects
for each row execute function public.guimmia_v780_touch_updated_at();

drop trigger if exists trg_guimmia_v780_conversations_updated_at
  on public.guimmia_ai_conversations;
create trigger trg_guimmia_v780_conversations_updated_at
before update on public.guimmia_ai_conversations
for each row execute function public.guimmia_v780_touch_updated_at();

alter table public.guimmia_ai_projects enable row level security;
alter table public.guimmia_ai_projects force row level security;
alter table public.guimmia_ai_conversations enable row level security;
alter table public.guimmia_ai_conversations force row level security;
alter table public.guimmia_ai_messages enable row level security;
alter table public.guimmia_ai_messages force row level security;

drop policy if exists guimmia_ai_projects_owner_all
  on public.guimmia_ai_projects;
create policy guimmia_ai_projects_owner_all
on public.guimmia_ai_projects
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists guimmia_ai_conversations_owner_all
  on public.guimmia_ai_conversations;
create policy guimmia_ai_conversations_owner_all
on public.guimmia_ai_conversations
for all
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and (
    project_id is null
    or exists (
      select 1
      from public.guimmia_ai_projects project
      where project.id = project_id
        and project.user_id = auth.uid()
    )
  )
);

drop policy if exists guimmia_ai_messages_owner_all
  on public.guimmia_ai_messages;
create policy guimmia_ai_messages_owner_all
on public.guimmia_ai_messages
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

revoke all on public.guimmia_ai_projects from anon;
revoke all on public.guimmia_ai_conversations from anon;
revoke all on public.guimmia_ai_messages from anon;

grant select, insert, update, delete
  on public.guimmia_ai_projects to authenticated;
grant select, insert, update, delete
  on public.guimmia_ai_conversations to authenticated;
grant select, insert, update, delete
  on public.guimmia_ai_messages to authenticated;

revoke all on function public.guimmia_v780_touch_updated_at() from public;
grant execute on function public.guimmia_v780_touch_updated_at() to authenticated;

comment on table public.guimmia_ai_projects is
  'V78.0 cartelle cloud private create dagli utenti Guimmia AI.';
comment on table public.guimmia_ai_conversations is
  'V78.0 conversazioni private Guimmia AI, separate dalle pratiche agenzia.';
comment on table public.guimmia_ai_messages is
  'V78.0 messaggi delle conversazioni Guimmia AI visibili soltanto al proprietario.';
