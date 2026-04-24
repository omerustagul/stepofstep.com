-- FIX ADMIN VIEW PERMISSIONS
-- The previous RLS policy restricted users to only see their own profile.
-- This script allows Admins to see ALL profiles.

-- 1. Create a secure function to check if the current user is an admin
-- SECURITY DEFINER means this function runs with the privileges of the creator (superuser)
-- This bypasses RLS recursion issues.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE auth_id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update RLS Policies for app_users

-- Drop existing policies to be clean
DROP POLICY IF EXISTS "Users can view own profile" ON public.app_users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.app_users;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.app_users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.app_users;

-- Policy: Users can view their own profile, OR Admins can view ALL profiles
CREATE POLICY "View Profiles" ON public.app_users 
FOR SELECT 
USING (
  auth.uid() = auth_id 
  OR 
  public.is_admin()
);

-- Policy: Users can update their own, Admins can update all
CREATE POLICY "Update Profiles" ON public.app_users 
FOR UPDATE 
USING (
  auth.uid() = auth_id 
  OR 
  public.is_admin()
);

-- Policy: Only Admins can delete
CREATE POLICY "Delete Profiles" ON public.app_users 
FOR DELETE 
USING ( public.is_admin() );

-- Policy: Insert (Registration) - Allow authenticated users to insert (usually themselves)
-- We strictly check they are inserting their own auth_id
DROP POLICY IF EXISTS "Users can insert own profile" ON public.app_users;
CREATE POLICY "Insert Profile" ON public.app_users 
FOR INSERT 
WITH CHECK (
  auth.uid() = auth_id
);

-- 3. Ensure the main admin user has the 'admin' role
-- Adjust this email if necessary, but this is the hardcoded one from AuthContext
UPDATE public.app_users 
SET role = 'admin' 
WHERE email = 'stepofstep@mail.com';

-- 4. Force Refresh
NOTIFY pgrst, 'reload config';
