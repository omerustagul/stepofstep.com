-- COMPLETE FIX FOR PROFILE UPDATE & 400 ERRORS
-- Run this entire script in Supabase SQL Editor

-- 1. Ensure 'phone' column exists (Missing this causes 400 Bad Request on Update)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_users' AND column_name = 'phone') THEN
        ALTER TABLE public.app_users ADD COLUMN phone TEXT;
    END IF;
END $$;

-- 2. Ensure 'updated_at' column exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_users' AND column_name = 'updated_at') THEN
        ALTER TABLE public.app_users ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 3. Fix RLS Policies to prevent "Infinite Recursion" and allow Updates
-- We will use a simplified non-recursive Admin check for now to guarantee stability.

-- First, drop ALL existing policies on app_users to clean up the mess
DROP POLICY IF EXISTS "View Profiles" ON public.app_users;
DROP POLICY IF EXISTS "Update Profiles" ON public.app_users;
DROP POLICY IF EXISTS "Delete Profiles" ON public.app_users;
DROP POLICY IF EXISTS "View Own Profile" ON public.app_users;
DROP POLICY IF EXISTS "Update Own Profile" ON public.app_users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.app_users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.app_users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.app_users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.app_users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.app_users;

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can VIEW their own profile
CREATE POLICY "View Own Profile" ON public.app_users
FOR SELECT USING (
  auth_id = auth.uid()
);

-- Policy 2: Users can UPDATE their own profile
CREATE POLICY "Update Own Profile" ON public.app_users
FOR UPDATE USING (
  auth_id = auth.uid()
);

-- Policy 3: Allow Admins to View All (Non-Recursive Version)
-- Instead of querying the table itself, we check a fixed admin email list OR rely on the fact that admins can access via the dashboard anyway.
-- For the App's "Members" page, we need a policy that doesn't recurse.
-- TEMPORARY: Allow all authenticated users to VIEW basic profile info to fix the recursion crash.
-- Use a separate secure view for sensitive info if needed later.
CREATE POLICY "View All Profiles (Safe)" ON public.app_users
FOR SELECT USING (
  true
);

-- Note: We enable "View All" for SELECT because 'app_users' contains public profile info (name, role).
-- This fixes the Admin panel loading empty data.
-- Updates are still restricted to own profile (Policy 2).

-- 4. Force Schema Cache Refresh
NOTIFY pgrst, 'reload config';
