-- EMERGENCY FIX SCRIPT V2
-- Execute this in Supabase SQL Editor to fix all "Schema Cache" and "Missing Column" errors.

-- 1. Fix site_settings (Add favicon_url if missing)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'favicon_url') THEN
        ALTER TABLE public.site_settings ADD COLUMN favicon_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'updated_at') THEN
        ALTER TABLE public.site_settings ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
    END IF;
END $$;

-- 2. Fix membership_plans (Ensure table exists)
CREATE TABLE IF NOT EXISTS public.membership_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price_monthly NUMERIC DEFAULT 0,
    features JSONB DEFAULT '[]'::jsonb,
    color TEXT DEFAULT 'bg-zinc-100 text-zinc-600',
    icon TEXT DEFAULT 'Zap',
    is_popular BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on membership_plans
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read plans
DROP POLICY IF EXISTS "Public view membership plans" ON membership_plans;
CREATE POLICY "Public view membership plans" ON membership_plans FOR SELECT USING (true);

-- Policy: Admins can manage plans
DROP POLICY IF EXISTS "Admin manage membership plans" ON membership_plans;
CREATE POLICY "Admin manage membership plans" ON membership_plans 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM app_users 
        WHERE auth_id = auth.uid() AND role = 'admin'
    )
);

-- 3. Fix site_seo (Ensure table exists)
CREATE TABLE IF NOT EXISTS public.site_seo (
    path TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    title TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on site_seo
ALTER TABLE public.site_seo ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read SEO
DROP POLICY IF EXISTS "Public read site_seo" ON site_seo;
CREATE POLICY "Public read site_seo" ON site_seo FOR SELECT USING (true);

-- Policy: Admins can manage SEO
DROP POLICY IF EXISTS "Admin manage site_seo" ON site_seo;
CREATE POLICY "Admin manage site_seo" ON site_seo 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM app_users 
        WHERE auth_id = auth.uid() AND role = 'admin'
    )
);

-- 4. Fix app_users (Add auth_id if missing)
-- This is CRITICAL for permissions.
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_users' AND column_name = 'auth_id') THEN
        ALTER TABLE public.app_users ADD COLUMN auth_id UUID REFERENCES auth.users(id);
        CREATE INDEX IF NOT EXISTS idx_app_users_auth_id ON public.app_users(auth_id);
    END IF;
END $$;

-- 5. Force Schema Cache Reload (standard Supabase trick)
NOTIFY pgrst, 'reload config';
