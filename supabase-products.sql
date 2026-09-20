-- Pet World product schema helper
-- Run this once in Supabase SQL Editor if any of these columns are missing.
-- The browser must NEVER use a Supabase secret/service-role key.
create extension if not exists pgcrypto;

alter table public.products add column if not exists name text;
alter table public.products add column if not exists sku text;
alter table public.products add column if not exists price numeric default 0;
alter table public.products add column if not exists category text;
alter table public.products add column if not exists stock integer default 0;
alter table public.products add column if not exists image_url text;
alter table public.products add column if not exists description text;
alter table public.products add column if not exists active boolean default true;
alter table public.products add column if not exists created_at timestamptz default now();
alter table public.products add column if not exists updated_at timestamptz default now();

create unique index if not exists products_sku_unique on public.products(sku);

alter table public.products enable row level security;

-- Make sure Supabase Data API roles have table privileges.
grant select on table public.products to anon, authenticated;
grant insert, update, delete on table public.products to authenticated;

-- Public storefront: read active products.
drop policy if exists "Public can view active products" on public.products;
create policy "Public can view active products"
on public.products for select to anon, authenticated
using (active = true);

-- Admin writes are allowed only for authenticated users whose Supabase Auth
-- user_metadata contains {"role":"admin"}. Do NOT create anon write policies.
drop policy if exists "Admins can insert products" on public.products;
drop policy if exists "Admins can update products" on public.products;
drop policy if exists "Admins can delete products" on public.products;

create policy "Admins can insert products"
on public.products for insert to authenticated
with check ((select auth.jwt()->'user_metadata'->>'role') = 'admin');

create policy "Admins can update products"
on public.products for update to authenticated
using ((select auth.jwt()->'user_metadata'->>'role') = 'admin')
with check ((select auth.jwt()->'user_metadata'->>'role') = 'admin');

create policy "Admins can delete products"
on public.products for delete to authenticated
using ((select auth.jwt()->'user_metadata'->>'role') = 'admin');

-- After creating your admin user in Supabase Auth, set its user metadata role to:
-- {"role":"admin"}
-- Then /admin.html can sign in and manage products.
