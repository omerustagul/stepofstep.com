-- Favicon Migration Script
-- Bu SQL'i Supabase Dashboard > SQL Editor'de çalıştırın

-- site_settings tablosuna favicon_url sütunu ekle
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS favicon_url TEXT DEFAULT '';
