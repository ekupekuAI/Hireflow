-- HireFlow — Supabase schema
-- Paste this into the Supabase SQL Editor (Dashboard → SQL Editor → New query → Run).
-- One table stores each screening session as a JSON snapshot.
--
-- Screenings contain candidate personal data, so every row belongs to the user who
-- created it and Row Level Security only lets that user read / change / delete it.
-- The app signs each browser in with Supabase anonymous auth, so also turn on:
--   Authentication → Sign In / Providers → "Allow anonymous sign-ins".
-- Safe to re-run; it also upgrades the old world-readable version of this table.

create table if not exists public.screenings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  candidate_count int not null default 0,
  data jsonb not null,
  created_at timestamptz not null default now()
);

-- Upgrade path for tables created by the previous (public) schema.
alter table public.screenings
  add column if not exists owner_id uuid default auth.uid() references auth.users (id) on delete cascade;
-- Ownerless legacy rows were readable by anyone holding the anon key; remove them.
delete from public.screenings where owner_id is null;
alter table public.screenings alter column owner_id set not null;

create index if not exists screenings_created_at_idx on public.screenings (created_at desc);
create index if not exists screenings_owner_idx on public.screenings (owner_id);

alter table public.screenings enable row level security;

-- Drop the old "anyone with the anon key can read/insert/delete everything" policies.
drop policy if exists "screenings_anon_select" on public.screenings;
drop policy if exists "screenings_anon_insert" on public.screenings;
drop policy if exists "screenings_anon_delete" on public.screenings;

drop policy if exists "screenings_owner_select" on public.screenings;
create policy "screenings_owner_select" on public.screenings
  for select to authenticated using (owner_id = auth.uid());

drop policy if exists "screenings_owner_insert" on public.screenings;
create policy "screenings_owner_insert" on public.screenings
  for insert to authenticated with check (owner_id = auth.uid());

drop policy if exists "screenings_owner_update" on public.screenings;
create policy "screenings_owner_update" on public.screenings
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "screenings_owner_delete" on public.screenings;
create policy "screenings_owner_delete" on public.screenings
  for delete to authenticated using (owner_id = auth.uid());
