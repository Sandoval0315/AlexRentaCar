-- Flujo público/administrativo aplicado a producción.
alter table public.rental_requests
add column if not exists request_code uuid not null default gen_random_uuid();

create unique index if not exists rental_requests_request_code_idx
on public.rental_requests (request_code);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (char_length(email) between 3 and 254),
  phone text not null default '' check (char_length(phone) <= 40),
  subject text not null default 'general' check (char_length(subject) <= 80),
  message text not null check (char_length(message) between 5 and 3000),
  status text not null default 'nuevo'
    check (status in ('nuevo', 'en_proceso', 'resuelto')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contact_messages_created_at_idx
on public.contact_messages (created_at desc);

create index if not exists contact_messages_status_idx
on public.contact_messages (status);

drop trigger if exists contact_messages_set_updated_at on public.contact_messages;
create trigger contact_messages_set_updated_at
before update on public.contact_messages
for each row
execute function public.set_updated_at();

create or replace function public.create_rental_request(
  p_rental_id uuid,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_start_date date,
  p_end_date date,
  p_notes text default ''
)
returns table (id uuid, request_code uuid, total_estimate numeric)
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_rental public.rentals%rowtype;
  created_request public.rental_requests%rowtype;
begin
  if p_start_date < current_date or p_end_date < p_start_date then
    raise exception 'Selecciona un rango de fechas valido.';
  end if;

  if char_length(trim(p_customer_name)) not between 2 and 120
    or char_length(trim(p_customer_email)) not between 3 and 254
    or position('@' in p_customer_email) < 2
    or char_length(trim(p_customer_phone)) not between 7 and 40
    or char_length(coalesce(p_notes, '')) > 2000 then
    raise exception 'Los datos de contacto no son validos.';
  end if;

  select * into selected_rental
  from public.rentals
  where public.rentals.id = p_rental_id
    and public.rentals.available = true;

  if not found then
    raise exception 'El vehiculo no esta disponible.';
  end if;

  if exists (
    select 1
    from public.rental_requests
    where rental_id = p_rental_id
      and status = 'confirmada'
      and daterange(start_date, end_date, '[]') && daterange(p_start_date, p_end_date, '[]')
  ) then
    raise exception 'El vehiculo ya esta reservado para esas fechas.';
  end if;

  insert into public.rental_requests (
    rental_id,
    customer_name,
    customer_email,
    customer_phone,
    start_date,
    end_date,
    notes,
    status,
    total_estimate,
    rental_snapshot
  ) values (
    p_rental_id,
    trim(p_customer_name),
    lower(trim(p_customer_email)),
    trim(p_customer_phone),
    p_start_date,
    p_end_date,
    trim(coalesce(p_notes, '')),
    'pendiente',
    selected_rental.price_per_day * greatest(1, p_end_date - p_start_date),
    jsonb_build_object(
      'id', selected_rental.id,
      'brand', selected_rental.brand,
      'model', selected_rental.model,
      'year', selected_rental.year,
      'price_per_day', selected_rental.price_per_day,
      'image', coalesce(selected_rental.images ->> 0, '')
    )
  ) returning * into created_request;

  return query
  select created_request.id, created_request.request_code, created_request.total_estimate;
end;
$$;

create or replace function public.lookup_rental_request(
  p_request_code uuid,
  p_customer_email text
)
returns table (
  request_code uuid,
  status text,
  start_date date,
  end_date date,
  total_estimate numeric,
  rental_snapshot jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
security definer
set search_path = ''
stable
as $$
  select
    rr.request_code,
    rr.status,
    rr.start_date,
    rr.end_date,
    rr.total_estimate,
    rr.rental_snapshot,
    rr.created_at,
    rr.updated_at
  from public.rental_requests rr
  where rr.request_code = p_request_code
    and lower(rr.customer_email) = lower(trim(p_customer_email))
  limit 1;
$$;

create or replace function public.submit_contact_message(
  p_name text,
  p_email text,
  p_phone text,
  p_subject text,
  p_message text
)
returns table (id uuid, created_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  created_message public.contact_messages%rowtype;
begin
  if char_length(trim(p_name)) not between 2 and 120
    or char_length(trim(p_email)) not between 3 and 254
    or position('@' in p_email) < 2
    or char_length(trim(p_phone)) not between 7 and 40
    or char_length(trim(p_message)) not between 5 and 3000
    or char_length(coalesce(p_subject, 'general')) > 80 then
    raise exception 'Completa correctamente los datos de contacto.';
  end if;

  insert into public.contact_messages (name, email, phone, subject, message)
  values (
    trim(p_name),
    lower(trim(p_email)),
    trim(p_phone),
    coalesce(nullif(trim(p_subject), ''), 'general'),
    trim(p_message)
  )
  returning * into created_message;

  return query select created_message.id, created_message.created_at;
end;
$$;

create or replace function public.prevent_overlapping_confirmed_rentals()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'confirmada' and exists (
    select 1
    from public.rental_requests rr
    where rr.rental_id = new.rental_id
      and rr.id <> new.id
      and rr.status = 'confirmada'
      and daterange(rr.start_date, rr.end_date, '[]') && daterange(new.start_date, new.end_date, '[]')
  ) then
    raise exception 'Ya existe una reserva confirmada para ese vehiculo y fechas.';
  end if;
  return new;
end;
$$;

drop trigger if exists rental_requests_prevent_overlap on public.rental_requests;
create trigger rental_requests_prevent_overlap
before insert or update of status, start_date, end_date on public.rental_requests
for each row
execute function public.prevent_overlapping_confirmed_rentals();

alter table public.contact_messages enable row level security;

drop policy if exists "Public can create rental requests" on public.rental_requests;

drop policy if exists "Admins can manage contact messages" on public.contact_messages;
create policy "Admins can manage contact messages"
on public.contact_messages
for all
to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

revoke insert on public.rental_requests from anon, authenticated;
revoke all on public.contact_messages from anon, authenticated;
revoke all on function public.create_rental_request(uuid, text, text, text, date, date, text) from public;
revoke all on function public.lookup_rental_request(uuid, text) from public;
revoke all on function public.submit_contact_message(text, text, text, text, text) from public;

grant execute on function public.create_rental_request(uuid, text, text, text, date, date, text) to anon, authenticated;
grant execute on function public.lookup_rental_request(uuid, text) to anon, authenticated;
grant execute on function public.submit_contact_message(text, text, text, text, text) to anon, authenticated;
grant select, update, delete on public.rental_requests to authenticated;
grant select, insert, update, delete on public.contact_messages to authenticated;
