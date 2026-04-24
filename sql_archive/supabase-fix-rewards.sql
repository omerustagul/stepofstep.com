-- Fix missing columns in wheel_rewards table
-- Run this script in Supabase SQL Editor

DO $$
BEGIN
    -- Add reward_type if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wheel_rewards' AND column_name = 'reward_type') THEN
        ALTER TABLE public.wheel_rewards ADD COLUMN reward_type TEXT DEFAULT 'text';
    END IF;

    -- Add reward_value if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wheel_rewards' AND column_name = 'reward_value') THEN
        ALTER TABLE public.wheel_rewards ADD COLUMN reward_value TEXT;
    END IF;

    -- Add file_url if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wheel_rewards' AND column_name = 'file_url') THEN
        ALTER TABLE public.wheel_rewards ADD COLUMN file_url TEXT;
    END IF;
END $$;

-- Force Schema Cache Refresh
NOTIFY pgrst, 'reload config';
