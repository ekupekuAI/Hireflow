-- HireFlow — Supabase schema
-- Paste this into the Supabase SQL Editor (Dashboard → SQL Editor → New query → Run).
-- One table stores each screening session as a JSON snapshot (simple, no over-engineering).

create table if not exists public.screenings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  candidate_count int not null default 0,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists screenings_created_at_idx on public.screenings (created_at desc);

-- Row Level Security. For the hackathon demo we allow the public (anon) key to
-- read/write. For real production, scope these policies to auth.uid() once you add auth.
alter table public.screenings enable row level security;

drop policy if exists "screenings_anon_select" on public.screenings;
create policy "screenings_anon_select" on public.screenings
  for select using (true);

drop policy if exists "screenings_anon_insert" on public.screenings;
create policy "screenings_anon_insert" on public.screenings
  for insert with check (true);

drop policy if exists "screenings_anon_delete" on public.screenings;
create policy "screenings_anon_delete" on public.screenings
  for delete using (true);
