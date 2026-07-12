-- SquishyDex Supabase schema. Paste into the Supabase SQL editor and run.
-- Safe to re-run: everything is IF NOT EXISTS / CREATE OR REPLACE.
--
-- Covers Phase A (accounts + collections) and forward-declares Phase B
-- (friendships) and Phase D (user submissions) so later phases are app
-- code only, no schema round-trip.

-- ============================================================ profiles
-- One row per auth user, created automatically on signup.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  avatar_url text, -- "emoji:🧸" for emoji avatars, or a real URL later
  auth_provider text not null default 'email' check (auth_provider in ('email', 'google')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles are readable by signed-in users" on public.profiles;
create policy "profiles are readable by signed-in users"
  on public.profiles for select to authenticated using (true);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- Create a profile row on signup, pulling display_name from metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, auth_provider)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_app_meta_data ->> 'provider', 'email')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================== user_collection_entries
create table if not exists public.user_collection_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  squishy_id text not null,
  status text not null check (status in ('owned', 'wishlist')),
  condition text check (condition in ('new-with-packaging', 'out-of-packaging', 'loved')),
  price_paid numeric,
  date_acquired date,
  tags text[] not null default '{}',
  notes text,
  added_at timestamptz not null default now(),
  unique (user_id, squishy_id)
);

alter table public.user_collection_entries enable row level security;

-- Owners have full control. (A friends-can-read policy lands with Phase B —
-- see the commented policy at the bottom.)
drop policy if exists "own entries: select" on public.user_collection_entries;
create policy "own entries: select"
  on public.user_collection_entries for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "own entries: insert" on public.user_collection_entries;
create policy "own entries: insert"
  on public.user_collection_entries for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "own entries: update" on public.user_collection_entries;
create policy "own entries: update"
  on public.user_collection_entries for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own entries: delete" on public.user_collection_entries;
create policy "own entries: delete"
  on public.user_collection_entries for delete to authenticated
  using (auth.uid() = user_id);

-- ==================================================== friendships (Phase B)
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  unique (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

alter table public.friendships enable row level security;

drop policy if exists "friendships: involved parties read" on public.friendships;
create policy "friendships: involved parties read"
  on public.friendships for select to authenticated
  using (auth.uid() in (requester_id, addressee_id));

drop policy if exists "friendships: requester creates pending" on public.friendships;
create policy "friendships: requester creates pending"
  on public.friendships for insert to authenticated
  with check (auth.uid() = requester_id and status = 'pending');

drop policy if exists "friendships: addressee accepts" on public.friendships;
create policy "friendships: addressee accepts"
  on public.friendships for update to authenticated
  using (auth.uid() = addressee_id) with check (status = 'accepted');

drop policy if exists "friendships: either party removes" on public.friendships;
create policy "friendships: either party removes"
  on public.friendships for delete to authenticated
  using (auth.uid() in (requester_id, addressee_id));

-- Friends may read each other's collections (used by Phase B read-only view).
drop policy if exists "friend entries: select" on public.user_collection_entries;
create policy "friend entries: select"
  on public.user_collection_entries for select to authenticated
  using (
    exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and ((f.requester_id = auth.uid() and f.addressee_id = user_id)
          or (f.addressee_id = auth.uid() and f.requester_id = user_id))
    )
  );

-- ========================================= user submissions (Phase D)
create table if not exists public.user_submitted_squishies (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid not null references public.profiles (id) on delete cascade,
  submitted_at timestamptz not null default now(),
  name text not null,
  brand_id text not null,
  new_brand_name text, -- set when the brand wasn't in the catalog
  type text not null,
  size text not null,
  scent text,
  barcode text,
  photo_url text not null,
  status text not null default 'published' check (status in ('published', 'flagged'))
);

alter table public.user_submitted_squishies enable row level security;

drop policy if exists "submissions: all signed-in read published" on public.user_submitted_squishies;
create policy "submissions: all signed-in read published"
  on public.user_submitted_squishies for select to authenticated using (true);

drop policy if exists "submissions: users insert own" on public.user_submitted_squishies;
create policy "submissions: users insert own"
  on public.user_submitted_squishies for insert to authenticated
  with check (auth.uid() = submitted_by);

-- Anyone signed in can flag; only the submitter can edit other fields
-- (enforced app-side for now — refine when moderation earns a queue).
drop policy if exists "submissions: signed-in can update status" on public.user_submitted_squishies;
create policy "submissions: signed-in can update status"
  on public.user_submitted_squishies for update to authenticated using (true);
