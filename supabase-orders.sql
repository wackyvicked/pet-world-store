-- Pet World order management
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null,
  phone text not null,
  alternate_phone text,
  city text not null,
  address text not null,
  notes text,
  items jsonb not null default '[]'::jsonb,
  total numeric not null default 0,
  status text not null default 'New',
  created_at timestamptz not null default now()
);

grant insert on table public.orders to anon, authenticated;
grant select, update on table public.orders to authenticated;
alter table public.orders enable row level security;

drop policy if exists "Customers can create orders" on public.orders;
create policy "Customers can create orders"
on public.orders for insert
to anon, authenticated
with check (true);

drop policy if exists "Admins can view orders" on public.orders;
create policy "Admins can view orders"
on public.orders for select
to authenticated
using ((select auth.jwt()->'user_metadata'->>'role') = 'admin');

drop policy if exists "Admins can update orders" on public.orders;
create policy "Admins can update orders"
on public.orders for update
to authenticated
using ((select auth.jwt()->'user_metadata'->>'role') = 'admin')
with check ((select auth.jwt()->'user_metadata'->>'role') = 'admin');
