-- Reset membership plans
TRUNCATE TABLE membership_plans;

-- Insert the 3 specific tiers as requested
INSERT INTO membership_plans (id, name, price_monthly, features, color, icon, is_popular)
VALUES 
('pro', 'Pro Plan', 299, '["Tüm Premium Araçlar", "Sınırsız Proje", "Öncelikli Destek", "API Erişimi"]', 'bg-orange-100 text-orange-600', 'Zap', true),
('advanced', 'Advanced Plan', 599, '["AI Destekli Araçlar", "Gelişmiş Analitik", "Özel Entegrasyonlar", "7/24 Destek"]', 'bg-purple-100 text-purple-600', 'Star', false),
('business', 'Business Plan', 999, '["Özel Çözümler", "Dedicated Manager", "SLA Anlaşması", "White-labeling"]', 'bg-blue-100 text-blue-600', 'CreditCard', false);

-- Note: We are NOT removing 'free' from users, but it won't be in the membership_plans table as an upgradeable option.
-- This ensures 'free' users keep their status but see the 3 paid options for upgrading.
