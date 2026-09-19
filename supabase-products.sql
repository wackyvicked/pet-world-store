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

-- Public storefront: read active products.
drop policy if exists "Public can view active products" on public.products;
create policy "Public can view active products"
on public.products for select to anon, authenticated
using (active = true);

-- IMPORTANT: Admin writes must be protected by Supabase Auth.
-- Do not add an anonymous insert/update/delete policy.
-- Create an admin user in Supabase Auth and add authenticated-only
-- policies after the admin login is wired.
