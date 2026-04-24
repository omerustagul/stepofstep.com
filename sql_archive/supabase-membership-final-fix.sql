-- Create membership_plans table if it doesn't exist
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

-- Enable RLS
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;

-- Policy for viewing (everyone can see plans)
DROP POLICY IF EXISTS "Public view membership plans" ON membership_plans;
CREATE POLICY "Public view membership plans" ON membership_plans
    FOR SELECT USING (true);

-- Policy for managing (admins only)
DROP POLICY IF EXISTS "Admin manage membership plans" ON membership_plans;
CREATE POLICY "Admin manage membership plans" ON membership_plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM app_users 
            WHERE auth_id = auth.uid() AND role = 'admin'
        )
    );

-- Clear existing and seed correct plans
TRUNCATE TABLE membership_plans;

INSERT INTO membership_plans (id, name, price_monthly, features, color, icon, is_popular)
VALUES 
('pro', 'Pro Plan', 299, '["Tüm Premium Araçlar", "Sınırsız Proje", "Öncelikli Destek", "API Erişimi"]', 'bg-orange-100 text-orange-600', 'Zap', true),
('advanced', 'Advanced Plan', 599, '["AI Destekli Araçlar", "Gelişmiş Analitik", "Özel Entegrasyonlar", "7/24 Destek"]', 'bg-purple-100 text-purple-600', 'Star', false),
('business', 'Business Plan', 999, '["Özel Çözümler", "Dedicated Manager", "SLA Anlaşması", "White-labeling"]', 'bg-blue-100 text-blue-600', 'CreditCard', false);
