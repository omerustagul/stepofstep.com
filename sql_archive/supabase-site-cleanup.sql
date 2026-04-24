-- 1. Ensure exactly one row in site_settings
DO $$ 
BEGIN
    -- If no rows, insert default
    IF NOT EXISTS (SELECT 1 FROM site_settings) THEN
        INSERT INTO site_settings (title, description, logo_width_desktop, logo_width_mobile)
        VALUES ('Step of Step', 'Digital Marketing & Creative Agency', 120, 40);
    END IF;
    
    -- If multiple rows, keep only the first one (most recently updated or first id)
    DELETE FROM site_settings 
    WHERE id NOT IN (SELECT id FROM site_settings ORDER BY updated_at DESC LIMIT 1);
END $$;

-- 2. Create site_seo table for persistent SEO settings
CREATE TABLE IF NOT EXISTS public.site_seo (
    path TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    title TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for site_seo
ALTER TABLE public.site_seo ENABLE ROW LEVEL SECURITY;

-- Allow public read for site_seo
DROP POLICY IF EXISTS "Public read site_seo" ON site_seo;
CREATE POLICY "Public read site_seo" ON site_seo FOR SELECT USING (true);

-- Allow admin write for site_seo
DROP POLICY IF EXISTS "Admin manage site_seo" ON site_seo;
CREATE POLICY "Admin manage site_seo" ON site_seo 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM app_users 
        WHERE auth_id = auth.uid() AND role = 'admin'
    )
);

-- Seed initial SEO pages
INSERT INTO site_seo (path, name, title, description)
VALUES 
('/', 'Ana Sayfa', 'Step of Step - Dijital Ajans', 'Digital Marketing & Creative Agency'),
('/about', 'Hakkımızda', '', ''),
('/contact', 'İletişim', '', ''),
('/careers', 'Kariyer', '', ''),
('/services/branding', 'Markalama Hizmeti', '', ''),
('/services/development', 'Yazılım Geliştirme', '', ''),
('/services/marketing', 'Dijital Pazarlama', '', ''),
('/profile', 'Profil', '', ''),
('/app', 'App Dashboard', '', ''),
('/login', 'Giriş Yap', '', ''),
('/register', 'Kayıt Ol', '', '')
ON CONFLICT (path) DO NOTHING;

-- 3. Clear membership plans as requested
TRUNCATE TABLE membership_plans;
