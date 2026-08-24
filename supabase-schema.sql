create extension if not exists pgcrypto;

create table if not exists public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  is_admin boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.rentals (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  model text not null,
  year integer not null check (year between 1990 and 2100),
  price_per_day numeric(10,2) not null default 0 check (price_per_day >= 0),
  category text not null default 'sedan',
  transmission text not null default 'automatica',
  seats integer not null default 5 check (seats between 2 and 20),
  fuel_type text not null default 'gasolina',
  features jsonb not null default '[]'::jsonb,
  images jsonb not null default '[]'::jsonb,
  available boolean not null default true,
  featured boolean not null default false,
  description text not null default '',
  status text not null default 'Disponible',
  created_at timestamptz not null default now()
);

create table if not exists public.imports (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  brand text not null,
  model text not null,
  year integer not null check (year between 1990 and 2100),
  condition text not null default '',
  status text not null default '',
  transit_time_days integer not null default 0 check (transit_time_days >= 0),
  shipping_method text not null default '',
  origin text not null default '',
  destination text not null default '',
  price numeric(10,2) not null default 0 check (price >= 0),
  client_name text not null default '',
  summary text not null default '',
  images jsonb not null default '[]'::jsonb,
  featured boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.rental_requests (
  id uuid primary key default gen_random_uuid(),
  rental_id uuid not null references public.rentals(id) on delete restrict,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  start_date date not null,
  end_date date not null,
  notes text not null default '',
  status text not null default 'pendiente',
  total_estimate numeric(10,2) not null default 0,
  rental_snapshot jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rental_requests_valid_dates check (end_date >= start_date),
  constraint rental_requests_status_check check (status in ('pendiente', 'confirmada', 'cancelada', 'completada'))
);

create index if not exists rental_requests_created_at_idx
on public.rental_requests (created_at desc);

create index if not exists rental_requests_status_idx
on public.rental_requests (status);

create index if not exists rental_requests_rental_id_idx
on public.rental_requests (rental_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists rental_requests_set_updated_at on public.rental_requests;
create trigger rental_requests_set_updated_at
before update on public.rental_requests
for each row
execute function public.set_updated_at();

alter table public.admin_profiles enable row level security;
alter table public.rentals enable row level security;
alter table public.imports enable row level security;
alter table public.rental_requests enable row level security;

drop policy if exists "Public can read rentals" on public.rentals;
create policy "Public can read rentals"
on public.rentals for select
to anon
using (true);

drop policy if exists "Admins can manage rentals" on public.rentals;
create policy "Admins can manage rentals"
on public.rentals
for all
to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Public can read imports" on public.imports;
create policy "Public can read imports"
on public.imports for select
to anon
using (true);

drop policy if exists "Admins can manage imports" on public.imports;
create policy "Admins can manage imports"
on public.imports
for all
to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can read own profile" on public.admin_profiles;
create policy "Admins can read own profile"
on public.admin_profiles for select
to authenticated
using (id = (select auth.uid()));

drop policy if exists "Admins can manage rental requests" on public.rental_requests;
create policy "Admins can manage rental requests"
on public.rental_requests
for all
to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Public can create rental requests" on public.rental_requests;
create policy "Public can create rental requests"
on public.rental_requests
for insert
to anon
with check (
  status = 'pendiente'
  and start_date >= current_date
  and end_date >= start_date
  and exists (
    select 1
    from public.rentals
    where rentals.id = rental_requests.rental_id
      and rentals.available = true
  )
);

grant usage on schema public to anon, authenticated;
grant select on public.rentals to anon, authenticated;
grant select on public.imports to anon, authenticated;
grant insert on public.rental_requests to anon, authenticated;
revoke all on public.rentals from public;
revoke all on public.imports from public;
revoke all on public.rental_requests from public;
grant select, insert, update, delete on public.rentals to authenticated;
grant select, insert, update, delete on public.imports to authenticated;
grant select, update, delete on public.rental_requests to authenticated;
grant select on public.admin_profiles to authenticated;
