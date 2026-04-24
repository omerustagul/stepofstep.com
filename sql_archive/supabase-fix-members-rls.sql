-- Fix RLS for app_users to ensure admins can see all users
-- This script replaces restrictive policies with a comprehensive one

-- 1. Create a secure function to check admin status (avoiding recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE auth_id = auth.uid() 
    AND role IN ('admin', 'marketing', 'designer')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing policies to ensure a clean slate
DROP POLICY IF EXISTS "View Profiles" ON public.app_users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.app_users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.app_users;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.app_users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.app_users;
DROP POLICY IF EXISTS "Update Profiles" ON public.app_users;
DROP POLICY IF EXISTS "Delete Profiles" ON public.app_users;

-- 3. Create new comprehensive policies

-- VIEW: Users see themselves, Admins see everyone
CREATE POLICY "View Profiles" ON public.app_users
FOR SELECT USING (
  auth.uid() = auth_id
  OR
  public.is_admin()
);

-- UPDATE: Users update themselves, Admins update everyone
CREATE POLICY "Update Profiles" ON public.app_users
FOR UPDATE USING (
  auth.uid() = auth_id
  OR
  public.is_admin()
);

-- DELETE: Only Admins can delete
CREATE POLICY "Delete Profiles" ON public.app_users
FOR DELETE USING (
  public.is_admin()
);

-- 4. Force schema cache refresh
NOTIFY pgrst, 'reload config';
