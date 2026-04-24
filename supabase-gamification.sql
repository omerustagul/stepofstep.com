-- GAMIFICATION SYSTEM
-- Tables for Achievements, User Progress, and Daily Rewards

-- 1. Levels & XP System (Update app_users)
ALTER TABLE public.app_users 
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.app_users(id);

-- 2. Achievements Definitions
CREATE TABLE IF NOT EXISTS public.achievements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon_name TEXT NOT NULL, -- Lucide icon name or asset path
    xp_reward INTEGER DEFAULT 100,
    rarity TEXT CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')) DEFAULT 'common',
    condition_type TEXT, -- 'manual', 'event_count', 'profile_complete' etc.
    condition_value INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. User Unlocked Achievements
CREATE TABLE IF NOT EXISTS public.user_achievements (
    user_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE,
    achievement_id TEXT REFERENCES public.achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (user_id, achievement_id)
);

-- 4. Daily Streak System
CREATE TABLE IF NOT EXISTS public.daily_streaks (
    user_id UUID PRIMARY KEY REFERENCES public.app_users(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    last_claim_date DATE,
    total_claims INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS POLICIES

-- Read: Everyone can read definitions, users can read their own progress
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read achievements" ON public.achievements FOR SELECT USING (true);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own achievements" ON public.user_achievements 
FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.daily_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own streaks" ON public.daily_streaks 
FOR SELECT USING (auth.uid() = user_id);

-- Write: Only system/admin (or strict constraints). 
-- For MVP, allowing authenticated users to insert/update their own (e.g. claim daily)
-- In production, this should be done via Edge Functions to prevent cheating.
CREATE POLICY "Users update own streaks" ON public.daily_streaks 
FOR ALL USING (auth.uid() = user_id);

-- Seed Initial Achievements
INSERT INTO public.achievements (id, title, description, icon_name, xp_reward, rarity) VALUES
('first-login', 'İlk Adım', 'Platforma ilk kez giriş yaptın.', 'Footprints', 50, 'common'),
('profile-complete', 'Kimlik Doğrulandı', 'Profil bilgilerini eksiksiz doldurdun.', 'UserCheck', 100, 'common'),
('first-project', 'Proje Başlangıcı', 'İlk projeni başlattın.', 'Rocket', 200, 'rare'),
('social-connector', 'Sosyal Kelebek', 'Sosyal medya hesaplarını bağladın.', 'Share2', 150, 'common'),
('night-owl', 'Gece Kuşu', 'Gece yarısından sonra sistemi kullandın.', 'Moon', 300, 'epic')
ON CONFLICT (id) DO NOTHING;
