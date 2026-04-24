-- GUARANTEED ADMIN ACCESS
-- This script hardcodes the admin email into the policy to bypass any role-lookup issues.

-- 1. Drop existing policies to start fresh
DROP POLICY IF EXISTS "View Profiles" ON public.app_users;
DROP POLICY IF EXISTS "Update Profiles" ON public.app_users;
DROP POLICY IF EXISTS "Delete Profiles" ON public.app_users;
DROP POLICY IF EXISTS "Insert Profile" ON public.app_users;
-- Also drop old ones just in case
DROP POLICY IF EXISTS "Users can view own profile" ON public.app_users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.app_users;

-- 2. Create "Bulletproof" Policies

-- VIEW: Allow if it's your own profile OR if your email is the admin email
CREATE POLICY "View Profiles" ON public.app_users 
FOR SELECT 
USING (
  auth.uid() = auth_id 
  OR 
  (select email from auth.users where id = auth.uid()) = 'stepofstep@mail.com'
  OR 
  (select role from public.app_users where auth_id = auth.uid()) = 'admin'
);

-- UPDATE: Same logic
CREATE POLICY "Update Profiles" ON public.app_users 
FOR UPDATE 
USING (
  auth.uid() = auth_id 
  OR 
  (select email from auth.users where id = auth.uid()) = 'stepofstep@mail.com'
);

-- DELETE: Only Admin Email
CREATE POLICY "Delete Profiles" ON public.app_users 
FOR DELETE 
USING (
  (select email from auth.users where id = auth.uid()) = 'stepofstep@mail.com'
);

-- INSERT: Allow anyone authenticated (Standard)
CREATE POLICY "Insert Profile" ON public.app_users 
FOR INSERT 
WITH CHECK ( auth.uid() = auth_id );

-- 3. Force Admin Role on the user (just to be safe for frontend logic that checks role)
UPDATE public.app_users 
SET role = 'admin' 
WHERE email = 'stepofstep@mail.com';

-- 4. Force Supabase Config Reload
NOTIFY pgrst, 'reload config';
