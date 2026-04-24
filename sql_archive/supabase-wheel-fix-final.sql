-- REPAIR WHEEL_SPINS TABLE AND CACHE
-- This script fixes the "Could not find the 'is_claimed' column" error.

-- 1. Ensure 'is_claimed' and 'claimed_at' columns exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wheel_spins' AND column_name = 'is_claimed') THEN
        ALTER TABLE public.wheel_spins ADD COLUMN is_claimed BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wheel_spins' AND column_name = 'claimed_at') THEN
        ALTER TABLE public.wheel_spins ADD COLUMN claimed_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wheel_spins' AND column_name = 'meta_data') THEN
        ALTER TABLE public.wheel_spins ADD COLUMN meta_data JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 2. Force Supabase API to Refresh Schema Cache
-- This is critical to fix the "Schema Cache" error.
NOTIFY pgrst, 'reload config';
