-- Debug RLS: Simplify policies to test recursion hypothesis

-- 1. Drop existing policies on app_users
DROP POLICY IF EXISTS "View Profiles" ON public.app_users;
DROP POLICY IF EXISTS "Update Profiles" ON public.app_users;
DROP POLICY IF EXISTS "Delete Profiles" ON public.app_users;

-- 2. Create simplified policies (No recursive admin check for SELECT)
-- Checks only if the user owns the record.
CREATE POLICY "View Own Profile" ON public.app_users
FOR SELECT USING (
  auth_id = auth.uid()
);

-- Note: Admins won't be able to see others temporarily, but login should work instantly.

-- 3. Allow update for own profile
CREATE POLICY "Update Own Profile" ON public.app_users
FOR UPDATE USING (
  auth_id = auth.uid()
);

-- Force reload
NOTIFY pgrst, 'reload config';
