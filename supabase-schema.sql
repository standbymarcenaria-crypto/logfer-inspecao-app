create table if not exists drivers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cnh text not null,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists vehicles (
  id uuid primary key default gen_random_uuid(),
  plate text not null unique,
  vehicle_type text,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists inspections (
  id uuid primary key default gen_random_uuid(),
  protocol text not null,
  created_at timestamptz default now(),
  status text not null,
  driver_name text not null,
  driver_cnh text,
  inspection_date date,
  inspection_time text,
  odometer numeric,
  plate text not null,
  vehicle_type text,
  route text,
  needs_repair text,
  driver_report text,
  manager_status text default 'Aguardando análise',
  manager_action text,
  release_date date,
  signature text
);

create table if not exists inspection_items (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid references inspections(id) on delete cascade,
  item_id integer,
  group_name text,
  title text,
  critical boolean,
  severity text,
  answer text,
  observation text,
  extra_date date,
  photo text
);
