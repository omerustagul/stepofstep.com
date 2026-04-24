-- Add discount_deadline column to app_users
-- This column will store the expiration date of the membership discount won from the wheel.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_users' AND column_name = 'discount_deadline') THEN
        ALTER TABLE public.app_users ADD COLUMN discount_deadline TIMESTAMPTZ;
    END IF;
END $$;

-- Force Schema Cache Refresh
NOTIFY pgrst, 'reload config';
