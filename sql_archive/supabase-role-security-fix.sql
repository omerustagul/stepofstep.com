-- ROLE SECURITY FIX
-- This script secures the role assignment logic.

-- 1. Enforce Default 'user' constraint on app_users
ALTER TABLE public.app_users ALTER COLUMN role SET DEFAULT 'user';

-- 2. Create team_members table if it doesn't exist (to prevent errors in AuthContext)
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    role_id TEXT NOT NULL, -- 'admin', 'marketing', 'designer'
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Sanitize existing users (Downgrade unauthorized admins)
-- This logic resets anyone who is NOT the master email AND NOT in team_members table to 'user'.
UPDATE public.app_users
SET role = 'user'
WHERE role IN ('admin', 'marketing', 'designer')
  AND email != 'stepofstep@mail.com'
  AND email NOT IN (SELECT email FROM public.team_members);

-- 4. Ensure master admin is admin
UPDATE public.app_users
SET role = 'admin'
WHERE email = 'stepofstep@mail.com';

-- 5. Force Refresh
NOTIFY pgrst, 'reload config';
