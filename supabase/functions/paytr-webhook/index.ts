
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as crypto from "https://deno.land/std@0.177.0/node/crypto.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'POST') {
        try {
            const formData = await req.formData();
            const params: any = {};

            // Convert FormData to Object
            for (const [key, value] of formData.entries()) {
                params[key] = value;
            }

            const { merchant_oid, status, total_amount, hash } = params;
            const merchant_salt = Deno.env.get('PAYTR_MERCHANT_SALT');
            const merchant_key = Deno.env.get('PAYTR_MERCHANT_KEY');

            if (!merchant_salt || !merchant_key) throw new Error('Missing keys');

            // Validate Hash
            const hash_str = `${merchant_oid}${merchant_salt}${status}${total_amount}`;
            const generated_hash = crypto.createHmac('sha256', merchant_key).update(hash_str).digest('base64');

            if (hash !== generated_hash) {
                return new Response('BAD_HASH', { status: 400 });
            }

            if (status === 'success') {
                // Initialize Supabase Client (Service Role for Admin Access)
                const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
                const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
                const supabase = createClient(supabaseUrl, supabaseKey);

                // Find User by email
                const userEmail = params.email;

                if (userEmail) {
                    // Find User
                    const { data: user } = await supabase.from('app_users').select('id, plan').eq('email', userEmail).single();

                    if (user) {
                        // Recover Plan Name from Merchant OID (Format: ORD_PLAN-NAME_TIMESTAMP_RANDOM)
                        let planId = 'pro';
                        try {
                            const parts = merchant_oid.split('_');
                            // merchant_oid: ORD_planId_timestamp_random
                            if (parts.length >= 2) {
                                planId = parts[1];
                            }
                        } catch (e) {
                            console.error('Plan parse error', e);
                        }

                        // Update User
                        const nextMonth = new Date();
                        nextMonth.setDate(nextMonth.getDate() + 30);

                        await supabase.from('app_users').update({
                            plan: planId,
                            subscription_status: 'active',
                            subscription_end_date: nextMonth.toISOString(),
                            last_payment_id: merchant_oid,
                            updated_at: new Date().toISOString()
                        }).eq('id', user.id);

                        // Log Payment
                        await supabase.from('payment_history').insert({
                            user_id: user.id,
                            amount: parseFloat(total_amount) / 100,
                            status: 'success',
                            provider_payment_id: merchant_oid,
                            meta_data: params
                        });
                    }
                }
            } else {
                console.log('Payment failed or cancelled', status);
            }

            return new Response('OK');
        } catch (err) {
            console.error(err);
            return new Response('Error', { status: 500 });
        }
    }

    return new Response('OK');
});
