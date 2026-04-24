-- Create membership_plans table
CREATE TABLE IF NOT EXISTS public.membership_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price_monthly NUMERIC NOT NULL DEFAULT 0,
    features JSONB NOT NULL DEFAULT '[]',
    color TEXT,
    icon TEXT,
    is_popular BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed initial plans
INSERT INTO public.membership_plans (id, name, price_monthly, features, color, icon, is_popular)
VALUES 
('free', 'Free', 0, '["Temel Araçlar", "3 Proje", "Topluluk Desteği"]', 'bg-zinc-100 text-zinc-600', 'Shield', false),
('pro', 'Pro', 299, '["Tüm Premium Araçlar", "Sınırsız Proje", "Öncelikli Destek", "API Erişimi"]', 'bg-orange-100 text-orange-600', 'Zap', true),
('advanced', 'Advanced', 599, '["AI Destekli Araçlar", "Gelişmiş Analitik", "Özel Entegrasyonlar", "7/24 Destek"]', 'bg-purple-100 text-purple-600', 'Star', false),
('business', 'Business', 999, '["Özel Çözümler", "Dedicated Manager", "SLA Anlaşması", "White-labeling"]', 'bg-blue-100 text-blue-600', 'CreditCard', false)
ON CONFLICT (id) DO NOTHING;

-- Add discount columns to app_users
ALTER TABLE public.app_users 
ADD COLUMN IF NOT EXISTS discount_rate INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_plan TEXT;

-- Update wheel_rewards type enum (Supabase enums are tricky to update, we'll just handle it in app logic if needed, but adding a comment here)
COMMENT ON COLUMN public.wheel_rewards.reward_type IS 'text, membership, discount, file, membership_discount';
