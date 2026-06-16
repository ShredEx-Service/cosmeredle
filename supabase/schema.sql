-- Run this in Supabase Dashboard -> SQL Editor

create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  username text,
  is_admin boolean default false,
  created_at timestamptz default now()
);

create table if not exists stats (
  user_id uuid references profiles(id) on delete cascade primary key,
  daily_streak int default 0,
  daily_best_streak int default 0,
  daily_last_win_day int,
  daily_last_play_day int,
  daily_played int default 0,
  daily_won int default 0,
  practice_played int default 0,
  practice_guess_total int default 0,
  updated_at timestamptz default now()
);

alter table profiles enable row level security;
alter table stats enable row level security;

create policy "Profiles are viewable by everyone" on profiles
  for select using (true);

create policy "Users can update their own profile" on profiles
  for update using (auth.uid() = id);

create policy "Stats are viewable by everyone" on stats
  for select using (true);

create policy "Users can upsert their own stats" on stats
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-create profile + stats row whenever a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email));
  insert into public.stats (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
