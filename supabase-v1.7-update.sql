-- Servicekollen Röjsåg v1.7
-- Standard: service var 30:e dag, varning 7 dagar före.

alter table public.machines
  alter column service_interval_days set default 30;

alter table public.machines
  alter column service_warning_days set default 7;

-- Uppdatera befintliga maskiner till den nya gemensamma standarden.
update public.machines
set
  service_interval_days = 30,
  service_warning_days = 7;

notify pgrst, 'reload schema';
