-- Create a new storage bucket for Wheel Rewards
insert into storage.buckets (id, name, public)
values ('wheel-rewards', 'wheel-rewards', true)
on conflict (id) do nothing;

-- Drop existing policies to avoid conflicts
drop policy if exists "Wheel Rewards Public Read" on storage.objects;
drop policy if exists "Wheel Rewards Admin Upload" on storage.objects;
drop policy if exists "Wheel Rewards Admin Update" on storage.objects;
drop policy if exists "Wheel Rewards Admin Delete" on storage.objects;

-- Set up RLS policies for the bucket
create policy "Wheel Rewards Public Read"
  on storage.objects for select
  using ( bucket_id = 'wheel-rewards' );

create policy "Wheel Rewards Admin Upload"
  on storage.objects for insert
  with check ( bucket_id = 'wheel-rewards' and auth.role() = 'authenticated' );

create policy "Wheel Rewards Admin Update"
  on storage.objects for update
  using ( bucket_id = 'wheel-rewards' and auth.role() = 'authenticated' );

create policy "Wheel Rewards Admin Delete"
  on storage.objects for delete
  using ( bucket_id = 'wheel-rewards' and auth.role() = 'authenticated' );
