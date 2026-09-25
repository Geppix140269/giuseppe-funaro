-- Giuseppe OS - Slice 1 memory foundation.
-- Run this against the dedicated "Giuseppe OS" Supabase project only.
-- It must stay completely separate from the ClassMA and Ponte Trade projects.

create extension if not exists pgcrypto;

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists people (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete set null,
  name text not null,
  email text,
  role text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  status text not null default 'inbox',
  due_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists work (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  item_id uuid references items(id) on delete set null,
  title text not null,
  stage text not null default 'today' check (stage in ('today', 'waiting', 'done')),
  assigned_to text,
  authority_level text not null default 'read' check (authority_level in ('read', 'prepare', 'propose')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists activity (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete set null,
  actor text not null,
  action text not null,
  target_type text,
  target_id uuid,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table workspaces enable row level security;
alter table people enable row level security;
alter table items enable row level security;
alter table work enable row level security;
alter table activity enable row level security;

-- No policies are defined on purpose: every access path in Slice 1 goes
-- through Netlify Functions using the service role key, which bypasses RLS.
-- The anon and authenticated Supabase roles have no path to this data at all.

insert into workspaces (key, name) values
  ('job-consulting', 'Job / Consulting'),
  ('classma', 'ClassMA'),
  ('ponte-trade', 'Ponte Trade'),
  ('padel-sitges', 'Padel Sitges'),
  ('personal-admin', 'Personal / Admin')
on conflict (key) do nothing;
