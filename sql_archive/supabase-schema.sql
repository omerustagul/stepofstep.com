-- Step of Step Veritabanı Tabloları
-- Bu SQL'i Supabase Dashboard > SQL Editor'de çalıştırın

-- 1. Site Ayarları Tablosu
CREATE TABLE IF NOT EXISTS site_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT DEFAULT 'Step of Step',
    description TEXT DEFAULT '',
    logo_url TEXT DEFAULT '',
    logo_width_desktop INTEGER DEFAULT 120,
    logo_width_mobile INTEGER DEFAULT 40,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Sayfa SEO Ayarları
CREATE TABLE IF NOT EXISTS page_seo (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    path TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    title TEXT DEFAULT '',
    description TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Roller Tablosu
CREATE TABLE IF NOT EXISTS roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    permissions JSONB DEFAULT '{}',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Ekip Üyeleri Tablosu
CREATE TABLE IF NOT EXISTS team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT DEFAULT '',
    address TEXT DEFAULT '',
    position TEXT DEFAULT '',
    start_date DATE,
    end_date DATE,
    role_id UUID REFERENCES roles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. İş Başvuruları Tablosu
CREATE TABLE IF NOT EXISTS job_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT DEFAULT '',
    message TEXT DEFAULT '',
    cv_url TEXT DEFAULT '',
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'interview', 'rejected', 'hired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Portfolyo Tablosu
CREATE TABLE IF NOT EXISTS portfolios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT,
    category TEXT DEFAULT '',
    description TEXT DEFAULT '',
    image TEXT DEFAULT '',
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Kullanıcılar Tablosu (Uygulama Kullanıcıları)
CREATE TABLE IF NOT EXISTS app_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'business')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Varsayılan Site Ayarları Ekle
INSERT INTO site_settings (title, description) 
VALUES ('Step of Step', 'Dijital Ajans')
ON CONFLICT DO NOTHING;

-- Varsayılan Roller Ekle
INSERT INTO roles (id, name, permissions, is_default) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Yönetici', '{"dashboard":"edit","portfolios":"edit","users":"edit","jobs":"edit","members":"edit","settings":"edit","policies":"edit"}', true),
    ('00000000-0000-0000-0000-000000000002', 'Editör', '{"dashboard":"view","portfolios":"edit","users":"none","jobs":"view","members":"view","settings":"none","policies":"none"}', true),
    ('00000000-0000-0000-0000-000000000003', 'İzleyici', '{"dashboard":"view","portfolios":"view","users":"none","jobs":"view","members":"none","settings":"none","policies":"none"}', true)
ON CONFLICT DO NOTHING;

-- Varsayılan Sayfa SEO Ayarları
INSERT INTO page_seo (path, name) VALUES
    ('/', 'Ana Sayfa'),
    ('/about', 'Hakkımızda'),
    ('/contact', 'İletişim'),
    ('/careers', 'Kariyer'),
    ('/services/branding', 'Markalama Hizmeti'),
    ('/services/development', 'Yazılım Geliştirme'),
    ('/services/marketing', 'Dijital Pazarlama')
ON CONFLICT DO NOTHING;

-- Row Level Security (RLS) - Herkesin okuyabilmesi için
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_seo ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- Herkese okuma izni
CREATE POLICY "Public read" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Public read" ON page_seo FOR SELECT USING (true);
CREATE POLICY "Public read" ON roles FOR SELECT USING (true);
CREATE POLICY "Public read" ON portfolios FOR SELECT USING (true);

-- Anonim yazma izni (geliştirme için - production'da kaldırılmalı)
CREATE POLICY "Anon insert" ON site_settings FOR ALL USING (true);
CREATE POLICY "Anon insert" ON page_seo FOR ALL USING (true);
CREATE POLICY "Anon insert" ON roles FOR ALL USING (true);
CREATE POLICY "Anon insert" ON team_members FOR ALL USING (true);
CREATE POLICY "Anon insert" ON job_applications FOR ALL USING (true);
CREATE POLICY "Anon insert" ON portfolios FOR ALL USING (true);
CREATE POLICY "Anon insert" ON app_users FOR ALL USING (true);
