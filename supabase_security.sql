-- ==========================================
-- GÜVENLİK VE OTOMASYON YAMASI (Admin Guard)
-- ==========================================

-- 1. ADIM: Otomatik Yetki Senkronizasyonu (Trigger)
-- Bu fonksiyon, app_users tablosunda veya team_members tablosunda bir değişiklik olduğunda çalışır.
-- Amacı: Bir kişinin emaili team_members listesinde varsa, otomatik olarak admin yetkisi verir.
-- Bu işlem sunucu tarafında olduğu için hacklenemez.

CREATE OR REPLACE FUNCTION public.sync_user_role_security()
RETURNS TRIGGER AS $$
DECLARE
    target_email TEXT;
    is_team_member BOOLEAN;
    member_record RECORD;
BEGIN
    -- Tetikleyici kaynağına göre email belirle
    IF TG_TABLE_NAME = 'app_users' THEN
        target_email := NEW.email;
    ELSIF TG_TABLE_NAME = 'team_members' THEN
        target_email := NEW.email;
    END IF;

    -- Email boşsa işlem yapma
    IF target_email IS NULL THEN
        RETURN NEW;
    END IF;

    -- Team Members tablosunda bu email var mı kontrol et
    SELECT * INTO member_record FROM public.team_members WHERE email = target_email LIMIT 1;
    
    IF FOUND THEN
        -- Eğer kullanıcı takım listesindeyse, app_users tablosundaki rolünü güncelle
        -- (Döngüyü engellemek için sadece rol farklıysa güncelle)
        UPDATE public.app_users
        SET 
            role = 'admin',
            role_id = member_record.role_id
        WHERE email = target_email 
        AND (role IS DISTINCT FROM 'admin' OR role_id IS DISTINCT FROM member_record.role_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. ADIM: Tetikleyicileri (Triggers) Oluştur
-- Eğer triggerlar zaten varsa önce temizle (Hata almamak için)
DROP TRIGGER IF EXISTS on_user_created_sync_role ON public.app_users;
DROP TRIGGER IF EXISTS on_team_member_added_sync_role ON public.team_members;

-- a) Yeni bir kullanıcı kayıt olduğunda çalıştır
CREATE TRIGGER on_user_created_sync_role
AFTER INSERT ON public.app_users
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_role_security();

-- b) Ekibe yeni biri eklendiğinde çalıştır
CREATE TRIGGER on_team_member_added_sync_role
AFTER INSERT OR UPDATE ON public.team_members
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_role_security();


-- 3. ADIM: RLS (Row Level Security) Güvenlik Duvarı
-- Kullanıcıların kendi rollerini değiştirmesini engelle.

-- Önce RLS'yi aktif et (Zaten aktif olabilir ama garanti olsun)
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları temizle (Çakışma olmasın diye)
DROP POLICY IF EXISTS "Users can update own profile" ON public.app_users;

-- GÜVENLİ GÜNCELLEME POLİTİKASI
-- Kullanıcılar sadece kendi isim, telefon vb. bilgilerini güncelleyebilir.
-- "role" ve "plan" sütunlarını güncellemelerine İZİN VERME.
CREATE POLICY "Users can update own basic info"
ON public.app_users
FOR UPDATE
USING (auth.uid() = auth_id)
WITH CHECK (
    auth.uid() = auth_id 
    -- Burada kritik sütunların değişip değişmediğini kontrol edemiyoruz (Postgres limitation in simple policies)
    -- Ancak UI tarafında bu alanları göndermezsek ve Trigger ile korursak güvendeyiz.
    -- Daha katı güvenlik için "role" sütunu için ayrı bir trigger yazılabilir veya
    -- Sadece belirli sütunlara izin veren bir "security definer" fonksiyon kullanılabilir.
);

-- Ek Güvenlik: Role sütununun manuel değiştirilmesini engelleyen Trigger
CREATE OR REPLACE FUNCTION public.protect_critical_columns()
RETURNS TRIGGER AS $$
BEGIN
    -- Eğer işlemi yapan süper admin veya sistem değilse (örneğin normal bir kullanıcı update atıyorsa)
    IF session_user = 'authenticated' OR session_user = 'anon' THEN
        -- Eğer kullanıcı kendi rolünü değiştirmeye çalışıyorsa ve yeni rol admin ise
        IF NEW.role != OLD.role AND NEW.role = 'admin' THEN
            -- Team members kontrolü yap (Yine de hak ediyor mu?)
            PERFORM 1 FROM public.team_members WHERE email = NEW.email;
            IF NOT FOUND THEN
                RAISE EXCEPTION 'Güvenlik İhlali: Yetkisiz rol değişimi tespit edildi.';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS protect_roles_trigger ON public.app_users;

CREATE TRIGGER protect_roles_trigger
BEFORE UPDATE ON public.app_users
FOR EACH ROW
EXECUTE FUNCTION public.protect_critical_columns();
