alter table public.machines
add column if not exists service_interval_days integer not null default 90
check (service_interval_days > 0);

alter table public.machines
add column if not exists service_warning_days integer not null default 14
check (service_warning_days >= 0);

notify pgrst, 'reload schema';
