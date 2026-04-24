-- ACİL DÜZELTME SCRIPT V3 (Sıralama Hatası Düzeltildi)
-- Bu scripti Supabase SQL Editor'de çalıştırın.

-- 1. ADIM: Önce kritik "auth_id" sütununu ekle (En başta yapılmalı)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_users' AND column_name = 'auth_id') THEN
        ALTER TABLE public.app_users ADD COLUMN auth_id UUID REFERENCES auth.users(id);
        CREATE INDEX IF NOT EXISTS idx_app_users_auth_id ON public.app_users(auth_id);
    END IF;
END $$;

-- 2. ADIM: site_settings tablosunu düzelt
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'favicon_url') THEN
        ALTER TABLE public.site_settings ADD COLUMN favicon_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'updated_at') THEN
        ALTER TABLE public.site_settings ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
    END IF;
END $$;

-- 3. ADIM: membership_plans tablosunu oluştur ve yetkilendir
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

ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;

-- Herkes planları görebilsin
DROP POLICY IF EXISTS "Public view membership plans" ON membership_plans;
CREATE POLICY "Public view membership plans" ON membership_plans FOR SELECT USING (true);

-- Sadece adminler yönetebilsin (Burada artık auth_id hatası almayacaksınız)
DROP POLICY IF EXISTS "Admin manage membership plans" ON membership_plans;
CREATE POLICY "Admin manage membership plans" ON membership_plans 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM app_users 
        WHERE auth_id = auth.uid() AND role = 'admin'
    )
);

-- 4. ADIM: site_seo tablosunu oluştur ve yetkilendir
CREATE TABLE IF NOT EXISTS public.site_seo (
    path TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    title TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.site_seo ENABLE ROW LEVEL SECURITY;

-- Herkes SEO bilgilerini okuyabilsin
DROP POLICY IF EXISTS "Public read site_seo" ON site_seo;
CREATE POLICY "Public read site_seo" ON site_seo FOR SELECT USING (true);

-- Adminler değiştirebilsin
DROP POLICY IF EXISTS "Admin manage site_seo" ON site_seo;
CREATE POLICY "Admin manage site_seo" ON site_seo 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM app_users 
        WHERE auth_id = auth.uid() AND role = 'admin'
    )
);

-- 5. ADIM: Önbelleği Yenile
NOTIFY pgrst, 'reload config';
