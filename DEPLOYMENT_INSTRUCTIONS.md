# Yayına Alma ve Kurulum Talimatları

Proje son haline getirilmiş, gerçek veriler ve yapay zeka entegrasyonu sağlanmıştır. Çalışır hale getirmek için yapılması gerekenler:

## 1. Veritabanı Kurulumu
"Canlı Proje Akışı" (Live Project Widget) özelliğinin çalışması için veritabanında tablo oluşturulmalıdır.

1.  Supabase Dashboard'a gidin.
2.  SQL Editor'ü açın.
3.  Proje kök dizinindeki `supabase-create-project-activities.sql` dosyasının içeriğini yapıştırın ve çalıştırın.

## 2. Gemini AI Kurulumu
Yapay zeka asistanının (StepAI) çalışması için Edge Function deploy edilmelidir.

1.  Terminali açın ve proje dizinine gidin.
2.  Fonksiyonu deploy edin:
    ```bash
    npx supabase functions deploy gemini-generate --no-verify-jwt
    ```
    *(Not: `--no-verify-jwt` bayrağı, fonksiyonun herkes tarafından çağrılabilmesini sağlar. Prodüksiyonda bunu kaldırıp client tarafında Authorization header kullanmanız önerilir, ancak şu anki kod herkese açık çalışacak şekilde ayarlandı.)*

3.  Google Gemini API Anahtarı Tanımlayın:
    ```bash
    npx supabase secrets set GEMINI_API_KEY=AIza.....
    ```
    *API anahtarınız yoksa [Google AI Studio](https://aistudio.google.com/)'dan alabilirsiniz.*

## Son Kontroller
- `LiveProjectWidget.tsx` artık `project_activities` tablosunu dinlemektedir. Tablo boşsa widget "Henüz aktivite yok" diyecektir. Test için tabloya manuel veri ekleyebilirsiniz.
- `StepAI.tsx`, `gemini-generate` fonksiyonunu çağırmaktadır. Fonksiyon deploy edilmezse hata verecektir.
