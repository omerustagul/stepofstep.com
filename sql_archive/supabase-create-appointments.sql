-- Create appointments table
create table public.appointments (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  user_name text not null,
  user_email text not null,
  user_phone text,
  status text not null default 'pending', -- pending, confirmed, cancelled, completed
  meeting_type text not null default 'online', -- online, phone, office
  notes text,
  google_event_id text -- For future integration
);

-- Enable Row Level Security (RLS)
alter table public.appointments enable row level security;

-- Policies
-- Public can insert (book)
create policy "Anyone can create appointments"
  on public.appointments for insert
  with check (true);

-- Users can read their own (by email match) - Optional if we have auth, but for public booking sticky session/email match is harder without auth.
-- For now, let's allow public read for own email if we had auth, but since it's "Public Booking", we rely on Admin to view all.

-- Admin can do everything
create policy "Admins can do everything on appointments"
  on public.appointments for all
  using (
    auth.uid() in (
      select auth_id from public.app_users where role in ('admin', 'marketing')
    )
  );
