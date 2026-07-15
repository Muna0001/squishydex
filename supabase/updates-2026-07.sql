-- SquishyDex updates: friendship dedupe + unordered-pair uniqueness,
-- quantity owned, Amazon product cache. Paste into the Supabase SQL
-- editor and run once (safe to re-run).

-- ============================== 1. friendship dedupe + race-proofing
-- Backfill: merge duplicate pairs created by the mutual-request bug.
-- For each unordered pair keep one row (prefer accepted, then oldest).
delete from public.friendships f
using public.friendships g
where f.id <> g.id
  and least(f.requester_id, f.addressee_id) = least(g.requester_id, g.addressee_id)
  and greatest(f.requester_id, f.addressee_id) = greatest(g.requester_id, g.addressee_id)
  and (
    (g.status = 'accepted' and f.status <> 'accepted')
    or (g.status = f.status and g.created_at < f.created_at)
    or (g.status = f.status and g.created_at = f.created_at and g.id < f.id)
  );

-- Enforce one row per unordered pair: A→B and B→A collide from now on.
create unique index if not exists friendships_unordered_pair_key
  on public.friendships (
    least(requester_id, addressee_id),
    greatest(requester_id, addressee_id)
  );

-- ================================================= 2. quantity owned
alter table public.user_collection_entries
  add column if not exists quantity integer not null default 1;

do $$ begin
  alter table public.user_collection_entries
    add constraint user_collection_entries_quantity_positive check (quantity >= 1);
exception when duplicate_object then null; end $$;

-- ========================================== 3. Amazon product cache
-- Filled by scripts/refresh-amazon.mjs (service role); read by the app.
create table if not exists public.amazon_product_cache (
  asin text primary key,
  tracked_url text not null,
  price numeric,
  currency text,
  image_url text,
  refreshed_at timestamptz not null default now()
);

alter table public.amazon_product_cache enable row level security;

drop policy if exists "amazon cache: anyone reads" on public.amazon_product_cache;
create policy "amazon cache: anyone reads"
  on public.amazon_product_cache for select
  using (true);
-- No insert/update policies on purpose: only the refresh script's
-- service-role key (which bypasses RLS) writes here.
