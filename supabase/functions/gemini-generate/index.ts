import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { brandName, industry, vibe } = await req.json()

        if (!brandName || !industry) {
            throw new Error('Marka ismi ve sektör zorunludur.')
        }

        const apiKey = Deno.env.get('GEMINI_API_KEY')
        if (!apiKey) {
            console.error('GEMINI_API_KEY is not set')
            throw new Error('Server configuration error: API Key missing')
        }

        const prompt = `
      Sen profesyonel bir marka danışmanısın. Aşağıdaki bilgilere göre bir marka kimliği oluştur.
      
      Marka Adı: ${brandName}
      Sektör: ${industry}
      Hissiyat (Vibe): ${vibe || 'Modern ve Profesyonel'}

      Lütfen yanıtı SADECE aşağıdaki JSON formatında ver, başka hiçbir metin ekleme:
      {
        "analysis": "Marka analizi ve stratejik yorum (kısa ve etkileyici, Türkçe)",
        "slogan": "Kısa, akılda kalıcı bir slogan (Türkçe)",
        "colors": ["#hex1", "#hex2", "#hex3", "#hex4"],
        "fonts": {
          "heading": "Önerilen Başlık Fontu (Google Fonts)",
          "body": "Önerilen Metin Fontu (Google Fonts)"
        }
      }
    `

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        })

        const data = await response.json()

        if (data.error) {
            console.error('Gemini API Error:', data.error);
            throw new Error(data.error.message || 'AI servisi şu an yanıt veremiyor.');
        }

        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawText) {
            throw new Error('AI boş yanıt döndürdü.');
        }

        // Clean up markdown code blocks if present
        const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

        let parsedResult;
        try {
            parsedResult = JSON.parse(cleanJson);
        } catch (e) {
            console.error('JSON Parse Error:', e, rawText);
            throw new Error('AI yanıtı işlenemedi.');
        }

        return new Response(
            JSON.stringify(parsedResult),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            },
        )

    } catch (error) {
        console.error('Error:', error.message)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            },
        )
    }
})
