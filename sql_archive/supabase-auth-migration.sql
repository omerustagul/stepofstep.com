-- Supabase Auth Migration Script
-- Bu SQL'i Supabase Dashboard > SQL Editor'de çalıştırın

-- 1. app_users tablosuna auth_id sütunu ekle
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id);

-- 2. Plan constraint'ini güncelle (advanced ekle)
ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_plan_check;
ALTER TABLE app_users ADD CONSTRAINT app_users_plan_check CHECK (plan IN ('free', 'pro', 'advanced', 'business'));

-- 3. auth_id için index oluştur (performans için)
CREATE INDEX IF NOT EXISTS idx_app_users_auth_id ON app_users(auth_id);

-- 4. email için unique constraint ekle (henüz yoksa)
-- Önce mevcut duplicateleri kontrol et
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'app_users_email_key'
    ) THEN
        ALTER TABLE app_users ADD CONSTRAINT app_users_email_key UNIQUE (email);
    END IF;
END $$;

-- 5. phone sütunu ekle (yoksa)
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';

-- 6. RLS politikalarını güncelle
-- Kullanıcıların kendi profillerini okuyabilmesi
DROP POLICY IF EXISTS "Users can view own profile" ON app_users;
CREATE POLICY "Users can view own profile" ON app_users 
    FOR SELECT USING (auth.uid() = auth_id);

-- Kullanıcıların kendi profillerini güncelleyebilmesi
DROP POLICY IF EXISTS "Users can update own profile" ON app_users;
CREATE POLICY "Users can update own profile" ON app_users 
    FOR UPDATE USING (auth.uid() = auth_id);

-- Public insert (kayıt için)
DROP POLICY IF EXISTS "Allow public insert" ON app_users;
CREATE POLICY "Allow public insert" ON app_users 
    FOR INSERT WITH CHECK (true);

-- Admin tam erişim
DROP POLICY IF EXISTS "Admin full access" ON app_users;
CREATE POLICY "Admin full access" ON app_users 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM app_users 
            WHERE auth_id = auth.uid() AND role = 'admin'
        )
    );

-- Anonim okuma erişimi (geliştirme için - production'da kaldırılmalı)
DROP POLICY IF EXISTS "Anon insert" ON app_users;
CREATE POLICY "Anon read" ON app_users FOR SELECT USING (true);
CREATE POLICY "Anon write" ON app_users FOR ALL USING (true);
