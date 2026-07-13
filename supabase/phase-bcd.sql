-- SquishyDex Phase B/C/D addendum. Paste into the Supabase SQL editor
-- and run once (safe to re-run).
--
-- 1. profiles.email — friend search by email needs it queryable.
-- 2. submission-photos storage bucket for crowdsourced product photos.
-- 3. Published submissions readable by signed-out browsers too.

-- ------------------------------------------------ 1. email on profiles
alter table public.profiles add column if not exists email text;

-- Backfill existing users from auth.users.
update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is null;

-- Keep it populated for future signups.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, auth_provider, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_app_meta_data ->> 'provider', 'email'),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- --------------------------------------- 2. storage for submission photos
insert into storage.buckets (id, name, public)
values ('submission-photos', 'submission-photos', true)
on conflict (id) do nothing;

drop policy if exists "submission photos: public read" on storage.objects;
create policy "submission photos: public read"
  on storage.objects for select
  using (bucket_id = 'submission-photos');

drop policy if exists "submission photos: signed-in upload" on storage.objects;
create policy "submission photos: signed-in upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'submission-photos');

-- ------------------------------- 3. submissions readable when signed out
drop policy if exists "submissions: anon read published" on public.user_submitted_squishies;
create policy "submissions: anon read published"
  on public.user_submitted_squishies for select to anon
  using (status = 'published');
