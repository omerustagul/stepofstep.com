-- =============================================================
-- STEP OF STEP — TAM VERİTABANI ŞEMASI
-- Kaynak: Tüm proje dosyaları analiz edilerek oluşturuldu.
-- Supabase SQL Editor'da tek seferde çalıştırılabilir.
-- =============================================================

-- UUID extension (Supabase'de genellikle aktif gelir)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Kolon Güvencesi (Var olan tabloların güncelliğini garanti eder)
DO $$ 
BEGIN
    -- job_applications
    ALTER TABLE IF EXISTS public.job_applications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL;
    
    -- contact_messages
    ALTER TABLE IF EXISTS public.contact_messages ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL;
    
    -- membership_plans
    ALTER TABLE IF EXISTS public.membership_plans ADD COLUMN IF NOT EXISTS price_monthly NUMERIC(10,2) DEFAULT 0;
    ALTER TABLE IF EXISTS public.membership_plans ADD COLUMN IF NOT EXISTS color TEXT DEFAULT 'bg-zinc-100 text-zinc-600';
    ALTER TABLE IF EXISTS public.membership_plans ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'Zap';
    -- membership_plans
    ALTER TABLE IF EXISTS public.membership_plans ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
    ALTER TABLE IF EXISTS public.membership_plans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

    -- wheel_spins rename (Robust check)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='wheel_spins' AND column_name='spun_at') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='wheel_spins' AND column_name='created_at') THEN
            ALTER TABLE public.wheel_spins RENAME COLUMN spun_at TO created_at;
        END IF;
    END IF;

    -- portfolios
    ALTER TABLE IF EXISTS public.portfolios ADD COLUMN IF NOT EXISTS category TEXT[] DEFAULT '{}';
    ALTER TABLE IF EXISTS public.portfolios ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
    ALTER TABLE IF EXISTS public.portfolios ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

    -- activity_log rename
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='activity_log' AND column_name='timestamp') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='activity_log' AND column_name='created_at') THEN
            ALTER TABLE public.activity_log RENAME COLUMN timestamp TO created_at;
        END IF;
    END IF;

    -- usage & streaks
    ALTER TABLE IF EXISTS public.daily_streaks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
    ALTER TABLE IF EXISTS public.app_usage ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
    
    -- wheel_rewards
    ALTER TABLE IF EXISTS public.wheel_rewards ADD COLUMN IF NOT EXISTS file_url TEXT;
    ALTER TABLE IF EXISTS public.wheel_rewards ADD COLUMN IF NOT EXISTS text_color TEXT DEFAULT '#ffffff';
    ALTER TABLE IF EXISTS public.wheel_rewards ADD COLUMN IF NOT EXISTS reward_value TEXT;
    ALTER TABLE IF EXISTS public.wheel_rewards ADD COLUMN IF NOT EXISTS plan_target TEXT;
    ALTER TABLE IF EXISTS public.wheel_rewards ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT '🎁';
END $$;


-- =============================================================
-- 1. ROLLER (RBAC)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.roles (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,
    permissions JSONB NOT NULL DEFAULT '{}',
    is_default  BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Varsayılan "Super Admin" rolü
INSERT INTO public.roles (name, permissions, is_default)
VALUES (
    'Super Admin',
    '{
        "dashboard":    "edit",
        "jobs":         "edit",
        "appointments": "edit",
        "users":        "edit",
        "members":      "edit",
        "plans":        "edit",
        "wheel":        "edit",
        "policies":     "edit",
        "settings":     "edit",
        "messages":     "edit",
        "portfolios":   "edit",
        "notifications":"edit"
    }',
    true
)
ON CONFLICT DO NOTHING;

