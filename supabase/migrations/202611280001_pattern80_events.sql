-- First-round original 80 sentence patterns (separate from Book 2100).
-- Per-account immutable review log for offline-first SRS across devices.
create table if not exists public.language_studio_pattern80_events (
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null,
  pattern_id smallint not null check (pattern_id between 1 and 80),
  skill text not null check (skill = 'sentence'),
  event_kind text not null check (event_kind in ('baseline','correct','wrong','weak')),
  assisted boolean not null default false,
  occurred_at timestamptz not null,
  baseline jsonb,
  created_at timestamptz not null default now(),
  primary key(user_id,event_id)
);
create index if not exists pattern80_events_owner_time
 on public.language_studio_pattern80_events (user_id,occurred_at,event_id);
alter table public.language_studio_pattern80_events enable row level security;
create policy "80 patterns owner can read reviews"
  on public.language_studio_pattern80_events for select to authenticated
  using ((select auth.uid())=user_id);
create policy "80 patterns owner can append reviews"
  on public.language_studio_pattern80_events for insert to authenticated
  with check ((select auth.uid())=user_id);
revoke all on public.language_studio_pattern80_events from public,anon,authenticated;
grant select,insert on public.language_studio_pattern80_events to authenticated;
