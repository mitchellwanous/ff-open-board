-- Allow site-wide product feedback (grain=app) alongside team/player projection edits.
-- Run once in Supabase SQL editor after deploying the Site feedback button.

alter table public.open_source_edits
  drop constraint if exists open_source_edits_grain_check;

alter table public.open_source_edits
  add constraint open_source_edits_grain_check
  check (grain in ('team', 'player', 'app'));
