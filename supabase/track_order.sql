-- Pet World customer order tracking
-- Run this once in Supabase SQL Editor.
create or replace function public.track_order(p_order_number text, p_phone text)
returns table(
  order_number text,
  customer_name text,
  city text,
  phone text,
  total numeric,
  status text,
  created_at timestamptz,
  items jsonb
)
language sql
security definer
set search_path = public
as $$
  select
    o.order_number::text,
    o.customer_name::text,
    o.city::text,
    o.phone::text,
    o.total::numeric,
    coalesce(o.status,'New')::text,
    o.created_at::timestamptz,
    o.items::jsonb
  from public.orders o
  where trim(o.order_number::text) = trim(p_order_number)
    and right(regexp_replace(coalesce(o.phone::text,''),'[^0-9]','','g'),10)
        = right(regexp_replace(coalesce(p_phone,''),'[^0-9]','','g'),10)
  limit 1;
$$;

revoke execute on function public.track_order(text,text) from public;
grant execute on function public.track_order(text,text) to anon, authenticated;
