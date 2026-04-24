-- 1. Trigger Function Oluştur
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.app_users (id, auth_id, email, name, role, plan, created_at, updated_at)
  VALUES (
    new.id, -- Use same ID as Auth ID for simplicity, or generate new UUID
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'user',
    'free',
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO UPDATE SET
    auth_id = EXCLUDED.auth_id,
    updated_at = NOW();
  return new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger'ı Auth.users tablosuna bağla
-- Önce eski trigger varsa sil
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Trigger'ı oluştur
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Mevcut kullanıcıları senkronize et (Eksik olanları ekle)
INSERT INTO public.app_users (auth_id, email, name, role, plan)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)),
  'user',
  'free'
FROM auth.users
WHERE email NOT IN (SELECT email FROM public.app_users)
ON CONFLICT (email) DO NOTHING;
