-- Book 2100: append-only SRS reviews keyed to the existing Language Studio account.
-- Applied to Supabase project aypyeqwbespobiwoaefe via migration.
create table if not exists public.language_studio_book2100_events (
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null,
  word_id smallint not null check (word_id between 1 and 400),
  skill text not null check (skill in ('word','sentence')),
  event_kind text not null check (event_kind in ('baseline','correct','wrong','weak')),
  assisted boolean not null default false,
  occurred_at timestamptz not null,
  baseline jsonb,
  created_at timestamptz not null default now(),
  primary key (user_id,event_id),
  constraint book2100_valid_baseline check (
    (event_kind='baseline' and jsonb_typeof(baseline)='object')
    or (event_kind<>'baseline' and baseline is null)
  )
);
comment on table public.language_studio_book2100_events is
  'Append-only per-account reviews for Book 2100; unique event IDs prevent offline/device replay duplicates.';
create index if not exists book2100_events_owner_time_idx
  on public.language_studio_book2100_events(user_id, occurred_at, event_id);
alter table public.language_studio_book2100_events enable row level security;
revoke all on table public.language_studio_book2100_events from public, anon, authenticated;
grant select, insert on table public.language_studio_book2100_events to authenticated;
create policy "book2100_read_own_events" on public.language_studio_book2100_events
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "book2100_append_own_events" on public.language_studio_book2100_events
  for insert to authenticated with check ((select auth.uid()) = user_id);
