-- Run this entire script in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (char_length(username) between 3 and 20),
  created_at timestamptz not null default now()
);

create table if not exists public.words (
  id bigint generated always as identity primary key,
  category text not null check (category in ('Name','Object','City','Animal','Profession','Food','Character')),
  word text not null,
  normalized_word text not null,
  rarity_score integer not null check (rarity_score between 1 and 100),
  verified boolean not null default false,
  source text,
  reviewed_at timestamptz,
  unique(category, normalized_word)
);

create table if not exists public.daily_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge_date date not null,
  letter char(1) not null,
  total_score integer not null default 0,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(user_id, challenge_date)
);

alter table public.profiles enable row level security;
alter table public.words enable row level security;
alter table public.daily_submissions enable row level security;

create policy "Profiles are public to read" on public.profiles for select using (true);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Verified words are public" on public.words for select using (verified = true);
create policy "Leaderboard submissions are public" on public.daily_submissions for select using (true);
create policy "Users can submit their own score" on public.daily_submissions for insert with check (auth.uid() = user_id);

create index if not exists words_lookup_idx on public.words(category, normalized_word) where verified = true;
create index if not exists submissions_daily_idx on public.daily_submissions(challenge_date, total_score desc);

-- Ranking view: highest daily score first; ties are shared.
create or replace view public.daily_rankings as
select s.challenge_date, p.username, s.total_score,
       rank() over(partition by s.challenge_date order by s.total_score desc, s.created_at asc) as position
from public.daily_submissions s join public.profiles p on p.id=s.user_id;

-- Do not expose the service-role key in the browser. Keep word imports/review admin-only.
