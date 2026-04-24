-- Activity Tracking Migration Script (SAFE MODE)
-- Bu SQL'i Supabase Dashboard > SQL Editor'de çalıştırın

-- 1. Tabloları oluştur (Varsa hiçbir şey yapmaz)
CREATE TABLE IF NOT EXISTS app_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
    app_id TEXT NOT NULL,
    app_name TEXT NOT NULL,
    total_seconds INTEGER DEFAULT 0,
    last_used TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, app_id)
);

CREATE TABLE IF NOT EXISTS activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
    app_id TEXT NOT NULL,
    app_name TEXT NOT NULL,
    action TEXT DEFAULT 'Opened App',
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexler (Varsa hata vermez)
CREATE INDEX IF NOT EXISTS idx_app_usage_user_id ON app_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_timestamp ON activity_log(timestamp DESC);

-- 3. RLS Politikaları (Önce eskileri temizler, sonra yeniden oluşturur)
ALTER TABLE app_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Politikaları Temizle
DROP POLICY IF EXISTS "Users can view own usage" ON app_usage;
DROP POLICY IF EXISTS "Users can view own activity" ON activity_log;
DROP POLICY IF EXISTS "Users can insert usage" ON app_usage;
DROP POLICY IF EXISTS "Users can update usage" ON app_usage;
DROP POLICY IF EXISTS "Users can insert activity" ON activity_log;

-- Politikaları Oluştur
CREATE POLICY "Users can view own usage" ON app_usage FOR SELECT USING (true);
CREATE POLICY "Users can view own activity" ON activity_log FOR SELECT USING (true);
CREATE POLICY "Users can insert usage" ON app_usage FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update usage" ON app_usage FOR UPDATE USING (true);
CREATE POLICY "Users can insert activity" ON activity_log FOR INSERT WITH CHECK (true);

-- 4. Temizleme Fonksiyonu
CREATE OR REPLACE FUNCTION cleanup_old_activities()
RETURNS void AS $$
BEGIN
    DELETE FROM activity_log WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;
