-- Open Board: open-source edits inbox
-- Run in Supabase SQL editor (or via supabase db push).

create extension if not exists "pgcrypto";

create table if not exists public.open_source_edits (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  grain text not null check (grain in ('team', 'player')),
  subject_id text not null,
  subject_label text not null,
  field text not null,
  field_label text not null,
  official_value double precision null,
  value double precision null,
  confidence text not null default 'med' check (confidence in ('low', 'med', 'high')),
  rationale text not null,
  doctrine_ok boolean not null default true,
  author text not null default 'anonymous',
  status text not null default 'pending'
    check (status in ('pending', 'reviewed', 'rejected')),
  reviewed_at timestamptz null,
  decision_note text null
);

create index if not exists open_source_edits_subject_idx
  on public.open_source_edits (grain, subject_id);

create index if not exists open_source_edits_status_idx
  on public.open_source_edits (status);

create index if not exists open_source_edits_created_idx
  on public.open_source_edits (created_at desc);

-- Server uses service role; no public anon writes required.
alter table public.open_source_edits enable row level security;

-- Needed when "Automatically expose new tables" is OFF in Data API settings.
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on table public.open_source_edits to postgres, service_role;
-- No grants to anon/authenticated — edits go through Next.js with the secret/service key only.

-- Optional: allow anon read of pending medians only if you ever call from the browser.
-- Prefer server-side API with service role (recommended).
-- create policy "anon_read_pending" on public.open_source_edits
--   for select to anon using (status = 'pending');
