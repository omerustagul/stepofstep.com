-- ==========================================
-- EKSİK KOLON VE TABLO ONARIMI (Fix Schema)
-- ==========================================

-- 1. team_members tablosuna role_id ekle (Eğer yoksa)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'team_members' AND column_name = 'role_id') THEN
        ALTER TABLE public.team_members ADD COLUMN role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. app_users tablosuna role_id ekle (Eğer yoksa)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_users' AND column_name = 'role_id') THEN
        ALTER TABLE public.app_users ADD COLUMN role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. roles tablosunun varlığını ve yapısını garantiye al
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    permissions JSONB DEFAULT '{}'::jsonb,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Rolleri kontrol et, hiç rol yoksa varsayılanları ekle
INSERT INTO public.roles (name, permissions, is_default)
SELECT 'Yönetici', '{"dashboard": "edit", "jobs": "edit", "appointments": "edit", "users": "edit", "members": "edit", "wheel": "edit", "policies": "edit", "settings": "edit", "messages": "edit", "portfolios": "edit"}', true
WHERE NOT EXISTS (SELECT 1 FROM public.roles);

INSERT INTO public.roles (name, permissions, is_default)
SELECT 'Personel', '{"dashboard": "view", "jobs": "view", "appointments": "view", "users": "none", "members": "view", "wheel": "none", "policies": "none", "settings": "none", "messages": "view", "portfolios": "view"}', false
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE name = 'Personel');
