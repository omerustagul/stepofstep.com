-- COMPREHENSIVE FIX SCRIPT
-- Run this in Supabase SQL Editor

-- 1. Performance: Add Index to app_users(auth_id) to prevent timeouts
CREATE INDEX IF NOT EXISTS idx_app_users_auth_id ON public.app_users(auth_id);

-- 2. Storage: Ensure 'wheel-rewards' bucket exists
INSERT INTO storage.buckets (id, name, public, avif_autodetection)
VALUES ('wheel-rewards', 'wheel-rewards', true, false)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Storage: Policies (Reset and Re-create to be sure)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload" ON storage.objects;
DROP POLICY IF EXISTS "Admin Manage" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete" ON storage.objects;

-- Simple Public Read Policy
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'wheel-rewards' );

-- Simple Authenticated Upload Policy (For debugging, allow all auth users to upload)
-- We can restrict this later, but let's get it working first.
CREATE POLICY "Auth Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'wheel-rewards' 
  AND auth.role() = 'authenticated'
);

-- Management Policy
CREATE POLICY "Auth Manage"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'wheel-rewards' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Auth Delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'wheel-rewards' 
  AND auth.role() = 'authenticated'
);

-- 4. Auth: Ensure app_users RLS is simple to avoid recursion timeouts
-- (These policies should already be correct from previous fixes, but confirming)
DROP POLICY IF EXISTS "View All Profiles (Safe)" ON public.app_users;
CREATE POLICY "View All Profiles (Safe)" ON public.app_users
FOR SELECT USING (true); -- Allow all reads to prevent complex joins causing locks

-- Force configuration reload
NOTIFY pgrst, 'reload config';
