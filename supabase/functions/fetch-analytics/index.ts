
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.8/mod.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper: PEM formatting for private key
function formatPrivateKey(privateKey: string) {
    if (!privateKey.includes("BEGIN PRIVATE KEY")) {
        // Add headers if missing (common in some copy-paste scenarios)
        return `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
    }
    return privateKey;
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const serviceAccountStr = Deno.env.get('GOOGLE_SERVICE_ACCOUNT');
        const propertyId = Deno.env.get('GOOGLE_ANALYTICS_PROPERTY_ID');

        if (!serviceAccountStr || !propertyId) {
            throw new Error('Configuration missing: GOOGLE_SERVICE_ACCOUNT or GOOGLE_ANALYTICS_PROPERTY_ID');
        }

        const serviceAccount = JSON.parse(serviceAccountStr);

        // 1. Create JWT for Google Auth
        // https://developers.google.com/identity/protocols/oauth2/service-account#jwt-auth
        const iat = getNumericDate(new Date());
        const exp = iat + 3600; // 1 hour

        const jwtClaimSet = {
            iss: serviceAccount.client_email,
            scope: 'https://www.googleapis.com/auth/analytics.readonly',
            aud: 'https://oauth2.googleapis.com/token',
            exp,
            iat,
        };

        // Import Key
        const algorithm = { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" };
        // Clean key
        const pem = serviceAccount.private_key;

        // Deno Web Crypto API requires importing key
        // We use a simpler strategy: construct JWT manually or use djwt. 
        // djwt requires KeyObject. Let's try to import the PEM.

        // Fix key format
        const pemHeader = "-----BEGIN PRIVATE KEY-----";
        const pemFooter = "-----END PRIVATE KEY-----";
        const pemContents = pem.substring(pemHeader.length, pem.length - pemFooter.length).replace(/\s/g, '');
        const binaryDerString = window.atob(pemContents);
        const binaryDer = new Uint8Array(binaryDerString.length);
        for (let i = 0; i < binaryDerString.length; i++) {
            binaryDer[i] = binaryDerString.charCodeAt(i);
        }

        const key = await crypto.subtle.importKey(
            "pkcs8",
            binaryDer,
            algorithm,
            true,
            ["sign"]
        );

        const jwt = await create({ alg: "RS256", typ: "JWT" }, jwtClaimSet, key);

        // 2. Exchange JWT for Access Token
        const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`
        });

        const tokenData = await tokenResp.json();
        if (!tokenData.access_token) {
            throw new Error('Failed to get access token: ' + JSON.stringify(tokenData));
        }

        const accessToken = tokenData.access_token;

        // 3. Query GA4 Data API
        const analyticsUrl = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;

        const reportReq = {
            dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
            metrics: [
                { name: 'activeUsers' },
                { name: 'sessions' },
                { name: 'averageSessionDuration' },
                { name: 'bounceRate' },
                { name: 'screenPageViewsPerSession' },
                { name: 'newUsers' }
            ],
            // dimensions: [{ name: 'date' }] // For charts if needed
        };

        const dataResp = await fetch(analyticsUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(reportReq)
        });

        const reportData = await dataResp.json();

        return new Response(JSON.stringify(reportData), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400, // or 500
        });
    }
});
