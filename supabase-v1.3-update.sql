-- Servicekollen Röjsåg v1.3 - uppgradering av befintlig databas
-- Kör EN gång i Supabase SQL Editor.

alter table public.machines
  add column if not exists operational_status text not null default 'active';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'machines_operational_status_check'
  ) then
    alter table public.machines
      add constraint machines_operational_status_check
      check (operational_status in ('active','out_of_service'));
  end if;
end $$;

-- Administratörer får redigera maskinregistret.
drop policy if exists "machines_update_admin" on public.machines;
create policy "machines_update_admin"
on public.machines
for update
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  )
);

grant update on public.machines to authenticated;
