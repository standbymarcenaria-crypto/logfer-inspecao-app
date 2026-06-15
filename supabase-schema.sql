-- Logfer | Banco de dados do sistema de inspeção de caminhões
-- Execute no Supabase em: SQL Editor > New query > Run.

create table if not exists public.inspections (
  id uuid primary key default gen_random_uuid(),
  protocol text unique not null,
  created_at timestamptz default now(),
  status text not null,
  driver_name text not null,
  driver_cnh text,
  inspection_date date,
  inspection_time time,
  odometer numeric,
  plate text not null,
  vehicle_type text,
  needs_repair text,
  driver_report text,
  signature text
);

create table if not exists public.inspection_items (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid references public.inspections(id) on delete cascade,
  item_id int not null,
  title text not null,
  critical boolean default false,
  answer text,
  observation text,
  extra_date date,
  photo text
);

-- Atenção: para teste inicial, esta política libera inserts e leitura pública.
-- Em produção, trocaremos por autenticação por motorista/gestor.
alter table public.inspections enable row level security;
alter table public.inspection_items enable row level security;

drop policy if exists "public_insert_inspections" on public.inspections;
drop policy if exists "public_select_inspections" on public.inspections;
drop policy if exists "public_insert_items" on public.inspection_items;
drop policy if exists "public_select_items" on public.inspection_items;

create policy "public_insert_inspections" on public.inspections for insert with check (true);
create policy "public_select_inspections" on public.inspections for select using (true);
create policy "public_insert_items" on public.inspection_items for insert with check (true);
create policy "public_select_items" on public.inspection_items for select using (true);
