-- Store currency exactly and add indexes used by joins and conflict checks.
alter table public.vehicles
  alter column daily_rate type numeric(10,2) using round(daily_rate::numeric, 2),
  alter column weekly_rate type numeric(10,2) using round(weekly_rate::numeric, 2);

alter table public.rentals
  alter column rate type numeric(10,2) using round(rate::numeric, 2),
  alter column deposit type numeric(10,2) using round(deposit::numeric, 2);

create index if not exists rentals_customer_id_idx on public.rentals (customer_id);
create index if not exists rentals_vehicle_id_idx on public.rentals (vehicle_id);
create index if not exists maintenance_periods_vehicle_id_idx on public.maintenance_periods (vehicle_id);
create index if not exists rental_notes_rental_id_idx on public.rental_notes (rental_id);

create index if not exists rentals_vehicle_schedule_idx
  on public.rentals (vehicle_id, pickup_at, expected_return_at)
  where status in ('reserved', 'out');

create index if not exists maintenance_vehicle_schedule_idx
  on public.maintenance_periods (vehicle_id, start_at, end_at);
