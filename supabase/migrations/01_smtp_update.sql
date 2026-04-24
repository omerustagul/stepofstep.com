-- =============================================================
-- SMTP ayarları tablosuna from_name ve from_email kolonları ekle
-- (Eğer tablo yoksa sıfırdan oluşturur)
-- =============================================================

CREATE TABLE IF NOT EXISTS public.smtp_settings (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    host       TEXT NOT NULL DEFAULT '',
    port       INTEGER DEFAULT 587,
    username   TEXT DEFAULT '',
    password   TEXT DEFAULT '',
    from_name  TEXT DEFAULT 'Step of Step',
    from_email TEXT DEFAULT '',
    secure     BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Mevcut tabloya eksik kolonları güvenle ekle
ALTER TABLE public.smtp_settings
    ADD COLUMN IF NOT EXISTS from_name  TEXT DEFAULT 'Step of Step',
    ADD COLUMN IF NOT EXISTS from_email TEXT DEFAULT '';

-- RLS
ALTER TABLE public.smtp_settings ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir (Edge Function service role ile okur zaten, bu opsiyonel)
DROP POLICY IF EXISTS "Authenticated can view smtp" ON public.smtp_settings;
CREATE POLICY "Authenticated can view smtp"
    ON public.smtp_settings FOR SELECT
    USING (auth.role() = 'authenticated');

-- Sadece admin yazabilir
DROP POLICY IF EXISTS "Admins can manage smtp" ON public.smtp_settings;
CREATE POLICY "Admins can manage smtp"
    ON public.smtp_settings FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.app_users
        WHERE auth_id = auth.uid() AND role = 'admin'
    ));
