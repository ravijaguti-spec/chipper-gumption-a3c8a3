-- ELITORR shared cloud database
-- Run this once in Supabase SQL Editor.

create table if not exists public.orders (
  id text primary key,
  customer text not null,
  "vendorName" text not null default '',
  "designNo" text,
  "jobNo" text,
  "itemType" text,
  weight text,
  size text,
  "metalKT" text,
  "rhodiumColor" text,
  "diamondDetails" text,
  "colorStoneDetails" text,
  quantity integer not null default 1,
  "orderDate" text,
  "deliveryDate" text,
  status text not null default 'Order place to factory',
  priority text not null default 'Normal',
  image text,
  history jsonb not null default '[]'::jsonb,
  notes jsonb not null default '[]'::jsonb,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders ("createdAt" desc);
create index if not exists orders_status_idx on public.orders (status);

-- This deployment uses the server API with the publishable key.
-- The policy below permits the API to read/write orders. If you later add
-- Supabase Auth + per-user permissions, replace these policies with RLS
-- policies based on auth.uid().
alter table public.orders enable row level security;

drop policy if exists "ELITORR public read" on public.orders;
drop policy if exists "ELITORR public insert" on public.orders;
drop policy if exists "ELITORR public update" on public.orders;
drop policy if exists "ELITORR public delete" on public.orders;

create policy "ELITORR public read" on public.orders for select to anon, authenticated using (true);
create policy "ELITORR public insert" on public.orders for insert to anon, authenticated with check (true);
create policy "ELITORR public update" on public.orders for update to anon, authenticated using (true) with check (true);
create policy "ELITORR public delete" on public.orders for delete to anon, authenticated using (true);
