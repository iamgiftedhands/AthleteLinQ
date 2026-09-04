-- ============================================================
-- AthleteLinQ — Phase 1 database schema
-- Run this ONCE in: Supabase Dashboard -> SQL Editor -> New query
-- ============================================================

-- 1. TABLES ---------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('athlete', 'coach', 'academy', 'scout')),
  full_name text not null,
  state text,
  photo_url text,
  phone text,
  email text,
  created_at timestamptz not null default now()
);

create table public.athletes (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  date_of_birth date,
  position text,
  bio text,
  trust_level int not null default 1 check (trust_level between 1 and 4)
);

create table public.academies (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  club_name text,
  home_location text
);

create table public.videos (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.profiles (id) on delete cascade,
  playback_id text not null,
  title text not null,
  status text not null default 'processing' check (status in ('processing', 'ready', 'removed')),
  created_at timestamptz not null default now()
);

create table public.verifications (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.profiles (id) on delete cascade,
  coach_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (athlete_id, coach_id)
);

create table public.roster_members (
  academy_id uuid not null references public.profiles (id) on delete cascade,
  athlete_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (academy_id, athlete_id)
);

create table public.needs (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  amount_kobo int not null check (amount_kobo > 0),
  raised_kobo int not null default 0,
  status text not null default 'open' check (status in ('open', 'funded', 'closed')),
  created_at timestamptz not null default now()
);

create table public.contributions (
  id uuid primary key default gen_random_uuid(),
  need_id uuid not null references public.needs (id) on delete cascade,
  supporter_name text,
  amount_kobo int not null check (amount_kobo > 0),
  paystack_ref text not null unique,
  status text not null default 'pending' check (status in ('pending', 'success', 'failed')),
  created_at timestamptz not null default now()
);

-- 2. AUTO-CREATE PROFILE ON SIGN-UP ---------------------------
-- When someone signs up, this creates their profile row (and
-- athlete/academy row if relevant) using the role and name
-- collected on the sign-up form.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_role text := coalesce(new.raw_user_meta_data ->> 'role', 'athlete');
  v_name text := coalesce(new.raw_user_meta_data ->> 'full_name', 'New user');
begin
  insert into public.profiles (id, role, full_name, email)
  values (new.id, v_role, v_name, new.email);

  if v_role = 'athlete' then
    insert into public.athletes (profile_id) values (new.id);
  elsif v_role = 'academy' then
    insert into public.academies (profile_id) values (new.id);
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. ROW-LEVEL SECURITY ---------------------------------------
-- The rules below are enforced by the database itself.

alter table public.profiles enable row level security;
alter table public.athletes enable row level security;
alter table public.academies enable row level security;
alter table public.videos enable row level security;
alter table public.verifications enable row level security;
alter table public.roster_members enable row level security;
alter table public.needs enable row level security;
alter table public.contributions enable row level security;

-- Profiles: anyone can view (discovery is public); only you can edit yours.
create policy "profiles are viewable by everyone"
  on public.profiles for select using (true);
create policy "users update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Athletes: public to view; only the athlete edits their own details.
create policy "athletes viewable by everyone"
  on public.athletes for select using (true);
create policy "athlete edits own record"
  on public.athletes for update using (auth.uid() = profile_id);
create policy "athlete inserts own record"
  on public.athletes for insert with check (auth.uid() = profile_id);

-- Academies: public to view; only the academy edits its own details.
create policy "academies viewable by everyone"
  on public.academies for select using (true);
create policy "academy edits own record"
  on public.academies for update using (auth.uid() = profile_id);
create policy "academy inserts own record"
  on public.academies for insert with check (auth.uid() = profile_id);

-- Videos: public to view; athletes manage their own.
create policy "videos viewable by everyone"
  on public.videos for select using (true);
create policy "athlete adds own videos"
  on public.videos for insert with check (auth.uid() = athlete_id);
create policy "athlete updates own videos"
  on public.videos for update using (auth.uid() = athlete_id);

-- Verifications: public to view (the badge must be provable);
-- only coach accounts can create them, and never for themselves.
create policy "verifications viewable by everyone"
  on public.verifications for select using (true);
create policy "only coaches verify athletes"
  on public.verifications for insert with check (
    auth.uid() = coach_id
    and coach_id <> athlete_id
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'coach')
  );

-- Rosters: public to view; only the academy manages its own roster.
create policy "rosters viewable by everyone"
  on public.roster_members for select using (true);
create policy "academy manages own roster"
  on public.roster_members for insert with check (
    auth.uid() = academy_id
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'academy')
  );
create policy "academy removes from own roster"
  on public.roster_members for delete using (auth.uid() = academy_id);

-- Needs: public to view; athletes manage their own.
create policy "needs viewable by everyone"
  on public.needs for select using (true);
create policy "athlete creates own needs"
  on public.needs for insert with check (auth.uid() = athlete_id);
create policy "athlete updates own needs"
  on public.needs for update using (auth.uid() = athlete_id);

-- Contributions: public to view. No insert policy on purpose —
-- payments will be written by the server (Paystack webhook) in
-- Milestone 4, never directly from the browser.
create policy "contributions viewable by everyone"
  on public.contributions for select using (true);
