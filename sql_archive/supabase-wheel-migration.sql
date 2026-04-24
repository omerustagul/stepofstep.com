-- ==========================================
-- WHEEL OF FORTUNE DATABASE SETUP
-- ==========================================

-- 1. Create wheel_rewards table
CREATE TABLE IF NOT EXISTS public.wheel_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL,
    value TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#f97316',
    text_color TEXT NOT NULL DEFAULT '#ffffff',
    probability INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create wheel_spins table (tracking usage)
CREATE TABLE IF NOT EXISTS public.wheel_spins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE,
    reward_id UUID REFERENCES public.wheel_rewards(id) ON DELETE SET NULL,
    spin_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.wheel_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wheel_spins ENABLE ROW LEVEL SECURITY;

-- 4. Policies for wheel_rewards
DO $$ BEGIN
    DROP POLICY IF EXISTS "Public Read Rewards" ON public.wheel_rewards;
    CREATE POLICY "Public Read Rewards" ON public.wheel_rewards FOR SELECT USING (true);
EXCEPTION WHEN undefined_object THEN NULL; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Admin All Rewards" ON public.wheel_rewards;
    CREATE POLICY "Admin All Rewards" ON public.wheel_rewards FOR ALL USING (
        EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role = 'admin')
    );
EXCEPTION WHEN undefined_object THEN NULL; END $$;

-- 5. Policies for wheel_spins
DO $$ BEGIN
    DROP POLICY IF EXISTS "User Spin History" ON public.wheel_spins;
    CREATE POLICY "User Spin History" ON public.wheel_spins FOR SELECT USING (
        user_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role = 'admin')
    );
EXCEPTION WHEN undefined_object THEN NULL; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Allow Spin Insert" ON public.wheel_spins;
    CREATE POLICY "Allow Spin Insert" ON public.wheel_spins FOR INSERT WITH CHECK (true);
EXCEPTION WHEN undefined_object THEN NULL; END $$;

-- 6. Initial Data (Optional)
INSERT INTO public.wheel_rewards (label, value, color, text_color, probability)
VALUES 
('1 Ay Pro', '1 Aylık Pro Üyelik', '#f97316', '#ffffff', 10),
('%50 İndirim', '%50 İndirim Kuponu', '#18181b', '#ffffff', 5),
('1 Ay Basic', '1 Aylık Basic Üyelik', '#f97316', '#ffffff', 20),
('%20 İndirim', '%20 İndirim Kuponu', '#18181b', '#ffffff', 30),
('Tekrar Dene', 'Tekrar Deneyin', '#71717a', '#ffffff', 35)
ON CONFLICT DO NOTHING;
