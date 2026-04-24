-- Fix User Synchronization Issue (v2)

-- 1. Create a function to handle new user insertion automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.app_users (auth_id, email, name, role, plan, password_hash)
  VALUES (
    new.id,
    new.email,
    -- Handle case where metadata might be empty, fallback to email prefix
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'user',
    'free',
    'supabase_auth' -- Default placeholder for legacy column
  )
  ON CONFLICT (email) DO UPDATE SET 
    auth_id = EXCLUDED.auth_id,
    updated_at = now();
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Backfill existing users who are missing from app_users
INSERT INTO public.app_users (auth_id, email, name, role, plan, password_hash)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)), 
  'user',
  'free',
  'supabase_auth'
FROM auth.users
WHERE email NOT IN (SELECT email FROM public.app_users)
ON CONFLICT (email) DO NOTHING;

-- Force schema cache refresh
NOTIFY pgrst, 'reload config';
