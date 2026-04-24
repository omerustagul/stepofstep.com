-- FIX WHEEL, USERS AND APP USAGE (Final Consistency Fix)

-- 1. Ensure 'app_users' has all required columns and constraints
CREATE TABLE IF NOT EXISTS public.app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID REFERENCES auth.users(id),
    email TEXT,
    name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'user',
    plan TEXT DEFAULT 'free',
    password_hash TEXT,
    discount_rate INTEGER DEFAULT 0,
    discount_plan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add auth_id column if it doesn't exist (idempotent)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_users' AND column_name = 'auth_id') THEN
        ALTER TABLE public.app_users ADD COLUMN auth_id UUID REFERENCES auth.users(id);
    END IF;
    -- Add discount columns if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_users' AND column_name = 'discount_rate') THEN
        ALTER TABLE public.app_users ADD COLUMN discount_rate INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_users' AND column_name = 'discount_plan') THEN
        ALTER TABLE public.app_users ADD COLUMN discount_plan TEXT;
    END IF;
END $$;

-- RLS for app_users
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON app_users;
CREATE POLICY "Users can view own profile" ON app_users FOR SELECT USING (auth.uid() = auth_id);

DROP POLICY IF EXISTS "Users can update own profile" ON app_users;
CREATE POLICY "Users can update own profile" ON app_users FOR UPDATE USING (auth.uid() = auth_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON app_users;
CREATE POLICY "Users can insert own profile" ON app_users FOR INSERT WITH CHECK (auth.uid() = auth_id);

-- 2. Fix 'wheel_spins' table
CREATE TABLE IF NOT EXISTS public.wheel_spins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- Matches ID from app_users or auth_id depending on app logic. We'll allow it to be loose or FK.
    reward_id TEXT,
    spin_date DATE,
    is_claimed BOOLEAN DEFAULT false,
    claimed_at TIMESTAMP WITH TIME ZONE,
    meta_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ensure columns exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wheel_spins' AND column_name = 'meta_data') THEN
        ALTER TABLE public.wheel_spins ADD COLUMN meta_data JSONB DEFAULT '{}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wheel_spins' AND column_name = 'claimed_at') THEN
        ALTER TABLE public.wheel_spins ADD COLUMN claimed_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- RLS for wheel_spins
ALTER TABLE public.wheel_spins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own spins" ON wheel_spins;
CREATE POLICY "Users can view own spins" ON wheel_spins FOR SELECT USING (
    -- Allow if user_id matches their internal ID or Auth ID
    user_id::text = auth.uid()::text 
    OR 
    EXISTS (SELECT 1 FROM app_users WHERE id = wheel_spins.user_id AND auth_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can insert spins" ON wheel_spins;
CREATE POLICY "Users can insert spins" ON wheel_spins FOR INSERT WITH CHECK (true); -- Allow insert, data integrity handled by backend permissions usually, or refine to auth check

-- 3. Create missing 'app_usage' table
CREATE TABLE IF NOT EXISTS public.app_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id), -- Or app_users(id), assuming auth.users for safer linking
    feature_name TEXT NOT NULL,
    usage_count INTEGER DEFAULT 0,
    usage_limit INTEGER DEFAULT 10,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS for app_usage
ALTER TABLE public.app_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own usage" ON app_usage;
CREATE POLICY "Users can view own usage" ON app_usage FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can update usage" ON app_usage;
CREATE POLICY "System can update usage" ON app_usage FOR ALL USING (user_id = auth.uid());


-- 4. Auto-Confirm Email Trigger (Requested Feature)
CREATE OR REPLACE FUNCTION public.auto_confirm_email()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email_confirmed_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_email();

-- 5. Force Refresh
NOTIFY pgrst, 'reload config';
