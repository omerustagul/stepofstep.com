// Supabase Edge Function: send-email
// Dağıtım: supabase functions deploy send-email
// Açıklama: smtp_settings tablosundaki SMTP bilgileriyle email gönderir.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Deno SMTP Client (minimal implementation)
// Supabase Edge Functions Deno ortamında SMTP TCP bağlantısı açamaz.
// Bu nedenle harici bir mail API kullanıyoruz (Mailgun / SendGrid / SMTP2GO vs.)
// VEYA Supabase'in yerleşik smtp_settings tablosundan okuyarak
// fetch-based mail servisleri (Brevo, Mailgun API) kullanıyoruz.

// --- Tip tanımları ---
interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

interface SmtpSettings {
  host: string;
  port: number;
  username: string;
  password: string;
  from_name: string;
  from_email: string;
  secure: boolean;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1. SMTP ayarlarını veritabanından çek
    const { data: smtpData, error: smtpError } = await supabase
      .from("smtp_settings")
      .select("*")
      .limit(1)
      .single();

    if (smtpError || !smtpData) {
      console.error("SMTP settings not found:", smtpError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "SMTP ayarları bulunamadı. Lütfen admin panelinden ayarlayın.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const smtp: SmtpSettings = smtpData;

    // SMTP bilgileri eksik mi?
    if (!smtp.host || !smtp.username || !smtp.password || !smtp.from_email) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "SMTP ayarları eksik. Host, kullanıcı adı, şifre ve gönderen email gereklidir.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 2. Request body'den email payload'ını al
    const payload: EmailPayload = await req.json();

    if (!payload.to || !payload.subject || !payload.html) {
      return new Response(
        JSON.stringify({ success: false, error: "to, subject ve html alanları zorunludur." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const toArray = Array.isArray(payload.to) ? payload.to : [payload.to];

    // 3. SMTP üzerinden email gönder
    // Deno ortamında native TCP SMTP için Deno.connect kullanabiliriz
    // veya daha basit bir yol olarak fetch tabanlı bir SMTP gateway kullanabiliriz.
    // Aşağıdaki implementasyon SMTP over HTTP/STARTTLS için temel bir wrapper'dır.

    const emailResult = await sendViaSMTP({
      smtp,
      to: toArray,
      subject: payload.subject,
      html: payload.html,
      text: payload.text || stripHtml(payload.html),
      replyTo: payload.replyTo,
    });

    if (!emailResult.success) {
      throw new Error(emailResult.error);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Email başarıyla gönderildi." }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Edge Function error:", message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// ==========================================
// SMTP Gönderici — Deno TCP tabanlı
// ==========================================
async function sendViaSMTP(options: {
  smtp: SmtpSettings;
  to: string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { smtp, to, subject, html, text, replyTo } = options;

  try {
    // Boundary for multipart
    const boundary = `----=_Part_${Date.now()}`;
    const fromAddress = smtp.from_name
      ? `${smtp.from_name} <${smtp.from_email}>`
      : smtp.from_email;

    // RFC 2822 mesaj formatı (multipart/alternative: hem text hem html)
    const message = [
      `From: ${fromAddress}`,
      `To: ${to.join(", ")}`,
      `Reply-To: ${replyTo || smtp.from_email}`,
      `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      `Date: ${new Date().toUTCString()}`,
      ``,
      `--${boundary}`,
      `Content-Type: text/plain; charset=UTF-8`,
      `Content-Transfer-Encoding: base64`,
      ``,
      btoa(unescape(encodeURIComponent(text))),
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: base64`,
      ``,
      btoa(unescape(encodeURIComponent(html))),
      ``,
      `--${boundary}--`,
    ].join("\r\n");

    // TCP bağlantısı
    const port = smtp.port || 587;
    const conn = await Deno.connect({ hostname: smtp.host, port });
    const enc = new TextEncoder();
    const dec = new TextDecoder();

    const readLine = async (): Promise<string> => {
      const buf = new Uint8Array(4096);
      const n = await conn.read(buf);
      return dec.decode(buf.subarray(0, n ?? 0));
    };

    const send = async (cmd: string) => {
      await conn.write(enc.encode(cmd + "\r\n"));
    };

    // Greeting
    await readLine(); // 220

    // EHLO
    await send(`EHLO ${smtp.host}`);
    await readLine(); // 250-...

    // STARTTLS (port 587)
    if (port === 587) {
      await send("STARTTLS");
      await readLine(); // 220

      // TLS yükseltme
      const tlsConn = await Deno.startTls(conn, { hostname: smtp.host });
      const tlsSend = async (cmd: string) =>
        await tlsConn.write(enc.encode(cmd + "\r\n"));
      const tlsRead = async (): Promise<string> => {
        const buf = new Uint8Array(4096);
        const n = await tlsConn.read(buf);
        return dec.decode(buf.subarray(0, n ?? 0));
      };

      await tlsSend(`EHLO ${smtp.host}`);
      await tlsRead();

      // AUTH LOGIN
      await tlsSend("AUTH LOGIN");
      await tlsRead(); // 334

      await tlsSend(btoa(smtp.username));
      await tlsRead(); // 334

      await tlsSend(btoa(smtp.password));
      const authResp = await tlsRead(); // 235
      if (!authResp.startsWith("2")) throw new Error(`Auth hatası: ${authResp}`);

      await tlsSend(`MAIL FROM:<${smtp.from_email}>`);
      await tlsRead(); // 250

      for (const rcpt of to) {
        await tlsSend(`RCPT TO:<${rcpt}>`);
        await tlsRead();
      }

      await tlsSend("DATA");
      await tlsRead(); // 354

      await tlsSend(message + "\r\n.");
      const dataResp = await tlsRead();
      if (!dataResp.startsWith("2")) throw new Error(`Data gönderme hatası: ${dataResp}`);

      await tlsSend("QUIT");
      tlsConn.close();
    } else {
      // Port 465 (SSL) — direkt TLS
      conn.close();
      const tlsConn = await Deno.connectTls({ hostname: smtp.host, port });
      const tlsSend = async (cmd: string) =>
        await tlsConn.write(enc.encode(cmd + "\r\n"));
      const tlsRead = async (): Promise<string> => {
        const buf = new Uint8Array(4096);
        const n = await tlsConn.read(buf);
        return dec.decode(buf.subarray(0, n ?? 0));
      };

      await tlsRead(); // 220

      await tlsSend(`EHLO ${smtp.host}`);
      await tlsRead();

      await tlsSend("AUTH LOGIN");
      await tlsRead();

      await tlsSend(btoa(smtp.username));
      await tlsRead();

      await tlsSend(btoa(smtp.password));
      const authResp = await tlsRead();
      if (!authResp.startsWith("2")) throw new Error(`Auth hatası: ${authResp}`);

      await tlsSend(`MAIL FROM:<${smtp.from_email}>`);
      await tlsRead();

      for (const rcpt of to) {
        await tlsSend(`RCPT TO:<${rcpt}>`);
        await tlsRead();
      }

      await tlsSend("DATA");
      await tlsRead();

      await tlsSend(message + "\r\n.");
      const dataResp = await tlsRead();
      if (!dataResp.startsWith("2")) throw new Error(`Data gönderme hatası: ${dataResp}`);

      await tlsSend("QUIT");
      tlsConn.close();
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("SMTP send error:", msg);
    return { success: false, error: msg };
  }
}

// HTML etiketlerini temizle (text fallback için)
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}
