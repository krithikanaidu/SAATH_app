-- ============================================================================
-- SAATH — initial schema
-- Run this once in the Supabase SQL editor (or `supabase db push`).
--
-- Design notes
--  * Every table is owner-scoped and protected by Row Level Security. The
--    publishable (anon) key shipped to the browser can only read/write rows the
--    signed-in user is allowed to, so no secret is needed client-side.
--  * `buddy_groups` rows are real rows created by users — the app no longer
--    ships hardcoded group names.
--  * Columns mirror src/lib/types.ts so the client maps 1:1.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- profiles
-- One row per auth user, created on first sign-in via the trigger below.
create table if not exists public.profiles (
  id                    uuid primary key references auth.users (id) on delete cascade,
  phone                 text,
  name                  text not null default 'Commuter',
  language              text not null default 'en' check (language in ('en', 'hi', 'mr')),
  usual_line            text not null default 'Western line',
  from_station          text not null default 'Borivali',
  to_station            text not null default 'Churchgate',
  -- stored as "HH:MM" 24h; the UI formats it for display
  departure_time        text not null default '08:30',
  travel_as             text check (travel_as in ('woman', 'senior', 'differently-abled', 'daily')),
  large_text            boolean not null default false,
  share_location_on_sos boolean not null default true,
  location_allowed      boolean not null default false,
  onboarded             boolean not null default false,
  points                integer not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Auto-create a profile whenever a new auth user appears.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, phone, name)
  values (
    new.id,
    new.phone,
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), 'Commuter')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------- buddy_groups
create table if not exists public.buddy_groups (
  id                uuid primary key default gen_random_uuid(),
  name              text not null check (char_length(trim(name)) >= 3),
  line              text not null check (line in ('Western', 'Central', 'Harbour')),
  from_station      text not null,
  to_station        text not null,
  -- meeting window as "HH:MM"–"HH:MM"
  window            text not null default '08:15–08:45',
  organiser_id      uuid not null references public.profiles (id) on delete cascade,
  verified_organiser boolean not null default false,
  created_at        timestamptz not null default now()
);

-- Live member count derived from group_members (kept denormalised for reads).
create or replace function public.group_member_count(g_id uuid)
returns integer
language sql stable security definer set search_path = public
as $$
  select count(*)::integer from public.group_members where group_id = g_id;
$$;

-- ------------------------------------------------------------ group_members
create table if not exists public.group_members (
  group_id  uuid not null references public.buddy_groups (id) on delete cascade,
  user_id   uuid not null references public.profiles (id) on delete cascade,
  role      text not null default 'member' check (role in ('organiser', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- ----------------------------------------------------------- crowd_reports
create table if not exists public.crowd_reports (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  train_id    text not null,
  compartment text not null check (compartment in ('ladies', 'general', 'first')),
  level       text not null check (level in ('low', 'medium', 'high')),
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------------- trips
create table if not exists public.trips (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  from_station text not null,
  to_station  text not null,
  departure   text not null,
  arrival     text,
  points      integer not null default 0,
  group_id    uuid references public.buddy_groups (id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.profiles      enable row level security;
alter table public.buddy_groups  enable row level security;
alter table public.group_members enable row level security;
alter table public.crowd_reports enable row level security;
alter table public.trips         enable row level security;

-- profiles: a user sees and edits only their own row.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- buddy_groups: any signed-in user can browse groups; only the organiser can
-- change or delete one.
drop policy if exists "groups_select_all" on public.buddy_groups;
create policy "groups_select_all" on public.buddy_groups
  for select using (auth.role() = 'authenticated');

drop policy if exists "groups_insert_own" on public.buddy_groups;
create policy "groups_insert_own" on public.buddy_groups
  for insert with check (auth.uid() = organiser_id);

drop policy if exists "groups_update_own" on public.buddy_groups;
create policy "groups_update_own" on public.buddy_groups
  for update using (auth.uid() = organiser_id) with check (auth.uid() = organiser_id);

drop policy if exists "groups_delete_own" on public.buddy_groups;
create policy "groups_delete_own" on public.buddy_groups
  for delete using (auth.uid() = organiser_id);

-- group_members: readable by signed-in users; you manage only your own rows.
drop policy if exists "members_select_all" on public.group_members;
create policy "members_select_all" on public.group_members
  for select using (auth.role() = 'authenticated');

drop policy if exists "members_insert_self" on public.group_members;
create policy "members_insert_self" on public.group_members
  for insert with check (auth.uid() = user_id);

drop policy if exists "members_delete_self" on public.group_members;
create policy "members_delete_self" on public.group_members
  for delete using (auth.uid() = user_id);

-- crowd_reports: any signed-in user may report; you edit only your own.
drop policy if exists "reports_select_all" on public.crowd_reports;
create policy "reports_select_all" on public.crowd_reports
  for select using (auth.role() = 'authenticated');

drop policy if exists "reports_insert_own" on public.crowd_reports;
create policy "reports_insert_own" on public.crowd_reports
  for insert with check (auth.uid() = user_id);

drop policy if exists "reports_delete_own" on public.crowd_reports;
create policy "reports_delete_own" on public.crowd_reports
  for delete using (auth.uid() = user_id);

-- trips: private to the traveller.
drop policy if exists "trips_select_own" on public.trips;
create policy "trips_select_own" on public.trips
  for select using (auth.uid() = user_id);

drop policy if exists "trips_insert_own" on public.trips;
create policy "trips_insert_own" on public.trips
  for insert with check (auth.uid() = user_id);

-- ============================================================================
-- Optional starter data — a couple of example groups so the list is not empty
-- on a fresh project. Comment out if you prefer a blank slate.
-- The organiser_id must be a real auth user; these inserts are skipped safely
-- when no matching user exists, so they are left commented by default.
-- ============================================================================
-- insert into public.buddy_groups (name, line, from_station, to_station, organiser_id)
-- values ('Western morning buddies', 'Western', 'Borivali', 'Churchgate', '<uuid>');
