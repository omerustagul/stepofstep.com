-- Create appointment_exceptions table
create table public.appointment_exceptions (
  id serial primary key,
  date date not null,
  is_available boolean default false, -- Default to closed if an exception is created (e.g. Holiday)
  start_time time default '09:00:00',
  end_time time default '18:00:00',
  reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(date)
);

-- Enable RLS
alter table public.appointment_exceptions enable row level security;

-- Policies
create policy "Public read exceptions"
  on public.appointment_exceptions for select
  using (true);

create policy "Admins manage exceptions"
  on public.appointment_exceptions for all
  using (
    auth.uid() in (
      select auth_id from public.app_users where role in ('admin', 'marketing')
    )
  );
