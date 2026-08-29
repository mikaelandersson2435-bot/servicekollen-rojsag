-- Servicekollen Röjsåg v1.1
-- Kör i Supabase SQL Editor i ett separat projekt eller efter granskning.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.machines (
  id uuid primary key default gen_random_uuid(),
  brand text not null check (brand in ('Husqvarna','STIHL')),
  model text,
  serial text,
  location text,
  note text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  constraint machine_identity_required check (coalesce(nullif(trim(model),''),nullif(trim(serial),'')) is not null)
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references public.machines(id) on delete cascade,
  service_date date not null default current_date,
  performed_by text,
  checks jsonb not null default '[]'::jsonb,
  final_status text not null check (final_status in ('ok','fix','stop')),
  comment text,
  parts text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.machines enable row level security;
alter table public.services enable row level security;

-- Alla autentiserade användare i arbetsgruppen får läsa maskiner och servicehistorik.
create policy "profiles_read_own" on public.profiles for select to authenticated
using ((select auth.uid()) = id);

create policy "machines_read_authenticated" on public.machines for select to authenticated
using ((select auth.uid()) is not null);

create policy "machines_insert_authenticated" on public.machines for insert to authenticated
with check ((select auth.uid()) = created_by);

create policy "machines_delete_admin" on public.machines for delete to authenticated
using (exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin'));

create policy "services_read_authenticated" on public.services for select to authenticated
using ((select auth.uid()) is not null);

create policy "services_insert_authenticated" on public.services for insert to authenticated
with check ((select auth.uid()) = created_by);

create policy "services_update_owner_or_admin" on public.services for update to authenticated
using (
  created_by=(select auth.uid()) or exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin')
)
with check (
  created_by=(select auth.uid()) or exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin')
);

create policy "services_delete_admin" on public.services for delete to authenticated
using (exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin'));

-- API grants. RLS ovan styr vilka rader som faktiskt får användas.
grant usage on schema public to authenticated;
grant select on public.profiles to authenticated;
grant select, insert, delete on public.machines to authenticated;
grant select, insert, update, delete on public.services to authenticated;

-- Efter att första användaren skapats i Auth, gör den till admin manuellt:
-- insert into public.profiles (id, display_name, role)
-- values ('ANVÄNDARENS_UUID', 'Mikael', 'admin')
-- on conflict (id) do update set role='admin';
