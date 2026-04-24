import { supabase } from '../lib/supabase';

interface EmailPayload {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
}

interface EmailResponse {
    success: boolean;
    data?: any;
    error?: any;
}

export const emailService = {
    /**
     * Sends an email using the 'send-email' Supabase Edge Function
     */
    async sendEmail(payload: EmailPayload): Promise<EmailResponse> {
        try {
            const { data, error } = await supabase.functions.invoke('send-email', {
                body: payload
            });

            if (error) {
                console.error('Email Service Error (Invoke):', error);
                return { success: false, error };
            }

            return { success: true, data };
        } catch (err) {
            console.error('Email Service Error (Catch):', err);
            return { success: false, error: err };
        }
    }
};
