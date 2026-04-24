-- =====================================================
-- STEP OF STEP - TAM VERİTABANI MİGRASYON DOSYASI
-- =====================================================
-- Supabase Dashboard > SQL Editor'de çalıştırın
-- Bu dosya tüm eksik tabloları ve alanları ekler

-- =====================================================
-- 1. PORTFOLIOS TABLOSU - OLUŞTURMA VE EKSİK ALANLAR
-- =====================================================

-- 6. Portfolyo Tablosu (Eğer yoksa oluştur)
CREATE TABLE IF NOT EXISTS portfolios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT,
    category TEXT DEFAULT '',
    description TEXT DEFAULT '',
    image_url TEXT DEFAULT '', -- Renamed from image
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Eksik alanları ekle
ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT '';
ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS client_name TEXT DEFAULT '';
ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS challenge TEXT DEFAULT '';
ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS solution TEXT DEFAULT '';
ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS results JSONB DEFAULT '[]';
ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]';
ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT ''; -- Ensure it exists if migration is partial

-- =====================================================
-- 2. SITE_SETTINGS TABLOSU - EKSİK ALANLAR
-- =====================================================
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS favicon_url TEXT DEFAULT '';

-- =====================================================
-- 3. RLS POLİTİKALARINI GÜNCELLE (VARSA SİL, YENİDEN OLUŞTUR)
-- =====================================================

-- Önce mevcut politikaları sil (hata vermemesi için)
DROP POLICY IF EXISTS "Public read" ON site_settings;
DROP POLICY IF EXISTS "Public read" ON page_seo;
DROP POLICY IF EXISTS "Public read" ON roles;
DROP POLICY IF EXISTS "Public read" ON portfolios;
DROP POLICY IF EXISTS "Anon insert" ON site_settings;
DROP POLICY IF EXISTS "Anon insert" ON page_seo;
DROP POLICY IF EXISTS "Anon insert" ON roles;
DROP POLICY IF EXISTS "Anon insert" ON team_members;
DROP POLICY IF EXISTS "Anon insert" ON job_applications;
DROP POLICY IF EXISTS "Anon insert" ON portfolios;
DROP POLICY IF EXISTS "Anon insert" ON app_users;

-- Yeni politikalar oluştur
-- OKUMA (SELECT) - Herkes okuyabilir
CREATE POLICY "allow_public_select" ON site_settings FOR SELECT USING (true);
CREATE POLICY "allow_public_select" ON page_seo FOR SELECT USING (true);
CREATE POLICY "allow_public_select" ON roles FOR SELECT USING (true);
CREATE POLICY "allow_public_select" ON portfolios FOR SELECT USING (true);
CREATE POLICY "allow_public_select" ON team_members FOR SELECT USING (true);
CREATE POLICY "allow_public_select" ON job_applications FOR SELECT USING (true);

-- EKLEME (INSERT) - Herkes ekleyebilir (geliştirme için)
CREATE POLICY "allow_public_insert" ON site_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_public_insert" ON page_seo FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_public_insert" ON roles FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_public_insert" ON team_members FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_public_insert" ON job_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_public_insert" ON portfolios FOR INSERT WITH CHECK (true);

-- GÜNCELLEME (UPDATE) - Herkes güncelleyebilir (geliştirme için)
CREATE POLICY "allow_public_update" ON site_settings FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "allow_public_update" ON page_seo FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "allow_public_update" ON roles FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "allow_public_update" ON team_members FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "allow_public_update" ON job_applications FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "allow_public_update" ON portfolios FOR UPDATE USING (true) WITH CHECK (true);

-- SİLME (DELETE) - Herkes silebilir (geliştirme için)
CREATE POLICY "allow_public_delete" ON site_settings FOR DELETE USING (true);
CREATE POLICY "allow_public_delete" ON page_seo FOR DELETE USING (true);
CREATE POLICY "allow_public_delete" ON roles FOR DELETE USING (true);
CREATE POLICY "allow_public_delete" ON team_members FOR DELETE USING (true);
CREATE POLICY "allow_public_delete" ON job_applications FOR DELETE USING (true);
CREATE POLICY "allow_public_delete" ON portfolios FOR DELETE USING (true);

-- =====================================================
-- 4. VARSAYILAN VERİLERİ KONTROL ET
-- =====================================================

-- Site ayarları yoksa ekle
INSERT INTO site_settings (title, description)
SELECT 'Step of Step', 'Dijital Ajans'
WHERE NOT EXISTS (SELECT 1 FROM site_settings LIMIT 1);

-- =====================================================
-- 5. İNDEKSLER (PERFORMANS İÇİN)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_portfolios_slug ON portfolios(slug);
CREATE INDEX IF NOT EXISTS idx_portfolios_category ON portfolios(category);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_team_members_role_id ON team_members(role_id);

-- =====================================================
-- TAMAMLANDI!
-- =====================================================
