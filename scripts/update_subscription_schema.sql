
-- Add subscription fields to app_users
ALTER TABLE app_users 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial', -- active, past_due, canceled, trial
ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS paytr_token TEXT, -- For recurring payments (stored card token)
ADD COLUMN IF NOT EXISTS last_payment_id TEXT;

-- Create payment_history table
CREATE TABLE IF NOT EXISTS payment_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'TL',
    provider TEXT DEFAULT 'paytr',
    provider_payment_id TEXT,
    status TEXT DEFAULT 'pending', -- pending, success, failed
    plan_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    meta_data JSONB
);

-- RLS for payment_history
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own payment history
CREATE POLICY "Users can view own payments" 
ON payment_history FOR SELECT 
TO authenticated 
USING (auth.uid() = (SELECT auth_id FROM app_users WHERE id = payment_history.user_id));

-- Service role can do everything
CREATE POLICY "Service role full access payments" 
ON payment_history FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);
