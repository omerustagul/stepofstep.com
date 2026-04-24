
# Google Analytics Backend Setup Guide

Dashboard üzerindeki "Canlı Veri" (Ziyaretçi Sayısı, Oturum Süresi vb.) kartlarının çalışması için bir **Google Cloud Service Account** oluşturulması ve bu hesabın Supabase'e tanıtılması gerekmektedir.

## 1. Google Cloud Service Account Oluşturma

1.  [Google Cloud Console](https://console.cloud.google.com/)'a gidin.
2.  Yeni bir proje oluşturun veya mevcut projenizi seçin.
3.  **APIs & Services > Library** menüsüne gidin ve **"Google Analytics Data API"** aratıp etkinleştirin (Enable).
4.  **IAM & Admin > Service Accounts** menüsüne gidin.
5.  **"Create Service Account"** butonuna tıklayın.
    *   İsim: `analytics-fetcher` (veya istediğiniz bir isim).
    *   Role: Gerekli değil, boş bırakabilirsiniz.
6.  Oluşturulan hesabın üzerine tıklayın, **"Keys"** sekmesine gidin.
7.  **"Add Key" > "Create new key"** seçeneğine tıklayın.
8.  **JSON** formatını seçip "Create" deyin. Bilgisayarınıza bir JSON dosyası inecektir.

## 2. Google Analytics Erişimi Verme

1.  İndirdiğiniz JSON dosyasını bir metin editörüyle açın ve `"client_email"` değerini (örn: `analytics-fetcher@...iam.gserviceaccount.com`) kopyalayın.
2.  [Google Analytics](https://analytics.google.com/)'e gidin.
3.  **Yönetici > Mülk Ayarları > Mülk Erişimi Yönetimi** (Property Access Management) menüsüne gidin.
4.  Sağ üstteki **"+"** ikonuna basıp "Kullanıcı Ekle" deyin.
5.  Kopyaladığınız email adresini yapıştırın ve **"Görüntüleyen" (Viewer)** rolü verip ekleyin.

## 3. Supabase Kurulumu

Bu adımda oluşturduğumuz Edge Function'ı yayınlamamız ve anahtarları tanımlamamız gerekiyor.

Terminalde (Proje klasöründe):

```bash
# 1. Supabase'e giriş yapın (Eğer yapmadıysanız)
npx supabase login

# 2. Servis Hesabı JSON içeriğini Secret olarak ekleyin
# JSON dosyasının tamamını tek satır (minify) haline getirip yapıştırın veya doğrudan dosya içeriğini kullanın.
npx supabase secrets set GOOGLE_SERVICE_ACCOUNT='{...JSON_ICERIGI_BURAYA...}'

# 3. Analytics Property ID'yi ekleyin (Analytics > Yönetici > Mülk Ayarları > Mülk Ayrıntıları'nda yazar, örn: 342512345)
npx supabase secrets set GOOGLE_ANALYTICS_PROPERTY_ID='342512345'

# 4. Fonksiyonu yayınlayın
npx supabase functions deploy fetch-analytics --no-verify-jwt
```

## Sonuç

Bu adımları tamamladığınızda Dashboard sayfasını yenileyin. Artık "Google Analytics 4" kartında gerçek veriler (Ziyaretçi, Süre, Hemen Çıkma Oranı vb.) görünecektir.
