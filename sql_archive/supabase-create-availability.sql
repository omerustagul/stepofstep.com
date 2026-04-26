-- Create appointment_availability table
create table public.appointment_availability (
  id serial primary key,
  day_of_week int not null, -- 0 (Sunday) to 6 (Saturday)
  is_working_day boolean default true,
  start_time time not null default '09:00:00',
  end_time time not null default '18:00:00',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(day_of_week)
);

-- Enable RLS
alter table public.appointment_availability enable row level security;

-- Policies
create policy "Public read availability"
  on public.appointment_availability for select
  using (true);

create policy "Admins manage availability"
  on public.appointment_availability for all
  using (
    auth.uid() in (
      select auth_id from public.app_users where role in ('admin', 'marketing')
    )
  );

-- Seed defaults (Mon-Fri working, Sat-Sun off/working?)
-- Let's stick to simple insert. We will run this script manually or via code.
insert into public.appointment_availability (day_of_week, is_working_day, start_time, end_time) values
(1, true, '09:00', '18:00'), -- Mon
(2, true, '09:00', '18:00'), -- Tue
(3, true, '09:00', '18:00'), -- Wed
(4, true, '09:00', '18:00'), -- Thu
(5, true, '09:00', '18:00'), -- Fri
(6, false, '10:00', '14:00'), -- Sat
(0, false, '10:00', '14:00') -- Sun
on conflict (day_of_week) do nothing;
