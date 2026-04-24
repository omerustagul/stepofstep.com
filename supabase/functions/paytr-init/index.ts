
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as crypto from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { user_id, email, plan_name, payment_amount, user_ip } = await req.json();

        const merchant_id = Deno.env.get('PAYTR_MERCHANT_ID');
        const merchant_key = Deno.env.get('PAYTR_MERCHANT_KEY');
        const merchant_salt = Deno.env.get('PAYTR_MERCHANT_SALT');

        if (!merchant_id || !merchant_key || !merchant_salt) {
            throw new Error('PayTR credentials missing in environment variables');
        }

        // PayTR Parameters
        // Embed plan_name in merchant_oid to retrieve it in webhook
        // Format: ORD_PLAN-NAME_TIMESTAMP_RANDOM
        const safe_plan_name = plan_name.replace(/[^a-zA-Z0-9]/g, '');
        const merchant_oid = `ORD_${safe_plan_name}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const payment_amount_str = (payment_amount * 100).toString(); // Kuruş cinsinden
        const currency = 'TL';
        const no_installment = '1'; // Taksit yok
        const max_installment = '0';
        const user_name = email.split('@')[0]; // Simple name extraction if not provided
        const user_address = 'Digital Service Address';
        const user_phone = '05555555555'; // Should ideally allow user to input this
        const merchant_ok_url = 'https://stepofstep.com/portal/profile?status=success';
        const merchant_fail_url = 'https://stepofstep.com/portal/profile?status=fail';
        const user_basket = JSON.stringify([[plan_name, payment_amount_str, 1]]);
        const debug_on = '1'; // Set to 0 in production
        const test_mode = '1'; // Set to 0 in production
        const timeout_limit = '30';

        // Generate Token Hash
        const hash_str = `${merchant_id}${user_ip}${merchant_oid}${email}${payment_amount_str}${user_basket}${no_installment}${max_installment}${currency}${test_mode}`;
        const paytr_token = crypto.createHmac('sha256', merchant_key + merchant_salt).update(hash_str).digest('base64');

        // Request Token from PayTR
        const formData = new URLSearchParams();
        formData.append('merchant_id', merchant_id);
        formData.append('user_ip', user_ip || '127.0.0.1');
        formData.append('merchant_oid', merchant_oid);
        formData.append('email', email);
        formData.append('payment_amount', payment_amount_str);
        formData.append('paytr_token', paytr_token);
        formData.append('user_basket', user_basket);
        formData.append('debug_on', debug_on);
        formData.append('no_installment', no_installment);
        formData.append('max_installment', max_installment);
        formData.append('user_name', user_name);
        formData.append('user_address', user_address);
        formData.append('user_phone', user_phone);
        formData.append('merchant_ok_url', merchant_ok_url);
        formData.append('merchant_fail_url', merchant_fail_url);
        formData.append('timeout_limit', timeout_limit);
        formData.append('currency', currency);
        formData.append('test_mode', test_mode);

        const response = await fetch('https://www.paytr.com/odeme/api/get-token', {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const data = await response.json();

        if (data.status === 'success') {
            return new Response(JSON.stringify({
                token: data.token,
                merchant_oid: merchant_oid
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        } else {
            console.error('PayTR Init Error:', data.reason);
            return new Response(JSON.stringify({ error: data.reason }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
