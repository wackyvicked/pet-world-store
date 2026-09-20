-- Pet World customer order tracking
-- Run this once in Supabase SQL Editor.
drop function if exists public.track_order(text, text);
create or replace function public.track_order(p_order_number text, p_phone text)
returns table(
  order_number text,
  customer_name text,
  city text,
  address text,
  phone text,
  total numeric,
  status text,
  created_at timestamptz,
  items jsonb
)
language sql
security definer
set search_path = ''
as $$
  select
    o.order_number::text,
    o.customer_name::text,
    o.city::text,
    o.address::text,
    o.phone::text,
    o.total::numeric,
    coalesce(o.status,'New')::text,
    o.created_at::timestamptz,
    o.items::jsonb
  from public.orders o
  where (p_order_number is not null and lower(trim(o.order_number::text)) = lower(trim(p_order_number)))
     or (p_order_number is null and p_phone is not null
         and right(regexp_replace(coalesce(o.phone::text,''),'[^0-9]','','g'),10)
             = right(regexp_replace(coalesce(p_phone,''),'[^0-9]','','g'),10))
  order by o.created_at desc;
$$;

revoke execute on function public.track_order(text,text) from public;
grant execute on function public.track_order(text,text) to anon, authenticated;