-- =============================================================
-- 2. EKİP ÜYELERİ (Personel)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.team_members (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    phone       TEXT NOT NULL DEFAULT '',
    address     TEXT,
    position    TEXT,
    start_date  DATE,
    end_date    DATE,
    role_id     UUID REFERENCES public.roles(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- 3. KULLANICILAR (app_users)
--    Supabase Auth ile senkronize, ek profil bilgileri içerir.
-- =============================================================
CREATE TABLE IF NOT EXISTS public.app_users (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id               UUID UNIQUE,                              -- Supabase auth.users.id
    email                 TEXT UNIQUE,
    name                  TEXT NOT NULL DEFAULT '',
    phone                 TEXT DEFAULT '',
    role                  TEXT NOT NULL DEFAULT 'user'
                          CHECK (role IN ('admin', 'marketing', 'designer', 'user')),
    role_id               UUID REFERENCES public.roles(id) ON DELETE SET NULL,
    plan                  TEXT NOT NULL DEFAULT 'free'
                          CHECK (plan IN ('free', 'pro', 'advanced', 'business')),
    password_hash         TEXT DEFAULT 'supabase_auth',            -- Supabase auth kullanıldığında sabit değer
    xp                    INTEGER NOT NULL DEFAULT 0,
    level                 INTEGER NOT NULL DEFAULT 1,
    discount_rate         NUMERIC(5,2) DEFAULT 0,
    discount_plan         TEXT,
    discount_deadline     TIMESTAMPTZ,
    subscription_end_date TIMESTAMPTZ,
    photo_url             TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- 5. SİTE AYARLARI
-- =============================================================
CREATE TABLE IF NOT EXISTS public.site_settings (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title               TEXT NOT NULL DEFAULT 'Step of Step',
    description         TEXT DEFAULT '',
    logo_url            TEXT DEFAULT '',
    portal_logo_url     TEXT DEFAULT '',
    favicon_url         TEXT DEFAULT '',
    logo_width_desktop  INTEGER DEFAULT 120,
    logo_width_mobile   INTEGER DEFAULT 40,
    policies            JSONB DEFAULT '[]',
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Başlangıç satırı
INSERT INTO public.site_settings (title, description)
VALUES ('Step of Step', 'Digital Marketing & Creative Agency')
ON CONFLICT DO NOTHING;

-- =============================================================
-- 5. SAYFA SEO
-- =============================================================
CREATE TABLE IF NOT EXISTS public.site_seo (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,           -- Sayfa adı (örn: 'Ana Sayfa')
    path        TEXT NOT NULL UNIQUE,    -- URL yolu (örn: '/')
    title       TEXT,
    description TEXT,
    keywords    TEXT,
    og_image    TEXT,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Existing duplicates cleanup for site_seo
DO $$
BEGIN
    DELETE FROM public.site_seo 
    WHERE id NOT IN (
        SELECT MIN(id::text)::uuid 
        FROM public.site_seo 
        GROUP BY path
    );
END $$;

-- Varsayılan sayfalar
INSERT INTO public.site_seo (name, path, title, description) VALUES
    ('Ana Sayfa',          '/',                    'Step of Step — Dijital Ajans',             'Marka, yazılım ve dijital pazarlama hizmetleri.'),
    ('Hakkımızda',         '/about',               'Hakkımızda — Step of Step',                'Biz kimiz ve ne yapıyoruz?'),
    ('İletişim',           '/contact',             'İletişim — Step of Step',                  'Bize ulaşın.'),
    ('Kariyer',            '/careers',             'Kariyer — Step of Step',                   'Ekibimize katılın.'),
    ('Markalama Hizmeti',  '/services/branding',   'Markalama — Step of Step',                 'Marka kimliği ve tasarım hizmetleri.'),
    ('Yazılım Geliştirme', '/services/development','Yazılım Geliştirme — Step of Step',        'Web ve mobil uygulama geliştirme.'),
    ('Dijital Pazarlama',  '/services/marketing',  'Dijital Pazarlama — Step of Step',         'SEO, sosyal medya ve reklam yönetimi.'),
    ('Profil',             '/profile',             'Profilim — Step of Step',                  'Hesap bilgilerinizi yönetin.')
ON CONFLICT DO NOTHING;

-- =============================================================
-- 6. SMTP AYARLARI
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

-- =============================================================
-- 7. PORTFÖYler
-- =============================================================
CREATE TABLE IF NOT EXISTS public.portfolios (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name           TEXT NOT NULL,
    description    TEXT,
    category       TEXT[],
    image_url      TEXT,
    logo_url       TEXT,
    slug           TEXT UNIQUE,
    featured       BOOLEAN DEFAULT false,
    client_name    TEXT,
    challenge      TEXT,
    solution       TEXT,
    results        JSONB DEFAULT '[]',
    gallery_images JSONB DEFAULT '[]',
    latitude       NUMERIC(10,6),
    longitude      NUMERIC(10,6),
    created_by     UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- 8. ÜYELİK PAKETLERİ
-- =============================================================
CREATE TABLE IF NOT EXISTS public.membership_plans (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name          TEXT NOT NULL,
    slug          TEXT UNIQUE,
    price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0,
    currency      TEXT NOT NULL DEFAULT 'TRY',
    features      JSONB DEFAULT '[]',
    color         TEXT DEFAULT 'bg-zinc-100 text-zinc-600',
    icon          TEXT DEFAULT 'Zap',
    is_popular    BOOLEAN DEFAULT false,
    is_active     BOOLEAN DEFAULT true,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- 9. RANDEVULAR
-- =============================================================
CREATE TABLE IF NOT EXISTS public.appointments (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id            UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
    start_time         TIMESTAMPTZ NOT NULL,
    end_time           TIMESTAMPTZ NOT NULL,
    user_name          TEXT NOT NULL,
    user_email         TEXT NOT NULL,
    user_phone         TEXT,
    status             TEXT NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    meeting_type       TEXT NOT NULL DEFAULT 'online'
                       CHECK (meeting_type IN ('online', 'phone', 'office')),
    notes              TEXT,
    google_event_id    TEXT,
    meeting_link       TEXT,
    meeting_confirmed  BOOLEAN DEFAULT false,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- 10. İŞ BAŞVURULARI
-- =============================================================
CREATE TABLE IF NOT EXISTS public.job_applications (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
    name              TEXT NOT NULL,
    email             TEXT NOT NULL,
    phone             TEXT NOT NULL,
    message           TEXT,
    cv_url            TEXT,
    status            TEXT NOT NULL DEFAULT 'new'
                      CHECK (status IN ('new', 'reviewed', 'interview', 'rejected', 'hired')),
    meeting_link      TEXT,
    meeting_confirmed BOOLEAN DEFAULT false,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- 11. İLETİŞİM MESAJLARI
-- =============================================================
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    phone      TEXT,
    subject    TEXT,
    message    TEXT NOT NULL,
    status     TEXT NOT NULL DEFAULT 'new'
               CHECK (status IN ('new', 'read', 'replied', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- 12. MESAJ CEVAPLARI
-- =============================================================
CREATE TABLE IF NOT EXISTS public.message_replies (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES public.contact_messages(id) ON DELETE CASCADE,
    author_id  UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
    content    TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- 13. BİLDİRİMLER
-- =============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
    type       TEXT NOT NULL DEFAULT 'info'
               CHECK (type IN ('promo', 'system', 'project', 'achievement', 'info', 'warning', 'success', 'error')),
    title      TEXT NOT NULL,
    message    TEXT NOT NULL,
    link       TEXT,
    is_read    BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- 14. ÇARK ÖDÜLLER
-- =============================================================
CREATE TABLE IF NOT EXISTS public.wheel_rewards (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    label       TEXT NOT NULL,
    type        TEXT NOT NULL DEFAULT 'text'
                CHECK (type IN ('text', 'membership_discount', 'file', 'discount', 'free_month', 'xp', 'badge', 'empty')),
    value       NUMERIC(10,2) DEFAULT 0,
    probability NUMERIC(5,2) NOT NULL DEFAULT 10,    -- % olasılık
    color       TEXT DEFAULT '#FF6B35',
    text_color  TEXT DEFAULT '#ffffff',
    icon        TEXT DEFAULT '🎁',
    plan_target TEXT,                                 -- Hangi plan için geçerli?
    reward_value TEXT,                                -- Ödül verisi (indirim oranı vb.)
    file_url    TEXT,
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Başlangıç çark öğeleri (Sadece tablo boşsa ekle)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.wheel_rewards LIMIT 1) THEN
        INSERT INTO public.wheel_rewards (id, label, type, value, probability, color, icon) VALUES
            ('00000000-0000-0000-0000-000000000101', '%10 İndirim',    'discount',   10,  25, '#FF6B35', '🎯'),
            ('00000000-0000-0000-0000-000000000102', '%20 İndirim',    'discount',   20,  15, '#FF8C42', '💰'),
            ('00000000-0000-0000-0000-000000000103', '%30 İndirim',    'discount',   30,  10, '#FFA07A', '🔥'),
            ('00000000-0000-0000-0000-000000000104', '50 XP Kazan',    'xp',         50,  20, '#4ECDC4', '⭐'),
            ('00000000-0000-0000-0000-000000000105', '100 XP Kazan',   'xp',         100, 10, '#45B7D1', '💫'),
            ('00000000-0000-0000-0000-000000000106', 'Ücretsiz Ay',    'free_month', 1,   5,  '#96CEB4', '🎁'),
            ('00000000-0000-0000-0000-000000000107', 'Bir Dahaki Sefere', 'empty',   0,   15, '#FFEAA7', '🍀');
    END IF;
END $$;

-- =============================================================
-- 15. ÇARK DÖNDÜRME LOGu
-- =============================================================
CREATE TABLE IF NOT EXISTS public.wheel_spins (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
    reward_id  UUID REFERENCES public.wheel_rewards(id) ON DELETE SET NULL,
    reward_label TEXT,
    reward_type  TEXT,
    reward_value NUMERIC(10,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- 16. BAŞARIMLAR (Gamification)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.achievements (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title       TEXT NOT NULL,
    description TEXT NOT NULL,
    icon_name   TEXT NOT NULL DEFAULT 'Trophy',
    xp_reward   INTEGER NOT NULL DEFAULT 0,
    rarity      TEXT NOT NULL DEFAULT 'common'
                CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Başlangıç başarımları
INSERT INTO public.achievements (title, description, icon_name, xp_reward, rarity) VALUES
    ('İlk Giriş',       'Platforma ilk kez giriş yaptın!',            'Star',        50,  'common'),
    ('Çarkı Döndür',    'Çekilişe ilk kez katıldın.',                  'Gift',        75,  'common'),
    ('Sadık Üye',       '7 gün üst üste giriş yaptın.',               'Calendar',    200, 'rare'),
    ('Uygulama Kaşifi', '5 farklı uygulamayı kullandın.',              'Compass',     150, 'rare'),
    ('Pro Kullanıcı',   'Pro plana yükseltme yaptın.',                 'Zap',         300, 'epic'),
    ('Süper Kahraman',  'Tüm başarımları tamamladın.',                 'Crown',       1000,'legendary')
ON CONFLICT DO NOTHING;

-- =============================================================
-- 17. KULLANICI BAŞARIMLARI
-- =============================================================
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id        UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
    unlocked_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- =============================================================
-- 18. GÜNLÜK SERILER (Streak)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.daily_streaks (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID NOT NULL UNIQUE REFERENCES public.app_users(id) ON DELETE CASCADE,
    current_streak   INTEGER NOT NULL DEFAULT 0,
    last_claim_date  DATE,
    total_claims     INTEGER NOT NULL DEFAULT 0,
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- 19. UYGULAMA KULLANIM İSTATİSTİKLERİ
-- =============================================================
CREATE TABLE IF NOT EXISTS public.app_usage (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id        UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
    app_id         TEXT NOT NULL,
    app_name       TEXT NOT NULL,
    total_seconds  INTEGER NOT NULL DEFAULT 0,
    last_used      TIMESTAMPTZ,
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, app_id)
);

-- =============================================================
-- 20. AKTİVİTE LOGU
-- =============================================================
CREATE TABLE IF NOT EXISTS public.activity_log (
    id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id   UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
    app_id    TEXT NOT NULL,
    app_name  TEXT NOT NULL,
    action    TEXT NOT NULL DEFAULT 'Opened App',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- 21. PROJE AKTİVİTELERİ (Live Widget)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.project_activities (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_name  TEXT NOT NULL DEFAULT 'Ekip Üyesi',
    type       TEXT NOT NULL DEFAULT 'info'
               CHECK (type IN ('figma', 'code', 'image', 'check', 'info')),
    action     TEXT NOT NULL,
    details    TEXT,
    is_active  BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- ROW LEVEL SECURITY (RLS) POLİTİKALARI
-- Tüm policy'ler idempotent: DROP IF EXISTS → CREATE
-- =============================================================

-- app_users
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile"       ON public.app_users;
DROP POLICY IF EXISTS "Users can update own profile"     ON public.app_users;
DROP POLICY IF EXISTS "Service role bypass"              ON public.app_users;
CREATE POLICY "Users can view own profile"
    ON public.app_users FOR SELECT
    USING (auth.uid() = auth_id);
CREATE POLICY "Users can update own profile"
    ON public.app_users FOR UPDATE
    USING (auth.uid() = auth_id);
CREATE POLICY "Service role bypass"
    ON public.app_users
    USING (true)
    WITH CHECK (true);

-- notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own notifications" ON public.notifications;
CREATE POLICY "Users can manage own notifications"
    ON public.notifications FOR ALL
    USING (user_id IN (SELECT id FROM public.app_users WHERE auth_id = auth.uid()));

-- wheel_spins
ALTER TABLE public.wheel_spins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own spins"   ON public.wheel_spins;
DROP POLICY IF EXISTS "Users can insert own spins" ON public.wheel_spins;
CREATE POLICY "Users can view own spins"
    ON public.wheel_spins FOR SELECT
    USING (user_id IN (SELECT id FROM public.app_users WHERE auth_id = auth.uid()));
CREATE POLICY "Users can insert own spins"
    ON public.wheel_spins FOR INSERT
    WITH CHECK (user_id IN (SELECT id FROM public.app_users WHERE auth_id = auth.uid()));

-- user_achievements
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own achievements"   ON public.user_achievements;
DROP POLICY IF EXISTS "Users can insert own achievements" ON public.user_achievements;
CREATE POLICY "Users can view own achievements"
    ON public.user_achievements FOR SELECT
    USING (user_id IN (SELECT id FROM public.app_users WHERE auth_id = auth.uid()));
CREATE POLICY "Users can insert own achievements"
    ON public.user_achievements FOR INSERT
    WITH CHECK (user_id IN (SELECT id FROM public.app_users WHERE auth_id = auth.uid()));

-- daily_streaks
ALTER TABLE public.daily_streaks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own streak" ON public.daily_streaks;
CREATE POLICY "Users can manage own streak"
    ON public.daily_streaks FOR ALL
    USING (user_id IN (SELECT id FROM public.app_users WHERE auth_id = auth.uid()));

-- app_usage
ALTER TABLE public.app_usage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own app usage" ON public.app_usage;
CREATE POLICY "Users can manage own app usage"
    ON public.app_usage FOR ALL
    USING (user_id IN (SELECT id FROM public.app_users WHERE auth_id = auth.uid()));

-- activity_log
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own activity" ON public.activity_log;
CREATE POLICY "Users can manage own activity"
    ON public.activity_log FOR ALL
    USING (user_id IN (SELECT id FROM public.app_users WHERE auth_id = auth.uid()));

-- portfolios
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view portfolios"    ON public.portfolios;
DROP POLICY IF EXISTS "Admins can manage portfolios"  ON public.portfolios;
CREATE POLICY "Anyone can view portfolios"
    ON public.portfolios FOR SELECT USING (true);
CREATE POLICY "Admins can manage portfolios"
    ON public.portfolios FOR ALL
    USING (EXISTS (SELECT 1 FROM public.app_users WHERE auth_id = auth.uid() AND role = 'admin'));

-- wheel_rewards
ALTER TABLE public.wheel_rewards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view wheel rewards" ON public.wheel_rewards;
CREATE POLICY "Anyone can view wheel rewards"
    ON public.wheel_rewards FOR SELECT USING (true);

-- achievements
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view achievements" ON public.achievements;
CREATE POLICY "Anyone can view achievements"
    ON public.achievements FOR SELECT USING (true);

-- membership_plans
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view plans" ON public.membership_plans;
CREATE POLICY "Anyone can view plans"
    ON public.membership_plans FOR SELECT USING (true);

-- site_settings
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view site settings" ON public.site_settings;
CREATE POLICY "Anyone can view site settings"
    ON public.site_settings FOR SELECT USING (true);

-- site_seo
ALTER TABLE public.site_seo ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view site seo" ON public.site_seo;
CREATE POLICY "Anyone can view site seo"
    ON public.site_seo FOR SELECT USING (true);

-- contact_messages
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Users can view own messages"        ON public.contact_messages;
CREATE POLICY "Anyone can insert contact messages"
    ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own messages"
    ON public.contact_messages FOR SELECT
    USING (user_id IN (SELECT id FROM public.app_users WHERE auth_id = auth.uid())
           OR email = (SELECT email FROM public.app_users WHERE auth_id = auth.uid())
           OR EXISTS (SELECT 1 FROM public.app_users WHERE auth_id = auth.uid() AND role = 'admin'));

-- job_applications
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can insert job application" ON public.job_applications;
CREATE POLICY "Anyone can insert job application"
    ON public.job_applications FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can view own job application" ON public.job_applications;
CREATE POLICY "Users can view own job application"
    ON public.job_applications FOR SELECT
    USING (user_id IN (SELECT id FROM public.app_users WHERE auth_id = auth.uid())
           OR email = (SELECT email FROM public.app_users WHERE auth_id = auth.uid())
           OR EXISTS (SELECT 1 FROM public.app_users WHERE auth_id = auth.uid() AND role = 'admin'));

-- project_activities (Public View)
ALTER TABLE public.project_activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view activities" ON public.project_activities;
CREATE POLICY "Anyone can view activities"
    ON public.project_activities FOR SELECT USING (true);

-- appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can insert appointment"    ON public.appointments;
DROP POLICY IF EXISTS "Users can view own appointments" ON public.appointments;
CREATE POLICY "Anyone can insert appointment"
    ON public.appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own appointments"
    ON public.appointments FOR SELECT
    USING (user_id IN (SELECT id FROM public.app_users WHERE auth_id = auth.uid())
           OR EXISTS (SELECT 1 FROM public.app_users WHERE auth_id = auth.uid() AND role = 'admin'));

-- roles
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can view roles" ON public.roles;
CREATE POLICY "Authenticated can view roles"
    ON public.roles FOR SELECT USING (auth.role() = 'authenticated');

-- team_members
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can view team members" ON public.team_members;
CREATE POLICY "Authenticated can view team members"
    ON public.team_members FOR SELECT USING (auth.role() = 'authenticated');

-- smtp_settings
ALTER TABLE public.smtp_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view smtp" ON public.smtp_settings;
CREATE POLICY "Admins can view smtp"
    ON public.smtp_settings FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.app_users WHERE auth_id = auth.uid() AND (role = 'admin' OR role = 'designer')));

DROP POLICY IF EXISTS "Admins can manage smtp" ON public.smtp_settings;
CREATE POLICY "Admins can manage smtp"
    ON public.smtp_settings FOR ALL
    USING (EXISTS (SELECT 1 FROM public.app_users WHERE auth_id = auth.uid() AND role = 'admin'));

-- wheel_rewards
ALTER TABLE public.wheel_rewards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view active rewards" ON public.wheel_rewards;
CREATE POLICY "Anyone can view active rewards"
    ON public.wheel_rewards FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage rewards" ON public.wheel_rewards;
CREATE POLICY "Admins can manage rewards"
    ON public.wheel_rewards FOR ALL
    USING (EXISTS (SELECT 1 FROM public.app_users WHERE auth_id = auth.uid() AND role = 'admin'));

-- =============================================================
-- REALTIME (Bildirimler için) — idempotent
-- =============================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
END $$;

-- =============================================================
-- VARSAYILAN VERİLER (En sonda çalıştırılır)
-- =============================================================

-- Üyelik Planları
INSERT INTO public.membership_plans (id, name, slug, price_monthly, currency, features, color, icon, is_popular, is_active) VALUES
    ('00000000-0000-0000-0000-000000000201', 'Free',     'free',     0,    'TRY', '["Temel özellikler", "1 GB depolama"]', 'bg-zinc-100 text-zinc-600', 'Zap', false, true),
    ('00000000-0000-0000-0000-000000000202', 'Pro',      'pro',      299,  'TRY', '["Gelişmiş özellikler", "10 GB depolama", "Öncelikli destek"]', 'bg-orange-100 text-orange-600', 'Star', true, true),
    ('00000000-0000-0000-0000-000000000203', 'Advanced', 'advanced', 599,  'TRY', '["Tüm Pro özellikler", "50 GB depolama", "API erişimi"]', 'bg-purple-100 text-purple-600', 'Zap', false, true),
    ('00000000-0000-0000-0000-000000000204', 'Business', 'business', 1299, 'TRY', '["Sınırsız her şey", "Özel destek", "SLA garantisi"]', 'bg-blue-100 text-blue-600', 'Shield', false, true)
ON CONFLICT (slug) DO NOTHING;

-- =============================================================
-- TAMAMLANDI
-- Toplam Tablo: 20
-- app_users, roles, team_members, site_settings, site_seo,
-- smtp_settings, portfolios, membership_plans, appointments,
-- job_applications, contact_messages, message_replies,
-- notifications, wheel_rewards, wheel_spins, achievements,
-- user_achievements, daily_streaks, app_usage, activity_log
-- =============================================================

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_app_users_auth_id ON public.app_users(auth_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_wheel_spins_user_id ON public.wheel_spins(user_id);
CREATE INDEX IF NOT EXISTS idx_wheel_spins_created_at ON public.wheel_spins(created_at);
