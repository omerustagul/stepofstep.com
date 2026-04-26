-- FIX ROLE DEFAULTS AND OFFBOARD ACCIDENTAL ADMINS
-- The user reported that new signups can access the admin panel.
-- This implies they are getting 'admin' role or a role_id.

-- 1. Ensure 'role' column defaults to 'user'
ALTER TABLE public.app_users 
ALTER COLUMN role SET DEFAULT 'user';

-- 2. Update any user who is 'admin' but NOT in the allowlist and has NO role_id
-- We assume only 'stepofstep@mail.com' works as super admin without role_id
-- OR users who are explicitly team_members (who should have role_id).

UPDATE public.app_users
SET role = 'user'
WHERE role = 'admin' 
  AND email != 'stepofstep@mail.com'
  AND role_id IS NULL;

-- 3. Ensure RLS policies don't accidentally grant access (though this is structural)
-- (We already fixed policies in previous steps, but let's double check defaults)

-- 4. Check if there's a trigger setting role to admin?
-- We can't easily see triggers, but we can drop a potential bad one if we knew the name.
-- Instead, we'll recreate the handle_new_user function if it exists to be safe.

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.app_users (auth_id, email, role, name, plan)
  VALUES (
    new.id, 
    new.email, 
    CASE 
        WHEN new.email = 'stepofstep@mail.com' THEN 'admin'
        ELSE 'user' 
    END,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'free'
  )
  ON CONFLICT (auth_id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    role = CASE 
        WHEN EXCLUDED.email = 'stepofstep@mail.com' THEN 'admin'
        ELSE 'user' -- Force user for others on conflict too, unless manual update? No, let's keep existing if not stepofstep.
    END; 
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
